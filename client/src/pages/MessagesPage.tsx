import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useMarket } from '../context/MarketContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useToast } from '../components/common/Toast';
import { formatRelativeTime } from '../utils/date';
import {
  Send,
  ArrowLeftRight,
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
  MessageSquare
} from 'lucide-react';
import { PromptModal } from '../components/common/PromptModal';

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
  'What time are you free today?',
  'Is the price negotiable?',
  'I am at the campus meetup spot!',
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
    respondToSwap,
    completeTransaction,
    cancelTransaction
  } = useChat();

  const { listings } = useMarket();
  const { showToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customMeetupInput, setCustomMeetupInput] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Modals state
  const [acceptSwapModal, setAcceptSwapModal] = useState<{ id: string; title: string } | null>(null);
  const [declineSwapModal, setDeclineSwapModal] = useState<{ id: string; title: string } | null>(null);
  const [completeTxModal, setCompleteTxModal] = useState<{ id: string; refNo: string } | null>(null);
  const [cancelTxModal, setCancelTxModal] = useState<{ id: string; refNo: string } | null>(null);

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

  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return conversations;
    const q = searchFilter.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherParticipant.name.toLowerCase().includes(q) ||
        (c.listingTitle && c.listingTitle.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [conversations, searchFilter]);

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
    const text = inputMessage.trim();
    if (!text || !activeConversation) return;

    setInputMessage('');
    sendTypingStatus(false);

    try {
      await sendMessage(text);
    } catch (err: any) {
      showToast('Message Error', err?.message || 'Failed to send message.', 'error');
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

  const activeListing = useMemo(() => {
    if (!activeConversation?.listingId) return null;
    return listings.find((l) => l.id === activeConversation.listingId) || null;
  }, [activeConversation, listings]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Lock size={48} color="var(--uc-blue)" style={{ margin: '0 auto 1rem auto' }} />
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
    <div className="container" style={{ padding: '1.25rem 1rem 3rem 1rem', maxWidth: '1360px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Campus Messages
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'var(--uc-blue)', color: '#FFFFFF' }}>
              {conversations.length}
            </span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>End-to-End Server Encrypted (AES-256-GCM) • Official UC Campus Checkpoints</span>
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
          height: 'calc(100vh - 180px)',
          minHeight: '560px',
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
              width: isMobileView ? '100%' : '360px',
              minWidth: isMobileView ? '100%' : '320px',
              borderRight: isMobileView ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            {/* Search Input */}
            <div style={{ padding: '0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
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
                  placeholder="Search chats or listings..."
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
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No conversations found</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Open any item in the marketplace and click "Chat with Seller" to start trading.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = activeConversation?.id === conv.id;
                  const otherUser = conv.otherParticipant;
                  const unread = conv.unreadCount || 0;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConv(conv.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
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
                      <div style={{ position: 'relative', flexShrink: 0 }}>
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

                        {conv.listingTitle && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--uc-blue)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '1px'
                            }}
                          >
                            {conv.listingTitle}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
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
                        {activeConversation.otherParticipant.college || 'UC Student'} • {activeConversation.otherParticipant.campus || 'UC Main'}
                      </div>
                    </div>
                  </div>

                  {/* Security Badge */}
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

                    {activeConversation.listingId && (
                      <button
                        onClick={() => onNavigate('item-detail', { id: activeConversation.listingId })}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <ExternalLink size={12} />
                        <span>View Item</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Context Listing Card if available */}
                {activeListing && (
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      {activeListing.images?.[0] ? (
                        <img
                          src={activeListing.images[0]}
                          alt={activeListing.title}
                          style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={18} color="var(--text-muted)" />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {activeListing.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--uc-blue)', fontWeight: 800 }}>
                          {activeListing.tradeMode === 'free_donation' ? 'FREE' : `₱${activeListing.price.toLocaleString()}`}
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.4rem' }}>
                            • {activeListing.condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('item-detail', { id: activeListing.id })}
                      className="btn-ghost"
                      style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--uc-blue)' }}
                    >
                      Details →
                    </button>
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
                  <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle, #F1F5F9)', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--border-subtle)' }}>
                      🔒 Messages in this conversation are encrypted and accessible only by you and {activeConversation.otherParticipant.name}.
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

                        {/* Text Bubble */}
                        {msg.content && (
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
                            {msg.content}
                          </div>
                        )}

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
                        placeholder="Or type custom meetup location"
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
                    placeholder="Type an encrypted message..."
                    value={inputMessage}
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
                    disabled={!inputMessage.trim()}
                    className="btn-primary"
                    style={{
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexShrink: 0,
                      opacity: inputMessage.trim() ? 1 : 0.6
                    }}
                  >
                    <Send size={15} />
                    <span className="hidden-xs">Send</span>
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
                  Choose a student chat on the left to review barter proposals, agree on campus meetup spots, or negotiate item details.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
