import { isValidEmail, isValidPassword, isValidObjectId, sanitizeString } from '../utils/validators.js';
import { sendValidationError } from '../utils/responseUtils.js';

export const validate = (rules) => (req, res, next) => {
  const errors = [];
  for (const [field, rule] of Object.entries(rules)) {
    const value = req.body[field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    if (value === undefined || value === null) continue;
    if (rule.minLength && String(value).length < rule.minLength)
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    if (rule.maxLength && String(value).length > rule.maxLength)
      errors.push(`${field} must be at most ${rule.maxLength} characters`);
    if (rule.enum && !rule.enum.includes(value))
      errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
    if (rule.type === 'email' && !isValidEmail(value))
      errors.push(`${field} must be a valid email`);
    if (rule.type === 'objectId' && !isValidObjectId(value))
      errors.push(`${field} must be a valid ID`);
    if (rule.pattern && !rule.pattern.test(value))
      errors.push(rule.patternMessage || `${field} has invalid format`);
    if (rule.custom) {
      const err = rule.custom(value);
      if (err) errors.push(err);
    }
  }
  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

export const validateEmail = (email) => isValidEmail(email);
export const validatePassword = (password) => isValidPassword(password);
export const validateObjectId = (id) => isValidObjectId(id);
export const sanitizeBody = (req, res, next) => {
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitizeString(req.body[key]);
    }
  }
  next();
};

export default { validate, validateEmail, validatePassword, validateObjectId, sanitizeString, sanitizeBody };
