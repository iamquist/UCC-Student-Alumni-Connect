import { create } from "zustand";
import type { Conversation, Message, Notification } from "@/types";
import { messagesApi, notificationsApi } from "@/services/api";
import { socketService } from "@/services/socket";

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  onlineUsers: Set<string>;
  unreadTotal: number;

  loadConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  markConversationRead: (conversationId: string) => void;
  setTyping: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;
  setUserOnline: (userId: string, online: boolean) => void;
  createConversation: (participantId: string) => Promise<Conversation>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  unreadTotal: 0,

  loadConversations: async () => {
    try {
      const convs = await messagesApi.getConversations();
      if (!Array.isArray(convs)) {
        console.warn("Unexpected conversations response format:", convs);
        set({ conversations: [], unreadTotal: 0 });
        return;
      }
      const unreadTotal = convs.reduce(
        (acc, c) => acc + (c.unreadCount || 0),
        0,
      );
      set({ conversations: convs, unreadTotal });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      set({ conversations: [], unreadTotal: 0 });
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) {
      socketService.joinConversation(id);
      get().markConversationRead(id);
    }
  },

  loadMessages: async (conversationId, page = 1) => {
    try {
      const result = await messagesApi.getMessages(conversationId, page);
      const messagesArray = Array.isArray(result) ? result : result?.data || [];
      if (!Array.isArray(messagesArray)) {
        console.warn("Unexpected messages response format:", result);
        return;
      }
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]:
            page === 1
              ? messagesArray.reverse()
              : [
                  ...messagesArray.reverse(),
                  ...(state.messages[conversationId] || []),
                ],
        },
      }));
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  },

  sendMessage: async (conversationId, content) => {
    // Optimistic update
    const tempMsg: Message = {
      _id: `temp_${Date.now()}`,
      conversation: conversationId,
      sender: {} as import("@/types").User,
      content,
      readBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    get().addMessage(tempMsg);
    socketService.sendMessage({ conversationId, content });

    try {
      const msg = await messagesApi.sendMessage(conversationId, content);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map((m) =>
            m._id === tempMsg._id ? msg : m,
          ) || [msg],
        },
      }));
    } catch {
      // Remove optimistic message on error
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]:
            state.messages[conversationId]?.filter(
              (m) => m._id !== tempMsg._id,
            ) || [],
        },
      }));
    }
  },

  addMessage: (message) => {
    set((state) => {
      const convId = message.conversation;
      const existing = state.messages[convId] || [];
      // Avoid duplicates
      if (existing.find((m) => m._id === message._id)) return state;
      const updated = [...existing, message];

      // Update conversation last message
      const convs = state.conversations.map((c) =>
        c._id === convId
          ? {
              ...c,
              lastMessage: message,
              unreadCount:
                c._id === state.activeConversationId
                  ? 0
                  : (c.unreadCount || 0) + 1,
            }
          : c,
      );

      return {
        messages: { ...state.messages, [convId]: updated },
        conversations: convs,
        unreadTotal: convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
      };
    });
  },

  markConversationRead: async (conversationId) => {
    await messagesApi.markAsRead(conversationId).catch(() => {});
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
      unreadTotal: state.conversations
        .filter((c) => c._id !== conversationId)
        .reduce((acc, c) => acc + (c.unreadCount || 0), 0),
    }));
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    });
  },

  setUserOnline: (userId, online) => {
    set((state) => {
      const updated = new Set(state.onlineUsers);
      if (online) updated.add(userId);
      else updated.delete(userId);
      return { onlineUsers: updated };
    });
  },

  createConversation: async (participantId) => {
    try {
      const conv = await messagesApi.getOrCreateConversation(participantId);
      if (!conv) {
        throw new Error("Failed to create conversation");
      }
      set((state) => ({
        conversations: state.conversations.find((c) => c._id === conv._id)
          ? state.conversations
          : [conv, ...state.conversations],
      }));
      return conv;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      throw error;
    }
  },
}));

// Notifications store
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  loadNotifications: async () => {
    try {
      const result = await notificationsApi.getNotifications();
      // Handle both response structures: direct array or paginated response
      const notificationsArray = Array.isArray(result)
        ? result
        : result?.data || [];
      const unread = notificationsArray.filter((n) => !n.read).length;
      set({ notifications: notificationsArray, unreadCount: unread });
    } catch (error) {
      console.error("Failed to load notifications:", error);
      set({ notifications: [], unreadCount: 0 });
    }
  },

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.read ? 0 : 1),
    }));
  },

  markRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  deleteNotification: async (id) => {
    const wasUnread = get().notifications.find((n) => n._id === id && !n.read);
    try {
      await notificationsApi.deleteNotification(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },
}));
