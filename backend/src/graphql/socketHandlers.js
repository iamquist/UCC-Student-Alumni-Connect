import { verifyToken } from '../middleware/auth.js';
import { User } from '../db/models/user.js';
import * as messageService from '../services/messageService.js';
import logger from '../utils/logger.js';

const onlineUsers = new Map(); // userId -> Set of socketIds

export function setupSocketHandlers(io) {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || !user.isActive) return next(new Error('Unauthorized'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.debug(`Socket connected: ${userId} (${socket.id})`);

    // Track online users
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status to all connected users
    socket.broadcast.emit('user:online', { userId });

    // Join user's personal room for targeted notifications
    socket.join(`user:${userId}`);

    // ── Conversation events ──────────────────────────────────
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
      logger.debug(`${userId} joined conversation: ${conversationId}`);
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── Messaging ────────────────────────────────────────────
    socket.on('message:send', async ({ conversationId, content, attachments = [] }) => {
      try {
        const message = await messageService.sendMessage(userId, { conversationId, content, attachments });
        // Broadcast to all in conversation room (including sender for confirmation)
        io.to(`conv:${conversationId}`).emit('message:new', message);
        logger.debug(`Message sent in conv ${conversationId} by ${userId}`);
      } catch (err) {
        socket.emit('message:error', { error: err.message });
        logger.error('Socket message:send error', err);
      }
    });

    socket.on('message:read', async ({ conversationId }) => {
      try {
        const count = await messageService.markMessagesAsRead(conversationId, userId);
        if (count > 0) {
          io.to(`conv:${conversationId}`).emit('message:read', {
            conversationId,
            userId,
            readAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.error('Socket message:read error', err);
      }
    });

    // ── Typing indicators ────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
        user: {
          _id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          profilePicture: socket.user.profilePicture,
        },
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { conversationId, userId });
    });

    // ── Disconnect ───────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
          logger.debug(`User offline: ${userId}`);
        }
      }
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${userId}`, err);
    });
  });

  return io;
}

// Helper to send notification to a specific user via socket
export function emitToUser(io, userId, event, data) {
  io.to(`user:${userId.toString()}`).emit(event, data);
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

export default { setupSocketHandlers, emitToUser, isUserOnline, getOnlineUsers };
