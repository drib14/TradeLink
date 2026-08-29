import { mobileApi } from './api';
import { WantedRequest, Conversation } from '../types';

export const mobileWantedService = {
  async getWantedRequests(filters: Record<string, any> = {}): Promise<WantedRequest[]> {
    const res = await mobileApi.get('/wanted', filters);
    const list = res.data?.requests || [];
    return Array.isArray(list) ? list : [];
  },

  async createWantedRequest(data: Partial<WantedRequest>): Promise<WantedRequest> {
    const res = await mobileApi.post('/wanted', data);
    return res.data?.request;
  },

  async respondToWanted(id: string): Promise<void> {
    await mobileApi.post(`/wanted/${id}/respond`);
  },

  async deleteWantedRequest(id: string): Promise<void> {
    await mobileApi.delete(`/wanted/${id}`);
  },
};

export const mobileChatService = {
  async getConversations(): Promise<Conversation[]> {
    const res = await mobileApi.get('/chat/conversations');
    const list = res.data?.conversations || [];
    return Array.isArray(list) ? list : [];
  },

  async getMessages(conversationId: string) {
    const res = await mobileApi.get(`/chat/conversations/${conversationId}/messages`);
    return res.data?.messages || [];
  },

  async sendMessage(data: { conversationId: string; receiverId: string; content: string; swapOfferId?: string }) {
    const res = await mobileApi.post('/chat/messages', data);
    return res.data?.message;
  },
};
