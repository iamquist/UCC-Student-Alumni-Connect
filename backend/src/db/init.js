import mongoose from "mongoose";
import { DB_CONFIG, ENV } from "../config/index.js";
import logger from "../utils/logger.js";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(DB_CONFIG.uri, DB_CONFIG.options);
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB error", err);
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      logger.info("MongoDB reconnected");
    });
  } catch (err) {
    logger.error("MongoDB connection failed", err);
    if (ENV.isProd) process.exit(1);
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info("MongoDB disconnected gracefully");
}

export default connectDB;
