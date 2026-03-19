import { logActivity } from '../utils/activityTracker.js';
import logger from '../utils/logger.js';

export const trackActivity = async (activityType, req, metadata = {}) => {
  if (!req.user) return;
  try {
    await logActivity({
      user: req.user._id,
      activityType,
      description: `${activityType} by ${req.user.firstName} ${req.user.lastName}`,
      metadata: { ip: req.ip, ...metadata },
    });
  } catch (err) {
    logger.error('Activity tracking error', err);
  }
};

export const activityTracker = (activityType, getMetadata) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      const metadata = getMetadata ? getMetadata(req) : {};
      trackActivity(activityType, req, metadata).catch(() => {});
    }
  });
  next();
};

export default { trackActivity, activityTracker };
