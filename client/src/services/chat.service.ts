// Chat, Swaps, and Transactions service
import { api } from './api';
import type { Conversation, Message, SwapOffer, Transaction } from '../types';

export const chatService = {
  // Upload media (image or video) for chat attachments
  async uploadMedia(file: File): Promise<{ url: string; mediaType: 'image' | 'video' }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'chat');

    const res: any = await api.post('/upload', formData);
    const data = res?.data || res;
    return {
      url: data?.url || '',
      mediaType: data?.mediaType || (file.type.startsWith('video/') ? 'video' : 'image')
    };
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get<{ conversations: any[] }>('/chat/conversations');
    const list = res.data?.conversations || res.data || [];
    if (Array.isArray(list)) {
      return list.map((c) => ({
        id: c.id,
        participantIds: c.participantIds || c.participant_ids || [],
        otherParticipant: {
          id: c.otherParticipant?.id || c.other_participant_id || '',
          name: c.otherParticipant?.name || c.other_participant_name || '',
          avatar: c.otherParticipant?.avatar || c.other_participant_avatar || '',
          campus: c.otherParticipant?.campus || c.other_participant_campus || 'UC Main',
          isVerified: Boolean(c.otherParticipant?.isVerified ?? c.other_participant_verified)
        },
        listingId: c.listingId || c.listing_id || '',
        listingTitle: c.listingTitle || c.listing_title || '',
        listingImage: c.listingImage || c.listing_image || '',
        lastMessage: c.lastMessage || c.last_message || '',
        lastMessageTimestamp: c.lastMessageTimestamp || c.last_message_timestamp || new Date().toISOString(),
        unreadCount: c.unreadCount ?? c.unread_count ?? 0
      }));
    }
    return [];
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await api.get<{ messages: any[] }>(`/chat/conversations/${conversationId}/messages`);
    const list = res.data?.messages || res.data || [];
    if (Array.isArray(list)) {
      return list.map((m) => ({
        id: m.id,
        conversationId: m.conversationId || m.conversation_id || conversationId,
        senderId: m.senderId || m.sender_id || '',
        receiverId: m.receiverId || m.receiver_id || '',
        content: m.content || '',
        isRead: Boolean(m.isRead ?? m.is_read),
        timestamp: m.timestamp || m.created_at || new Date().toISOString(),
        isSystemMessage: Boolean(m.isSystemMessage ?? m.is_system_message),
        swapOfferId: m.swapOfferId || m.swap_offer_id,
        transactionId: m.transactionId || m.transaction_id,
        mediaUrl: m.mediaUrl || m.media_url || null,
        mediaType: m.mediaType || m.media_type || null
      }));
    }
    return [];
  },

  async sendMessage(params: {
    conversationId?: string;
    receiverId: string;
    listingId?: string;
    content: string;
    isSystemMessage?: boolean;
    swapOfferId?: string;
    transactionId?: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
  }): Promise<Message> {
    const res = await api.post<{ message: any }>('/chat/messages', params);
    const m = res.data?.message || res.data;
    return {
      id: m.id,
      conversationId: m.conversationId || m.conversation_id || params.conversationId || '',
      senderId: m.senderId || m.sender_id || '',
      receiverId: m.receiverId || m.receiver_id || params.receiverId,
      content: m.content || params.content,
      isRead: false,
      timestamp: m.timestamp || m.created_at || new Date().toISOString(),
      isSystemMessage: Boolean(m.isSystemMessage ?? m.is_system_message),
      swapOfferId: m.swapOfferId || m.swap_offer_id || params.swapOfferId,
      transactionId: m.transactionId || m.transaction_id || params.transactionId,
      mediaUrl: m.mediaUrl || m.media_url || params.mediaUrl || null,
      mediaType: m.mediaType || m.media_type || params.mediaType || null
    };
  },

  // Swaps
  async getSwaps(): Promise<SwapOffer[]> {
    const res = await api.get<{ swaps: any[] }>('/swaps');
    const list = res.data?.swaps || res.data || [];
    if (Array.isArray(list)) {
      return list.map((s) => ({
        id: s.id,
        targetListingId: s.targetListingId || s.target_listing_id || '',
        targetListingTitle: s.targetListingTitle || s.target_listing_title || '',
        targetListingImage: s.targetListingImage || s.target_listing_image || '',
        targetSellerId: s.targetSellerId || s.target_seller_id || '',
        targetSellerName: s.targetSellerName || s.target_seller_name || '',
        offererId: s.offererId || s.offerer_id || '',
        offererName: s.offererName || s.offerer_name || '',
        offererAvatar: s.offererAvatar || s.offerer_avatar || '',
        offererCampus: s.offererCampus || s.offerer_campus || 'UC Main',
        offeredListingId: s.offeredListingId || s.offered_listing_id,
        offeredListingTitle: s.offeredListingTitle || s.offered_listing_title,
        offeredListingImage: s.offeredListingImage || s.offered_listing_image,
        offeredDescription: s.offeredDescription || s.offered_description || '',
        cashTopUp: parseFloat(s.cashTopUp ?? s.cash_top_up) || 0,
        status: s.status || 'pending',
        createdAt: s.createdAt || s.created_at || new Date().toISOString()
      }));
    }
    return [];
  },

  async proposeSwap(data: any): Promise<SwapOffer> {
    const res = await api.post<{ swap: any }>('/swaps', data);
    return res.data?.swap || res.data;
  },

  async respondToSwap(id: string, action: 'accept' | 'decline'): Promise<void> {
    await api.patch(`/swaps/${id}/respond`, { action });
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await api.get<{ transactions: any[] }>('/transactions');
    const list = res.data?.transactions || res.data || [];
    if (Array.isArray(list)) {
      return list.map((t) => ({
        id: t.id,
        referenceNo: t.referenceNo || t.reference_no || `TL-TX-${t.id.slice(0, 6)}`,
        listingId: t.listingId || t.listing_id || '',
        listingTitle: t.listingTitle || t.listing_title || '',
        listingImage: t.listingImage || t.listing_image || '',
        sellerId: t.sellerId || t.seller_id || '',
        sellerName: t.sellerName || t.seller_name || '',
        buyerId: t.buyerId || t.buyer_id || '',
        buyerName: t.buyerName || t.buyer_name || '',
        tradeMode: t.tradeMode || t.trade_mode || 'buy_sell',
        amount: parseFloat(t.amount || t.finalPrice || 0),
        paymentMethod: t.paymentMethod || t.payment_method || 'cash',
        paymentStatus: t.paymentStatus || t.payment_status || 'unpaid',
        status: t.status || 'pending',
        notes: t.notes || '',
        completedAt: t.completedAt || t.completed_at,
        cancelledAt: t.cancelledAt || t.cancelled_at,
        cancellationReason: t.cancellationReason || t.cancellation_reason,
        createdAt: t.createdAt || t.created_at || new Date().toISOString()
      }));
    }
    return [];
  },

  async createTransaction(data: {
    listingId: string;
    paymentMethod?: string;
    notes?: string;
    swapOfferId?: string;
  }): Promise<Transaction> {
    const res = await api.post<{ transaction: any }>('/transactions', data);
    return res.data?.transaction || res.data;
  },

  async completeTransaction(id: string): Promise<void> {
    await api.patch(`/transactions/${id}/complete`);
  },

  async cancelTransaction(id: string, reason?: string): Promise<void> {
    await api.patch(`/transactions/${id}/cancel`, { reason });
  },

  // Aliases for backward compatibility
  async getMeetups(): Promise<Transaction[]> {
    return this.getTransactions();
  },

  async scheduleMeetup(data: any): Promise<Transaction> {
    return this.createTransaction(data);
  },

  async updateMeetupStatus(id: string, status: string): Promise<void> {
    if (status === 'completed') {
      await this.completeTransaction(id);
    } else if (status === 'cancelled') {
      await this.cancelTransaction(id);
    }
  }
};
