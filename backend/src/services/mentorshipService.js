import { MentorshipRequest } from '../db/models/index.js';
import { User } from '../db/models/user.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';
import { createNotification } from './notificationService.js';

export async function sendMentorshipRequest(studentId, { alumniId, topic, message }) {
  const alumni = await User.findById(alumniId);
  if (!alumni || alumni.role !== 'alumni') throw new AppError('Alumni not found', 404);

  const existing = await MentorshipRequest.findOne({
    student: studentId, alumni: alumniId, status: 'pending',
  });
  if (existing) throw new AppError('You already have a pending request with this alumni', 409);

  const request = await MentorshipRequest.create({ student: studentId, alumni: alumniId, topic, message });
  await request.populate(['student', 'alumni']);

  await createNotification({
    recipient: alumniId,
    sender: studentId,
    type: 'mentorship_request',
    title: 'Mentorship Request',
    message: `wants mentorship on: ${topic}`,
    data: { requestId: request._id },
  });

  return request;
}

export async function getMentorshipRequests(alumniId, filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { alumni: alumniId };
  if (filters.status) filter.status = filters.status;

  const [data, total] = await Promise.all([
    MentorshipRequest.find(filter)
      .populate('student', 'firstName lastName profilePicture bio role')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    MentorshipRequest.countDocuments(filter),
  ]);
  return formatPaginationResponse(data, total, page, limit);
}

export async function getMyMentorshipRequests(studentId, filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { student: studentId };
  if (filters.status) filter.status = filters.status;

  const [data, total] = await Promise.all([
    MentorshipRequest.find(filter)
      .populate('alumni', 'firstName lastName profilePicture bio role')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    MentorshipRequest.countDocuments(filter),
  ]);
  return formatPaginationResponse(data, total, page, limit);
}

export async function acceptMentorshipRequest(requestId, alumniId, { responseMessage, scheduledAt } = {}) {
  const request = await MentorshipRequest.findOne({ _id: requestId, alumni: alumniId, status: 'pending' });
  if (!request) throw new AppError('Mentorship request not found', 404);

  request.status = 'accepted';
  if (responseMessage) request.responseMessage = responseMessage;
  if (scheduledAt) request.scheduledAt = scheduledAt;
  await request.save();
  await request.populate(['student', 'alumni']);

  await createNotification({
    recipient: request.student._id,
    sender: alumniId,
    type: 'mentorship_accepted',
    title: 'Mentorship Accepted',
    message: 'accepted your mentorship request',
    data: { requestId },
  });

  return request;
}

export async function declineMentorshipRequest(requestId, alumniId, responseMessage) {
  const request = await MentorshipRequest.findOneAndUpdate(
    { _id: requestId, alumni: alumniId, status: 'pending' },
    { status: 'declined', responseMessage },
    { new: true }
  );
  if (!request) throw new AppError('Mentorship request not found', 404);
  return request;
}

export default {
  sendMentorshipRequest, getMentorshipRequests, getMyMentorshipRequests,
  acceptMentorshipRequest, declineMentorshipRequest,
};
