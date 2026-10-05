import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process on connection failure to prevent running
 * the app without a database.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // mongoose 7+ does not need these options but kept for clarity
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};
