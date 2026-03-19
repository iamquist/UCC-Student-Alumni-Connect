import nodemailer from 'nodemailer';
import { EMAIL_CONFIG, ENV } from '../config/index.js';
import logger from './logger.js';

let transporter = null;
let emailHistory = [];

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.port === 465,
      auth: EMAIL_CONFIG.enabled ? { user: EMAIL_CONFIG.user, pass: EMAIL_CONFIG.pass } : undefined,
    });
  }
  return transporter;
};

const sendEmailWithRetry = async (mailOptions, retries = 3) => {
  if (!EMAIL_CONFIG.enabled) {
    logger.info(`[Email] Simulated: ${mailOptions.to} - ${mailOptions.subject}`);
    emailHistory.push({ ...mailOptions, sentAt: new Date(), simulated: true });
    return { messageId: `simulated_${Date.now()}` };
  }
  for (let i = 0; i < retries; i++) {
    try {
      const result = await getTransporter().sendMail(mailOptions);
      emailHistory.push({ ...mailOptions, sentAt: new Date(), messageId: result.messageId });
      return result;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
};

const baseOptions = (to, subject) => ({
  from: EMAIL_CONFIG.from,
  to,
  subject,
});

export const sendWelcomeEmail = async (user) => sendEmailWithRetry({
  ...baseOptions(user.email, 'Welcome to UniAlum!'),
  html: `<h2>Welcome, ${user.firstName}!</h2><p>Your account has been created successfully. Start exploring the platform and connecting with alumni.</p>`,
});

export const sendPasswordResetEmail = async (user, resetToken) => sendEmailWithRetry({
  ...baseOptions(user.email, 'Password Reset Request'),
  html: `<h2>Reset Your Password</h2><p>Click the link below to reset your password. This link expires in 1 hour.</p><a href="${ENV.CLIENT_URL}/reset-password?token=${resetToken}">Reset Password</a>`,
});

export const sendEmailVerificationEmail = async (user, token) => sendEmailWithRetry({
  ...baseOptions(user.email, 'Verify Your Email - UniAlum'),
  html: `<h2>Verify Your Email</h2><p>Click the link below to verify your email address.</p><a href="${ENV.CLIENT_URL}/verify-email/${token}">Verify Email</a>`,
});

export const sendMentorshipRequestEmail = async (alumni, student, request) => sendEmailWithRetry({
  ...baseOptions(alumni.email, `Mentorship Request from ${student.firstName}`),
  html: `<h2>New Mentorship Request</h2><p>${student.firstName} ${student.lastName} has sent you a mentorship request about: <strong>${request.topic}</strong></p><p>${request.message}</p>`,
});

export const sendConnectionRequestEmail = async (recipient, requester) => sendEmailWithRetry({
  ...baseOptions(recipient.email, `${requester.firstName} wants to connect with you`),
  html: `<h2>New Connection Request</h2><p>${requester.firstName} ${requester.lastName} wants to connect with you on UniAlum.</p><a href="${ENV.CLIENT_URL}/network">View Request</a>`,
});

export const sendEventReminderEmail = async (user, event) => sendEmailWithRetry({
  ...baseOptions(user.email, `Reminder: ${event.title} is coming up!`),
  html: `<h2>Event Reminder</h2><p>Don't forget! <strong>${event.title}</strong> starts on ${new Date(event.startDate).toLocaleDateString()}.</p>`,
});

export const sendNotificationEmail = async (user, notification) => sendEmailWithRetry({
  ...baseOptions(user.email, notification.title),
  html: `<h2>${notification.title}</h2><p>${notification.message}</p><a href="${ENV.CLIENT_URL}/notifications">View on UniAlum</a>`,
});

export const sendTestEmail = async ({ to, subject, message, triggeredBy }) => {
  const result = await sendEmailWithRetry({ ...baseOptions(to, subject || 'Test Email'), html: `<p>${message}</p>`, text: message });
  logger.info(`Test email sent by ${triggeredBy}`);
  return result;
};

export const verifyEmailConfig = async () => {
  try {
    await getTransporter().verify();
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

export const getEmailStatus = () => ({
  enabled: EMAIL_CONFIG.enabled,
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  from: EMAIL_CONFIG.from,
  historyCount: emailHistory.length,
  recentHistory: emailHistory.slice(-5),
});

export default {
  sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail,
  sendMentorshipRequestEmail, sendConnectionRequestEmail, sendEventReminderEmail,
  sendNotificationEmail, sendTestEmail, verifyEmailConfig, getEmailStatus,
};
