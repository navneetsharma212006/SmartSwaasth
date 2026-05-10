const mongoose = require("mongoose");

async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (process.env.USE_MEMORY_DB === "true") {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log("Using in-memory MongoDB (USE_MEMORY_DB=true)");
  }

  if (!uri) {
    console.error("MONGO_URI is missing in .env (or set USE_MEMORY_DB=true)");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
