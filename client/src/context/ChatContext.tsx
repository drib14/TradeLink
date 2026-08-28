import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Conversation, Message, SwapOffer, MeetupTransaction, Listing, Campus, TradeMode } from '../types';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chat.service';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: Message[];
  swaps: SwapOffer[];
  meetups: MeetupTransaction[];
  unreadTotal: number;
  isLoading: boolean;
  setActiveConversationId: (id: string | null) => void;
  openChatWithSeller: (listing: Listing) => void;
  sendMessage: (text: string, isSystem?: boolean, swapOfferId?: string) => Promise<void>;
  proposeSwap: (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
    proposedMeetupSpot: string;
    proposedDateTime: string;
  }) => Promise<SwapOffer>;
  respondToSwap: (swapId: string, status: 'accepted' | 'declined') => Promise<void>;
  scheduleMeetup: (params: {
    listing: Listing;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    tradeMode: TradeMode;
    finalPrice: number;
    campus: Campus;
    landmarkSpot: string;
    scheduledDateTime: string;
    notes?: string;
  }) => Promise<MeetupTransaction>;
  completeMeetupWithCode: (meetupId: string, code: string) => Promise<{ success: boolean; message: string }>;
  updateMeetupStatus: (meetupId: string, status: MeetupTransaction['status']) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [meetups, setMeetups] = useState<MeetupTransaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with API when authenticated
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [serverConvs, serverSwaps, serverMeetups] = await Promise.allSettled([
        chatService.getConversations(),
        chatService.getSwaps(),
        chatService.getMeetups()
      ]);

      if (serverConvs.status === 'fulfilled') {
        setConversations(serverConvs.value);
      }
      if (serverSwaps.status === 'fulfilled') {
        setSwaps(serverSwaps.value);
      }
      if (serverMeetups.status === 'fulfilled') {
        setMeetups(serverMeetups.value);
      }
    } catch {
      // Backend error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    chatService.getMessages(activeConvId).then((serverMsgs) => {
      if (serverMsgs && serverMsgs.length > 0) {
        setMessages((prev) => {
          const otherMsgs = prev.filter((m) => m.conversationId !== activeConvId);
          return [...otherMsgs, ...serverMsgs];
        });
      }
    }).catch(() => {});
  }, [activeConvId]);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  const activeMessages = useMemo(() => {
    if (!activeConvId) return [];
    return messages.filter((m) => m.conversationId === activeConvId);
  }, [messages, activeConvId]);

  const unreadTotal = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const setActiveConversationId = (id: string | null) => {
    setActiveConvId(id);
    if (id) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const openChatWithSeller = async (listing: Listing) => {
    if (!currentUser) return;
    const existing = conversations.find(
      (c) =>
        c.listingId === listing.id &&
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(listing.sellerId)
    );

    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    const newConvId = `conv-${Date.now()}`;
    const initialMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: newConvId,
      senderId: currentUser.id,
      receiverId: listing.sellerId,
      content: `Hi ${listing.sellerName}! I am interested in your item: "${listing.title}". Is it still available for meetup?`,
      timestamp: 'Just now',
      isSystemMessage: false
    };

    const newConv: Conversation = {
      id: newConvId,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || '',
      participantIds: [currentUser.id, listing.sellerId],
      otherParticipant: {
        id: listing.sellerId,
        name: listing.sellerName,
        avatar: listing.sellerAvatar,
        campus: listing.sellerCampus,
        college: listing.sellerCollege,
        isVerified: listing.sellerIsVerified
      },
      lastMessage: initialMsg.content,
      lastMessageTimestamp: 'Just now',
      unreadCount: 0
    };

    setConversations((prev) => [newConv, ...prev]);
    setMessages((prev) => [...prev, initialMsg]);
    setActiveConvId(newConvId);

    chatService.sendMessage({
      conversationId: newConvId,
      receiverId: listing.sellerId,
      listingId: listing.id,
      content: initialMsg.content
    }).catch(() => {});
  };

  const sendMessage = async (text: string, isSystem = false, swapOfferId?: string) => {
    if (!activeConversation || !text.trim() || !currentUser) return;

    const receiverId =
      activeConversation.participantIds.find((id) => id !== currentUser.id) ||
      activeConversation.otherParticipant.id;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      receiverId,
      content: text.trim(),
      timestamp: 'Just now',
      isSystemMessage: isSystem,
      swapOfferId
    };

    setMessages((prev) => [...prev, newMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, lastMessage: text.trim(), lastMessageTimestamp: 'Just now' }
          : c
      )
    );

    await chatService.sendMessage({
      conversationId: activeConversation.id,
      receiverId,
      content: text.trim(),
      isSystemMessage: isSystem,
      swapOfferId
    });
  };

  const proposeSwap = async (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
    proposedMeetupSpot: string;
    proposedDateTime: string;
  }): Promise<SwapOffer> => {
    if (!currentUser) {
      throw new Error('Authentication required to propose a swap offer.');
    }

    const payload = {
      targetListingId: params.targetListing.id,
      offeredListingId: params.offeredListingId,
      offeredDescription: params.offeredDescription,
      cashTopUp: params.cashTopUp,
      proposedMeetupSpot: params.proposedMeetupSpot,
      proposedDateTime: params.proposedDateTime
    };

    const created = await chatService.proposeSwap(payload);
    setSwaps((prev) => [created, ...prev]);
    openChatWithSeller(params.targetListing);
    return created;
  };

  const respondToSwap = async (swapId: string, status: 'accepted' | 'declined') => {
    setSwaps((prev) => prev.map((s) => (s.id === swapId ? { ...s, status } : s)));
    await chatService.respondToSwap(swapId, status === 'accepted' ? 'accept' : 'decline');
  };

  const scheduleMeetup = async (params: {
    listing: Listing;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    tradeMode: TradeMode;
    finalPrice: number;
    campus: Campus;
    landmarkSpot: string;
    scheduledDateTime: string;
    notes?: string;
  }): Promise<MeetupTransaction> => {
    const payload = {
      listingId: params.listing.id,
      buyerId: params.buyerId,
      tradeMode: params.tradeMode,
      finalPrice: params.finalPrice,
      campus: params.campus,
      landmarkSpot: params.landmarkSpot,
      scheduledDateTime: params.scheduledDateTime,
      notes: params.notes
    };

    const created = await chatService.scheduleMeetup(payload);
    setMeetups((prev) => [created, ...prev]);
    openChatWithSeller(params.listing);
    return created;
  };

  const completeMeetupWithCode = async (meetupId: string, enteredCode: string): Promise<{ success: boolean; message: string }> => {
    const res = await chatService.verifyMeetupCode(meetupId, enteredCode);
    setMeetups((prev) => prev.map((m) => (m.id === meetupId ? { ...m, status: 'completed' } : m)));
    return { success: true, message: res.message || 'Transaction verified and completed!' };
  };

  const updateMeetupStatus = async (meetupId: string, status: MeetupTransaction['status']) => {
    setMeetups((prev) => prev.map((m) => (m.id === meetupId ? { ...m, status } : m)));
    if (status !== 'scheduled') {
      await chatService.updateMeetupStatus(meetupId, status as any);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeMessages,
        swaps,
        meetups,
        unreadTotal,
        isLoading,
        setActiveConversationId,
        openChatWithSeller,
        sendMessage,
        proposeSwap,
        respondToSwap,
        scheduleMeetup,
        completeMeetupWithCode,
        updateMeetupStatus,
        refreshAll
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
