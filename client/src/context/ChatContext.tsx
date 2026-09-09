import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Conversation, Message, SwapOffer, Transaction, Listing, Campus, TradeMode } from '../types';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chat.service';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: Message[];
  swaps: SwapOffer[];
  transactions: Transaction[];
  meetups: Transaction[]; // Backward compatibility alias
  unreadTotal: number;
  isLoading: boolean;
  setActiveConversationId: (id: string | null) => void;
  openChatWithSeller: (listing: Listing) => void;
  sendMessage: (
    text: string,
    isSystem?: boolean,
    swapOfferId?: string,
    transactionId?: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ) => Promise<void>;
  sendMediaMessage: (file: File, caption?: string) => Promise<void>;
  proposeSwap: (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
  }) => Promise<SwapOffer>;
  respondToSwap: (swapId: string, status: 'accepted' | 'declined') => Promise<void>;
  createDirectOrder: (params: {
    listing: Listing;
    paymentMethod?: 'cash' | 'gcash' | 'maya';
    notes?: string;
  }) => Promise<Transaction>;
  completeTransaction: (transactionId: string) => Promise<void>;
  cancelTransaction: (transactionId: string, reason?: string) => Promise<void>;
  // Legacy aliases for backward compatibility
  scheduleMeetup?: (params: any) => Promise<any>;
  completeMeetupWithCode?: (meetupId: string, code: string) => Promise<{ success: boolean; message: string }>;
  updateMeetupStatus?: (meetupId: string, status: any) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with API when authenticated
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [serverConvs, serverSwaps, serverTxs] = await Promise.allSettled([
        chatService.getConversations(),
        chatService.getSwaps(),
        chatService.getTransactions()
      ]);

      if (serverConvs.status === 'fulfilled') {
        setConversations(serverConvs.value);
      }
      if (serverSwaps.status === 'fulfilled') {
        setSwaps(serverSwaps.value);
      }
      if (serverTxs.status === 'fulfilled') {
        setTransactions(serverTxs.value);
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
      content: `Hi ${listing.sellerName}! I am interested in your item: "${listing.title}". Where and when can we meet to transact?`,
      timestamp: 'Just now',
      isSystemMessage: false
    };

    const firstImg = (listing.media && listing.media[0]?.url) || (listing.images && listing.images[0]) || '';
    const newConv: Conversation = {
      id: newConvId,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: firstImg,
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

  const sendMessage = async (
    text: string,
    isSystem = false,
    swapOfferId?: string,
    transactionId?: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ) => {
    if (!activeConversation || (!text.trim() && !mediaUrl) || !currentUser) return;

    const receiverId =
      activeConversation.participantIds.find((id) => id !== currentUser.id) ||
      activeConversation.otherParticipant.id;

    const summaryContent = text.trim() || (mediaType === 'video' ? '📹 Video attachment' : '📷 Image attachment');

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      receiverId,
      content: summaryContent,
      timestamp: 'Just now',
      isSystemMessage: isSystem,
      swapOfferId,
      transactionId,
      mediaUrl,
      mediaType
    };

    setMessages((prev) => [...prev, newMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, lastMessage: summaryContent, lastMessageTimestamp: 'Just now' }
          : c
      )
    );

    await chatService.sendMessage({
      conversationId: activeConversation.id,
      receiverId,
      content: summaryContent,
      isSystemMessage: isSystem,
      swapOfferId,
      transactionId,
      mediaUrl,
      mediaType
    });
  };

  const sendMediaMessage = async (file: File, caption?: string) => {
    if (!activeConversation || !currentUser) return;
    const uploaded = await chatService.uploadMedia(file);
    await sendMessage(caption || '', false, undefined, undefined, uploaded.url, uploaded.mediaType);
  };

  const proposeSwap = async (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
  }): Promise<SwapOffer> => {
    if (!currentUser) {
      throw new Error('Authentication required to propose a swap offer.');
    }

    const payload = {
      targetListingId: params.targetListing.id,
      offeredListingId: params.offeredListingId,
      offeredDescription: params.offeredDescription,
      cashTopUp: params.cashTopUp
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

  const createDirectOrder = async (params: {
    listing: Listing;
    paymentMethod?: 'cash' | 'gcash' | 'maya';
    notes?: string;
  }): Promise<Transaction> => {
    if (!currentUser) {
      throw new Error('Authentication required to transact.');
    }

    const created = await chatService.createTransaction({
      listingId: params.listing.id,
      paymentMethod: params.paymentMethod || 'cash',
      notes: params.notes
    });

    setTransactions((prev) => [created, ...prev]);

    // Open chat and notify seller
    openChatWithSeller(params.listing);
    setTimeout(() => {
      sendMessage(
        `🎉 I have confirmed an order for "${params.listing.title}" (Ref: ${created.referenceNo || 'Pending'}). Let's chat here to arrange where and when we can meet up on campus!`,
        true,
        undefined,
        created.id
      );
    }, 400);

    return created;
  };

  const completeTransaction = async (transactionId: string) => {
    await chatService.completeTransaction(transactionId);
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'completed' } : t))
    );
    refreshAll();
  };

  const cancelTransaction = async (transactionId: string, reason?: string) => {
    await chatService.cancelTransaction(transactionId, reason);
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'cancelled' } : t))
    );
    refreshAll();
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeMessages,
        swaps,
        transactions,
        meetups: transactions,
        unreadTotal,
        isLoading,
        setActiveConversationId,
        openChatWithSeller,
        sendMessage,
        sendMediaMessage,
        proposeSwap,
        respondToSwap,
        createDirectOrder,
        completeTransaction,
        cancelTransaction,
        // Legacy stubs
        scheduleMeetup: async (p: any) => createDirectOrder({ listing: p.listing, notes: p.notes }),
        completeMeetupWithCode: async (id: string) => {
          await completeTransaction(id);
          return { success: true, message: 'Transaction completed!' };
        },
        updateMeetupStatus: async (id: string, s: any) => {
          if (s === 'completed') await completeTransaction(id);
          else if (s === 'cancelled') await cancelTransaction(id);
        },
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
