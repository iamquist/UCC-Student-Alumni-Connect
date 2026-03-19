import { ActivityLog } from '../db/models/index.js';
import logger from './logger.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';

export const logActivity = async (activityData) => {
  try {
    return await ActivityLog.create(activityData);
  } catch (err) {
    logger.error('Failed to log activity', err);
    return null;
  }
};

const log = (activityType) => (userId, description, metadata = {}) =>
  logActivity({ user: userId, activityType, description, metadata });

export const logLogin        = log('login');
export const logLogout       = log('logout');
export const logProfileUpdate = log('profile_update');
export const logPostCreate   = log('post_create');
export const logPostUpdate   = log('post_update');
export const logPostDelete   = log('post_delete');
export const logConnectionRequest = log('connection_request');
export const logConnectionAccept  = log('connection_accept');
export const logMentorshipRequest = log('mentorship_request');
export const logMentorshipAccept  = log('mentorship_accept');
export const logEventRegistration = log('event_registration');
export const logJobApplication    = log('job_application');
export const logQuestionCreate    = log('question_create');
export const logAdminAction       = log('admin_action');

export const getUserActivities = async (userId, filters = {}, query = {}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { user: userId, ...filters };
  const [data, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);
  return formatPaginationResponse(data, total, page, limit);
};

export const getSystemActivities = async (filters = {}, query = {}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [data, total] = await Promise.all([
    ActivityLog.find(filters)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filters),
  ]);
  return formatPaginationResponse(data, total, page, limit);
};

export default {
  logActivity, logLogin, logLogout, logProfileUpdate, logPostCreate, logPostUpdate,
  logPostDelete, logConnectionRequest, logConnectionAccept, logMentorshipRequest,
  logMentorshipAccept, logEventRegistration, logJobApplication, logQuestionCreate,
  logAdminAction, getUserActivities, getSystemActivities,
};
