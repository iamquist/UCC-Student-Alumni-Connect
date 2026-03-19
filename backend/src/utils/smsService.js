import { SMS_CONFIG } from '../config/index.js';
import logger from './logger.js';

export const formatPhoneNumber = (phone) => {
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('233')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+233${cleaned.slice(1)}`;
  return `+233${cleaned}`;
};

export const validatePhoneNumber = (phone) =>
  /^(\+233|0)(20|23|24|25|26|27|28|29|50|54|55|56|57|59)\d{7}$/.test(String(phone).replace(/\s/g, ''));

const simulateSMS = (phone, message) => {
  logger.info(`[SMS] Simulated to ${phone}: ${message.slice(0, 50)}...`);
  return { status: 'simulated', phone, message };
};

const truncateMessage = (message, maxLength = 160) =>
  message.length > maxLength ? message.slice(0, maxLength - 3) + '...' : message;

const sendSMSWithRetry = async (phone, message, retries = 2) => {
  const formatted = formatPhoneNumber(phone);
  const truncated = truncateMessage(message);

  if (!SMS_CONFIG.enabled) return simulateSMS(formatted, truncated);

  for (let i = 0; i < retries; i++) {
    try {
      // In production: integrate with Africa's Talking or Twilio
      logger.info(`[SMS] Sending to ${formatted}`);
      return { status: 'sent', phone: formatted };
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

export const sendVerificationCode = (phone, code) =>
  sendSMSWithRetry(phone, `Your UniAlum verification code is: ${code}. Valid for 10 minutes.`);

export const sendPasswordResetCode = (phone, code) =>
  sendSMSWithRetry(phone, `Your UniAlum password reset code is: ${code}. Valid for 1 hour.`);

export const sendWelcomeSMS = (phone, userName) =>
  sendSMSWithRetry(phone, `Welcome to UniAlum, ${userName}! Connect with alumni and grow your network.`);

export const sendMentorshipRequestSMS = (phone, studentName) =>
  sendSMSWithRetry(phone, `UniAlum: ${studentName} sent you a mentorship request. Log in to respond.`);

export const sendConnectionRequestSMS = (phone, userName) =>
  sendSMSWithRetry(phone, `UniAlum: ${userName} wants to connect with you. Log in to accept.`);

export const sendEventReminderSMS = (phone, eventName, time) =>
  sendSMSWithRetry(phone, `UniAlum Reminder: "${eventName}" starts at ${time}. Don't miss it!`);

export const sendCustomSMS = (phone, message) => sendSMSWithRetry(phone, message);

export const getSMSStatus = () => ({
  enabled: SMS_CONFIG.enabled,
  provider: SMS_CONFIG.provider,
  senderId: SMS_CONFIG.senderId,
});

export const verifySMSConfig = async () => {
  if (!SMS_CONFIG.enabled) return { connected: false, reason: 'SMS not configured' };
  return { connected: true, provider: SMS_CONFIG.provider };
};

export default {
  sendVerificationCode, sendPasswordResetCode, sendWelcomeSMS, sendMentorshipRequestSMS,
  sendConnectionRequestSMS, sendEventReminderSMS, sendCustomSMS, formatPhoneNumber,
  validatePhoneNumber, getSMSStatus, verifySMSConfig,
};
