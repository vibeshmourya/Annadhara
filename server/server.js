require('dotenv').config();
const { connectDB } = require('./src/config/db');
const app = require('./src/app');
const User = require('./src/models/User');
const { seedDatabase } = require('./src/utils/seedData');
const { startExpirationJob } = require('./src/services/expirationService');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async (customPort = null) => {
  try {
    // 1. Initialize and await database connection before any database operations
    await connectDB();

    // 2. Only after database is verified and ready, check for initial demo seed
    if (process.env.NODE_ENV !== 'test') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Server] Database contains no user accounts. Initializing demo seed data...');
        await seedDatabase({ forceClean: false });
      } else {
        console.log(`[Server] Database contains ${userCount} existing user account(s). Seeding skipped (existing data preserved).`);
      }
      startExpirationJob();
    }

    const listenPort = customPort !== null 
      ? customPort 
      : (process.env.NODE_ENV === 'test' ? 0 : PORT);

    return new Promise((resolve, reject) => {
      const server = app.listen(listenPort, () => {
        const actualPort = server.address().port;
        console.log(`====================================================`);
        console.log(`🌿 Annadhara Backend Server running on port ${actualPort}`);
        console.log(`🌿 Developed by Team Seva Shakti (MERNOVA X 2026)`);
        console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌿 API Health check: http://localhost:${actualPort}/api/health`);
        console.log(`====================================================`);
        resolve(server);
      });
      server.on('error', reject);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// If run directly from node server.js
if (require.main === module) {
  startServer();
}

// Export app as callable function by default, while retaining named properties for backwards compatibility
module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;

