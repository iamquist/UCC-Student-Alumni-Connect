import Bull from 'bull';
import { REDIS_CONFIG } from '../config/index.js';
import logger from '../utils/logger.js';

const redisOpts = {
  host: REDIS_CONFIG.host,
  port: REDIS_CONFIG.port,
  password: REDIS_CONFIG.password,
  maxRetriesPerRequest: REDIS_CONFIG.maxRetriesPerRequest,
  retryStrategy: (times) => Math.min(times * REDIS_CONFIG.retryDelayMs, 10000),
};

export const notificationQueue = new Bull('notifications', { redis: redisOpts });

notificationQueue.on('error', (err) => logger.error('Notification queue error', err));
notificationQueue.on('failed', (job, err) => logger.error(`Job ${job.id} failed`, err));
notificationQueue.on('completed', (job) => logger.debug(`Notification job ${job.id} completed`));

export async function enqueueNotificationDelivery(notificationId, options = {}) {
  return notificationQueue.add('deliver', { notificationId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
    ...options,
  });
}

export async function enqueueEmailNotification(data) {
  return notificationQueue.add('email', data, {
    attempts: 3,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: true,
  });
}

export default { notificationQueue, enqueueNotificationDelivery, enqueueEmailNotification };
