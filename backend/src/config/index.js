import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000"),
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
};

export const DB_CONFIG = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/unialum",
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

export const AUTH_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  bcryptRounds: 12,
};

export const CORS_CONFIG = {
  origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
};

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayMs: 2000,
  maxRetriesPerRequest: 3,
};

export const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  user: process.env.EMAIL_USER || "",
  pass: process.env.EMAIL_PASS || "",
  from: process.env.EMAIL_FROM || "UniAlum <noreply@unialum.com>",
  enabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
};

export const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || "africas_talking",
  apiKey: process.env.SMS_API_KEY || "",
  username: process.env.SMS_USERNAME || "",
  senderId: process.env.SMS_SENDER_ID || "UniAlum",
  enabled: !!process.env.SMS_API_KEY,
};

export const UPLOAD_CONFIG = {
  dir: process.env.UPLOAD_DIR || "uploads",
  maxSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"),
  allowedImages: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  allowedDocs: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  authMax: 20,
  registerMax: 10,
  messageMax: 60,
  uploadMax: 20,
};

export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};

export function getPaginationParams(query) {
  const page = Math.max(
    1,
    parseInt(query.page) || PAGINATION_CONFIG.defaultPage,
  );
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION_CONFIG.defaultLimit,
    PAGINATION_CONFIG.maxLimit,
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function formatPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
