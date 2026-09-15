import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const getSocketBaseUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

class SocketService {
  private socket: Socket | null = null;
  private currentConvId: string | null = null;

  connect(customToken?: string): Socket | null {
    const token = customToken || getAccessToken();

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const baseUrl = getSocketBaseUrl();
    this.socket = io(baseUrl, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      if (this.currentConvId) {
        this.joinConversation(this.currentConvId);
      }
    });

    this.socket.on('connect_error', () => {
      // Reconnection handled automatically by Socket.io
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentConvId = null;
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  joinConversation(conversationId: string) {
    this.currentConvId = conversationId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:join', { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.currentConvId === conversationId) {
      this.currentConvId = null;
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:leave', { conversationId });
    }
  }

  sendMessage(data: {
    conversationId: string;
    receiverId: string;
    content: string;
    isSystemMessage?: boolean;
    swapOfferId?: string;
    transactionId?: string;
    wantedRequestId?: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
  }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:message', data);
    }
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:typing', { conversationId, isTyping });
    }
  }

  markRead(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:read', { conversationId });
    }
  }

  onMessage(callback: (message: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('chat:message', callback);
    return () => {
      this.socket?.off('chat:message', callback);
    };
  }

  onTyping(
    callback: (data: {
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => void
  ): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('chat:typing', callback);
    return () => {
      this.socket?.off('chat:typing', callback);
    };
  }

  onRead(
    callback: (data: { conversationId: string; userId: string }) => void
  ): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('chat:read', callback);
    return () => {
      this.socket?.off('chat:read', callback);
    };
  }

  onDealUpdated(callback: (data: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('chat:deal_updated', callback);
    return () => {
      this.socket?.off('chat:deal_updated', callback);
    };
  }

  onNotification(callback: (notif: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('notification:new', callback);
    return () => {
      this.socket?.off('notification:new', callback);
    };
  }
}

export const socketService = new SocketService();
