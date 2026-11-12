import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Conversation, Message, SwapOffer, Transaction, Listing } from '../types';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chat.service';
import { socketService } from '../services/socket.service';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: Message[];
  swaps: SwapOffer[];
  transactions: Transaction[];
  meetups: Transaction[]; // Backward compatibility alias
  unreadTotal: number;
  isLoading: boolean;
  typingUsers: string[];
  setActiveConversationId: (id: string | null) => void;
  openChatWithSeller: (listing: Listing, initialMessage?: string) => Promise<string | void>;
  openChatWithUser: (user: { id: string; name: string; avatar?: string; campus?: string }, initialMessage?: string) => Promise<string | void>;
  openChatForFlash: (flash: { id: string; requesterId: string; itemTitle?: string; itemName?: string; targetBudget?: number }, offerMessage?: string) => Promise<string | void>;
  openChatForTransaction: (tx: Transaction) => Promise<string | void>;
  openChatForSwap: (swap: SwapOffer) => Promise<string | void>;
  sendMessage: (
    text: string,
    isSystem?: boolean,
    swapOfferId?: string,
    transactionId?: string,
    flashRequestId?: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ) => Promise<void>;
  sendMediaMessage: (file: File, caption?: string) => Promise<void>;
  sendMeetupLocation: (spot: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  proposeSwap: (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
    selectedVariation?: string;
  }) => Promise<SwapOffer>;
  respondToSwap: (swapId: string, status: 'accepted' | 'declined') => Promise<void>;
  createDirectOrder: (params: {
    listing: Listing;
    paymentMethod?: 'cash' | 'gcash' | 'maya' | 'free';
    notes?: string;
    selectedVariation?: string;
    variationId?: string;
    quantity?: number;
    amount?: number;
  }) => Promise<Transaction>;
  completeTransaction: (transactionId: string) => Promise<void>;
  cancelTransaction: (transactionId: string, reason?: string) => Promise<void>;
  submitTradeReview: (params: {
    transactionId: string;
    targetUserId: string;
    rating: number;
    comment?: string;
    itemTitle?: string;
    tradeType?: string;
    wasPunctual?: boolean;
    traitBadges?: string[];
  }) => Promise<void>;
  // Legacy aliases
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
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial full state refresh from API
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

  // 2. Setup Socket.IO connection & event handlers
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      socketService.disconnect();
      return;
    }

    socketService.connect();

    const unsubMsg = socketService.onMessage((newMsg: any) => {
      const incomingId = String(newMsg.id);
      const incomingConvId = newMsg.conversationId || newMsg.conversation_id;

      setMessages((prev) => {
        // Prevent duplicate if already in state by ID
        if (prev.some((m) => String(m.id) === incomingId)) return prev;

        // If this is our own message arriving via socket, reconcile with optimistic temp message
        if (currentUser && newMsg.senderId === currentUser.id) {
          const tempIndex = prev.findIndex(
            (m) =>
              String(m.id).startsWith('msg-') &&
              (m.conversationId === incomingConvId || (m as any).conversation_id === incomingConvId) &&
              m.senderId === newMsg.senderId &&
              m.content.trim() === String(newMsg.content || '').trim()
          );
          if (tempIndex !== -1) {
            const next = [...prev];
            next[tempIndex] = newMsg;
            return next;
          }
        }

        return [...prev, newMsg];
      });

      setConversations((prev) => {
        const found = prev.find((c) => c.id === incomingConvId);
        if (!found) {
          refreshAll();
          return prev;
        }
        return prev.map((c) => {
          if (c.id === incomingConvId) {
            const isSelf = newMsg.senderId === currentUser.id;
            const isCurrentlyOpen = activeConvId === incomingConvId;
            return {
              ...c,
              lastMessage: newMsg.content,
              lastMessageTimestamp: 'Just now',
              unreadCount: isSelf || isCurrentlyOpen ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });
      });
    });

    const unsubTyping = socketService.onTyping(({ conversationId, userId, userName, isTyping }) => {
      if (userId === currentUser.id) return;
      setTypingMap((prev) => {
        const current = prev[conversationId] || [];
        if (isTyping) {
          if (!current.includes(userName)) {
            return { ...prev, [conversationId]: [...current, userName] };
          }
        } else {
          return { ...prev, [conversationId]: current.filter((u) => u !== userName) };
        }
        return prev;
      });
    });

    const unsubRead = socketService.onRead(({ conversationId }) => {
      setMessages((prev) =>
        prev.map((m) => (m.conversationId === conversationId ? { ...m, isRead: true } : m))
      );
    });

    const unsubDeal = socketService.onDealUpdated(() => {
      refreshAll();
      if (activeConvId) {
        chatService.getMessages(activeConvId).then((refreshed) => {
          setMessages((prev) => {
            const others = prev.filter((m) => m.conversationId !== activeConvId);
            return [...others, ...refreshed];
          });
        }).catch(() => {});
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubDeal();
    };
  }, [isAuthenticated, currentUser, activeConvId, refreshAll]);

  // 3. Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    socketService.joinConversation(activeConvId);
    socketService.markRead(activeConvId);
    chatService.markConversationAsRead(activeConvId).catch(() => {});

    chatService
      .getMessages(activeConvId)
      .then((serverMsgs) => {
        if (serverMsgs) {
          setMessages((prev) => {
            const otherMsgs = prev.filter((m) => m.conversationId !== activeConvId);
            return [...otherMsgs, ...serverMsgs];
          });
        }
      })
      .catch(() => {});

    return () => {
      socketService.leaveConversation(activeConvId);
    };
  }, [activeConvId]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  const activeMessages = useMemo(() => {
    if (!activeConvId) return [];
    const filtered = messages.filter(
      (m) => (m.conversationId || (m as any).conversation_id) === activeConvId
    );

    // Track confirmed real messages by sender and content
    const confirmedContents = new Set(
      filtered
        .filter((m) => !String(m.id).startsWith('msg-'))
        .map((m) => `${m.senderId}:${m.content.trim()}`)
    );

    const seenIds = new Set<string>();
    return filtered.filter((m) => {
      const idStr = String(m.id);
      if (seenIds.has(idStr)) return false;

      // Drop temp message if the real DB message with the same sender and content is already present
      if (idStr.startsWith('msg-') && confirmedContents.has(`${m.senderId}:${m.content.trim()}`)) {
        return false;
      }

      seenIds.add(idStr);
      return true;
    });
  }, [messages, activeConvId]);

  const unreadTotal = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const typingUsers = useMemo(() => {
    if (!activeConvId) return [];
    return typingMap[activeConvId] || [];
  }, [typingMap, activeConvId]);

  const setActiveConversationId = (id: string | null) => {
    setActiveConvId(id);
    if (id) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (!activeConvId) return;
    socketService.sendTyping(activeConvId, isTyping);

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(activeConvId, false);
      }, 3000);
    }
  };

  // Open Chat for Listing
  const openChatWithSeller = async (listing: Listing, initialMessage?: string): Promise<string | void> => {
    if (!currentUser) return;
    const defaultMsg = initialMessage || `Hi ${listing.sellerName}! I'm interested in your "${listing.title}". Where and when can we meet on campus?`;

    try {
      const conv = await chatService.getOrCreateConversation({
        targetUserId: listing.sellerId,
        listingId: listing.id,
        initialMessage: defaultMsg
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        if (exists) {
          return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
        }
        return [conv, ...prev];
      });

      setActiveConversationId(conv.id);
      return conv.id;
    } catch {
      // Fallback local open
      const existing = conversations.find(
        (c) => c.listingId === listing.id && c.participantIds.includes(listing.sellerId)
      );
      if (existing) {
        setActiveConversationId(existing.id);
        return existing.id;
      }
    }
  };

  // Open Direct Chat with Student User
  const openChatWithUser = async (
    targetUser: { id: string; name: string; avatar?: string; campus?: string },
    initialMessage?: string
  ): Promise<string | void> => {
    if (!currentUser) return;
    try {
      const conv = await chatService.getOrCreateConversation({
        targetUserId: targetUser.id,
        initialMessage: initialMessage || `Hi ${targetUser.name}! Let's connect on TradeLink.`
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        if (exists) {
          return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
        }
        return [conv, ...prev];
      });

      setActiveConversationId(conv.id);
      return conv.id;
    } catch {
      // Handled
    }
  };

  // Open Chat for Flash Request
  const openChatForFlash = async (
    flash: { id: string; requesterId: string; itemTitle?: string; itemName?: string; targetBudget?: number },
    offerMessage?: string
  ): Promise<string | void> => {
    if (!currentUser) return;
    const title = flash.itemTitle || flash.itemName || 'Requested Item';
    const defaultMsg = offerMessage || `[Flash Request Offer] Hi! I have "${title}" available on campus for your target budget of ₱${flash.targetBudget || 0}. Let's chat here to arrange a quick meetup!`;

    try {
      const conv = await chatService.getOrCreateConversation({
        targetUserId: flash.requesterId,
        flashRequestId: flash.id,
        initialMessage: defaultMsg
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        if (exists) {
          return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
        }
        return [conv, ...prev];
      });

      setActiveConversationId(conv.id);
      return conv.id;
    } catch {
      // Handled
    }
  };

  // Open Chat for existing Transaction
  const openChatForTransaction = async (tx: Transaction): Promise<string | void> => {
    if (!currentUser) return;
    const targetUserId = tx.buyerId === currentUser.id ? tx.sellerId : tx.buyerId;

    try {
      const conv = await chatService.getOrCreateConversation({
        targetUserId,
        listingId: tx.listingId
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        if (exists) {
          return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
        }
        return [conv, ...prev];
      });

      setActiveConversationId(conv.id);
      return conv.id;
    } catch {
      // Handled
    }
  };

  // Open Chat for existing Swap Offer
  const openChatForSwap = async (swap: SwapOffer): Promise<string | void> => {
    if (!currentUser) return;
    const targetUserId = swap.offererId === currentUser.id ? swap.targetSellerId : swap.offererId;

    try {
      const conv = await chatService.getOrCreateConversation({
        targetUserId,
        listingId: swap.targetListingId
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        if (exists) {
          return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
        }
        return [conv, ...prev];
      });

      setActiveConversationId(conv.id);
      return conv.id;
    } catch {
      // Handled
    }
  };

  // Send Message
  const sendMessage = async (
    text: string,
    isSystem = false,
    swapOfferId?: string,
    transactionId?: string,
    flashRequestId?: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ) => {
    if (!activeConversation || (!text.trim() && !mediaUrl) || !currentUser) return;

    const receiverId =
      activeConversation.participantIds.find((id) => id !== currentUser.id) ||
      activeConversation.otherParticipant.id;

    const summaryContent = text.trim() || (mediaType === 'video' ? '[Video Attachment]' : '[Image Attachment]');

    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newMsg: Message = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      receiverId,
      content: summaryContent,
      timestamp: 'Just now',
      isSystemMessage: isSystem,
      swapOfferId,
      transactionId,
      flashRequestId,
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

    // Send via REST + WebSocket
    try {
      const sent = await chatService.sendMessage({
        conversationId: activeConversation.id,
        receiverId,
        content: summaryContent,
        isSystemMessage: isSystem,
        swapOfferId,
        transactionId,
        flashRequestId,
        mediaUrl,
        mediaType
      });

      // Replace temp message with server message, preventing duplicates if socket already broadcasted
      setMessages((prev) => {
        const alreadyHasReal = prev.some((m) => String(m.id) === String(sent.id));
        if (alreadyHasReal) {
          return prev.filter((m) => String(m.id) !== tempId);
        }
        return prev.map((m) => (String(m.id) === tempId ? sent : m));
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const sendMediaMessage = async (file: File, caption?: string) => {
    if (!activeConversation || !currentUser) return;
    const uploaded = await chatService.uploadMedia(file);
    await sendMessage(caption || '', false, undefined, undefined, undefined, uploaded.url, uploaded.mediaType);
  };

  const sendMeetupLocation = async (spot: string) => {
    if (!activeConversation) return;
    await sendMessage(`Proposed Campus Meetup Zone: Let's meet at "${spot}". What time works best for you?`);
  };

  const proposeSwap = async (params: {
    targetListing: Listing;
    offeredListingId?: string;
    offeredListingTitle?: string;
    offeredListingImage?: string;
    offeredDescription: string;
    cashTopUp: number;
    selectedVariation?: string;
  }): Promise<SwapOffer> => {
    if (!currentUser) {
      throw new Error('Authentication required to propose a swap offer.');
    }

    const payload = {
      targetListingId: params.targetListing.id,
      offeredListingId: params.offeredListingId,
      offeredItemTitle: params.offeredListingTitle,
      offeredImage: params.offeredListingImage,
      offeredDescription: params.offeredDescription,
      cashTopUp: params.cashTopUp,
      selectedVariation: params.selectedVariation
    };

    const created = await chatService.proposeSwap(payload);
    setSwaps((prev) => [created, ...prev]);

    // Open chat with seller and auto-switch
    await openChatWithSeller(params.targetListing);
    return created;
  };

  const respondToSwap = async (swapId: string, status: 'accepted' | 'declined') => {
    setSwaps((prev) => prev.map((s) => (s.id === swapId ? { ...s, status } : s)));
    await chatService.respondToSwap(swapId, status);
    refreshAll();
  };

  const createDirectOrder = async (params: {
    listing: Listing;
    paymentMethod?: 'cash' | 'gcash' | 'maya' | 'free';
    notes?: string;
    selectedVariation?: string;
    variationId?: string;
    quantity?: number;
    amount?: number;
  }): Promise<Transaction> => {
    if (!currentUser) {
      throw new Error('Authentication required to transact.');
    }

    const created = await chatService.createTransaction({
      listingId: params.listing.id,
      sellerId: params.listing.sellerId,
      amount: params.amount !== undefined ? params.amount : params.listing.price,
      paymentMethod: params.paymentMethod || 'cash',
      notes: params.notes,
      selectedVariation: params.selectedVariation,
      variationId: params.variationId
    });

    setTransactions((prev) => [created, ...prev]);
    await openChatWithSeller(params.listing);
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

  const submitTradeReview = async (params: {
    transactionId: string;
    targetUserId: string;
    rating: number;
    comment?: string;
    itemTitle?: string;
    tradeType?: string;
    wasPunctual?: boolean;
    traitBadges?: string[];
  }) => {
    await chatService.submitReview(params);
    if (activeConversation) {
      await sendMessage(
        `[REVIEW] Left a ${params.rating}-Star Review: "${params.comment || 'Smooth and hassle-free campus trade!'}" Thank you!`,
        true,
        undefined,
        params.transactionId
      );
    }
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
        typingUsers,
        setActiveConversationId,
        openChatWithSeller,
        openChatWithUser,
        openChatForFlash,
        openChatForTransaction,
        openChatForSwap,
        sendMessage,
        sendMediaMessage,
        sendMeetupLocation,
        sendTypingStatus,
        proposeSwap,
        respondToSwap,
        createDirectOrder,
        completeTransaction,
        cancelTransaction,
        submitTradeReview,
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
