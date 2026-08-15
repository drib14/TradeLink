import React, { createContext, useContext, useState } from 'react';
import { Conversation, Message, SwapOffer, MeetupTransaction, Listing, Campus, TradeMode } from '../types';
import { SEED_CONVERSATIONS, SEED_SWAPS, SEED_MEETUPS } from '../data/seedData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: Message[];
  swaps: SwapOffer[];
  meetups: MeetupTransaction[];
  unreadTotal: number;
  setActiveConversationId: (id: string | null) => void;
  openChatWithSeller: (listing: Listing) => void;
  sendMessage: (text: string, isSystem?: boolean, swapOfferId?: string) => void;
  proposeSwap: (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
    proposedMeetupSpot: string;
    proposedDateTime: string;
  }) => SwapOffer;
  respondToSwap: (swapId: string, status: 'accepted' | 'declined') => void;
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
  }) => MeetupTransaction;
  completeMeetupWithCode: (meetupId: string, code: string) => { success: boolean; message: string };
  updateMeetupStatus: (meetupId: string, status: MeetupTransaction['status']) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('tradelink_conversations_v3', SEED_CONVERSATIONS);
  const [messages, setMessages] = useLocalStorage<Message[]>('tradelink_messages_v3', [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-alex',
      receiverId: 'user-ken',
      content: 'Hi Kenzo! Is the Casio 991ES Plus still available for meetup at UC LM?',
      timestamp: 'Today at 10:15 AM'
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'user-ken',
      receiverId: 'user-alex',
      content: 'Yes Alex, still available! Crisp condition with sliding cover.',
      timestamp: 'Today at 10:20 AM'
    }
  ]);
  const [swaps, setSwaps] = useLocalStorage<SwapOffer[]>('tradelink_swaps_v3', SEED_SWAPS);
  const [meetups, setMeetups] = useLocalStorage<MeetupTransaction[]>('tradelink_meetups_v3', SEED_MEETUPS);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  // Active Conversation
  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  // Active Messages for currently selected conversation
  const activeMessages = activeConvId
    ? messages.filter((m) => m.conversationId === activeConvId)
    : [];

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const setActiveConversationId = (id: string | null) => {
    setActiveConvId(id);
    if (id) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const openChatWithSeller = (listing: Listing) => {
    if (listing.sellerId === currentUser.id) return;

    // Check if conversation already exists
    const existing = conversations.find(
      (c) =>
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(listing.sellerId) &&
        c.listingId === listing.id
    );

    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    const newConvId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      participantIds: [currentUser.id, listing.sellerId],
      otherParticipant: {
        id: listing.sellerId,
        name: listing.sellerName,
        avatar: listing.sellerAvatar,
        campus: listing.sellerCampus,
        isVerified: listing.sellerIsVerified
      },
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || '',
      lastMessage: `Hi ${listing.sellerName}, I am interested in your ${listing.title}!`,
      lastMessageTimestamp: 'Just now',
      unreadCount: 0
    };

    setConversations((prev) => {
      if (prev.some((c) => c.id === newConv.id || (c.listingId === listing.id && c.participantIds.includes(currentUser.id)))) {
        return prev;
      }
      return [newConv, ...prev];
    });

    const initialMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: newConvId,
      senderId: currentUser.id,
      receiverId: listing.sellerId,
      content: `Hi ${listing.sellerName}! I am interested in your "${listing.title}". Is this still available for meetup in ${listing.sellerCampus}?`,
      timestamp: 'Just now'
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === initialMsg.id)) return prev;
      return [...prev, initialMsg];
    });

    setActiveConvId(newConvId);
  };

  const sendMessage = (text: string, isSystem = false, swapOfferId?: string) => {
    if (!activeConversation || !text.trim()) return;

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

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessage: text.trim(),
              lastMessageTimestamp: 'Just now'
            }
          : c
      )
    );
  };

  const proposeSwap = (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
    proposedMeetupSpot: string;
    proposedDateTime: string;
  }): SwapOffer => {
    const newSwap: SwapOffer = {
      id: `swap-${Date.now()}`,
      targetListingId: params.targetListing.id,
      targetListingTitle: params.targetListing.title,
      targetListingImage: params.targetListing.images[0] || '',
      targetSellerId: params.targetListing.sellerId,
      targetSellerName: params.targetListing.sellerName,
      offererId: currentUser.id,
      offererName: currentUser.name,
      offererAvatar: currentUser.avatar,
      offererCampus: currentUser.campus,
      offeredListingId: params.offeredListingId,
      offeredListingTitle: params.offeredListingTitle,
      offeredListingImage: params.offeredListingImage,
      offeredDescription: params.offeredDescription,
      cashTopUp: params.cashTopUp,
      status: 'pending',
      proposedMeetupSpot: params.proposedMeetupSpot,
      proposedDateTime: params.proposedDateTime,
      createdAt: new Date().toISOString()
    };

    setSwaps((prev) => {
      if (prev.some((s) => s.id === newSwap.id)) return prev;
      return [newSwap, ...prev];
    });

    openChatWithSeller(params.targetListing);
    setTimeout(() => {
      const topUpText =
        params.cashTopUp > 0
          ? ` (with +₱${params.cashTopUp} cash)`
          : params.cashTopUp < 0
          ? ` (requesting ₱${Math.abs(params.cashTopUp)} cash)`
          : '';
      sendMessage(
        `Sent a Swap Proposal: Offering "${params.offeredListingTitle || params.offeredDescription}"${topUpText} for "${params.targetListing.title}". Meetup: ${params.proposedMeetupSpot} on ${params.proposedDateTime}.`,
        true,
        newSwap.id
      );
    }, 100);

    return newSwap;
  };

  const respondToSwap = (swapId: string, status: 'accepted' | 'declined') => {
    setSwaps((prev) =>
      prev.map((s) => (s.id === swapId ? { ...s, status } : s))
    );

    const swap = swaps.find((s) => s.id === swapId);
    if (swap) {
      sendMessage(
        status === 'accepted'
          ? `🎉 Swap Offer ACCEPTED! Let's proceed to coordinate our campus meetup.`
          : `Swap offer declined. Thank you for your interest!`,
        true,
        swapId
      );
    }
  };

  const scheduleMeetup = (params: {
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
  }): MeetupTransaction => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const newMeetup: MeetupTransaction = {
      id: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      listingId: params.listing.id,
      listingTitle: params.listing.title,
      listingImage: params.listing.images[0] || '',
      sellerId: params.sellerId,
      sellerName: params.sellerName,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      tradeMode: params.tradeMode,
      finalPrice: params.finalPrice,
      campus: params.campus,
      landmarkSpot: params.landmarkSpot,
      scheduledDateTime: params.scheduledDateTime,
      verificationCode: code,
      status: 'scheduled',
      notes: params.notes,
      createdAt: new Date().toISOString()
    };

    setMeetups((prev) => {
      // Prevent duplicate insertion
      if (prev.some((m) => m.id === newMeetup.id || (m.listingId === params.listing.id && m.buyerId === params.buyerId && m.status === 'scheduled'))) {
        return prev;
      }
      return [newMeetup, ...prev];
    });

    openChatWithSeller(params.listing);
    setTimeout(() => {
      sendMessage(
        `📍 Campus Meetup Scheduled!\nItem: ${params.listing.title}\nLocation: ${params.landmarkSpot} (${params.campus})\nTime: ${params.scheduledDateTime}\nSecurity Code: Check your Meetups tab for the 4-digit code.`,
        true
      );
    }, 100);

    return newMeetup;
  };

  const completeMeetupWithCode = (meetupId: string, enteredCode: string): { success: boolean; message: string } => {
    const meetup = meetups.find((m) => m.id === meetupId);
    if (!meetup) {
      return { success: false, message: 'Meetup transaction not found.' };
    }

    if (meetup.verificationCode.trim() !== enteredCode.trim()) {
      return { success: false, message: 'Invalid 4-digit Handshake Code. Please double-check with the other student.' };
    }

    setMeetups((prev) =>
      prev.map((m) => (m.id === meetupId ? { ...m, status: 'completed' } : m))
    );

    return { success: true, message: 'Transaction verified and completed! +10 Campus Trust Score points awarded.' };
  };

  const updateMeetupStatus = (meetupId: string, status: MeetupTransaction['status']) => {
    setMeetups((prev) =>
      prev.map((m) => (m.id === meetupId ? { ...m, status } : m))
    );
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
        setActiveConversationId,
        openChatWithSeller,
        sendMessage,
        proposeSwap,
        respondToSwap,
        scheduleMeetup,
        completeMeetupWithCode,
        updateMeetupStatus
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
