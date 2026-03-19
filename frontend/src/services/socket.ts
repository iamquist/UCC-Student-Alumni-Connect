import { io, Socket } from 'socket.io-client';
import type { Message, Notification } from '@/types';

type EventCallback<T = unknown> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // Bind all registered events
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => {
        this.socket?.on(event, cb);
      });
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on<T = unknown>(event: string, callback: EventCallback<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    this.socket?.on(event, callback);
    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback?: EventCallback<T>) {
    if (callback) {
      this.listeners.get(event)?.delete(callback as EventCallback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: unknown) {
    this.socket?.emit(event, data);
  }

  // Chat events
  joinConversation(conversationId: string) {
    this.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.emit('conversation:leave', { conversationId });
  }

  sendMessage(data: { conversationId: string; content: string; attachments?: string[] }) {
    this.emit('message:send', data);
  }

  startTyping(conversationId: string) {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.emit('typing:stop', { conversationId });
  }

  markRead(conversationId: string) {
    this.emit('message:read', { conversationId });
  }

  // Listeners
  onNewMessage(cb: EventCallback<Message>) {
    return this.on<Message>('message:new', cb);
  }

  onMessageRead(cb: EventCallback<{ conversationId: string; userId: string; messageIds: string[] }>) {
    return this.on('message:read', cb);
  }

  onTypingStart(cb: EventCallback<{ conversationId: string; userId: string; user: import('@/types').User }>) {
    return this.on('typing:start', cb);
  }

  onTypingStop(cb: EventCallback<{ conversationId: string; userId: string }>) {
    return this.on('typing:stop', cb);
  }

  onNewNotification(cb: EventCallback<Notification>) {
    return this.on<Notification>('notification:new', cb);
  }

  onUserOnline(cb: EventCallback<{ userId: string }>) {
    return this.on('user:online', cb);
  }

  onUserOffline(cb: EventCallback<{ userId: string }>) {
    return this.on('user:offline', cb);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;
