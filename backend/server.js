require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const Department = require('./models/Department');
const { seedData } = require('./scripts/seed');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed initial demo data if database is fresh
    try {
      const deptCount = await Department.countDocuments();
      if (deptCount === 0) {
        console.log('🌱 Database is fresh. Auto-seeding initial departments and accounts...');
        await seedData(false);
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed check notice:', seedErr.message);
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 CivicConnect Backend Server running on port ${PORT}`);
      console.log(`📡 Healthcheck available at: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
