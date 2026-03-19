import crypto from 'crypto';
import { ENV } from '../config/index.js';

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (ENV.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};

export const requestId = (req, res, next) => {
  const id = crypto.randomBytes(8).toString('hex');
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

export const extractIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.headers['x-real-ip'] ||
  req.connection?.remoteAddress ||
  req.socket?.remoteAddress ||
  req.ip ||
  'unknown';

export const trustProxy = (req, res, next) => {
  req.ip = extractIp(req);
  next();
};

export default { securityHeaders, requestId, extractIp, trustProxy };
