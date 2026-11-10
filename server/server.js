require('dotenv').config();
const { connectDB } = require('./src/config/db');
const app = require('./src/app');
const User = require('./src/models/User');
const { seedDatabase } = require('./src/utils/seedData');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed in development if database is freshly initialized
    if (process.env.NODE_ENV !== 'test') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Server] Database is empty. Auto-seeding initial demo accounts and listings...');
        await seedDatabase();
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🌿 Annadhara Backend Server running on port ${PORT}`);
      console.log(`🌿 Developed by Team Seva Shakti (MERNOVA X 2026)`);
      console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌿 API Health check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// If run directly from node server.js
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

