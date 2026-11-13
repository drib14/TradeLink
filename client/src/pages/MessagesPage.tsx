import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useMarket } from '../context/MarketContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { PromptModal } from '../components/common/PromptModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { TradeLinkIcon } from '../components/common/TradeLinkIcon';
import { useToast } from '../components/common/Toast';
import { formatRelativeTime } from '../utils/date';
import { Message, Transaction } from '../types';
import {
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Paperclip,
  Loader2,
  MapPin,
  ShieldCheck,
  Search,
  ShoppingBag,
  Check,
  CheckCheck,
  Lock,
  MessageSquare,
  Copy,
  Clock,
  Tag,
  Filter
} from 'lucide-react';

interface MessagesPageProps {
  conversationId?: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenAuth?: () => void;
}

const OFFICIAL_CAMPUS_SPOTS = [
  'UC Main: Ground Floor Quadrangle',
  'UC Main: 4th Floor Main Library',
  'UC Main: Student Affairs Office (SAO) Lobby',
  'UC Banilad: Campus Canteen & Food Court',
  'UC Banilad: Engineering Hallway Plaza',
  'UC LM: Main Gate Student Waiting Lounge',
  'UC LM: 2nd Floor Library Reading Area',
  'UC METC: Student Center Plaza',
  'UC South Campus: Administration Lobby',
  'UC Pardo-Talisay: Student Lounge',
  'UC Medical Center: Ground Floor Lobby',
  'UC PRI: High School Entrance Hall'
];

const QUICK_REPLY_CHIPS = [
  'Is this still available?',
  'Can we meet at the Quadrangle?',
  'Can we meet at the Library?',
  'What time are you free today on campus?',
  'I am heading to the campus meetup spot!',
  'I have arrived at the meetup spot!',
  'Item inspected and received, thank you!'
];

export const MessagesPage: React.FC<MessagesPageProps> = ({
  conversationId,
  onNavigate,
  onOpenAuth
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    conversations,
    activeConversation,
    activeMessages,
    setActiveConversationId,
    sendMessage,
    sendMediaMessage,
    sendMeetupLocation,
    sendTypingStatus,
    typingUsers,
    transactions,
    confirmHandshake,
    cancelTransaction
  } = useChat();

  const { listings } = useMarket();
  const { showToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'orders' | 'unread'>('all');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customMeetupInput, setCustomMeetupInput] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Modals state
  const [completeTxModal, setCompleteTxModal] = useState<{ id: string; refNo: string; title?: string } | null>(null);
  const [confirmReceiptTxModal, setConfirmReceiptTxModal] = useState<{ id: string; refNo: string; title?: string } | null>(null);
  const [cancelTxModal, setCancelTxModal] = useState<{ id: string; refNo: string; title?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync conversationId from prop / URL
  useEffect(() => {
    if (conversationId && conversationId !== activeConversation?.id) {
      setActiveConversationId(conversationId);
    }
  }, [conversationId, activeConversation?.id, setActiveConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  // Find active transaction for a given conversation
  const getConvTransaction = (conv: typeof conversations[0]) => {
    if (conv.activeTransaction) return conv.activeTransaction;
    if (!conv.listingId) return null;
    return transactions.find(
      (t) =>
        t.listingId === conv.listingId &&
        (t.buyerId === conv.otherParticipant.id || t.sellerId === conv.otherParticipant.id) &&
        (t.status === 'pending' || t.status === 'completed')
    ) || null;
  };

  // Filter conversations by search and tab
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const q = searchFilter.toLowerCase().trim();
      const matchesSearch = !q || (
        c.otherParticipant.name.toLowerCase().includes(q) ||
        (c.listingTitle && c.listingTitle.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;

      if (filterTab === 'orders') {
        const tx = getConvTransaction(c);
        return tx && tx.status === 'pending';
      }
      if (filterTab === 'unread') {
        return (c.unreadCount || 0) > 0;
      }
      return true;
    });
  }, [conversations, searchFilter, filterTab, transactions]);

  // Counts for tabs
  const activeOrdersCount = useMemo(() => {
    return conversations.filter((c) => {
      const tx = getConvTransaction(c);
      return tx && tx.status === 'pending';
    }).length;
  }, [conversations, transactions]);

  const totalUnreadCount = useMemo(() => {
    return conversations.filter((c) => (c.unreadCount || 0) > 0).length;
  }, [conversations]);

  const handleSelectConv = (id: string) => {
    setActiveConversationId(id);
    onNavigate('messages', { conversationId: id });
  };

  const handleBackToList = () => {
    setActiveConversationId(null);
    onNavigate('messages', {});
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending) return;
    const text = inputMessage.trim();
    if (!text || !activeConversation) return;

    setIsSending(true);
    setInputMessage('');
    sendTypingStatus(false);

    try {
      await sendMessage(text);
    } catch (err: any) {
      showToast('Message Error', err?.message || 'Failed to send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    setIsSendingMedia(true);
    try {
      await sendMediaMessage(file);
      showToast('Media Sent', 'Your attachment was uploaded and shared securely.', 'success');
    } catch (err: any) {
      showToast('Upload Failed', err?.message || 'Unable to upload media.', 'error');
    } finally {
      setIsSendingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Copied', `${label} copied to clipboard!`, 'success');
    }
  };

  // Resolve Active Listing & Active Transaction for current chat
  const activeListing = useMemo(() => {
    if (!activeConversation?.listingId) return null;
    return listings.find((l) => l.id === activeConversation.listingId) || null;
  }, [activeConversation, listings]);

  const activeDealTx = useMemo<Transaction | null>(() => {
    if (!activeConversation) return null;
    // 1. Direct matching transaction from user's full transactions array
    if (activeConversation.listingId) {
      const match = transactions.find(
        (t) =>
          t.listingId === activeConversation.listingId &&
          (t.buyerId === activeConversation.otherParticipant.id || t.sellerId === activeConversation.otherParticipant.id) &&
          (t.status === 'pending' || t.status === 'completed')
      );
      if (match) return match;
    }
    // 2. Active transaction embedded in conversation object
    if (activeConversation.activeTransaction) {
      const act = activeConversation.activeTransaction;
      return {
        id: act.id,
        referenceNo: act.referenceNo,
        listingId: act.listingId || activeConversation.listingId,
        listingTitle: act.listingTitle || activeConversation.listingTitle || 'Item',
        listingImage: activeConversation.listingImage,
        amount: act.amount,
        finalPrice: act.amount,
        paymentMethod: (act.paymentMethod || 'cash') as any,
        paymentStatus: 'unpaid' as any,
        status: (act.status || 'pending') as any,
        sellerId: act.sellerId || activeConversation.listingSellerId || '',
        sellerName: activeConversation.otherParticipant.name,
        buyerId: act.buyerId || currentUser?.id || '',
        buyerName: currentUser?.name || '',
        selectedVariation: act.selectedVariation || null,
        verificationCode: act.verificationCode || undefined,
        buyerConfirmedAt: act.buyerConfirmedAt || (act as any).buyer_confirmed_at || null,
        sellerConfirmedAt: act.sellerConfirmedAt || (act as any).seller_confirmed_at || null,
        handshakeCompletedAt: act.handshakeCompletedAt || (act as any).handshake_completed_at || null,
        tradeMode: (activeConversation.listingTradeMode || 'buy_sell') as any,
        createdAt: new Date().toISOString()
      } as Transaction;
    }
    return null;
  }, [activeConversation, transactions, currentUser]);

  // Combined item details so the item header is ALWAYS visible
  const displayItemInfo = useMemo(() => {
    if (!activeConversation?.listingId && !activeDealTx?.listingId) return null;
    const title = activeDealTx?.listingTitle || activeListing?.title || activeConversation?.listingTitle || 'Campus Item';
    const image = activeDealTx?.listingImage || (activeListing?.images && activeListing.images[0]) || activeConversation?.listingImage || '';
    const price = activeDealTx?.amount ?? activeListing?.price ?? activeConversation?.listingPrice;
    const condition = activeListing?.condition;
    const id = activeDealTx?.listingId || activeListing?.id || activeConversation?.listingId;
    const variation = activeDealTx?.selectedVariation;
    return { title, image, price, condition, id, variation };
  }, [activeDealTx, activeListing, activeConversation]);

  // Determine user role in active transaction
  const isSellerInDeal = Boolean(activeDealTx && currentUser && activeDealTx.sellerId === currentUser.id);
  const isBuyerInDeal = Boolean(activeDealTx && currentUser && activeDealTx.buyerId === currentUser.id);

  // Render Rich Formatted Message Bubbles
  const renderMessageContent = (msg: Message, isSelf: boolean) => {
    const content = msg.content || '';

    // 1. Order Confirmation Card
    if (content.includes('[ORDER CONFIRMED]') || content.includes('[Confirmed Deal]')) {
      const refMatch = content.match(/Reference:?\s*#?([A-Z0-9-]+)/i) || content.match(/Reference\s+([A-Z0-9-]+)/i);
      const refNo = refMatch ? refMatch[1] : (activeDealTx?.referenceNo || '');

      const itemMatch = content.match(/Item:\s*"([^"]+)"/i) || content.match(/Item:\s*([^\n•]+)/i);
      const itemTitle = itemMatch ? itemMatch[1].trim() : (displayItemInfo?.title || 'Campus Item');

      const optMatch = content.match(/Option:\s*"([^"]+)"/i) || content.match(/Option:\s*([^\n•]+)/i) || content.match(/\[Option:\s*([^\]]+)\]/i);
      const optionName = optMatch ? optMatch[1].trim() : (activeDealTx?.selectedVariation || null);

      const amtMatch = content.match(/Amount:\s*₱?([0-9,]+)/i) || content.match(/for\s*₱?([0-9,]+)/i);
      const amountStr = amtMatch ? amtMatch[1] : (activeDealTx ? Number(activeDealTx.amount).toLocaleString() : '');

      const payMatch = content.match(/\((CASH|GCASH|MAYA|FREE|BARTER)\)/i);
      const payMethod = payMatch ? payMatch[1] : (activeDealTx?.paymentMethod?.toUpperCase() || 'CASH');

      return (
        <div
          style={{
            border: '1.5px solid #BFDBFE',
            backgroundColor: '#EFF6FF',
            borderRadius: '14px',
            padding: '1rem',
            maxWidth: '420px',
            boxShadow: '0 4px 12px rgba(0, 43, 127, 0.08)',
            textAlign: 'left'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', borderBottom: '1px solid #DBEAFE', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--uc-blue, #002B7F)', color: '#FFC72C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={14} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Campus Order Confirmed
              </span>
            </div>
            {refNo && (
              <button
                type="button"
                onClick={() => handleCopyText(refNo, 'Order Reference')}
                style={{
                  background: '#DBEAFE',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--uc-blue, #002B7F)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title="Click to copy Reference"
              >
                <span>#{refNo}</span>
                <Copy size={11} />
              </button>
            )}
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', minWidth: '60px' }}>Item:</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem', wordBreak: 'break-word' }}>
                {itemTitle}
              </strong>
            </div>

            {optionName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', minWidth: '60px' }}>Option:</span>
                <span style={{ backgroundColor: 'var(--uc-blue-subtle, #EEF4FF)', color: 'var(--uc-blue, #002B7F)', padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.76rem' }}>
                  {optionName}
                </span>
              </div>
            )}

            {amountStr && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', minWidth: '60px' }}>Payment:</span>
                <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.88rem' }}>
                  ₱{amountStr} ({payMethod})
                </span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed #BFDBFE', fontSize: '0.76rem', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Agree on campus meetup spot & time:</span>
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              style={{
                border: 'none',
                background: 'var(--uc-blue, #002B7F)',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <MapPin size={12} /> Suggest Spot
            </button>
          </div>
        </div>
      );
    }

    // 2. Deal Completed Card
    if (content.includes('[Deal Completed]')) {
      const cleanText = content.replace('[Deal Completed]', '').trim();
      return (
        <div
          style={{
            border: '1.5px solid #A7F3D0',
            backgroundColor: '#ECFDF5',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            maxWidth: '420px',
            color: '#065F46',
            boxShadow: '0 3px 10px rgba(5, 150, 105, 0.08)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#047857' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>Campus Deal Completed!</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: '#065F46' }}>
            {cleanText}
          </p>
        </div>
      );
    }

    // 3. Deal Cancelled Card
    if (content.includes('[Deal Cancelled]')) {
      const cleanText = content.replace('[Deal Cancelled]', '').trim();
      return (
        <div
          style={{
            border: '1.5px solid #FECACA',
            backgroundColor: '#FEF2F2',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            maxWidth: '420px',
            color: '#991B1B',
            boxShadow: '0 3px 10px rgba(220, 38, 38, 0.08)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#B91C1C' }}>
            <XCircle size={18} color="#DC2626" />
            <span>Order Cancelled</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: '#991B1B' }}>
            {cleanText}
          </p>
        </div>
      );
    }

    // 4. Campus Meetup Landmark Card
    if (content.includes('[Meetup Landmark]') || content.includes('[Campus Meetup Location]')) {
      const spotText = content.replace(/\[Meetup Landmark\]|\[Campus Meetup Location\]/g, '').trim();
      return (
        <div
          style={{
            border: '1.5px solid #FED7AA',
            backgroundColor: '#FFF7ED',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            maxWidth: '420px',
            color: '#9A3412',
            boxShadow: '0 3px 10px rgba(234, 88, 12, 0.08)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.3rem', color: '#C2410C' }}>
            <MapPin size={16} color="#EA580C" />
            <span>Agreed Campus Meetup Landmark</span>
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {spotText}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#9A3412', marginTop: '0.4rem', borderTop: '1px dashed #FDBA74', paddingTop: '0.35rem' }}>
            Meet inside official University of Cebu premises during active school hours.
          </div>
        </div>
      );
    }

    // Default message bubble
    return (
      <div
        style={{
          padding: '0.65rem 0.95rem',
          borderRadius: '12px',
          fontSize: '0.86rem',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          backgroundColor: isSelf ? 'var(--uc-blue, #002B7F)' : 'var(--bg-subtle, #F1F5F9)',
          color: isSelf ? '#FFFFFF' : 'var(--text-primary)',
          borderTopRightRadius: isSelf ? '2px' : '12px',
          borderTopLeftRadius: isSelf ? '12px' : '2px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        {content}
      </div>
    );
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TradeLinkIcon size={56} style={{ marginBottom: '1.25rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Encrypted Campus Messages
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Sign in with your verified University of Cebu account to access encrypted peer-to-peer conversations, barter chats, and order meetups.
          </p>
          <button
            onClick={onOpenAuth}
            className="btn-primary"
            style={{ padding: '0.75rem 1.75rem', fontSize: '0.92rem', fontWeight: 800 }}
          >
            Sign In to TradeLink
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-enter" style={{ paddingTop: 'clamp(1rem, 2vw, 1.5rem)', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Campus Messages
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'var(--uc-blue)', color: '#FFFFFF' }}>
              {conversations.length}
            </span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Direct Peer Messaging • Coordinate Safe Campus Meetups
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => onNavigate('marketplace')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', fontWeight: 700 }}
          >
            Browse Marketplace
          </button>
        </div>
      </div>

      {/* Main Messenger Layout */}
      <div
        style={{
          display: 'flex',
          height: isMobileView ? 'calc(100dvh - 120px)' : 'calc(100dvh - 180px)',
          minHeight: isMobileView ? '360px' : '560px',
          maxHeight: '850px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 6px 24px rgba(0, 43, 127, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Left Sidebar: Conversations List */}
        {(!isMobileView || !activeConversation) && (
          <div
            style={{
              width: isMobileView ? '100%' : '370px',
              minWidth: isMobileView ? '100%' : '320px',
              borderRight: isMobileView ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            {/* Search Input */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search chats, items, or names..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  style={{
                    flex: 1,
                    padding: '0.3rem 0.45rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: filterTab === 'all' ? 'var(--uc-blue)' : 'var(--bg-subtle, #F1F5F9)',
                    color: filterTab === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('orders')}
                  style={{
                    flex: 1,
                    padding: '0.3rem 0.45rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: filterTab === 'orders' ? '#047857' : 'var(--bg-subtle, #F1F5F9)',
                    color: filterTab === 'orders' ? '#FFFFFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Orders</span>
                  {activeOrdersCount > 0 && (
                    <span style={{ fontSize: '0.68rem', backgroundColor: filterTab === 'orders' ? '#FFFFFF' : '#059669', color: filterTab === 'orders' ? '#047857' : '#FFFFFF', padding: '0.05rem 0.35rem', borderRadius: '9999px', fontWeight: 800 }}>
                      {activeOrdersCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  style={{
                    flex: 1,
                    padding: '0.3rem 0.45rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: filterTab === 'unread' ? 'var(--uc-blue)' : 'var(--bg-subtle, #F1F5F9)',
                    color: filterTab === 'unread' ? '#FFFFFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Unread</span>
                  {totalUnreadCount > 0 && (
                    <span style={{ fontSize: '0.68rem', backgroundColor: filterTab === 'unread' ? '#FFFFFF' : 'var(--uc-blue)', color: filterTab === 'unread' ? 'var(--uc-blue)' : '#FFFFFF', padding: '0.05rem 0.35rem', borderRadius: '9999px', fontWeight: 800 }}>
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No conversations found</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {filterTab === 'orders'
                      ? 'No active campus orders right now.'
                      : 'Open any item in the marketplace and click "Chat with Seller" to connect.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = activeConversation?.id === conv.id;
                  const otherUser = conv.otherParticipant;
                  const unread = conv.unreadCount || 0;
                  const convTx = getConvTransaction(conv);
                  const isOrderPending = convTx && convTx.status === 'pending';
                  const isOrderCompleted = convTx && convTx.status === 'completed';

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConv(conv.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isActive
                          ? 'var(--uc-blue-subtle, #EEF4FF)'
                          : 'transparent',
                        borderLeft: isActive
                          ? '3px solid var(--uc-blue, #002B7F)'
                          : '3px solid transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                        <UserAvatar
                          src={otherUser.avatar}
                          name={otherUser.name}
                          size="md"
                        />
                        {otherUser.isVerified && (
                          <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                            <VerifiedBadge size="xs" variant="green" />
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Top: Name + Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: unread > 0 ? 800 : 700,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {otherUser.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {formatRelativeTime(conv.lastMessageTimestamp)}
                          </span>
                        </div>

                        {/* Item Card context preview badge */}
                        {conv.listingTitle && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              marginTop: '2px',
                              overflow: 'hidden'
                            }}
                          >
                            {conv.listingImage ? (
                              <img
                                src={conv.listingImage}
                                alt={conv.listingTitle}
                                style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <ShoppingBag size={12} color="var(--uc-blue)" style={{ flexShrink: 0 }} />
                            )}
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--uc-blue)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {conv.listingTitle}
                            </span>
                          </div>
                        )}

                        {/* Active order badge if applicable */}
                        {isOrderPending && (
                          <div style={{ marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                border: '1px solid #FDE68A',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              <ShoppingBag size={10} />
                              <span>Order #{convTx.referenceNo}</span>
                            </span>
                          </div>
                        )}

                        {isOrderCompleted && (
                          <div style={{ marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: '#ECFDF5',
                                color: '#047857',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              <CheckCircle2 size={10} />
                              <span>Done #{convTx.referenceNo}</span>
                            </span>
                          </div>
                        )}

                        {/* Last message preview + Unread pill */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                          <span
                            style={{
                              fontSize: '0.76rem',
                              color: unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontWeight: unread > 0 ? 700 : 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {conv.lastMessage || 'Start conversation...'}
                          </span>

                          {unread > 0 && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                                backgroundColor: 'var(--uc-blue)',
                                color: '#FFFFFF',
                                flexShrink: 0,
                                marginLeft: '0.4rem'
                              }}
                            >
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Main Chat Window */}
        {(!isMobileView || Boolean(activeConversation)) && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              minWidth: 0
            }}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Header */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    {isMobileView && (
                      <button
                        onClick={handleBackToList}
                        className="btn-icon"
                        style={{ padding: '0.35rem', color: 'var(--text-primary)' }}
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}

                    <div
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => onNavigate('profile', { userId: activeConversation.otherParticipant.id })}
                    >
                      <UserAvatar
                        src={activeConversation.otherParticipant.avatar}
                        name={activeConversation.otherParticipant.name}
                        size="md"
                      />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <h3
                          style={{
                            fontSize: '0.94rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {activeConversation.otherParticipant.name}
                        </h3>
                        {activeConversation.otherParticipant.isVerified && (
                          <VerifiedBadge size="xs" variant="green" />
                        )}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activeConversation.otherParticipant.department || 'UC Student'} • {activeConversation.otherParticipant.campus || 'UC Main'}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Security Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#047857',
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px'
                      }}
                      title="Messages are encrypted on storage with AES-256-GCM"
                    >
                      <ShieldCheck size={13} />
                      <span className="hidden-xs">Encrypted Chat</span>
                    </div>

                    {displayItemInfo?.id && (
                      <button
                        onClick={() => onNavigate('item-detail', { id: displayItemInfo.id })}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <ExternalLink size={12} />
                        <span>View Item</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. Prominent Item Context Card (ALWAYS visible when item exists) */}
                {displayItemInfo && (
                  <div
                    style={{
                      padding: '0.55rem 1rem',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      {displayItemInfo.image ? (
                        <img
                          src={displayItemInfo.image}
                          alt={displayItemInfo.title}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ShoppingBag size={18} color="var(--text-muted)" />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayItemInfo.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', marginTop: '1px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--uc-blue)', fontWeight: 800 }}>
                            {displayItemInfo.price !== null && displayItemInfo.price !== undefined ? `₱${Number(displayItemInfo.price).toLocaleString()}` : 'FREE'}
                          </span>
                          {displayItemInfo.condition && (
                            <span style={{ color: 'var(--text-muted)' }}>• {displayItemInfo.condition}</span>
                          )}
                          {displayItemInfo.variation && (
                            <span style={{ backgroundColor: 'var(--uc-blue-subtle, #EEF4FF)', color: 'var(--uc-blue)', fontWeight: 700, padding: '0.05rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                              Option: {displayItemInfo.variation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('item-detail', { id: displayItemInfo.id })}
                      className="btn-ghost"
                      style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--uc-blue)', flexShrink: 0 }}
                    >
                      Details →
                    </button>
                  </div>
                )}

                {/* 2. Active Order Banner with Handshake Details & Quick Seller/Buyer Actions */}
                {activeDealTx && (
                  <div
                    style={{
                      padding: '0.65rem 1rem',
                      backgroundColor: activeDealTx.status === 'completed' ? '#ECFDF5' : '#FEF3C7',
                      borderBottom: activeDealTx.status === 'completed' ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: activeDealTx.status === 'completed' ? '#065F46' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {activeDealTx.status === 'completed' ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Order Completed</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={13} />
                              <span>Active Order</span>
                            </>
                          )}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.8rem', color: activeDealTx.status === 'completed' ? '#047857' : '#B45309', backgroundColor: activeDealTx.status === 'completed' ? '#D1FAE5' : '#FDE68A', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                          #{activeDealTx.referenceNo}
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: activeDealTx.status === 'completed' ? '#047857' : '#B45309' }}>
                          ₱{Number(activeDealTx.amount).toLocaleString()} ({activeDealTx.paymentMethod?.toUpperCase() || 'CASH'})
                        </span>
                      </div>

                      {/* Status / Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {activeDealTx.status === 'pending' && isSellerInDeal && !activeDealTx.sellerConfirmedAt && (
                          <>
                            <button
                              type="button"
                              onClick={() => setCompleteTxModal({ id: activeDealTx.id, refNo: activeDealTx.referenceNo, title: activeDealTx.listingTitle })}
                              className="btn-primary"
                              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <CheckCircle2 size={13} /> Verify buyer code
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelTxModal({ id: activeDealTx.id, refNo: activeDealTx.referenceNo, title: activeDealTx.listingTitle })}
                              className="btn-ghost"
                              style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem', color: '#DC2626', fontWeight: 700 }}
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {activeDealTx.status === 'pending' && isSellerInDeal && activeDealTx.sellerConfirmedAt && !activeDealTx.buyerConfirmedAt && (
                          <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>Code verified · Waiting for buyer confirmation</span>
                        )}

                        {activeDealTx.status === 'pending' && isBuyerInDeal && !activeDealTx.sellerConfirmedAt && (
                          <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 700 }}>
                            Inspect the item. The seller must verify your private code first.
                          </div>
                        )}

                        {activeDealTx.status === 'pending' && isBuyerInDeal && activeDealTx.sellerConfirmedAt && !activeDealTx.buyerConfirmedAt && (
                          <button
                            type="button"
                            onClick={() => setConfirmReceiptTxModal({ id: activeDealTx.id, refNo: activeDealTx.referenceNo, title: activeDealTx.listingTitle })}
                            className="btn-primary"
                            style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <CheckCircle2 size={13} /> Confirm item received
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order instructions & variation notice */}
                    <div style={{ fontSize: '0.74rem', color: activeDealTx.status === 'completed' ? '#065F46' : '#78350F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span>
                        Item: <strong>"{activeDealTx.listingTitle}"</strong>
                        {activeDealTx.selectedVariation && (
                          <> • Option: <strong>"{activeDealTx.selectedVariation}"</strong></>
                        )}
                      </span>

                      {/* Buyer Handshake Code reminder if present */}
                      {isBuyerInDeal && activeDealTx.verificationCode && activeDealTx.status === 'pending' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 800 }}>Your Handshake Code:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 900, backgroundColor: '#FEF3C7', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid #FCD34D', color: '#B45309' }}>
                            {activeDealTx.verificationCode}
                          </span>
                          <span style={{ color: '#92400E', fontSize: '0.68rem' }}>Show in person only. Never send this code in chat.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages Feed */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  {/* Encrypted Disclaimer */}
                  <div style={{ textAlign: 'center', margin: '0.35rem 0' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle, #F1F5F9)', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={11} color="var(--text-muted)" /> Messages are private and encrypted between you and {activeConversation.otherParticipant.name}.
                    </span>
                  </div>

                  {activeMessages.map((msg) => {
                    const isSelf = msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          alignSelf: isSelf ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {/* Media Attachment */}
                        {msg.mediaUrl && (
                          <div style={{ marginBottom: '0.35rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            {msg.mediaType === 'video' ? (
                              <video
                                src={msg.mediaUrl}
                                controls
                                style={{ maxWidth: '280px', maxHeight: '200px', display: 'block' }}
                              />
                            ) : (
                              <img
                                src={msg.mediaUrl}
                                alt="Attachment"
                                style={{ maxWidth: '280px', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                              />
                            )}
                          </div>
                        )}

                        {/* Rich formatted or standard bubble */}
                        {msg.content && renderMessageContent(msg, isSelf)}

                        {/* Metadata row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span>{formatRelativeTime(msg.timestamp)}</span>
                          {isSelf && (
                            msg.isRead ? <CheckCheck size={12} color="var(--uc-blue)" /> : <Check size={12} />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.includes(activeConversation.otherParticipant.id) && (
                    <div style={{ alignSelf: 'flex-start', fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Loader2 size={12} className="spin" />
                      <span>{activeConversation.otherParticipant.name} is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Chips */}
                <div
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {QUICK_REPLY_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Location Picker Popup */}
                {showLocationPicker && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderTop: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Select Campus Meetup Landmark:
                      </span>
                      <button
                        onClick={() => setShowLocationPicker(false)}
                        style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', maxHeight: '130px', overflowY: 'auto' }}>
                      {OFFICIAL_CAMPUS_SPOTS.map((spot) => (
                        <button
                          key={spot}
                          onClick={() => {
                            sendMeetupLocation(spot);
                            setShowLocationPicker(false);
                          }}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.72rem',
                            textAlign: 'left',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-subtle)',
                            cursor: 'pointer'
                          }}
                        >
                          <MapPin size={11} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {spot}
                        </button>
                      ))}
                    </div>

                    {/* Propose Any Custom Meetup Spot */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-subtle)' }}>
                      <input
                        type="text"
                        value={customMeetupInput}
                        onChange={(e) => setCustomMeetupInput(e.target.value)}
                        placeholder="Or type custom meetup location..."
                        className="clean-input"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customMeetupInput.trim()) {
                            e.preventDefault();
                            sendMeetupLocation(customMeetupInput.trim());
                            setCustomMeetupInput('');
                            setShowLocationPicker(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', whiteSpace: 'nowrap' }}
                        disabled={!customMeetupInput.trim()}
                        onClick={() => {
                          if (customMeetupInput.trim()) {
                            sendMeetupLocation(customMeetupInput.trim());
                            setCustomMeetupInput('');
                            setShowLocationPicker(false);
                          }
                        }}
                      >
                        Send Spot
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSendingMedia}
                    className="btn-icon"
                    title="Attach photo or sample video"
                    style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  >
                    {isSendingMedia ? <Loader2 size={18} className="spin" /> : <Paperclip size={18} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="btn-icon"
                    title="Share Official Campus Meetup Location"
                    style={{ color: 'var(--uc-blue)', flexShrink: 0 }}
                  >
                    <MapPin size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={isSending ? 'Sending encrypted message...' : 'Type an encrypted message...'}
                    value={inputMessage}
                    disabled={isSending}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      sendTypingStatus(e.target.value.length > 0);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.95rem',
                      fontSize: '0.86rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      color: 'var(--text-primary)'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="btn-primary"
                    style={{
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexShrink: 0,
                      opacity: inputMessage.trim() && !isSending ? 1 : 0.6
                    }}
                  >
                    <Send size={15} />
                    <span className="hidden-xs">{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </form>
              </>
            ) : (
              /* Empty state when no chat is selected on desktop */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle, #F1F5F9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <MessageSquare size={32} color="var(--uc-blue)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Select a Conversation
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '360px', lineHeight: 1.5 }}>
                  Choose a student chat on the left to review item purchases, agree on safe campus meetup spots, or negotiate barter options.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seller verifies the buyer's one-time code at the physical meetup. */}
      {completeTxModal && (
        <PromptModal
          isOpen={Boolean(completeTxModal)}
          title="Verify meetup handshake"
          message={`Ask the buyer to show their private 4-digit code in person for order #${completeTxModal.refNo}. Submit only after the item has been handed over and any agreed payment or swap terms have been settled.`}
          placeholder="Enter 4-digit buyer code"
          inputType="number"
          required
          confirmText="Verify code"
          cancelText="Not yet"
          onSubmit={async (code) => {
            const txId = completeTxModal.id;
            try {
              const result = await confirmHandshake(txId, code);
              setCompleteTxModal(null);
              showToast(
                result.completed ? 'Trade Completed' : 'Seller Verification Saved',
                result.completed ? 'Both parties confirmed the exchange.' : 'Waiting for the buyer to confirm the exchange from chat or Transactions.',
                'success'
              );
            } catch (err: any) {
              showToast('Handshake Verification Failed', err?.message || 'Check the 4-digit code and try again.', 'error');
            }
          }}
          onCancel={() => setCompleteTxModal(null)}
        />
      )}

      {/* Buyer independently confirms receipt after inspecting the exchanged item. */}
      {confirmReceiptTxModal && (
        <ConfirmModal
          isOpen={Boolean(confirmReceiptTxModal)}
          title="Confirm completed exchange"
          message={`Have you received and inspected "${confirmReceiptTxModal.title || 'the item'}" and completed the agreed payment or exchange terms for order #${confirmReceiptTxModal.refNo}? Confirm only when everything is settled.`}
          confirmText="Yes, I received it"
          cancelText="Not yet"
          variant="success"
          onConfirm={async () => {
            const txId = confirmReceiptTxModal.id;
            try {
              const result = await confirmHandshake(txId);
              setConfirmReceiptTxModal(null);
              showToast(
                result.completed ? 'Trade Completed' : 'Receipt Confirmation Saved',
                result.completed ? 'Both parties confirmed the exchange.' : 'Your confirmation has been recorded.',
                'success'
              );
            } catch (err: any) {
              showToast('Confirmation Failed', err?.message || 'Could not confirm receipt.', 'error');
            }
          }}
          onCancel={() => setConfirmReceiptTxModal(null)}
        />
      )}

      {/* Cancel Transaction Modal */}
      {cancelTxModal && (
        <PromptModal
          isOpen={Boolean(cancelTxModal)}
          title="Cancel Campus Order"
          message={`Please state the reason for cancelling Order #${cancelTxModal.refNo}. The item will be returned to active marketplace status.`}
          placeholder="Reason for cancellation (e.g. unable to meet, buyer rescheduled)..."
          confirmText="Cancel Order"
          cancelText="Keep Order Active"
          required
          onSubmit={async (reason) => {
            const txId = cancelTxModal.id;
            setCancelTxModal(null);
            try {
              await cancelTransaction(txId, reason.trim() || undefined);
              showToast('Order Cancelled', 'The order has been cancelled and listing restored.', 'info');
            } catch (err: any) {
              showToast('Action Failed', err?.message || 'Could not cancel transaction.', 'error');
            }
          }}
          onCancel={() => setCancelTxModal(null)}
        />
      )}
    </div>
  );
};
