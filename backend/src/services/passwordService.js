import bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from '../config/index.js';

export async function hashPassword(password) {
  return bcrypt.hash(password, AUTH_CONFIG.bcryptRounds);
}

export async function comparePassword(password, hashed) {
  return bcrypt.compare(password, hashed);
}

export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters required');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
  return { valid: errors.length === 0, errors };
}

export default { hashPassword, comparePassword, validatePassword };
