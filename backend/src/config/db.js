import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes("your_mongodb_atlas_connection_string_here")) {
      console.error(
        "MONGODB_URI is not set. Add your MongoDB Atlas connection string to backend/.env"
      );
      process.exit(1);
    }
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};
