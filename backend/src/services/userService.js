import { User } from '../db/models/user.js';
import { AlumniProfile, StudentProfile, ActivityLog, Notification, Post, JobOpportunity, Event, Connection, MentorshipRequest } from '../db/models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';

// ── User Service ───────────────────────────────────────────────
export async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateUserProfile(userId, updateData) {
  const allowedFields = ['firstName', 'lastName', 'bio', 'location', 'profilePicture', 'coverPhoto', 'phone'];
  const filtered = {};
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) filtered[field] = updateData[field];
  });

  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);

  // Update role-specific profile
  if (updateData.profile) {
    if (user.role === 'alumni') {
      await AlumniProfile.findOneAndUpdate({ user: userId }, updateData.profile, { new: true, upsert: true });
    } else if (user.role === 'student') {
      await StudentProfile.findOneAndUpdate({ user: userId }, updateData.profile, { new: true, upsert: true });
    }
  }

  return user;
}

export async function searchUsers(params) {
  const { page, limit, skip } = getPaginationParams(params);
  const filter = { isActive: true };

  if (params.q) {
    filter.$or = [
      { firstName: new RegExp(params.q, 'i') },
      { lastName: new RegExp(params.q, 'i') },
      { bio: new RegExp(params.q, 'i') },
    ];
  }
  if (params.role) filter.role = params.role;

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return formatPaginationResponse(users, total, page, limit);
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  let profile = null;
  if (user.role === 'alumni') {
    profile = await AlumniProfile.findOne({ user: userId });
  } else if (user.role === 'student') {
    profile = await StudentProfile.findOne({ user: userId });
  }

  return { user, profile };
}

// ── Admin Service ──────────────────────────────────────────────
export async function getDashboardStats() {
  const [
    totalUsers, totalStudents, totalAlumni, activeUsers,
    totalPosts, totalJobs, totalEvents, totalConnections,
    totalMentorships,
    recentSignups,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'alumni' }),
    User.countDocuments({ isActive: true }),
    Post.countDocuments(),
    JobOpportunity.countDocuments({ isActive: true }),
    Event.countDocuments({ isActive: true }),
    Connection.countDocuments({ status: 'accepted' }),
    MentorshipRequest.countDocuments(),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }),
  ]);

  return {
    totalUsers, totalStudents, totalAlumni, activeUsers,
    totalPosts, totalJobs, totalEvents, totalConnections,
    totalMentorships, recentSignups,
  };
}

export async function getAllUsers(filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  if (filters.role) filter.role = filters.role;
  if (filters.status === 'active') filter.isActive = true;
  if (filters.status === 'inactive') filter.isActive = false;
  if (filters.q) {
    filter.$or = [
      { firstName: new RegExp(filters.q, 'i') },
      { lastName: new RegExp(filters.q, 'i') },
      { email: new RegExp(filters.q, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return formatPaginationResponse(users, total, page, limit);
}

export async function updateUserStatus(userId, isActive) {
  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function getActivityLogs(filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  if (filters.userId) filter.user = filters.userId;
  if (filters.type) filter.activityType = filters.type;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'firstName lastName profilePicture role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return formatPaginationResponse(logs, total, page, limit);
}

export async function globalSearch(q) {
  if (!q || q.length < 2) return { jobs: [], users: [], posts: [], events: [], total: 0 };

  const regex = new RegExp(q, 'i');
  const [jobs, users, posts, events] = await Promise.all([
    JobOpportunity.find({ $or: [{ title: regex }, { company: regex }], isActive: true }).limit(5).populate('postedBy', 'firstName lastName'),
    User.find({ $or: [{ firstName: regex }, { lastName: regex }, { bio: regex }], isActive: true }).limit(10),
    Post.find({ content: regex, visibility: 'public' }).limit(5).populate('author', 'firstName lastName profilePicture'),
    Event.find({ $or: [{ title: regex }, { description: regex }], isActive: true }).limit(5),
  ]);

  return {
    jobs,
    users,
    posts,
    events,
    total: jobs.length + users.length + posts.length + events.length,
  };
}

export default {
  getUserProfile, updateUserProfile, searchUsers, getUserById,
  getDashboardStats, getAllUsers, updateUserStatus, getActivityLogs, globalSearch,
};
