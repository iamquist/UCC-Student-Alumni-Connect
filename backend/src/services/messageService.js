import { Conversation } from '../db/models/index.js';
import { Message } from '../db/models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';

export async function getOrCreateConversation(userId, participantId) {
  if (userId.toString() === participantId.toString()) {
    throw new AppError('Cannot create conversation with yourself', 400);
  }

  // Find existing conversation between the two users
  let conv = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
    isGroup: false,
  }).populate('participants', 'firstName lastName profilePicture bio role')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName profilePicture' } });

  if (!conv) {
    conv = await Conversation.create({ participants: [userId, participantId] });
    conv = await Conversation.findById(conv._id)
      .populate('participants', 'firstName lastName profilePicture bio role')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName profilePicture' } });
  }

  return conv;
}

export async function getUserConversations(userId) {
  const convs = await Conversation.find({ participants: userId })
    .populate('participants', 'firstName lastName profilePicture bio role')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName profilePicture' } })
    .sort({ updatedAt: -1 });

  // Add unread count per conversation
  const withUnread = await Promise.all(convs.map(async (conv) => {
    const unreadCount = await Message.countDocuments({
      conversation: conv._id,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });
    const obj = conv.toObject();
    obj.unreadCount = unreadCount;
    return obj;
  }));

  return withUnread;
}

export async function getConversationMessages(conversationId, userId, query = {}) {
  // Verify user is a participant
  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new AppError('Conversation not found', 404);

  const { page, limit, skip } = getPaginationParams(query);

  const total = await Message.countDocuments({
    conversation: conversationId,
    deletedFor: { $ne: userId },
  });

  const messages = await Message.find({
    conversation: conversationId,
    deletedFor: { $ne: userId },
  })
    .populate('sender', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginationResponse(messages, total, page, limit);
}

export async function sendMessage(userId, { conversationId, content, attachments = [] }) {
  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new AppError('Conversation not found', 404);

  const message = await Message.create({
    conversation: conversationId,
    sender: userId,
    content: content.trim(),
    attachments,
    readBy: [userId],
  });

  // Update conversation's last message
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  await message.populate('sender', 'firstName lastName profilePicture');
  return message;
}

export async function markMessagesAsRead(conversationId, userId) {
  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new AppError('Conversation not found', 404);

  const result = await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  return result.modifiedCount;
}

export async function deleteMessage(messageId, userId) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);

  if (message.sender.toString() === userId.toString()) {
    // Sender: mark as deleted for everyone
    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
  } else {
    // Recipient: hide from their view
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: userId },
    });
  }
}

export default {
  getOrCreateConversation, getUserConversations, getConversationMessages,
  sendMessage, markMessagesAsRead, deleteMessage,
};
