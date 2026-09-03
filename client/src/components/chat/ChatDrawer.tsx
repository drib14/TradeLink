import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useMarket } from '../../context/MarketContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { MeetupSchedulerModal } from '../marketplace/MeetupSchedulerModal';
import {
  X,
  Send,
  MessageSquare,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft
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
    swaps,
    respondToSwap
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const currentListing = activeConversation
    ? listings.find((l) => l.id === activeConversation.listingId)
    : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage.trim());
    setInputMessage('');
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
          maxWidth: '720px',
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
              width: isMobile ? '100%' : '260px',
              borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-subtle)'
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} color="var(--uc-blue)" />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Messages
                </h4>
              </div>
              {isMobile && (
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', padding: '0.35rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  No active conversations yet.
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = activeConversation?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--uc-blue)' : '3px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <UserAvatar
                        src={conv.otherParticipant.avatar}
                        name={conv.otherParticipant.name}
                        size="sm"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {conv.otherParticipant.name.split(' ')[0]}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {conv.lastMessageTimestamp}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--uc-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.listingTitle}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Col: Active Conversation */}
        {(!isMobile || Boolean(activeConversation)) && (
          <div style={{ flex: 1, width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
            {activeConversation ? (
              <>
                {/* Header */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  {currentListing && (
                    <button
                      onClick={() => setIsMeetupModalOpen(true)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                    >
                      <ShieldCheck size={13} color="var(--accent-green)" /> Meetup Spot
                    </button>
                  )}
                  <button onClick={onClose} style={{ padding: '0.35rem', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Item Ribbon */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={currentListing.images[0]}
                      alt=""
                      style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currentListing.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                        (₱{currentListing.price.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  {onNavigateToItem && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToItem(currentListing.id);
                      }}
                      style={{ fontSize: '0.72rem', color: 'var(--uc-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <span>Details</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              )}

              {/* Messages Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeMessages.map((msg) => {
                  const isMe = !!currentUser && msg.senderId === currentUser.id;

                  // Embedded Swap Offer
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
                          <ArrowLeftRight size={14} /> Item Barter Proposal
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{msg.content}</p>

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
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          fontSize: '0.82rem',
                          lineHeight: 1.45
                        }}
                      >
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 2px' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box */}
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
                  type="text"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="clean-input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.45rem 0.75rem' }}
                  title="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            </div>
          )}
        </div>
      )}
    </div>

      {currentListing && (
        <MeetupSchedulerModal
          isOpen={isMeetupModalOpen}
          onClose={() => setIsMeetupModalOpen(false)}
          listing={currentListing}
          counterpartUserId={activeConversation?.otherParticipant.id || ''}
          counterpartUserName={activeConversation?.otherParticipant.name || ''}
        />
      )}
    </div>
  );
};
