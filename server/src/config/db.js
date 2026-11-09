const mongoose = require('mongoose');

let mongodInstance = null;

const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodbridge';

  try {
    // First attempt to connect to the configured URI with a short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB connection established successfully [Status: ${getDbStatus()}] at ${uri}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to external MongoDB at ${uri}: ${err.message}`);
    console.log('[Database] Starting in-memory MongoDB instance for development...');

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
      console.log(`[Database] In-memory MongoDB running [Status: ${getDbStatus()}] at ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose disconnected');
  });
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB, getDbStatus };
