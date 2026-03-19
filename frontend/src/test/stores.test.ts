import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore, useNotificationStore } from '@/store/chatStore';
import type { Message, Conversation, Notification } from '@/types';

// Mock the API modules
vi.mock('@/services/api', () => ({
  messagesApi: {
    getConversations: vi.fn().mockResolvedValue([]),
    getMessages: vi.fn().mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false } }),
    sendMessage: vi.fn(),
    getOrCreateConversation: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue(undefined),
  },
  notificationsApi: {
    getNotifications: vi.fn().mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false } }),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/services/socket', () => ({
  socketService: {
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    sendMessage: vi.fn(),
    markRead: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(false),
  },
}));

describe('Chat Store', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      activeConversationId: null,
      messages: {},
      typingUsers: {},
      onlineUsers: new Set(),
      unreadTotal: 0,
    });
  });

  it('has correct initial state', () => {
    const state = useChatStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.activeConversationId).toBeNull();
    expect(state.messages).toEqual({});
    expect(state.unreadTotal).toBe(0);
  });

  it('addMessage appends to conversation messages', () => {
    const msg: Message = {
      _id: 'msg1',
      conversation: 'conv1',
      sender: { _id: 'user1', firstName: 'John', lastName: 'Doe', email: 'j@e.com', role: 'student', isActive: true, isEmailVerified: true, createdAt: '', updatedAt: '' },
      content: 'Hello',
      readBy: ['user1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useChatStore.getState().addMessage(msg);

    const state = useChatStore.getState();
    expect(state.messages['conv1']).toHaveLength(1);
    expect(state.messages['conv1'][0].content).toBe('Hello');
  });

  it('addMessage avoids duplicates', () => {
    const msg: Message = {
      _id: 'msg1',
      conversation: 'conv1',
      sender: { _id: 'user1', firstName: 'John', lastName: 'Doe', email: 'j@e.com', role: 'student', isActive: true, isEmailVerified: true, createdAt: '', updatedAt: '' },
      content: 'Hello',
      readBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useChatStore.getState().addMessage(msg);
    useChatStore.getState().addMessage(msg); // duplicate

    expect(useChatStore.getState().messages['conv1']).toHaveLength(1);
  });

  it('setTyping adds and removes users correctly', () => {
    useChatStore.getState().setTyping('conv1', 'user1', true);
    expect(useChatStore.getState().typingUsers['conv1']).toContain('user1');

    useChatStore.getState().setTyping('conv1', 'user1', false);
    expect(useChatStore.getState().typingUsers['conv1'] || []).not.toContain('user1');
  });

  it('setUserOnline tracks online status', () => {
    useChatStore.getState().setUserOnline('user1', true);
    expect(useChatStore.getState().onlineUsers.has('user1')).toBe(true);

    useChatStore.getState().setUserOnline('user1', false);
    expect(useChatStore.getState().onlineUsers.has('user1')).toBe(false);
  });

  it('setActiveConversation sets the correct conversation', () => {
    useChatStore.getState().setActiveConversation('conv1');
    expect(useChatStore.getState().activeConversationId).toBe('conv1');
  });

  it('setActiveConversation can be cleared', () => {
    useChatStore.getState().setActiveConversation('conv1');
    useChatStore.getState().setActiveConversation(null);
    expect(useChatStore.getState().activeConversationId).toBeNull();
  });
});

describe('Notification Store', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('addNotification increments unread count for unread notif', () => {
    const notif: Notification = {
      _id: 'n1',
      recipient: 'user1',
      type: 'system',
      title: 'Test',
      message: 'Hello',
      read: false,
      createdAt: new Date().toISOString(),
    };

    useNotificationStore.getState().addNotification(notif);

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('addNotification does not increment count for read notif', () => {
    const notif: Notification = {
      _id: 'n2',
      recipient: 'user1',
      type: 'system',
      title: 'Test',
      message: 'Hello',
      read: true,
      createdAt: new Date().toISOString(),
    };

    useNotificationStore.getState().addNotification(notif);

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('markRead marks notification as read and decrements count', async () => {
    useNotificationStore.setState({
      notifications: [{ _id: 'n1', recipient: 'u', type: 'system', title: 'T', message: 'M', read: false, createdAt: '' }],
      unreadCount: 1,
    });

    await useNotificationStore.getState().markRead('n1');

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('markAllRead sets all notifications as read', async () => {
    useNotificationStore.setState({
      notifications: [
        { _id: 'n1', recipient: 'u', type: 'system', title: 'T1', message: 'M1', read: false, createdAt: '' },
        { _id: 'n2', recipient: 'u', type: 'system', title: 'T2', message: 'M2', read: false, createdAt: '' },
      ],
      unreadCount: 2,
    });

    await useNotificationStore.getState().markAllRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.every(n => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });
});
