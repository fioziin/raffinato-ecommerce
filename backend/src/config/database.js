const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raffinato';
  await mongoose.connect(uri);
  const safeUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`✅ MongoDB conectado: ${safeUri}`);
}

module.exports = connectDB;
