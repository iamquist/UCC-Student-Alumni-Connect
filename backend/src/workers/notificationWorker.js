import { notificationQueue } from '../queues/notificationQueue.js';
import { Notification } from '../db/models/index.js';
import { User } from '../db/models/user.js';
import logger from '../utils/logger.js';
import { EMAIL_CONFIG } from '../config/index.js';

export function startNotificationWorker() {
  notificationQueue.process('deliver', async (job) => {
    const { notificationId } = job.data;

    const notification = await Notification.findById(notificationId)
      .populate('recipient', 'firstName lastName email phone')
      .populate('sender', 'firstName lastName');

    if (!notification) {
      logger.warn(`Notification ${notificationId} not found`);
      return;
    }

    const recipient = notification.recipient;
    const results = { email: false, sms: false };

    // Email delivery
    if (EMAIL_CONFIG.enabled && recipient.email) {
      try {
        // In production: use nodemailer here
        logger.info(`[Worker] Email notification to ${recipient.email}: ${notification.title}`);
        results.email = true;
      } catch (err) {
        logger.error('Email delivery failed', err);
      }
    }

    // Mark delivery status
    await Notification.findByIdAndUpdate(notificationId, {
      deliveredViaEmail: results.email,
      deliveredViaSMS: results.sms,
    });

    return results;
  });

  notificationQueue.process('email', async (job) => {
    const { to, subject, body } = job.data;
    logger.info(`[Worker] Sending email to ${to}: ${subject}`);
    // nodemailer send logic here
  });

  logger.info('Notification worker started');
}

export default { startNotificationWorker };
