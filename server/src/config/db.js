const mongoose = require('mongoose');

/**
 * Global cache for Mongoose connection in Vercel Serverless / AWS Lambda environments.
 * Prevents redundant connection handshakes and socket exhaustion across serverless invocations.
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
 * Supported environment variable names for MongoDB connection string.
 * Checks MONGODB_URI first, then common aliases.
 */
const getMongoConfig = () => {
  const envKeys = ['MONGODB_URI', 'MONGO_URI', 'DATABASE_URL', 'MONGODB_URL', 'MONGO_URL'];
  for (const key of envKeys) {
    const val = process.env[key];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return { uri: val.trim(), key };
    }
  }
  return { uri: '', key: null };
};

/**
 * Sanitizes a MongoDB connection URI by redacting user credentials
 * so passwords and secrets are never exposed in terminal, responses, or log files.
 */
const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(
    /^(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i,
    '$1$2:****@'
  );
};

/**
 * Extracts connection metadata for clean diagnostic logging and health responses
 */
const getDbDetails = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return { isAtlas: false, sanitized: '', host: 'unknown', dbName: 'unknown' };
  }
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
  const sanitized = sanitizeMongoUri(uri);
  const match = uri.match(/@([^/?]+)(?:\/([^?]+))?/);
  const host = match ? match[1] : (uri.match(/:\/\/([^/?]+)/) ? uri.match(/:\/\/([^/?]+)/)[1] : 'unknown');
  const dbName = match && match[2] ? match[2].split('?')[0] : (mongoose.connection.name || 'annadhara');
  return { isAtlas, sanitized, host, dbName };
};

/**
 * Current connection state as a clean string
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
 * Diagnostic reporting for API health and troubleshooting without exposing credentials
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
    lastError: cached.lastError ? sanitizeMongoUri(cached.lastError) : null,
    recommendations: status !== 'connected'
      ? [
          !uri ? 'Add MONGODB_URI in Vercel Project Settings -> Environment Variables.' : null,
          details.isAtlas ? 'In MongoDB Atlas -> Network Access, ensure 0.0.0.0/0 (Allow Access from Anywhere) is active.' : null,
          details.isAtlas ? 'In MongoDB Atlas -> Database Access, verify the username & password are valid.' : null,
          'After updating environment variables in Vercel, trigger a Redeploy in the Deployments tab.',
        ].filter(Boolean)
      : [],
  };
};

/**
 * Connect to MongoDB Atlas Cloud Database with serverless connection pooling & reuse
 */
const connectDB = async () => {
  // 1. If connection is already open (readyState === 1), reuse it immediately
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    cached.lastError = null;
    return cached.conn;
  }

  // 2. If a connection attempt is currently in-flight (readyState === 2), await the existing promise
  if (mongoose.connection.readyState === 2 && cached.promise) {
    return cached.promise;
  }

  // 3. Resolve MongoDB URI from supported environment variables
  const { uri, key } = getMongoConfig();
  cached.envVarName = key;

  // 4. Serverless + Atlas-optimized Mongoose connection options
  const mongooseOptions = {
    serverSelectionTimeoutMS: 10000, // 10 seconds for Atlas DNS SRV resolution and TLS handshake
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,  // Maximum 10 connections per serverless container
    minPoolSize: 0,   // Crucial for Serverless: Never hold idle sockets open across container freeze
  };

  const isServerlessOrProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  if (uri) {
    const details = getDbDetails(uri);
    try {
      if (!cached.promise) {
        cached.promise = mongoose.connect(uri, mongooseOptions)
          .then((conn) => {
            cached.conn = conn;
            cached.promise = null;
            cached.lastError = null;

            console.log(`====================================================`);
            console.log(`🌿 Annadhara Database: ${details.isAtlas ? 'MongoDB Atlas (Cloud)' : 'MongoDB (Custom)'}`);
            console.log(`🌿 Cluster/Host:       ${details.host}`);
            console.log(`🌿 Database Name:      ${mongoose.connection.name || details.dbName}`);
            console.log(`🌿 Env Variable:       ${key}`);
            console.log(`🌿 Connection Status:  Connected (readyState = 1)`);
            console.log(`====================================================`);
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

      console.error(`[Database] ❌ Connection failed to ${details.sanitized}`);
      console.error(`[Database] Error: ${err.message}`);

      if (details.isAtlas) {
        console.error(`[Database] 👉 MongoDB Atlas Troubleshooting Checklist:`);
        console.error(`[Database]    1. IP Whitelist: Atlas -> Network Access -> Add IP Address (use 0.0.0.0/0 for serverless).`);
        console.error(`[Database]    2. Credentials: Check username & password in ${key || 'MONGODB_URI'} under Database Access.`);
        console.error(`[Database]    3. Special Characters: URL-encode special characters in password.`);
        console.error(`[Database]    4. Network/Firewall: Ensure outgoing port 27017 is open.`);
      }

      if (isServerlessOrProd) {
        throw new Error(`Production database connection failed: ${err.message}`);
      }

      // Development / Test offline fallback
      console.warn(`[Database] ⚠️ Falling back to in-memory MongoDB for local evaluation...`);
      await startInMemoryDB();
      return mongoose.connection;
    }
  } else {
    // No MongoDB URI provided in any supported environment variable
    cached.lastError = 'MongoDB connection environment variable is not configured (checked MONGODB_URI, MONGO_URI, DATABASE_URL, MONGODB_URL, MONGO_URL)';

    if (isServerlessOrProd) {
      console.error(`[Database] ❌ ${cached.lastError}`);
      throw new Error(cached.lastError);
    }

    console.warn(`[Database] ⚠️ MONGODB_URI is not set in your environment or server/.env file.`);
    console.warn(`[Database] Starting in-memory MongoDB for development/testing...`);
    await startInMemoryDB();
    return mongoose.connection;
  }
};

/**
 * Starts an in-memory MongoDB instance for offline local testing / CI
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
    console.log(`[Database] In-memory MongoDB running [Status: ${getDbStatus()}] at ${sanitizeMongoUri(memoryUri)}`);
  } catch (memErr) {
    console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  if (cached.promise) {
    try {
      await cached.promise;
    } catch (_) {}
  }
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;

  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getDbStatus,
  getDbDetails,
  getDbDiagnostics,
  sanitizeMongoUri,
  getMongoConfig,
};
