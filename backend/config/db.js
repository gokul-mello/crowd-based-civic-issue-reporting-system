const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  try {
    if (uri && uri.trim().length > 0) {
      console.log(`[MongoDB] Connecting to: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Local/configured connection failed (${err.message}).`);
  }

  // Graceful fallback to mongodb-memory-server for local testing
  console.log('🔄 [MongoDB] Launching embedded MongoDB engine...');
  console.log('⏳ Note: If this is the first run without local MongoDB, an embedded binary is downloaded.');
  try {
    process.env.MONGOMS_MD5_CHECK = '0';
    process.env.MONGOMS_VERSION = '8.2.6';
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      binary: {
        version: '8.2.6',
        checkMD5: false,
      },
      instance: {
        dbName: 'civicconnect'
      }
    });
    const memoryUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`✅ Embedded MongoDB Running at: ${memoryUri}`);
    return conn;
  } catch (memErr) {
    console.error('\n❌ ========================================================');
    console.error('❌ MONGODB CONNECTION ERROR:');
    console.error('❌ Neither local MongoDB (port 27017) nor the embedded fallback could start.');
    console.error('❌');
    console.error('❌ SOLUTION:');
    console.error('❌ 1. Open backend/.env');
    console.error('❌ 2. Set MONGODB_URI to your free MongoDB Atlas connection string:');
    console.error('❌    MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/civicconnect');
    console.error('❌ 3. Or start your local MongoDB service with: net start MongoDB');
    console.error('❌ ========================================================\n');
    throw memErr;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
