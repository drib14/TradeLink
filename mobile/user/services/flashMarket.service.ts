import { mobileApi } from './api';
import { FlashRequest, WantedRequest, Conversation } from '../types';

export const mobileFlashMarketService = {
  async getFlashRequests(filters: Record<string, any> = {}): Promise<FlashRequest[]> {
    const res = await mobileApi.get('/flash-market', filters);
    const list = res.data?.requests || [];
    return Array.isArray(list) ? list : [];
  },

  async createFlashRequest(data: Partial<FlashRequest>): Promise<FlashRequest> {
    const res = await mobileApi.post('/flash-market', data);
    return res.data?.request;
  },

  async respondToFlashRequest(id: string): Promise<void> {
    await mobileApi.post(`/flash-market/${id}/respond`);
  },

  async deleteFlashRequest(id: string): Promise<void> {
    await mobileApi.delete(`/flash-market/${id}`);
  },

  // Backward compatibility methods
  async getWantedRequests(filters: Record<string, any> = {}): Promise<WantedRequest[]> {
    return this.getFlashRequests(filters);
  },

  async createWantedRequest(data: Partial<WantedRequest>): Promise<WantedRequest> {
    return this.createFlashRequest(data);
  },

  async respondToWanted(id: string): Promise<void> {
    return this.respondToFlashRequest(id);
  },

  async deleteWantedRequest(id: string): Promise<void> {
    return this.deleteFlashRequest(id);
  },
};

export const mobileWantedService = mobileFlashMarketService;

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
