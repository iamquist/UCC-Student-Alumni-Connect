import crypto from 'crypto';

export const generatePassword = (options = {}) => {
  const { length = 12, uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const generateNumericCode = (length = 6) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export const generateAlphanumericCode = (length = 8, uppercaseOnly = false) => {
  const chars = uppercaseOnly ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex');

export const generateRandomString = (length = 32, encoding = 'hex') =>
  crypto.randomBytes(length).toString(encoding);

export const generateVerificationCode = () => generateNumericCode(6);
export const generatePasswordResetToken = () => generateToken(32);
export const generateEmailVerificationToken = () => generateToken(32);
export const generateSessionToken = () => generateToken(48);

export default {
  generatePassword, generateNumericCode, generateAlphanumericCode, generateToken,
  generateRandomString, generateVerificationCode, generatePasswordResetToken,
  generateEmailVerificationToken, generateSessionToken,
};
