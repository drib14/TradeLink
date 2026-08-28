// Chat, Swaps, Meetups, and Notifications service
import { api } from './api';
import type { Conversation, Message, SwapOffer, MeetupTransaction, AppNotification } from '../types';

export const chatService = {
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
        timestamp: m.timestamp || m.created_at || new Date().toISOString(),
        isSystemMessage: Boolean(m.isSystemMessage ?? m.is_system_message),
        swapOfferId: m.swapOfferId || m.swap_offer_id
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
  }): Promise<Message> {
    const res = await api.post<{ message: any }>('/chat/messages', params);
    const m = res.data?.message || res.data;
    return {
      id: m.id,
      conversationId: m.conversationId || m.conversation_id || params.conversationId || '',
      senderId: m.senderId || m.sender_id || '',
      receiverId: m.receiverId || m.receiver_id || params.receiverId,
      content: m.content || params.content,
      timestamp: m.timestamp || m.created_at || new Date().toISOString(),
      isSystemMessage: Boolean(m.isSystemMessage ?? m.is_system_message),
      swapOfferId: m.swapOfferId || m.swap_offer_id || params.swapOfferId
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
        proposedMeetupSpot: s.proposedMeetupSpot || s.proposed_meetup_spot || '',
        proposedDateTime: s.proposedDateTime || s.proposed_date_time || '',
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

  // Meetups
  async getMeetups(): Promise<MeetupTransaction[]> {
    const res = await api.get<{ meetups: any[] }>('/meetups');
    const list = res.data?.meetups || res.data || [];
    if (Array.isArray(list)) {
      return list.map((m) => ({
        id: m.id,
        listingId: m.listingId || m.listing_id || '',
        listingTitle: m.listingTitle || m.listing_title || '',
        listingImage: m.listingImage || m.listing_image || '',
        sellerId: m.sellerId || m.seller_id || '',
        sellerName: m.sellerName || m.seller_name || '',
        buyerId: m.buyerId || m.buyer_id || '',
        buyerName: m.buyerName || m.buyer_name || '',
        tradeMode: m.tradeMode || m.trade_mode || 'buy_sell',
        finalPrice: parseFloat(m.finalPrice ?? m.final_price) || 0,
        swapSummary: m.swapSummary || m.swap_summary,
        campus: m.campus || 'UC Main',
        landmarkSpot: m.landmarkSpot || m.landmark_spot || '',
        scheduledDateTime: m.scheduledDateTime || m.scheduled_date_time || '',
        verificationCode: m.verificationCode || m.verification_code || '',
        status: m.status || 'scheduled',
        notes: m.notes,
        createdAt: m.createdAt || m.created_at || new Date().toISOString()
      }));
    }
    return [];
  },

  async scheduleMeetup(data: any): Promise<MeetupTransaction> {
    const res = await api.post<{ meetup: any }>('/meetups', data);
    return res.data?.meetup || res.data;
  },

  async verifyMeetupCode(id: string, code: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>(`/meetups/${id}/verify`, { code });
    return res.data || { success: true, message: 'Handshake complete!' };
  },

  async updateMeetupStatus(id: string, status: 'on_the_way' | 'completed' | 'cancelled'): Promise<void> {
    await api.patch(`/meetups/${id}/status`, { status });
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await api.get<{ notifications: any[] }>('/notifications');
    const list = res.data?.notifications || res.data || [];
    if (Array.isArray(list)) {
      return list.map((n) => ({
        id: n.id,
        userId: n.userId || n.user_id || '',
        title: n.title || '',
        message: n.message || '',
        type: n.type || 'system',
        isRead: Boolean(n.isRead ?? n.is_read),
        linkView: n.linkView || n.link_view,
        linkParams: n.linkParams || n.link_params,
        createdAt: n.createdAt || n.created_at || new Date().toISOString()
      }));
    }
    return [];
  },

  async markNotificationAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  }
};
