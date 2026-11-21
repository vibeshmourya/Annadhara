const mongoose = require('mongoose');

let mongodInstance = null;

/**
 * Sanitizes a MongoDB connection URI by redacting user credentials
 * so passwords and secrets are never exposed in terminal or log files.
 */
const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(
    /^(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i,
    '$1$2:****@'
  );
};

/**
 * Extracts connection metadata for clean diagnostic logging
 */
const getDbDetails = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return { isAtlas: false, sanitized: '', host: 'unknown', dbName: 'unknown' };
  }
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
  const sanitized = sanitizeMongoUri(uri);
  const match = uri.match(/@([^/?]+)(?:\/([^?]+))?/);
  const host = match ? match[1] : (uri.match(/:\/\/([^/?]+)/) ? uri.match(/:\/\/([^/?]+)/)[1] : 'unknown');
  const dbName = match && match[2] ? match[2].split('?')[0] : (mongoose.connection.name || 'foodbridge');
  return { isAtlas, sanitized, host, dbName };
};

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
 * Connect to MongoDB Atlas Cloud Database
 * Uses environment variable MONGODB_URI (or MONGO_URI fallback)
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // 1. Identify configured URI (prioritize MONGODB_URI, fallback to MONGO_URI)
  const configuredUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // 2. Atlas-optimized Mongoose connection options
  const mongooseOptions = {
    serverSelectionTimeoutMS: 15000, // 15 seconds allows Atlas DNS SRV resolution and TLS handshake
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxPoolSize: 20,
    minPoolSize: 2,
    family: 4, // Force IPv4 to prevent IPv6 routing delays
  };

  if (configuredUri) {
    const details = getDbDetails(configuredUri);
    try {
      console.log(`[Database] Attempting connection to ${details.isAtlas ? 'MongoDB Atlas' : 'MongoDB'}...`);
      console.log(`[Database] Target: ${details.sanitized}`);

      await mongoose.connect(configuredUri, mongooseOptions);

      console.log(`====================================================`);
      console.log(`🌿 Annadhara Database: ${details.isAtlas ? 'MongoDB Atlas (Cloud)' : 'MongoDB (Custom)'}`);
      console.log(`🌿 Cluster/Host:       ${details.host}`);
      console.log(`🌿 Database Name:      ${mongoose.connection.name || details.dbName}`);
      console.log(`🌿 Connection Status:  Connected (readyState = 1)`);
      console.log(`====================================================`);
    } catch (err) {
      console.error(`[Database] ❌ Connection failed to ${details.sanitized}`);
      console.error(`[Database] Error: ${err.message}`);

      if (details.isAtlas) {
        console.error(`[Database] 👉 MongoDB Atlas Troubleshooting Checklist:`);
        console.error(`[Database]    1. IP Whitelist: Atlas -> Network Access -> Add IP Address (use 0.0.0.0/0 for dev).`);
        console.error(`[Database]    2. Credentials: Check username & password in MONGODB_URI under Database Access.`);
        console.error(`[Database]    3. Special Characters: URL-encode special characters in password (e.g. @ -> %40).`);
        console.error(`[Database]    4. Network/Firewall: Ensure outgoing port 27017 is open.`);
      }

      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production database connection failed: ${err.message}`);
      }

      // Development / Test fallback
      console.warn(`[Database] ⚠️ Falling back to in-memory MongoDB for local evaluation...`);
      await startInMemoryDB();
    }
  } else {
    // No MONGODB_URI provided
    if (process.env.NODE_ENV === 'production') {
      console.error(`[Database] ❌ MONGODB_URI environment variable is required in production!`);
      throw new Error('MONGODB_URI environment variable is missing');
    }

    console.warn(`[Database] ⚠️ MONGODB_URI is not set in your environment or server/.env file.`);
    console.warn(`[Database] 👉 Configure your MongoDB Atlas connection string in server/.env:`);
    console.warn(`[Database]    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/annadhara?retryWrites=true&w=majority`);
    console.warn(`[Database] Starting in-memory MongoDB for development/testing...`);
    await startInMemoryDB();
  }

  // Register connection lifecycle listeners
  mongoose.connection.on('error', (err) => {
    console.error(`[Database] Mongoose runtime connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Mongoose connection re-established.');
  });
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
          dbName: 'foodbridge',
        },
      });
    }
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] In-memory MongoDB running [Status: ${getDbStatus()}] at ${sanitizeMongoUri(memoryUri)}`);
  } catch (memErr) {
    console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};

module.exports = { connectDB, disconnectDB, getDbStatus, sanitizeMongoUri, getDbDetails };
