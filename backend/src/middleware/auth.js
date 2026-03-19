import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/index.js';
import { sendUnauthorized, sendForbidden } from '../utils/responseUtils.js';
import { User } from '../db/models/user.js';
import logger from '../utils/logger.js';

export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, AUTH_CONFIG.jwtSecret, {
    expiresIn: AUTH_CONFIG.jwtExpiresIn,
  });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, AUTH_CONFIG.refreshSecret, {
    expiresIn: AUTH_CONFIG.refreshExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, AUTH_CONFIG.jwtSecret);
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided');
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return sendUnauthorized(res, 'User not found');
    if (!user.isActive) return sendForbidden(res, 'Account deactivated');

    req.user = user;
    req.auth = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendUnauthorized(res, 'Token expired');
    if (err.name === 'JsonWebTokenError') return sendUnauthorized(res, 'Invalid token');
    logger.error('Auth middleware error', err);
    return sendUnauthorized(res, 'Authentication failed');
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.auth = { userId: decoded.userId, role: decoded.role };
      }
    }
  } catch {
    // silently fail for optional auth
  }
  next();
}

export default { requireAuth, optionalAuth, generateToken, generateRefreshToken, verifyToken };
