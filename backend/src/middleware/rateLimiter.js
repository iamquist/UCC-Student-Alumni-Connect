import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/index.js';

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    data: null,
  });
};

export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  max: RATE_LIMIT_CONFIG.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMIT_CONFIG.authMax,
  handler,
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMIT_CONFIG.registerMax,
  handler,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler,
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMIT_CONFIG.messageMax,
  handler,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMIT_CONFIG.uploadMax,
  handler,
});

export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  handler,
});

export default { apiLimiter, authLimiter, registerLimiter, passwordResetLimiter, messageLimiter, uploadLimiter, postLimiter };
