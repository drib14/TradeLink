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

  // Get or create conversation with a student
  async getOrCreateConversation(params: {
    targetUserId: string;
    listingId?: string | null;
    flashRequestId?: string | null;
    initialMessage?: string | null;
  }): Promise<Conversation> {
    const res = await api.post<{ conversation: any }>('/chat/conversations', params);
    const c = res.data?.conversation || res.data;
    return {
      id: c.id,
      participantIds: c.participantIds || c.participant_ids || [],
      otherParticipant: {
        id: c.otherParticipant?.id || '',
        name: c.otherParticipant?.name || 'Student Peer',
        avatar: c.otherParticipant?.avatar || '',
        campus: c.otherParticipant?.campus || 'UC Main',
        department: c.otherParticipant?.department || c.otherParticipant?.college,
        isVerified: Boolean(c.otherParticipant?.isVerified),
        trustScore: c.otherParticipant?.trustScore,
        rating: c.otherParticipant?.rating
      },
      listingId: c.listingId || '',
      listingTitle: c.listingTitle || 'Campus Item',
      listingImage: c.listingImage || '',
      listingPrice: c.listingPrice,
      listingTradeMode: c.listingTradeMode,
      listingStatus: c.listingStatus,
      listingSellerId: c.listingSellerId,
      flashRequestId: c.flashRequestId ?? c.flash_request_id,
      flashRequest: c.flashRequest ?? c.flash_request,
      activeTransaction: c.activeTransaction,
      activeSwap: c.activeSwap,
      lastMessage: c.lastMessage || '',
      lastMessageTimestamp: c.lastMessageTimestamp || new Date().toISOString(),
      unreadCount: c.unreadCount ?? 0
    };
  },

  // Conversations list
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get<{ conversations: any[] }>('/chat/conversations');
    const list = res.data?.conversations || res.data || [];
    if (Array.isArray(list)) {
      return list.map((c) => ({
        id: c.id,
        participantIds: c.participantIds || c.participant_ids || [],
        otherParticipant: {
          id: c.otherParticipant?.id || c.other_participant_id || '',
          name: c.otherParticipant?.name || c.other_participant_name || 'Student Peer',
          avatar: c.otherParticipant?.avatar || c.other_participant_avatar || '',
          campus: c.otherParticipant?.campus || c.other_participant_campus || 'UC Main',
          department: c.otherParticipant?.department || c.otherParticipant?.college,
          isVerified: Boolean(c.otherParticipant?.isVerified ?? c.other_participant_verified),
          trustScore: c.otherParticipant?.trustScore ?? c.other_participant_trust,
          rating: c.otherParticipant?.rating ?? c.other_participant_rating
        },
        listingId: c.listingId || c.listing_id || '',
        listingTitle: c.listingTitle || c.listing_title || 'Campus Item',
        listingImage: c.listingImage || c.listing_image || '',
        listingPrice: c.listingPrice ?? c.listing_price,
        listingTradeMode: c.listingTradeMode ?? c.listing_trade_mode,
        listingStatus: c.listingStatus ?? c.listing_status,
        listingSellerId: c.listingSellerId ?? c.listing_seller_id,
        flashRequestId: c.flashRequestId ?? c.flash_request_id,
        flashRequest: c.flashRequest ?? c.flash_request,
        activeTransaction: c.activeTransaction,
        activeSwap: c.activeSwap,
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
        flashRequestId: m.flashRequestId || m.flash_request_id || m.wantedRequestId || m.wanted_request_id,
        mediaUrl: m.mediaUrl || m.media_url || null,
        mediaType: m.mediaType || m.media_type || null,
        swapOffer: m.swapOffer,
        transaction: m.transaction,
        flashRequest: m.flashRequest || m.flash_request
      }));
    }
    return [];
  },

  async markConversationAsRead(conversationId: string): Promise<void> {
    await api.patch(`/chat/conversations/${conversationId}/read`);
  },

  async sendMessage(params: {
    conversationId: string;
    receiverId: string;
    content: string;
    isSystemMessage?: boolean;
    swapOfferId?: string;
    transactionId?: string;
    flashRequestId?: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
  }): Promise<Message> {
    const res = await api.post<{ message: any }>('/chat/messages', params);
    const m = res.data?.message || res.data;
    return {
      id: m.id,
      conversationId: m.conversationId || m.conversation_id || params.conversationId,
      senderId: m.senderId || m.sender_id || '',
      receiverId: m.receiverId || m.receiver_id || params.receiverId,
      content: m.content || params.content,
      isRead: false,
      timestamp: m.timestamp || m.created_at || new Date().toISOString(),
      isSystemMessage: Boolean(m.isSystemMessage ?? m.is_system_message),
      swapOfferId: m.swapOfferId || m.swap_offer_id || params.swapOfferId,
      transactionId: m.transactionId || m.transaction_id || params.transactionId,
      flashRequestId: m.flashRequestId || m.flash_request_id || params.flashRequestId,
      mediaUrl: m.mediaUrl || m.media_url || params.mediaUrl || null,
      mediaType: m.mediaType || m.media_type || params.mediaType || null,
      swapOffer: m.swapOffer,
      transaction: m.transaction,
      flashRequest: m.flashRequest || m.flash_request
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
        selectedVariation: s.selectedVariation || s.selected_variation || null,
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

  async respondToSwap(id: string, action: 'accept' | 'decline' | 'accepted' | 'declined'): Promise<void> {
    const status = (action === 'accept' || action === 'accepted') ? 'accepted' : 'declined';
    await api.patch(`/swaps/${id}/respond`, { status });
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
        selectedVariation: t.selectedVariation || t.selected_variation || null,
        variationId: t.variationId || t.variation_id || null,
        completedAt: t.completedAt || t.completed_at,
        buyerConfirmedAt: t.buyerConfirmedAt || t.buyer_confirmed_at || null,
        sellerConfirmedAt: t.sellerConfirmedAt || t.seller_confirmed_at || null,
        handshakeCompletedAt: t.handshakeCompletedAt || t.handshake_completed_at || null,
        completionOverrideBy: t.completionOverrideBy || t.completion_override_by || null,
        cancelledAt: t.cancelledAt || t.cancelled_at,
        cancellationReason: t.cancellationReason || t.cancellation_reason,
        createdAt: t.createdAt || t.created_at || new Date().toISOString()
      }));
    }
    return [];
  },

  async createTransaction(data: {
    listingId: string;
    sellerId?: string;
    amount?: number;
    paymentMethod?: string;
    notes?: string;
    swapOfferId?: string;
    selectedVariation?: string;
    variationId?: string;
  }): Promise<Transaction> {
    const res = await api.post<{ transaction: Transaction; handshakeCode?: string }>('/transactions', data);
    const transaction = res.data?.transaction;
    if (!transaction) {
      throw new Error('The transaction could not be created. Please try again.');
    }
    // The raw code is returned once to the buyer at creation and is never reloaded from the API.
    if (res.data?.handshakeCode) {
      transaction.verificationCode = String(res.data.handshakeCode);
    }
    return transaction;
  },

  async confirmHandshake(id: string, handshakeCode?: string): Promise<{
    status: string;
    completed: boolean;
    buyerConfirmedAt?: string | null;
    sellerConfirmedAt?: string | null;
  }> {
    const res = await api.patch(`/transactions/${id}/handshake/confirm`, {
      ...(handshakeCode ? { handshakeCode: handshakeCode.trim() } : {})
    });
    return res.data || res;
  },

  async requestHandshakeCode(id: string): Promise<void> {
    await api.post(`/transactions/${id}/handshake/request-code`);
  },

  async completeTransaction(id: string, handshakeCode?: string): Promise<void> {
    await this.confirmHandshake(id, handshakeCode);
  },

  async cancelTransaction(id: string, reason?: string): Promise<void> {
    await api.patch(`/transactions/${id}/cancel`, { reason });
  },

  // Submit Review after completed trade
  async submitReview(data: {
    transactionId: string;
    targetUserId: string;
    rating: number;
    comment?: string;
    itemTitle?: string;
    tradeType?: string;
    wasPunctual?: boolean;
    traitBadges?: string[];
  }): Promise<any> {
    const res = await api.post('/reviews', data);
    return res.data;
  }
};
