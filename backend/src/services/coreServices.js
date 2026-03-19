import { Post } from '../db/models/index.js';
import { Connection } from '../db/models/index.js';
import { JobOpportunity } from '../db/models/index.js';
import { Event } from '../db/models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';
import { createNotification } from './notificationService.js';

// ── Post Service ───────────────────────────────────────────────
export async function createPost(authorId, postData) {
  const post = await Post.create({ ...postData, author: authorId });
  await post.populate('author', 'firstName lastName profilePicture bio role');
  return post;
}

export async function getPosts(filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { visibility: 'public' };
  if (filters.author) filter.author = filters.author;
  if (filters.tags) filter.tags = { $in: filters.tags };

  const sort = query.sort === 'trending'
    ? { likes: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'firstName lastName profilePicture bio role')
      .populate('comments.author', 'firstName lastName profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  return formatPaginationResponse(posts, total, page, limit);
}

export async function getPostById(postId) {
  const post = await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } }, { new: true })
    .populate('author', 'firstName lastName profilePicture bio role')
    .populate('comments.author', 'firstName lastName profilePicture');
  if (!post) throw new AppError('Post not found', 404);
  return post;
}

export async function togglePostLike(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const liked = post.likes.includes(userId);
  if (liked) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
    // Notify author
    if (post.author.toString() !== userId.toString()) {
      await createNotification({
        recipient: post.author,
        sender: userId,
        type: 'post_like',
        title: 'Post liked',
        message: 'liked your post',
        data: { postId },
      });
    }
  }
  await post.save();
  return { liked: !liked, count: post.likes.length };
}

export async function commentOnPost(postId, authorId, content) {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  post.comments.push({ author: authorId, content });
  await post.save();

  const comment = post.comments[post.comments.length - 1];
  await Post.populate(post, { path: 'comments.author', select: 'firstName lastName profilePicture' });

  // Notify post author
  if (post.author.toString() !== authorId.toString()) {
    await createNotification({
      recipient: post.author,
      sender: authorId,
      type: 'post_comment',
      title: 'New comment',
      message: 'commented on your post',
      data: { postId },
    });
  }

  const populated = post.comments.id(comment._id);
  return populated;
}

export async function deletePost(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  if (post.author.toString() !== userId.toString()) throw new AppError('Not authorized', 403);
  await post.deleteOne();
}

// ── Connection Service ─────────────────────────────────────────
export async function sendConnectionRequest(requesterId, recipientId, message) {
  if (requesterId.toString() === recipientId.toString()) {
    throw new AppError('Cannot connect with yourself', 400);
  }

  const existing = await Connection.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId },
    ],
  });
  if (existing) {
    if (existing.status === 'accepted') throw new AppError('Already connected', 409);
    if (existing.status === 'pending') throw new AppError('Request already sent', 409);
  }

  const connection = await Connection.create({ requester: requesterId, recipient: recipientId, message });
  await connection.populate(['requester', 'recipient']);

  await createNotification({
    recipient: recipientId,
    sender: requesterId,
    type: 'connection_request',
    title: 'Connection request',
    message: 'wants to connect with you',
    data: { connectionId: connection._id },
  });

  return connection;
}

export async function getConnectionRequests(userId, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const type = query.type || 'received';

  const filter = type === 'received'
    ? { recipient: userId, status: 'pending' }
    : { requester: userId, status: 'pending' };

  const [data, total] = await Promise.all([
    Connection.find(filter)
      .populate('requester', 'firstName lastName profilePicture bio role')
      .populate('recipient', 'firstName lastName profilePicture bio role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Connection.countDocuments(filter),
  ]);

  return formatPaginationResponse(data, total, page, limit);
}

export async function acceptConnectionRequest(requestId, userId) {
  const conn = await Connection.findOne({ _id: requestId, recipient: userId, status: 'pending' });
  if (!conn) throw new AppError('Connection request not found', 404);

  conn.status = 'accepted';
  await conn.save();
  await conn.populate(['requester', 'recipient']);

  await createNotification({
    recipient: conn.requester._id,
    sender: userId,
    type: 'connection_accepted',
    title: 'Connection accepted',
    message: 'accepted your connection request',
    data: { connectionId: conn._id },
  });

  return conn;
}

export async function declineConnectionRequest(requestId, userId) {
  const conn = await Connection.findOneAndUpdate(
    { _id: requestId, recipient: userId, status: 'pending' },
    { status: 'declined' },
    { new: true }
  );
  if (!conn) throw new AppError('Connection request not found', 404);
  return conn;
}

export async function getConnections(userId, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);

  const connections = await Connection.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted',
  })
    .populate('requester', 'firstName lastName profilePicture bio role location')
    .populate('recipient', 'firstName lastName profilePicture bio role location')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Connection.countDocuments({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted',
  });

  // Return the other user in each connection
  const users = connections.map(conn => {
    const other = conn.requester._id.toString() === userId.toString()
      ? conn.recipient
      : conn.requester;
    return { ...other.toObject(), connectedAt: conn.updatedAt };
  });

  return formatPaginationResponse(users, total, page, limit);
}

// ── Job Service ────────────────────────────────────────────────
export async function postJob(postedBy, jobData) {
  const job = await JobOpportunity.create({ ...jobData, postedBy });
  await job.populate('postedBy', 'firstName lastName profilePicture');
  return job;
}

export async function getJobs(filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { isActive: true };
  if (filters.q) filter.$text = { $search: filters.q };
  if (filters.type) filter.type = filters.type;
  if (filters.location) filter.location = new RegExp(filters.location, 'i');

  const sort = filters.q ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 };

  const [jobs, total] = await Promise.all([
    JobOpportunity.find(filter)
      .populate('postedBy', 'firstName lastName profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    JobOpportunity.countDocuments(filter),
  ]);

  return formatPaginationResponse(jobs, total, page, limit);
}

export async function getJobById(jobId) {
  const job = await JobOpportunity.findById(jobId)
    .populate('postedBy', 'firstName lastName profilePicture bio');
  if (!job) throw new AppError('Job not found', 404);
  return job;
}

export async function applyForJob(jobId, userId, applicationData) {
  const job = await JobOpportunity.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);
  if (!job.isActive) throw new AppError('This job is no longer active', 400);

  const alreadyApplied = job.applications.some(a => a.applicant.toString() === userId.toString());
  if (alreadyApplied) throw new AppError('Already applied to this job', 409);

  job.applications.push({ applicant: userId, ...applicationData });
  await job.save();

  // Notify job poster
  await createNotification({
    recipient: job.postedBy,
    sender: userId,
    type: 'system',
    title: 'New job application',
    message: `Someone applied for "${job.title}"`,
    data: { jobId },
  });

  return job.applications[job.applications.length - 1];
}

export async function saveJob(jobId, userId) {
  const job = await JobOpportunity.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);

  const saved = job.savedBy.includes(userId);
  if (saved) {
    job.savedBy.pull(userId);
  } else {
    job.savedBy.push(userId);
  }
  await job.save();
  return { saved: !saved };
}

// ── Event Service ──────────────────────────────────────────────
export async function createEvent(organizerId, eventData) {
  const event = await Event.create({ ...eventData, organizer: organizerId });
  await event.populate('organizer', 'firstName lastName profilePicture');
  return event;
}

export async function getEvents(filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { isActive: true };
  if (filters.upcoming) filter.startDate = { $gte: new Date() };
  if (filters.tags) filter.tags = { $in: filters.tags };

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('organizer', 'firstName lastName profilePicture')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  return formatPaginationResponse(events, total, page, limit);
}

export async function getEventById(eventId) {
  const event = await Event.findById(eventId).populate('organizer', 'firstName lastName profilePicture bio');
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

export async function registerForEvent(eventId, userId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);
  if (!event.isActive) throw new AppError('Event is no longer active', 400);
  if (event.attendees.includes(userId)) throw new AppError('Already registered', 409);
  if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
    throw new AppError('Event is full', 400);
  }

  event.attendees.push(userId);
  await event.save();

  await createNotification({
    recipient: userId,
    type: 'event_reminder',
    title: 'Event registered',
    message: `You are registered for "${event.title}"`,
    data: { eventId },
  });

  return event;
}

export async function cancelEventRegistration(eventId, userId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);
  if (!event.attendees.includes(userId)) throw new AppError('Not registered for this event', 400);

  event.attendees.pull(userId);
  await event.save();
  return event;
}

export default {
  // Posts
  createPost, getPosts, getPostById, togglePostLike, commentOnPost, deletePost,
  // Connections
  sendConnectionRequest, getConnectionRequests, acceptConnectionRequest, declineConnectionRequest, getConnections,
  // Jobs
  postJob, getJobs, getJobById, applyForJob, saveJob,
  // Events
  createEvent, getEvents, getEventById, registerForEvent, cancelEventRegistration,
};
