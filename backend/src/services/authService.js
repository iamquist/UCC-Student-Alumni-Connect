import crypto from 'crypto';
import { User } from '../db/models/user.js';
import { AlumniProfile } from '../db/models/index.js';
import { StudentProfile } from '../db/models/index.js';
import { Notification } from '../db/models/index.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export async function registerUser(userData) {
  const { firstName, lastName, email, password, role, phone } = userData;

  // Check existing user
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('Email already registered', 409);

  // Create user
  const user = await User.create({
    firstName, lastName, email: email.toLowerCase(), password, role,
    phone: phone || undefined,
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Create role profile
  if (role === 'alumni') {
    await AlumniProfile.create({ user: user._id, mentorshipAvailable: true });
  } else if (role === 'student') {
    await StudentProfile.create({ user: user._id });
  }

  // Welcome notification
  await Notification.create({
    recipient: user._id,
    type: 'system',
    title: 'Welcome to UniAlum!',
    message: 'Complete your profile to get started.',
  });

  const token = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  logger.logAuth('REGISTER', user._id, true, { role });

  const userObj = user.toJSON();
  return { user: userObj, token, refreshToken };
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account has been deactivated', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  logger.logAuth('LOGIN', user._id, true);

  const userObj = user.toJSON();
  return { user: userObj, token, refreshToken };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  user.password = newPassword;
  await user.save();
  logger.logAuth('PASSWORD_CHANGE', userId, true);
}

export async function generatePasswordResetToken(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('No account with that email', 404);

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  return { user, token };
}

export async function resetPasswordWithToken(token, newPassword) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  logger.logAuth('PASSWORD_RESET', user._id, true);
}

export async function verifyEmail(token) {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError('Invalid or expired verification token', 400);

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
  return user;
}

export async function sendPhoneVerificationCode(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.phoneVerificationCode = code;
  user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // In production: send via SMS service
  logger.info(`Phone verification code for ${user._id}: ${code}`);
  return code;
}

export async function verifyPhoneCode(userId, code) {
  const user = await User.findById(userId).select('+phoneVerificationCode +phoneVerificationExpires');
  if (!user) throw new AppError('User not found', 404);
  if (!user.phoneVerificationCode || user.phoneVerificationCode !== code) {
    throw new AppError('Invalid verification code', 400);
  }
  if (new Date() > user.phoneVerificationExpires) {
    throw new AppError('Verification code expired', 400);
  }

  user.isPhoneVerified = true;
  user.phoneVerificationCode = undefined;
  user.phoneVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
}

export default {
  registerUser, loginUser, getCurrentUser, changePassword,
  generatePasswordResetToken, resetPasswordWithToken,
  verifyEmail, sendPhoneVerificationCode, verifyPhoneCode,
};
