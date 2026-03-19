import { asyncHandler } from "../middleware/errorHandler.js";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNotFound,
  sendError,
} from "../utils/responseUtils.js";
import * as authService from "../services/authService.js";
import * as userService from "../services/userService.js";
import {
  createPost,
  getPosts,
  getPostById,
  togglePostLike,
  commentOnPost,
  deletePost,
} from "../services/coreServices.js";
import {
  sendConnectionRequest,
  getConnectionRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
  getConnections,
} from "../services/coreServices.js";
import {
  postJob,
  getJobs,
  getJobById,
  applyForJob,
  saveJob,
} from "../services/coreServices.js";
import {
  createEvent,
  getEvents,
  getEventById,
  registerForEvent,
  cancelEventRegistration,
} from "../services/coreServices.js";
import * as messageService from "../services/messageService.js";
import * as notificationService from "../services/notificationService.js";

// ── Auth Controller ────────────────────────────────────────────
export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body);
    sendCreated(res, result, "Registration successful");
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    sendSuccess(res, result, "Login successful");
  }),

  getCurrentUser: asyncHandler(async (req, res) => {
    sendSuccess(res, req.user);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword,
    );
    sendSuccess(res, null, "Password changed successfully");
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { token } = await authService.generatePasswordResetToken(email);
    // In production: send email with token
    sendSuccess(res, null, "Password reset link sent to your email");
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    await authService.resetPasswordWithToken(token, newPassword);
    sendSuccess(res, null, "Password reset successfully");
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.params.token);
    sendSuccess(res, null, "Email verified successfully");
  }),

  sendPhoneVerification: asyncHandler(async (req, res) => {
    await authService.sendPhoneVerificationCode(req.user._id);
    sendSuccess(res, null, "Verification code sent");
  }),

  verifyPhone: asyncHandler(async (req, res) => {
    const { code } = req.body;
    await authService.verifyPhoneCode(req.user._id, code);
    sendSuccess(res, null, "Phone verified successfully");
  }),
};

// ── User Controller ────────────────────────────────────────────
export const userController = {
  getProfile: asyncHandler(async (req, res) => {
    sendSuccess(res, req.user);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const user = await userService.updateUserProfile(req.user._id, req.body);
    sendSuccess(res, user, "Profile updated");
  }),

  getUserById: asyncHandler(async (req, res) => {
    const result = await userService.getUserById(req.params.id);
    sendSuccess(res, result);
  }),

  searchUsers: asyncHandler(async (req, res) => {
    const result = await userService.searchUsers({ ...req.query });
    res.json({ success: true, message: "OK", ...result });
  }),
};

// ── Post Controller ────────────────────────────────────────────
export const postController = {
  createPost: asyncHandler(async (req, res) => {
    const post = await createPost(req.user._id, req.body);
    sendCreated(res, post, "Post created");
  }),

  getPosts: asyncHandler(async (req, res) => {
    const result = await getPosts(req.query, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),

  getPostById: asyncHandler(async (req, res) => {
    const post = await getPostById(req.params.id);
    sendSuccess(res, post);
  }),

  likePost: asyncHandler(async (req, res) => {
    const result = await togglePostLike(req.params.id, req.user._id);
    sendSuccess(res, result);
  }),

  commentOnPost: asyncHandler(async (req, res) => {
    const comment = await commentOnPost(
      req.params.id,
      req.user._id,
      req.body.content,
    );
    sendCreated(res, comment, "Comment added");
  }),

  deletePost: asyncHandler(async (req, res) => {
    await deletePost(req.params.id, req.user._id);
    sendSuccess(res, null, "Post deleted");
  }),
};

// ── Connection Controller ──────────────────────────────────────
export const connectionController = {
  sendRequest: asyncHandler(async (req, res) => {
    const { recipientId, message } = req.body;
    const conn = await sendConnectionRequest(
      req.user._id,
      recipientId,
      message,
    );

    // Emit real-time notification via socket.io
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${recipientId}`).emit("notification:new", {
          _id: conn._id,
          recipient: recipientId,
          sender: req.user,
          type: "connection_request",
          title: "Connection request",
          message: "wants to connect with you",
          data: { connectionId: conn._id },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to emit socket notification:", err);
    }

    sendCreated(res, conn, "Connection request sent");
  }),

  getRequests: asyncHandler(async (req, res) => {
    const result = await getConnectionRequests(req.user._id, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),

  acceptRequest: asyncHandler(async (req, res) => {
    const conn = await acceptConnectionRequest(req.params.id, req.user._id);

    // Emit notification to the requester
    try {
      const io = req.app.get("io");
      if (io && conn.requester) {
        io.to(`user:${conn.requester._id}`).emit("notification:new", {
          type: "connection_accepted",
          title: "Connection accepted",
          message: "accepted your connection request",
          data: { connectionId: conn._id },
        });
      }
    } catch (err) {
      console.error("Failed to emit socket notification:", err);
    }

    sendSuccess(res, conn, "Connection accepted");
  }),

  declineRequest: asyncHandler(async (req, res) => {
    await declineConnectionRequest(req.params.id, req.user._id);
    sendSuccess(res, null, "Request declined");
  }),

  getConnections: asyncHandler(async (req, res) => {
    const result = await getConnections(req.user._id, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),
};

// ── Job Controller ─────────────────────────────────────────────
export const jobController = {
  postJob: asyncHandler(async (req, res) => {
    const job = await postJob(req.user._id, req.body);
    sendCreated(res, job, "Job posted");
  }),

  getJobs: asyncHandler(async (req, res) => {
    const result = await getJobs(req.query, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),

  getJobById: asyncHandler(async (req, res) => {
    const job = await getJobById(req.params.id);
    sendSuccess(res, job);
  }),

  applyForJob: asyncHandler(async (req, res) => {
    const application = await applyForJob(
      req.params.id,
      req.user._id,
      req.body,
    );
    sendCreated(res, application, "Application submitted");
  }),

  saveJob: asyncHandler(async (req, res) => {
    const result = await saveJob(req.params.id, req.user._id);
    sendSuccess(res, result);
  }),
};

// ── Event Controller ───────────────────────────────────────────
export const eventController = {
  createEvent: asyncHandler(async (req, res) => {
    const event = await createEvent(req.user._id, req.body);
    sendCreated(res, event, "Event created");
  }),

  getEvents: asyncHandler(async (req, res) => {
    const result = await getEvents(req.query, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),

  getEventById: asyncHandler(async (req, res) => {
    const event = await getEventById(req.params.id);
    sendSuccess(res, event);
  }),

  registerForEvent: asyncHandler(async (req, res) => {
    await registerForEvent(req.params.id, req.user._id);
    sendSuccess(res, null, "Registered for event");
  }),

  cancelRegistration: asyncHandler(async (req, res) => {
    await cancelEventRegistration(req.params.id, req.user._id);
    sendSuccess(res, null, "Registration cancelled");
  }),
};

// ── Message Controller ─────────────────────────────────────────
export const messageController = {
  getConversations: asyncHandler(async (req, res) => {
    const convs = await messageService.getUserConversations(req.user._id);
    sendSuccess(res, convs);
  }),

  getOrCreateConversation: asyncHandler(async (req, res) => {
    const { participantId } = req.body;
    const conv = await messageService.getOrCreateConversation(
      req.user._id,
      participantId,
    );
    sendSuccess(res, conv);
  }),

  getMessages: asyncHandler(async (req, res) => {
    const result = await messageService.getConversationMessages(
      req.params.id,
      req.user._id,
      req.query,
    );
    res.json({ success: true, message: "OK", ...result });
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const msg = await messageService.sendMessage(req.user._id, req.body);
    sendCreated(res, msg, "Message sent");
  }),

  markAsRead: asyncHandler(async (req, res) => {
    await messageService.markMessagesAsRead(req.params.id, req.user._id);
    sendSuccess(res, null, "Messages marked as read");
  }),

  deleteMessage: asyncHandler(async (req, res) => {
    await messageService.deleteMessage(req.params.id, req.user._id);
    sendSuccess(res, null, "Message deleted");
  }),
};

// ── Notification Controller ────────────────────────────────────
export const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const result = await notificationService.getUserNotifications(
      req.user._id,
      req.query,
    );
    res.json({ success: true, message: "OK", ...result });
  }),

  markAsRead: asyncHandler(async (req, res) => {
    await notificationService.markNotificationAsRead(
      req.params.id,
      req.user._id,
    );
    sendSuccess(res, null, "Marked as read");
  }),

  markAllAsRead: asyncHandler(async (req, res) => {
    await notificationService.markAllNotificationsAsRead(req.user._id);
    sendSuccess(res, null, "All notifications marked as read");
  }),

  deleteNotification: asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.params.id, req.user._id);
    sendSuccess(res, null, "Notification deleted");
  }),
};

// ── Admin Controller ───────────────────────────────────────────
export const adminController = {
  getDashboardStats: asyncHandler(async (req, res) => {
    const stats = await userService.getDashboardStats();
    sendSuccess(res, stats);
  }),

  getAllUsers: asyncHandler(async (req, res) => {
    const result = await userService.getAllUsers(req.query, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),

  updateUserStatus: asyncHandler(async (req, res) => {
    const user = await userService.updateUserStatus(
      req.params.id,
      req.body.isActive,
    );
    sendSuccess(res, user, "User status updated");
  }),

  getActivityLogs: asyncHandler(async (req, res) => {
    const result = await userService.getActivityLogs(req.query, req.query);
    res.json({ success: true, message: "OK", ...result });
  }),
};

// ── Search Controller ──────────────────────────────────────────
export const searchController = {
  search: asyncHandler(async (req, res) => {
    const result = await userService.globalSearch(req.query.q);
    sendSuccess(res, result);
  }),
};
