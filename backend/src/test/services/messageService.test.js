import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from '../testUtils.js';
import * as messageService from '../../services/messageService.js';
import { Message, Conversation } from '../../db/models/index.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('MessageService', () => {
  let user1, user2, user3;

  beforeEach(async () => {
    user1 = await createTestUser({ email: 'u1@example.com' });
    user2 = await createTestUser({ email: 'u2@example.com' });
    user3 = await createTestUser({ email: 'u3@example.com' });
  });

  describe('getOrCreateConversation', () => {
    it('should create a new conversation between two users', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      expect(conv).toBeDefined();
      expect(conv.participants).toHaveLength(2);
    });

    it('should return existing conversation instead of creating duplicate', async () => {
      const conv1 = await messageService.getOrCreateConversation(user1._id, user2._id);
      const conv2 = await messageService.getOrCreateConversation(user1._id, user2._id);
      expect(conv1._id.toString()).toBe(conv2._id.toString());
    });

    it('should return same conversation regardless of order', async () => {
      const conv1 = await messageService.getOrCreateConversation(user1._id, user2._id);
      const conv2 = await messageService.getOrCreateConversation(user2._id, user1._id);
      expect(conv1._id.toString()).toBe(conv2._id.toString());
    });

    it('should throw error when user tries to chat with themselves', async () => {
      await expect(messageService.getOrCreateConversation(user1._id, user1._id))
        .rejects.toThrow('Cannot create conversation with yourself');
    });
  });

  describe('sendMessage', () => {
    it('should send a message in an existing conversation', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      const message = await messageService.sendMessage(user1._id, {
        conversationId: conv._id,
        content: 'Hello, world!',
      });

      expect(message.content).toBe('Hello, world!');
      expect(message.sender._id.toString()).toBe(user1._id.toString());
      expect(message.readBy).toContainEqual(user1._id);
    });

    it('should update conversation lastMessage after send', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      const message = await messageService.sendMessage(user1._id, {
        conversationId: conv._id,
        content: 'Test message',
      });

      const updatedConv = await Conversation.findById(conv._id);
      expect(updatedConv.lastMessage.toString()).toBe(message._id.toString());
    });

    it('should throw error if user is not a participant', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      await expect(messageService.sendMessage(user3._id, {
        conversationId: conv._id,
        content: 'Unauthorized message',
      })).rejects.toThrow('Conversation not found');
    });

    it('should trim message content', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      const message = await messageService.sendMessage(user1._id, {
        conversationId: conv._id,
        content: '  Hello with spaces  ',
      });
      expect(message.content).toBe('Hello with spaces');
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark unread messages as read', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      await messageService.sendMessage(user1._id, { conversationId: conv._id, content: 'Msg 1' });
      await messageService.sendMessage(user1._id, { conversationId: conv._id, content: 'Msg 2' });

      const count = await messageService.markMessagesAsRead(conv._id, user2._id);
      expect(count).toBe(2);

      const messages = await Message.find({ conversation: conv._id });
      messages.forEach(msg => {
        expect(msg.readBy.map(id => id.toString())).toContain(user2._id.toString());
      });
    });
  });

  describe('getUserConversations', () => {
    it('should return user conversations with unread count', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      await messageService.sendMessage(user2._id, { conversationId: conv._id, content: 'Unread' });

      const convs = await messageService.getUserConversations(user1._id);
      expect(convs).toHaveLength(1);
      expect(convs[0].unreadCount).toBe(1);
    });

    it('should sort conversations by most recent activity', async () => {
      const conv1 = await messageService.getOrCreateConversation(user1._id, user2._id);
      const conv2 = await messageService.getOrCreateConversation(user1._id, user3._id);

      await messageService.sendMessage(user1._id, { conversationId: conv1._id, content: 'First' });
      // Small delay then send to conv2
      await new Promise(r => setTimeout(r, 10));
      await messageService.sendMessage(user1._id, { conversationId: conv2._id, content: 'Second' });

      const convs = await messageService.getUserConversations(user1._id);
      expect(convs[0]._id.toString()).toBe(conv2._id.toString());
    });
  });

  describe('deleteMessage', () => {
    it('should soft-delete message for sender (mark as deleted)', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      const msg = await messageService.sendMessage(user1._id, { conversationId: conv._id, content: 'Delete me' });

      await messageService.deleteMessage(msg._id, user1._id);

      const updated = await Message.findById(msg._id);
      expect(updated.isDeleted).toBe(true);
      expect(updated.content).toBe('This message was deleted');
    });

    it('should hide message for recipient without deleting', async () => {
      const conv = await messageService.getOrCreateConversation(user1._id, user2._id);
      const msg = await messageService.sendMessage(user1._id, { conversationId: conv._id, content: 'Hide from me' });

      await messageService.deleteMessage(msg._id, user2._id);

      const updated = await Message.findById(msg._id);
      expect(updated.deletedFor.map(id => id.toString())).toContain(user2._id.toString());
      expect(updated.isDeleted).toBe(false);
    });
  });
});
