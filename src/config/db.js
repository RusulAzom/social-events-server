const { MongoClient } = require("mongodb");

let client;
let db;

function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

async function connectDB() {
  if (db) return db;

  client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  await client.db("admin").command({ ping: 1 });

  db = client.db("social-events");
  console.log(`MongoDB connected: ${db.databaseName}`);
  return db;
}

async function disconnectDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB disconnected");
  }
}

module.exports = { connectDB, getDb, disconnectDB };
