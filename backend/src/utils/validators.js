import mongoose from 'mongoose';

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

export const isValidPhoneNumber = (phone) =>
  /^(\+233|0)(20|23|24|25|26|27|28|29|50|54|55|56|57|59)\d{7}$/.test(String(phone).replace(/\s/g, ''));

export const isValidPassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
  return { valid: errors.length === 0, errors };
};

export const isValidUrl = (url) => {
  try { new URL(url); return /^https?:\/\//.test(url); } catch { return false; }
};

export const isValidDate = (date) => !isNaN(new Date(date).getTime());

export const isFutureDate = (date) => new Date(date) > new Date();
export const isPastDate = (date) => new Date(date) < new Date();

export const isValidDateRange = (startDate, endDate) =>
  isValidDate(startDate) && isValidDate(endDate) && new Date(startDate) <= new Date(endDate);

export const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

export const isValidFileExtension = (filename, allowedExtensions) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.map(e => e.toLowerCase()).includes(ext) : false;
};

export const isValidFileSize = (size, maxSize) =>
  typeof size === 'number' && size > 0 && size <= maxSize;

export const isValidLength = (str, min, max) => {
  const len = String(str).length;
  return len >= min && len <= max;
};

export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const isValidEnum = (value, enumValues) => enumValues.includes(value);

export const isValidNumericRange = (value, min, max) =>
  typeof value === 'number' && !isNaN(value) && value >= min && value <= max;

export const isValidYear = (year, minYear = 1900, maxYear = new Date().getFullYear() + 10) => {
  const y = parseInt(year);
  return !isNaN(y) && String(y).length === 4 && y >= minYear && y <= maxYear;
};

export const isValidGPA = (gpa) => isValidNumericRange(parseFloat(gpa), 0, 4.0);

export const isValidLinkedInUrl = (url) =>
  /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(url);

export const isValidGitHubUrl = (url) =>
  /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(url);

export const isValidTwitterUrl = (url) =>
  /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/.test(url);

export const isValidPortfolioUrl = (url) => isValidUrl(url);

export const sanitizeString = (str) =>
  String(str).replace(/[<>]/g, '').trim();

export const validateAndSanitize = (value, options = {}) => {
  const { required = false, type, minLength, maxLength, pattern } = options;
  if (required && !validateRequired(value)) return { valid: false, error: 'This field is required' };
  if (!value && !required) return { valid: true, value };
  if (type === 'email' && !isValidEmail(value)) return { valid: false, error: 'Invalid email address' };
  if (type === 'url' && !isValidUrl(value)) return { valid: false, error: 'Invalid URL' };
  if (minLength && String(value).length < minLength) return { valid: false, error: `Minimum ${minLength} characters` };
  if (maxLength && String(value).length > maxLength) return { valid: false, error: `Maximum ${maxLength} characters` };
  if (pattern && !pattern.test(String(value))) return { valid: false, error: 'Invalid format' };
  return { valid: true, value: typeof value === 'string' ? sanitizeString(value) : value };
};

export default {
  isValidEmail, isValidPhoneNumber, isValidPassword, isValidUrl, isValidDate,
  isFutureDate, isPastDate, isValidDateRange, isValidObjectId, isValidFileExtension,
  isValidFileSize, isValidLength, validateRequired, isValidEnum, isValidNumericRange,
  isValidYear, isValidGPA, isValidLinkedInUrl, isValidGitHubUrl, isValidTwitterUrl,
  isValidPortfolioUrl, sanitizeString, validateAndSanitize,
};
