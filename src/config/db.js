import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error("⛔ Missing MONGODB_URI in environment variables!");
}

// Global is used here to maintain a cached connection across hot reloads in dev
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Faster failure
      maxPoolSize: 1
    }).then((mongoose) => {
      console.log("MongoDB Connected Successfully 🚀");
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}


// import mongoose from "mongoose";
// import dotenv from "dotenv";
// dotenv.config();

// export const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//   } catch (error) {
//     console.log("❌ MongoDB Error:", error.message);
//     process.exit(1);
//   }
// };
