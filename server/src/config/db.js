
const mongoose = require('mongoose');

/**
 * Global cache for Mongoose connection in Vercel Serverless / AWS Lambda.
 * Prevents redundant connections and socket exhaustion.
 */
let cached = global.__annadhara_mongoose;

if (!cached) {
  cached = global.__annadhara_mongoose = {
    conn: null,
    promise: null,
    lastError: null,
    envVarName: null,
  };
}

let mongodInstance = null;

/**
 * Supported MongoDB environment variable names.
 */
const getMongoConfig = () => {
  const envKeys = [
    'MONGODB_URI',
    'MONGO_URI',
    'DATABASE_URL',
    'MONGODB_URL',
    'MONGO_URL',
  ];

  for (const key of envKeys) {
    const val = process.env[key];

    if (val && typeof val === 'string' && val.trim().length > 0) {
      return {
        uri: val.trim(),
        key,
      };
    }
  }

  return {
    uri: '',
    key: null,
  };
};

/**
 * Redacts credentials from MongoDB URI.
 */
const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';

  return uri.replace(
    /^(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i,
    '$1$2:****@'
  );
};

/**
 * Extract MongoDB connection information.
 */
const getDbDetails = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return {
      isAtlas: false,
      sanitized: '',
      host: 'unknown',
      dbName: 'unknown',
    };
  }

  const isAtlas =
    uri.startsWith('mongodb+srv://') ||
    uri.includes('mongodb.net');

  const sanitized = sanitizeMongoUri(uri);

  const match = uri.match(/@([^/?]+)(?:\/([^?]+))?/);

  const host = match
    ? match[1]
    : (uri.match(/:\/\/([^/?]+)/)
        ? uri.match(/:\/\/([^/?]+)/)[1]
        : 'unknown');

  const dbName =
    match && match[2]
      ? match[2].split('?')[0]
      : (mongoose.connection.name || 'annadhara');

  return {
    isAtlas,
    sanitized,
    host,
    dbName,
  };
};

/**
 * Current MongoDB connection status.
 */
const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Database diagnostics without exposing credentials.
 */
const getDbDiagnostics = () => {
  const { uri, key } = getMongoConfig();
  const details = getDbDetails(uri);
  const status = getDbStatus();

  return {
    status,
    connected: status === 'connected',
    isAtlas: details.isAtlas,
    clusterHost: details.host,
    dbName: details.dbName,
    envConfigured: Boolean(uri),
    envVariableDetected: key || null,
    lastError: cached.lastError
      ? sanitizeMongoUri(cached.lastError)
      : null,

    recommendations:
      status !== 'connected'
        ? [
            !uri
              ? 'Add MONGODB_URI in Vercel Project Settings -> Environment Variables.'
              : null,

            details.isAtlas
              ? 'In MongoDB Atlas -> Network Access, ensure the required IP access is configured.'
              : null,

            details.isAtlas
              ? 'In MongoDB Atlas -> Database Access, verify the username and password.'
              : null,

            'After updating environment variables in Vercel, trigger a redeploy.',
          ].filter(Boolean)
        : [],
  };
};

/**
 * Connect to MongoDB with connection reuse and serverless optimization.
 */
const connectDB = async () => {
  // 1. Reuse an existing connection
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    cached.lastError = null;

    return cached.conn;
  }

  // 2. Reuse an ongoing connection attempt
  if (
    mongoose.connection.readyState === 2 &&
    cached.promise
  ) {
    return cached.promise;
  }

  // 3. Resolve MongoDB connection URI
  const { uri, key } = getMongoConfig();

  cached.envVarName = key;

  // 4. MongoDB connection options
  const mongooseOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 0,
  };

  const isServerlessOrProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL);

  // 5. Connect to external MongoDB
  if (uri) {
    const details = getDbDetails(uri);

    try {
      if (!cached.promise) {
        cached.promise = mongoose
          .connect(uri, mongooseOptions)
          .then((conn) => {
            cached.conn = conn;
            cached.promise = null;
            cached.lastError = null;

            console.log('============================================');
            console.log(
              `[Database] ${
                details.isAtlas
                  ? 'MongoDB Atlas'
                  : 'MongoDB'
              } connection established`
            );
            console.log(`[Database] Host: ${details.host}`);
            console.log(
              `[Database] Database: ${
                mongoose.connection.name || details.dbName
              }`
            );
            console.log(`[Database] Environment variable: ${key}`);
            console.log(
              `[Database] Status: ${getDbStatus()}`
            );
            console.log('============================================');

            return conn;
          })
          .catch((err) => {
            cached.promise = null;
            cached.lastError = err.message;

            throw err;
          });
      }

      await cached.promise;

      return mongoose.connection;
    } catch (err) {
      cached.promise = null;
      cached.lastError = err.message;

      console.error(
        `[Database] Connection failed to ${details.sanitized}`
      );
      console.error(`[Database] Error: ${err.message}`);

      if (details.isAtlas) {
        console.error('[Database] Atlas troubleshooting:');
        console.error(
          '[Database] 1. Check Network Access configuration.'
        );
        console.error(
          '[Database] 2. Verify Database Access credentials.'
        );
        console.error(
          '[Database] 3. URL-encode special characters in passwords.'
        );
        console.error(
          '[Database] 4. Verify network access to port 27017.'
        );
      }

      // Production must never silently switch to in-memory DB
      if (isServerlessOrProd) {
        throw new Error(
          `Production database connection failed: ${err.message}`
        );
      }

      // Development fallback
      console.warn(
        '[Database] Falling back to in-memory MongoDB for development...'
      );

      await startInMemoryDB();

      return mongoose.connection;
    }
  }

  // 6. No external MongoDB URI configured
  cached.lastError =
    'MongoDB connection environment variable is not configured (checked MONGODB_URI, MONGO_URI, DATABASE_URL, MONGODB_URL, MONGO_URL)';

  if (isServerlessOrProd) {
    console.error(`[Database] ${cached.lastError}`);

    throw new Error(cached.lastError);
  }

  // Local development fallback only
  console.warn(
    '[Database] MongoDB URI is not configured. Starting in-memory MongoDB...'
  );

  await startInMemoryDB();

  return mongoose.connection;
};

/**
 * Start an in-memory MongoDB for local development/testing.
 */
const startInMemoryDB = async () => {
  try {
    await mongoose.disconnect();

    const { MongoMemoryServer } = require('mongodb-memory-server');

    if (!mongodInstance) {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'annadhara',
        },
      });
    }

    const memoryUri = mongodInstance.getUri();

    await mongoose.connect(memoryUri);

    cached.conn = mongoose.connection;
    cached.lastError = null;

    console.log(
      `[Database] In-memory MongoDB running [Status: ${getDbStatus()}]`
    );
  } catch (memErr) {
    console.error(
      '[Database] Failed to start in-memory MongoDB:',
      memErr.message
    );

    throw memErr;
  }
};

/**
 * Disconnect MongoDB and stop the in-memory instance if running.
 */
const disconnectDB = async () => {
  if (cached.promise) {
    try {
      await cached.promise;
    } catch (_) {
      // Ignore pending connection errors during shutdown
    }
  }

  await mongoose.disconnect();

  cached.conn = null;
  cached.promise = null;

  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};

/**
 * Export database utilities.
 */
module.exports = {
  connectDB,
  disconnectDB,
  getDbStatus,
  getDbDetails,
  getDbDiagnostics,
  sanitizeMongoUri,
  getMongoConfig,
};
