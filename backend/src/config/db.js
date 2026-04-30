const mongoose = require('mongoose');

let connection;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    connection = conn.connection;
    console.log('MongoDB connected');
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const getConnection = () => connection;

module.exports = { connectDB, getConnection };
