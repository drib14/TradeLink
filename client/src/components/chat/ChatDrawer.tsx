import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useMarket } from '../../context/MarketContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { useToast } from '../common/Toast';
import {
  X,
  Send,
  MessageSquare,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Paperclip,
  Loader2,
  FileText,
  MapPin,
  ShieldCheck,
  Search,
  Star,
  Zap,
  ShoppingBag,
  ThumbsUp,
  Check,
  CheckCheck
} from 'lucide-react';
import { PromptModal } from '../common/PromptModal';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToItem?: (listingId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
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
  'What time are you free today?',
  'Is the price negotiable?',
  'I am on my way to the campus meetup spot!',
  'Item inspected and received, thank you!'
];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToItem,
  onNavigateToProfile
}) => {
  const { currentUser } = useAuth();
  const { listings } = useMarket();
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
    swaps,
    transactions,
    respondToSwap,
    createDirectOrder,
    completeTransaction,
    cancelTransaction,
    submitTradeReview
  } = useChat();
  const { showToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'transactions'>('conversations');
  const [cancelTxModal, setCancelTxModal] = useState<{ id: string } | null>(null);
  const [completeTxModal, setCompleteTxModal] = useState<{ id: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'buying' | 'selling' | 'swaps' | 'flash' | 'wanted'>('all');

  // Modal / Popover States
  const [isSpotPickerOpen, setIsSpotPickerOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<'cash' | 'gcash' | 'maya'>('cash');
  const [buyNotes, setBuyNotes] = useState('');
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);

  // Review Modal State
  const [reviewTxId, setReviewTxId] = useState<string | null>(null);
  const [reviewTargetUserId, setReviewTargetUserId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBadges, setReviewBadges] = useState<string[]>(['Punctual', 'Item as Described']);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Lightbox Media Preview
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Typing debounce emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    sendTypingStatus(e.target.value.length > 0);
  };

  const currentListing = activeConversation
    ? listings.find((l) => l.id === activeConversation.listingId)
    : null;

  const isCurrentUserSeller = !!currentUser && !!activeConversation && (
    activeConversation.listingSellerId === currentUser.id ||
    currentListing?.sellerId === currentUser.id
  );

  // Filter conversations unconditionally before any early return
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'buying') {
        return c.listingSellerId && c.listingSellerId !== currentUser?.id;
      }
      if (activeFilter === 'selling') {
        return c.listingSellerId === currentUser?.id;
      }
      if (activeFilter === 'swaps') {
        return c.activeSwap || c.listingTradeMode === 'swap';
      }
      if (activeFilter === 'flash' || activeFilter === 'wanted') {
        return (c as any).flashRequestId || c.wantedId || (c as any).listingTradeMode === 'flash' || c.listingTradeMode === 'wanted';
      }
      return true;
    });
  }, [conversations, searchQuery, activeFilter, currentUser]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage('');
    sendTypingStatus(false);
    await sendMessage(text);
  };

  const handleQuickChipClick = async (chipText: string) => {
    await sendMessage(chipText);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('File Too Large', 'File exceeds maximum size limit of 50MB.', 'warning');
      return;
    }

    try {
      setIsUploading(true);
      await sendMediaMessage(file, inputMessage.trim() || undefined);
      setInputMessage('');
    } catch (err: any) {
      showToast('Upload Failed', err?.message || 'Failed to upload media. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectMeetupSpot = async (spot: string) => {
    setIsSpotPickerOpen(false);
    await sendMeetupLocation(spot);
  };

  const handleConfirmDirectBuy = async () => {
    if (!currentListing) return;
    try {
      setIsSubmittingBuy(true);
      await createDirectOrder({
        listing: currentListing,
        paymentMethod: buyPaymentMethod,
        notes: buyNotes.trim() || undefined
      });
      setIsBuyModalOpen(false);
      setBuyNotes('');
    } catch (err: any) {
      showToast('Order Failed', err?.message || 'Failed to create order. Please try again.', 'error');
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  const handleOpenReviewModal = (txId: string, targetId: string) => {
    setReviewTxId(txId);
    setReviewTargetUserId(targetId);
    setReviewRating(5);
    setReviewComment('');
    setReviewBadges(['Punctual', 'Item as Described']);
  };

  const handleSubmitReviewForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTxId || !reviewTargetUserId) return;
    try {
      setIsSubmittingReview(true);
      await submitTradeReview({
        transactionId: reviewTxId,
        targetUserId: reviewTargetUserId,
        rating: reviewRating,
        comment: reviewComment.trim(),
        itemTitle: currentListing?.title || activeConversation?.listingTitle || 'TradeLink Item',
        traitBadges: reviewBadges
      });
      setReviewTxId(null);
      setReviewTargetUserId(null);
    } catch (err: any) {
      showToast('Review Failed', err?.message || 'Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        className="chat-drawer-container"
        style={{
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          color: 'var(--text-primary)',
          width: '100%',
          maxWidth: '820px',
          height: '100%',
          display: 'flex',
          boxShadow: '-10px 0 35px rgba(0, 43, 127, 0.18)',
          overflow: 'hidden',
          borderLeft: '1px solid var(--border-subtle)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* LEFT COLUMN: CONVERSATION LIST & FILTERS */}
        {/* ======================================================== */}
        {(!isMobile || !activeConversation) && (
          <div
            style={{
              width: isMobile ? '100%' : '300px',
              borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-subtle, #F8FAFC)'
            }}
          >
            {/* Top Bar Header */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 43, 127, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MessageSquare size={16} color="var(--uc-blue, #002B7F)" />
                </div>
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Campus Chat
                  </span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    University of Cebu Peer Trades
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search students, items, messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.65rem 0.4rem 2rem',
                    fontSize: '0.78rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.3rem',
                padding: '0.5rem 0.85rem',
                overflowX: 'auto',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'buying', label: 'Buying' },
                { id: 'selling', label: 'Selling' },
                { id: 'swaps', label: 'Swaps' },
                { id: 'flash', label: 'Flash' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '20px',
                    border: '1px solid',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    backgroundColor: activeFilter === tab.id ? 'var(--uc-blue, #002B7F)' : 'var(--bg-subtle)',
                    color: activeFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                    borderColor: activeFilter === tab.id ? 'var(--uc-blue, #002B7F)' : 'var(--border-subtle)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {tab.id === 'flash' && <Zap size={11} />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Conversation List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {filteredConversations.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <ShoppingBag size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                  {searchQuery ? 'No conversations matching search.' : 'No messages in this category yet. Inquire or propose trades across the catalog!'}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = activeConversation?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      style={{
                        padding: '0.75rem 0.9rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'rgba(0, 43, 127, 0.07)' : 'transparent',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'center',
                        transition: 'background-color 0.15s',
                        borderLeft: isSelected ? '3px solid var(--uc-blue, #002B7F)' : '3px solid transparent'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <UserAvatar
                          src={c.otherParticipant.avatar}
                          name={c.otherParticipant.name}
                          size="md"
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#22C55E',
                            border: '2px solid #FFFFFF'
                          }}
                          title="Online on campus"
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.otherParticipant.name}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                            {c.lastMessageTimestamp}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--uc-blue, #002B7F)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                          {c.listingTitle}
                        </div>

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                          {c.lastMessage || 'Started a conversation'}
                        </div>

                        {/* Status badges */}
                        {c.activeTransaction && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#1E40AF', backgroundColor: '#EFF6FF', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            <FileText size={10} />
                            <span>Order {c.activeTransaction.referenceNo}</span>
                          </div>
                        )}
                        {c.activeSwap && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#B45309', backgroundColor: '#FFFBEB', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            <ArrowLeftRight size={10} />
                            <span>Swap Pending</span>
                          </div>
                        )}
                      </div>

                      {c.unreadCount > 0 && (
                        <span
                          style={{
                            backgroundColor: 'var(--uc-blue, #002B7F)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            minWidth: '18px',
                            textAlign: 'center'
                          }}
                        >
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* RIGHT COLUMN: ACTIVE CONVERSATION THREAD */}
        {/* ======================================================== */}
        {(!isMobile || activeConversation) && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', position: 'relative' }}>
            {activeConversation ? (
              <>
                {/* 1. Header Bar with Partner Profile & Trust */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {isMobile && (
                      <button
                        onClick={() => setActiveConversationId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                        title="Back to conversations"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <UserAvatar
                      src={activeConversation.otherParticipant.avatar}
                      name={activeConversation.otherParticipant.name}
                      size="md"
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {activeConversation.otherParticipant.name}
                        </span>
                        {activeConversation.otherParticipant.isVerified && (
                          <VerifiedBadge size="xs" variant="green" />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>{activeConversation.otherParticipant.campus}</span>
                        {activeConversation.otherParticipant.trustScore !== undefined && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <ShieldCheck size={12} /> {activeConversation.otherParticipant.trustScore}% Trust
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {onNavigateToProfile && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToProfile(activeConversation.otherParticipant.id);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--uc-blue, #002B7F)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>Storefront</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      style={{ background: 'none', border: 'none', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* 2. Sticky Listing Context Ribbon with Direct Actions */}
                {(currentListing || activeConversation.listingTitle) && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      borderBottom: '1px solid var(--border-subtle)',
                      padding: '0.65rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                      <img
                        src={
                          activeConversation.listingImage ||
                          (currentListing?.media && currentListing.media[0]?.url) ||
                          (currentListing?.images && currentListing.images[0]) ||
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'
                        }
                        alt=""
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {currentListing?.title || activeConversation.listingTitle}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--uc-blue, #002B7F)', fontWeight: 900 }}>
                            {activeConversation.listingPrice !== null && activeConversation.listingPrice !== undefined
                              ? `₱${activeConversation.listingPrice.toLocaleString()}`
                              : currentListing?.price
                              ? `₱${currentListing.price.toLocaleString()}`
                              : 'Free / Barter'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor:
                                activeConversation.listingStatus === 'sold'
                                  ? '#FEE2E2'
                                  : activeConversation.listingStatus === 'reserved'
                                  ? '#FEF3C7'
                                  : '#ECFDF5',
                              color:
                                activeConversation.listingStatus === 'sold'
                                  ? '#991B1B'
                                  : activeConversation.listingStatus === 'reserved'
                                  ? '#B45309'
                                  : '#065F46'
                            }}
                          >
                            {(activeConversation.listingStatus || 'ACTIVE').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Marketplace Actions on Listing */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {!isCurrentUserSeller && currentListing && activeConversation.listingStatus !== 'sold' && (
                        <button
                          onClick={() => setIsBuyModalOpen(true)}
                          className="btn-gold"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Zap size={13} />
                          <span>Buy Now</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsSpotPickerOpen(!isSpotPickerOpen)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        title="Pick safe campus meetup spot"
                      >
                        <MapPin size={13} color="var(--uc-blue)" />
                        <span>Meetup Spot</span>
                      </button>

                      {onNavigateToItem && activeConversation.listingId && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToItem(activeConversation.listingId);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.72rem',
                            color: 'var(--uc-blue)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            cursor: 'pointer',
                            padding: '0.35rem 0.5rem'
                          }}
                        >
                          <span>Item Details</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Campus Safe Trade Notice Bar */}
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    borderBottom: '1px solid #BBF7D0',
                    padding: '0.35rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: '#166534'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={13} /> <strong>Safe Trade Tip:</strong> Meet in public campus areas (Quadrangle, Canteen, Library) during school hours. Inspect items before paying.
                  </span>
                </div>

                {/* Campus Spot Selector Dropdown Modal */}
                {isSpotPickerOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '110px',
                      right: '1rem',
                      zIndex: 30,
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-subtle)',
                      width: '320px',
                      maxHeight: '340px',
                      overflowY: 'auto',
                      padding: '0.5rem'
                    }}
                  >
                    <div style={{ padding: '0.4rem 0.5rem', fontWeight: 800, fontSize: '0.78rem', color: 'var(--uc-blue, #002B7F)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} /> Official Campus Safe Spots
                      </span>
                      <button onClick={() => setIsSpotPickerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                    {OFFICIAL_CAMPUS_SPOTS.map((spot) => (
                      <button
                        key={spot}
                        onClick={() => handleSelectMeetupSpot(spot)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 0.6rem',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'background-color 0.1s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <MapPin size={12} color="var(--uc-blue)" style={{ flexShrink: 0 }} />
                        <span>{spot}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. Messages Thread */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {activeMessages.map((msg) => {
                    const isMe = !!currentUser && msg.senderId === currentUser.id;

                    // ----------------------------------------------------
                    // 3A. INTERACTIVE SWAP PROPOSAL CARD
                    // ----------------------------------------------------
                    if (msg.swapOfferId || msg.swapOffer) {
                      const swap = msg.swapOffer || swaps.find((s) => s.id === msg.swapOfferId);
                      return (
                        <div
                          key={msg.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1.5px solid #FDE68A',
                            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FEF3C7', paddingBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#B45309' }}>
                              <ArrowLeftRight size={15} />
                              <span>Campus Barter Proposal</span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor:
                                  swap?.status === 'accepted' ? '#DCFCE7' : swap?.status === 'rejected' || swap?.status === 'declined' ? '#FEE2E2' : '#FEF3C7',
                                color:
                                  swap?.status === 'accepted' ? '#166534' : swap?.status === 'rejected' || swap?.status === 'declined' ? '#991B1B' : '#92400E'
                              }}
                            >
                              {(swap?.status || 'PENDING').toUpperCase()}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                            {msg.content}
                          </p>

                          {swap?.offeredItemTitle && (
                            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {swap.offeredItemImage && (
                                <img
                                  src={swap.offeredItemImage}
                                  alt=""
                                  style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                  Offered: {swap.offeredItemTitle}
                                </div>
                                {swap.cashAdjustment !== undefined && swap.cashAdjustment !== 0 && (
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: swap.cashAdjustment > 0 ? '#059669' : '#D97706' }}>
                                    Cash Top-up: {swap.cashAdjustment > 0 ? `+₱${swap.cashAdjustment}` : `-₱${Math.abs(swap.cashAdjustment)}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Receiver Action Buttons */}
                          {!isMe && swap && swap.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <button
                                onClick={() => respondToSwap(swap.id, 'accepted')}
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <CheckCircle2 size={13} /> Accept Swap
                              </button>
                              <button
                                onClick={() => respondToSwap(swap.id, 'declined')}
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <XCircle size={13} /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ----------------------------------------------------
                    // 3B. INTERACTIVE TRANSACTION DEAL CARD
                    // ----------------------------------------------------
                    if (msg.transactionId || msg.transaction) {
                      const tx = msg.transaction || transactions.find((t) => t.id === msg.transactionId);
                      const isTxCompleted = tx?.status === 'completed';
                      const isTxCancelled = tx?.status === 'cancelled';

                      return (
                        <div
                          key={msg.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1.5px solid #93C5FD',
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #DBEAFE', paddingBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#1E40AF' }}>
                              <FileText size={15} />
                              <span>Campus Order Deal</span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: isTxCompleted ? '#DCFCE7' : isTxCancelled ? '#FEE2E2' : '#EFF6FF',
                                color: isTxCompleted ? '#166534' : isTxCancelled ? '#991B1B' : '#1E40AF'
                              }}
                            >
                              {(tx?.status || 'PENDING MEETUP').toUpperCase()}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: '#1E3A8A', margin: 0, lineHeight: 1.45 }}>
                            {msg.content}
                          </p>

                          {tx && (
                            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '0.55rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Ref: </span>
                                <strong>{tx.referenceNo}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Amount: </span>
                                <strong style={{ color: 'var(--uc-blue)' }}>₱{parseFloat(tx.amount || 0).toLocaleString()}</strong>
                              </div>
                            </div>
                          )}

                          {/* Deal Actions */}
                          {tx && tx.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => setCompleteTxModal({ id: tx.id })}
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <CheckCircle2 size={13} /> Confirm Handover & Complete
                              </button>
                              <button
                                onClick={() => setCancelTxModal({ id: tx.id })}
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.74rem', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <XCircle size={13} /> Cancel Order
                              </button>
                            </div>
                          )}

                          {/* Rate & Review Button once completed */}
                          {isTxCompleted && (
                            <button
                              onClick={() => handleOpenReviewModal(tx.id, activeConversation.otherParticipant.id)}
                              className="btn-gold"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.25rem' }}
                            >
                              <Star size={13} /> Rate & Review Student
                            </button>
                          )}
                        </div>
                      );
                    }

                    // ----------------------------------------------------
                    // 3C. INTERACTIVE FLASH REQUEST / WANTED CARD
                    // ----------------------------------------------------
                    if ((msg as any).flashRequestId || (msg as any).flashRequest || msg.wantedRequestId || msg.wantedRequest) {
                      const flashReq = (msg as any).flashRequest || msg.wantedRequest;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1.5px solid var(--border-subtle, #E2E8F0)',
                            borderLeft: '4px solid var(--uc-gold, #FFC72C)',
                            boxShadow: '0 4px 14px rgba(0, 43, 127, 0.08)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                              <Zap size={15} color="var(--uc-gold, #FFC72C)" />
                              <span>Flash Market Offer</span>
                            </div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: '#FEF9C3', color: '#854D0E' }}>
                              OFFER
                            </span>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                            {msg.content}
                          </p>

                          {flashReq && (
                            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.76rem' }}>
                              <div><strong>Requested:</strong> {flashReq.itemTitle || flashReq.itemName}</div>
                              <div style={{ marginTop: '2px', color: 'var(--uc-blue)', fontWeight: 700 }}>
                                Target Budget: ₱{flashReq.targetBudget?.toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ----------------------------------------------------
                    // 3D. SYSTEM MILESTONE PILL
                    // ----------------------------------------------------
                    if (msg.isSystemMessage) {
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: 'center',
                            backgroundColor: 'var(--bg-subtle, #F1F5F9)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            borderRadius: '20px',
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            maxWidth: '90%'
                          }}
                        >
                          {msg.content}
                        </div>
                      );
                    }

                    // ----------------------------------------------------
                    // 3E. STANDARD PEER MESSAGE BUBBLE (TEXT & CLOUDINARY MEDIA)
                    // ----------------------------------------------------
                    const isVideo = msg.mediaType === 'video' || (msg.mediaUrl && msg.mediaUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i));

                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: isMe ? 'var(--uc-blue, #002B7F)' : 'var(--bg-subtle, #F1F5F9)',
                            color: isMe ? '#FFFFFF' : 'var(--text-primary)',
                            padding: '0.6rem 0.9rem',
                            borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            fontSize: '0.84rem',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            boxShadow: isMe ? '0 3px 10px rgba(0, 43, 127, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                          }}
                        >
                          {/* Media preview */}
                          {msg.mediaUrl && (
                            <div style={{ marginBottom: msg.content ? '0.45rem' : 0 }}>
                              {isVideo ? (
                                <video
                                  src={msg.mediaUrl}
                                  controls
                                  playsInline
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '260px',
                                    borderRadius: '10px',
                                    display: 'block',
                                    backgroundColor: '#000'
                                  }}
                                />
                              ) : (
                                <img
                                  src={msg.mediaUrl}
                                  alt="Attachment"
                                  onClick={() => setPreviewMediaUrl(msg.mediaUrl || null)}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '240px',
                                    borderRadius: '10px',
                                    display: 'block',
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                  }}
                                />
                              )}
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.content && <div>{msg.content}</div>}
                        </div>

                        {/* Timestamp & Read Receipts */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                          <span>{msg.timestamp}</span>
                          {isMe && (
                            <span style={{ color: msg.isRead ? '#38BDF8' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                              {msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.74rem', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                      <span className="animate-pulse">●</span>
                      <span>{typingUsers.join(', ')} is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* 4. Smart Student Quick Reply Chips */}
                <div
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {QUICK_REPLY_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickChipClick(chip)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: '20px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 43, 127, 0.08)';
                        e.currentTarget.style.borderColor = 'var(--uc-blue)';
                        e.currentTarget.style.color = 'var(--uc-blue)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* 5. Message Input Form with Cloudinary & Campus Spot Tools */}
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

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="btn-secondary"
                    style={{
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      cursor: isUploading ? 'not-allowed' : 'pointer'
                    }}
                    title="Send item photo or verification video"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  </button>

                  {/* Meetup Spot Picker Button */}
                  <button
                    type="button"
                    onClick={() => setIsSpotPickerOpen(!isSpotPickerOpen)}
                    className="btn-secondary"
                    style={{
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    title="Suggest campus safe meetup location"
                  >
                    <MapPin size={16} color="var(--uc-blue)" />
                  </button>

                  {/* Input Box */}
                  <input
                    type="text"
                    placeholder={isUploading ? 'Uploading to Cloudinary...' : 'Type message (where & when to meet on campus)...'}
                    value={inputMessage}
                    onChange={handleInputChange}
                    className="clean-input"
                    disabled={isUploading}
                    style={{ flex: 1, padding: '0.55rem 0.85rem', fontSize: '0.84rem' }}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isUploading || !inputMessage.trim()}
                    style={{ padding: '0.55rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.75rem', padding: '2rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 43, 127, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={28} color="var(--uc-blue, #002B7F)" />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Your University Trade Inbox
                </div>
                <p style={{ fontSize: '0.82rem', textAlign: 'center', maxWidth: '320px', lineHeight: 1.5, margin: 0 }}>
                  Select a student conversation from the left to coordinate purchases, swap offers, and campus meetups.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* IN-CHAT DIRECT BUY NOW / DEAL CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {isBuyModalOpen && currentListing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsBuyModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', margin: 0 }}>
                Confirm Direct Student Order
              </h3>
              <button onClick={() => setIsBuyModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <img
                src={(currentListing.media && currentListing.media[0]?.url) || (currentListing.images && currentListing.images[0]) || ''}
                alt=""
                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentListing.title}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--uc-blue)', marginTop: '2px' }}>
                  ₱{currentListing.price.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Payment Method Select */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Settlement Method on Meetup:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'gcash', label: 'GCash' },
                  { id: 'maya', label: 'Maya' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBuyPaymentMethod(m.id as any)}
                    style={{
                      padding: '0.45rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: '1.5px solid',
                      backgroundColor: buyPaymentMethod === m.id ? 'rgba(0, 43, 127, 0.08)' : 'var(--bg-subtle)',
                      borderColor: buyPaymentMethod === m.id ? 'var(--uc-blue, #002B7F)' : 'var(--border-subtle)',
                      color: buyPaymentMethod === m.id ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary)'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Note to Seller (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Free after 3 PM near Main Quadrangle"
                value={buyNotes}
                onChange={(e) => setBuyNotes(e.target.value)}
                className="clean-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectBuy}
                disabled={isSubmittingBuy}
                className="btn-gold"
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800 }}
              >
                {isSubmittingBuy ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                <span>Lock in Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* IN-CHAT RATE & REVIEW MODAL */}
      {/* ======================================================== */}
      {reviewTxId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setReviewTxId(null)}
        >
          <form
            onSubmit={handleSubmitReviewForm}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D97706', fontWeight: 900 }}>
                <Star size={18} fill="#D97706" />
                <span style={{ fontSize: '1.05rem', color: 'var(--uc-blue, #002B7F)' }}>Rate Student Peer</span>
              </div>
              <button type="button" onClick={() => setReviewTxId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Your feedback directly impacts trust scores and verification badges across the University of Cebu marketplace network.
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <Star
                    size={28}
                    color={star <= reviewRating ? '#F59E0B' : '#CBD5E1'}
                    fill={star <= reviewRating ? '#F59E0B' : 'none'}
                  />
                </button>
              ))}
            </div>

            {/* Trait Badges */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Highlight Trading Experience:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {['Punctual', 'Item as Described', 'Polite UCian', 'Fast Response', 'Hassle-Free'].map((badge) => {
                  const isSelected = reviewBadges.includes(badge);
                  return (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => {
                        setReviewBadges((prev) =>
                          isSelected ? prev.filter((b) => b !== badge) : [...prev, badge]
                        );
                      }}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        backgroundColor: isSelected ? '#ECFDF5' : 'var(--bg-subtle)',
                        color: isSelected ? '#047857' : 'var(--text-secondary)',
                        borderColor: isSelected ? '#047857' : 'var(--border-subtle)'
                      }}
                    >
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Comment / Review:
              </label>
              <textarea
                rows={3}
                placeholder="Share your experience dealing with this student..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="clean-input"
                style={{ width: '100%', fontSize: '0.82rem', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setReviewTxId(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="btn-primary"
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800 }}
              >
                {isSubmittingReview ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                <span>Submit Student Review</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL-SCREEN MEDIA LIGHTBOX PREVIEW */}
      {/* ======================================================== */}
      {previewMediaUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setPreviewMediaUrl(null)}
        >
          <img
            src={previewMediaUrl}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}

      {/* Complete Order Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(completeTxModal)}
        title="Confirm Order Handover"
        message="Are you sure you want to mark this transaction as completed? Both parties have fulfilled the deal."
        confirmText="Confirm Handover"
        cancelText="Cancel"
        variant="primary"
        onConfirm={() => {
          if (completeTxModal) {
            completeTransaction(completeTxModal.id);
            setCompleteTxModal(null);
          }
        }}
        onCancel={() => setCompleteTxModal(null)}
      />

      {/* Cancel Order Prompt Modal */}
      <PromptModal
        isOpen={Boolean(cancelTxModal)}
        title="Cancel Order"
        message="Please provide a reason for cancelling this order:"
        placeholder="Reason for cancellation"
        defaultValue="Agreed by mutual consent"
        confirmText="Confirm Cancellation"
        cancelText="Keep Order"
        onSubmit={(reason) => {
          if (cancelTxModal) {
            cancelTransaction(cancelTxModal.id, reason.trim() || undefined);
            setCancelTxModal(null);
          }
        }}
        onCancel={() => setCancelTxModal(null)}
      />
    </div>
  );
};
