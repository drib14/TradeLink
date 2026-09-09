import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useMarket } from '../../context/MarketContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
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
  Image as ImageIcon,
  Loader2,
  FileText
} from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToItem?: (listingId: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, onNavigateToItem }) => {
  const { currentUser } = useAuth();
  const { listings } = useMarket();
  const {
    conversations,
    activeConversation,
    activeMessages,
    setActiveConversationId,
    sendMessage,
    sendMediaMessage,
    swaps,
    respondToSwap
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
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

  if (!isOpen) return null;

  const currentListing = activeConversation
    ? listings.find((l) => l.id === activeConversation.listingId)
    : null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage('');
    await sendMessage(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (up to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds maximum size limit of 50MB.');
      return;
    }

    try {
      setIsUploading(true);
      await sendMediaMessage(file, inputMessage.trim() || undefined);
      setInputMessage('');
    } catch (err: any) {
      alert(err?.message || 'Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '740px',
          height: '100%',
          display: 'flex',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
          borderLeft: '1px solid var(--border-subtle)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Col: Conversation List */}
        {(!isMobile || !activeConversation) && (
          <div
            style={{
              width: isMobile ? '100%' : '270px',
              borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-subtle)'
            }}
          >
            <div
              style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="var(--uc-blue)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Campus Chat</span>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No messages yet. Inquire about any campus item to chat directly with student sellers.
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = activeConversation?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'center',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <UserAvatar
                        src={c.otherParticipant.avatar}
                        name={c.otherParticipant.name}
                        size="md"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.otherParticipant.name}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {c.lastMessageTimestamp}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {c.lastMessage || 'Sent an attachment'}
                        </div>
                      </div>
                      {c.unreadCount > 0 && (
                        <span
                          style={{
                            backgroundColor: 'var(--uc-blue)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '9999px'
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

        {/* Right Col: Active Chat Messages */}
        {(!isMobile || activeConversation) && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
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
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {isMobile && (
                      <button
                        onClick={() => setActiveConversationId('')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                        title="Back to conversations"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <UserAvatar
                      src={activeConversation.otherParticipant.avatar}
                      name={activeConversation.otherParticipant.name}
                      size="sm"
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {activeConversation.otherParticipant.name}
                        </span>
                        {activeConversation.otherParticipant.isVerified && (
                          <VerifiedBadge size="xs" variant="green" />
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {activeConversation.otherParticipant.campus}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={onClose}
                      style={{ background: 'none', border: 'none', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Item Ribbon Header */}
                {currentListing && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <img
                        src={(currentListing.media && currentListing.media[0]?.url) || (currentListing.images && currentListing.images[0]) || ''}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {currentListing.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--uc-blue)', fontWeight: 800 }}>
                          ₱{currentListing.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {onNavigateToItem && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToItem(currentListing.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.72rem',
                          color: 'var(--uc-blue)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <span>Listing Details</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Direct Coordination Banner */}
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    borderBottom: '1px solid #BBF7D0',
                    padding: '0.4rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.73rem',
                    color: '#15803D'
                  }}
                >
                  <span>💬 Direct Student Chat: Coordinate where and when to meet on campus right here!</span>
                </div>

                {/* Messages Thread */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeMessages.map((msg) => {
                    const isMe = !!currentUser && msg.senderId === currentUser.id;

                    // Embedded Swap Proposal
                    if (msg.swapOfferId) {
                      const swapOffer = swaps.find((s) => s.id === msg.swapOfferId);
                      return (
                        <div
                          key={msg.id}
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-subtle)',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <ArrowLeftRight size={14} color="var(--uc-blue)" /> Item Barter Proposal
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{msg.content}</p>

                          {swapOffer && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Status: <strong style={{ color: 'var(--uc-blue)' }}>{swapOffer.status.toUpperCase()}</strong>
                            </div>
                          )}

                          {!isMe && swapOffer && swapOffer.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                              <button
                                onClick={() => respondToSwap(swapOffer.id, 'accepted')}
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
                              >
                                <CheckCircle2 size={12} /> Accept
                              </button>
                              <button
                                onClick={() => respondToSwap(swapOffer.id, 'declined')}
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', color: 'var(--accent-red)' }}
                              >
                                <XCircle size={12} /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Direct Order Notification Card
                    if (msg.transactionId) {
                      return (
                        <div
                          key={msg.id}
                          style={{
                            backgroundColor: '#EFF6FF',
                            borderRadius: '10px',
                            border: '1px solid #BFDBFE',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 800, color: '#1E40AF' }}>
                            <FileText size={14} /> Confirmed Order Deal
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#1E3A8A', margin: 0 }}>{msg.content}</p>
                          <span style={{ fontSize: '0.65rem', color: '#60A5FA', marginTop: '2px' }}>
                            {msg.timestamp}
                          </span>
                        </div>
                      );
                    }

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
                            backgroundColor: isMe ? 'var(--uc-blue)' : 'var(--bg-subtle)',
                            color: isMe ? '#FFFFFF' : 'var(--text-primary)',
                            padding: '0.55rem 0.85rem',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            fontSize: '0.82rem',
                            lineHeight: 1.45,
                            wordBreak: 'break-word'
                          }}
                        >
                          {/* Media Attachment Render */}
                          {msg.mediaUrl && (
                            <div style={{ marginBottom: msg.content ? '0.4rem' : 0 }}>
                              {isVideo ? (
                                <video
                                  src={msg.mediaUrl}
                                  controls
                                  playsInline
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '260px',
                                    borderRadius: '8px',
                                    display: 'block',
                                    backgroundColor: '#000'
                                  }}
                                />
                              ) : (
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Attachment"
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '240px',
                                      borderRadius: '8px',
                                      display: 'block',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Message Text Content */}
                          {msg.content && <div>{msg.content}</div>}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 2px' }}>
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box with Media Attachment */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: '0.65rem 0.85rem',
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
                    title="Upload product photo or sample video (Cloudinary)"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  </button>

                  <input
                    type="text"
                    placeholder={isUploading ? 'Uploading media...' : 'Type message (where & when to meet)...'}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="clean-input"
                    disabled={isUploading}
                    style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                  />

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isUploading || !inputMessage.trim()}
                    style={{ padding: '0.45rem 0.75rem' }}
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Select a student conversation to begin messaging
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
