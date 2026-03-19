import { Notification } from "../db/models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../config/index.js";

export async function createNotification(data) {
  try {
    const notification = await Notification.create(data);
    await notification.populate("sender", "firstName lastName profilePicture");
    return notification;
  } catch (err) {
    // Non-fatal
    return null;
  }
}

// Create notification and emit via socket
export async function createAndEmitNotification(io, data) {
  const notification = await createNotification(data);
  if (notification && io) {
    // Emit to recipient in their personal room
    io.to(`user:${data.recipient.toString()}`).emit(
      "notification:new",
      notification,
    );
  }
  return notification;
}

export async function getUserNotifications(userId, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { recipient: userId };
  if (query.read !== undefined) filter.read = query.read === "true";

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate("sender", "firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  return formatPaginationResponse(notifications, total, page, limit);
}

export async function markNotificationAsRead(notificationId, userId) {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true },
  );
  if (!notif) throw new AppError("Notification not found", 404);
  return notif;
}

export async function markAllNotificationsAsRead(userId) {
  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true },
  );
}

export async function deleteNotification(notificationId, userId) {
  const notif = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
  if (!notif) throw new AppError("Notification not found", 404);
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}

export default {
  createNotification,
  createAndEmitNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
};
