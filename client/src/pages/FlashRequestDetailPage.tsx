import React, { useState, useEffect, useMemo } from 'react';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { UserAvatar } from '../components/common/UserAvatar';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { CampusBadge } from '../components/common/CampusBadge';
import { PaymentMethodBadge } from '../components/common/PaymentLogos';
import { decodeHashedId, encodeHashedId } from '../utils/security';
import { formatRelativeTime } from '../utils/date';
import {
  Zap,
  Clock,
  MapPin,
  Tag,
  ArrowLeft,
  Share2,
  MessageSquare,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Maximize2,
  X
} from 'lucide-react';
import { FlashRequest } from '../types';

interface FlashRequestDetailPageProps {
  requestId?: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenChat?: () => void;
  onOpenAuth?: () => void;
}

const getTimeRemaining = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
};

export const FlashRequestDetailPage: React.FC<FlashRequestDetailPageProps> = ({
  requestId,
  onNavigate,
  onOpenChat,
  onOpenAuth
}) => {
  const { requests, respondToRequest } = useFlashMarket();
  const { currentUser, isAuthenticated } = useAuth();
  const { openChatForFlash, openChatWithUser } = useChat();
  const { showToast } = useToast();

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Resolve raw request ID if passed as hashed slug
  const resolvedId = useMemo(() => {
    if (!requestId) return '';
    return decodeHashedId(requestId);
  }, [requestId]);

  const currentRequest = useMemo<FlashRequest | undefined>(() => {
    if (!resolvedId) return undefined;
    return requests.find((r) => r.id === resolvedId || r.id === requestId);
  }, [requests, resolvedId, requestId]);

  const isOwner = Boolean(
    currentUser && currentRequest && currentRequest.requesterId === currentUser.id
  );

  const timeLeft = getTimeRemaining(currentRequest?.expiresAt);
  const isExpired = Boolean(
    currentRequest?.isExpired ||
      currentRequest?.status === 'expired' ||
      (currentRequest?.expiresAt && new Date(currentRequest.expiresAt).getTime() <= Date.now())
  );

  const urgencyLower = (currentRequest?.urgency || '').toLowerCase();
  const isUrgent = urgencyLower.includes('immediate') || urgencyLower.includes('urgent');
  const isThisWeek = urgencyLower.includes('week');

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/flash/${encodeHashedId(currentRequest?.id || '', 'flash')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link Copied!', 'Flash request link copied to clipboard.', 'info');
    } else {
      showToast('Share Link', shareUrl, 'info');
    }
  };

  const handleConnectChat = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!currentRequest) return;

    if (isOwner) {
      onNavigate('profile');
      return;
    }

    try {
      if (openChatForFlash) {
        await openChatForFlash(
          {
            id: currentRequest.id,
            requesterId: currentRequest.requesterId,
            itemTitle: currentRequest.itemTitle,
            itemName: currentRequest.itemTitle,
            targetBudget: currentRequest.targetBudget
          },
          `Hi ${currentRequest.requesterName}! I saw your urgent Flash Request for "${currentRequest.itemTitle}". I have this item and can help you out on campus!`
        );
      } else if (openChatWithUser) {
        await openChatWithUser(
          { id: currentRequest.requesterId, name: currentRequest.requesterName },
          `Hi ${currentRequest.requesterName}! I saw your urgent Flash Request for "${currentRequest.itemTitle}". I have this item and can help you out on campus!`
        );
      }
      showToast(
        'Campus Chat Connected',
        `Opened secure peer chat with ${currentRequest.requesterName}.`,
        'success'
      );
      if (onOpenChat) onOpenChat();
    } catch {
      showToast('Chat Ready', `You can message ${currentRequest.requesterName} directly in Messages.`, 'info');
      if (onOpenChat) onOpenChat();
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRequest) return;
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsSubmittingOffer(true);
    try {
      await respondToRequest(currentRequest.id, offerMessage.trim() || undefined);
      if (openChatForFlash) {
        await openChatForFlash(
          {
            id: currentRequest.id,
            requesterId: currentRequest.requesterId,
            itemTitle: currentRequest.itemTitle,
            itemName: currentRequest.itemTitle,
            targetBudget: currentRequest.targetBudget
          },
          offerMessage.trim() ||
            `Hi! I have your requested item: "${currentRequest.itemTitle}". Let's arrange meetup on campus!`
        );
      } else if (openChatWithUser) {
        await openChatWithUser(
          { id: currentRequest.requesterId, name: currentRequest.requesterName },
          offerMessage.trim() ||
            `Hi! I have your requested item: "${currentRequest.itemTitle}". Let's arrange meetup on campus!`
        );
      }
      showToast(
        'Offer Submitted!',
        `Your offer was sent to ${currentRequest.requesterName}. Check Messages to coordinate.`,
        'success'
      );
      setIsOfferModalOpen(false);
      setOfferMessage('');
      if (onOpenChat) onOpenChat();
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not submit offer.', 'error');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  if (!currentRequest) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div
          className="clean-card"
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
            Flash Request Not Found
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This urgent request may have been fulfilled by another student, expired, or removed by the author.
          </p>
          <button
            onClick={() => onNavigate('flash-market')}
            className="btn-gold"
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.5rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Flash Marketplace</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container page-enter"
      style={{ padding: 'clamp(1rem, 2.5vw, 1.75rem) 0 5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Top Breadcrumb & Quick Actions */}
      <div className="product-breadcrumb-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <button
            onClick={() => onNavigate('flash-market')}
            className="btn-ghost"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--uc-blue)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft size={15} />
            <span>Flash Market</span>
          </button>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentRequest.itemTitle}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleShare}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Share Flash Request"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Hero Urgency Banner */}
      <div
        style={{
          backgroundColor: isExpired
            ? '#334155'
            : isUrgent
            ? '#991B1B'
            : '#002B7F',
          borderRadius: '20px',
          padding: '1.75rem clamp(1.25rem, 3vw, 2.25rem)',
          color: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 43, 127, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span
              style={{
                backgroundColor: '#FFC72C',
                color: '#002B7F',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '0.22rem 0.65rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                letterSpacing: '0.04em'
              }}
            >
              <Zap size={13} /> FLASH MARKETPLACE REQUEST
            </span>

            {isExpired ? (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#CBD5E1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.22rem 0.65rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Clock size={12} /> Request Expired
              </span>
            ) : isUrgent ? (
              <span
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.22rem 0.65rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Clock size={12} /> Immediate Urgency (24h)
              </span>
            ) : isThisWeek ? (
              <span
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.22rem 0.65rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Clock size={12} /> Needed This Week
              </span>
            ) : (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.22rem 0.65rem',
                  borderRadius: '6px'
                }}
              >
                Flexible Timeline
              </span>
            )}

            {timeLeft && !isExpired && (
              <span
                style={{
                  backgroundColor: 'rgba(255, 199, 44, 0.2)',
                  border: '1px solid rgba(255, 199, 44, 0.5)',
                  color: '#FFC72C',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.22rem 0.65rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Clock size={12} /> {timeLeft}
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.4rem, 2.5vw, 2.1rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.25,
              margin: '0 0 0.5rem 0',
              fontFamily: 'var(--font-display)'
            }}
          >
            {currentRequest.itemTitle}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FFC72C', fontWeight: 800 }}>
              <MapPin size={14} /> {currentRequest.preferredCampus || currentRequest.targetCampus}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={14} /> {currentRequest.category}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={14} /> {currentRequest.requesterCollege}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Actions/Requester */}
      <div className="flash-detail-grid">
        {/* Left Column: Media Preview, Need Details, Academic Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Media Container */}
          <div
            className="clean-card"
            style={{
              padding: '0.75rem',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                width: '100%',
                minHeight: '260px',
                maxHeight: '380px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {currentRequest.imageUrl ? (
                <>
                  <img
                    src={currentRequest.imageUrl}
                    alt={currentRequest.itemTitle}
                    style={{
                      width: '100%',
                      maxHeight: '380px',
                      objectFit: 'contain',
                      cursor: 'zoom-in'
                    }}
                    onClick={() => setIsImageZoomed(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsImageZoomed(true)}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Maximize2 size={13} /> Zoom
                  </button>
                </>
              ) : (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 43, 127, 0.08)',
                      color: 'var(--uc-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Zap size={32} color="#FFC72C" />
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                    Academic Need Broadcast
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                    Requester did not attach a sample reference photo. Review the detailed academic specifications below.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description & Urgent Needs Breakdown */}
          <div
            className="clean-card"
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--uc-blue)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={18} color="#FFC72C" />
              <span>Urgent Need Details & Specifications</span>
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' }}>
              {currentRequest.description}
            </p>

            {/* Academic Context Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Target Campus
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--uc-blue)', marginTop: '2px' }}>
                  {currentRequest.preferredCampus || currentRequest.targetCampus}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Category
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {currentRequest.category}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Requester College
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {currentRequest.requesterCollege}
                </div>
              </div>
            </div>
          </div>

          {/* Safe Campus Handover Protocol Card */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #BBF7D0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534', margin: '0 0 0.25rem 0' }}>
                University of Cebu Safe Handover Guidelines
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#15803D', lineHeight: 1.5, margin: 0 }}>
                Always coordinate handovers in public, designated campus locations such as the main security gate, library entrance, or university canteen during standard class hours. Never share external bank credentials or off-campus meetups without mutual agreement.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Modes, Accepted Payments, Requester Card, CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Budget & Pricing Mode Card */}
          <div
            className="clean-card"
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pricing & Settlement Mode
              </span>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #A7F3D0' }}>
                {currentRequest.offersCount} {currentRequest.offersCount === 1 ? 'Peer Offer' : 'Peer Offers'}
              </span>
            </div>

            {/* Pricing Mode Breakdown */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              {currentRequest.targetBudget <= 0 ? (
                currentRequest.description?.toLowerCase().includes('free') ? (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                      Mode 3: Senior Pass-Down / Gift
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                      FREE / Student Donation
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                      Requester is hoping for a passed-down reviewer, uniform, or supply from a senior.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>
                      Mode 2: Open to Offers / Barter
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D97706', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                      Negotiable / Open
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                      Requester has not set a fixed amount. Propose your asking price or swap item.
                    </p>
                  </div>
                )
              ) : (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--uc-blue)', textTransform: 'uppercase' }}>
                    Mode 1: Numeric Target Budget
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--uc-blue)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                    ₱{currentRequest.targetBudget.toLocaleString()}
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                    Target amount requester is prepared to pay upon delivery or meetup.
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Payment Mode
              </div>
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                <PaymentMethodBadge method="cash" size="sm" />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Cash on Meetup</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              {isExpired ? (
                <button
                  disabled
                  className="btn-secondary"
                  style={{ width: '100%', padding: '0.85rem', cursor: 'not-allowed', opacity: 0.65, fontWeight: 700 }}
                >
                  This Flash Request Has Closed
                </button>
              ) : isOwner ? (
                <button
                  onClick={() => onNavigate('profile')}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                >
                  <Building2 size={16} /> Manage in Your Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsOfferModalOpen(true)}
                    className="btn-gold"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px rgba(255, 199, 44, 0.35)'
                    }}
                  >
                    <MessageSquare size={17} />
                    <span>I Have This Item — Chat & Make Offer</span>
                  </button>

                  <button
                    onClick={handleConnectChat}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Open Direct Campus Chat</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Requester Identity Card */}
          <div
            className="clean-card"
            style={{
              padding: '1.35rem',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Posted By Verified Requester
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <UserAvatar
                src={currentRequest.requesterAvatar}
                name={currentRequest.requesterName}
                size={48}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {currentRequest.requesterName}
                  </span>
                  <VerifiedBadge size="sm" variant="green" />
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--uc-blue)', fontWeight: 700, marginTop: '2px' }}>
                  {currentRequest.preferredCampus || currentRequest.requesterCampus}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {currentRequest.requesterCollege}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Posted {formatRelativeTime(currentRequest.createdAt || Date.now())}
              </span>
              <button
                onClick={() => onNavigate('profile', { userId: currentRequest.requesterId })}
                className="btn-ghost"
                style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--uc-blue)', padding: '0.25rem 0.5rem' }}
              >
                View Profile &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Make Offer Modal */}
      {isOfferModalOpen && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setIsOfferModalOpen(false)}
        >
          <div
            className="modal-card-custom"
            style={{ maxWidth: '480px', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFC72C', color: '#002B7F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Make an Offer
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Fulfill {currentRequest.requesterName}&apos;s Flash Request
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="btn-ghost"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Requested Item</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--uc-blue)' }}>{currentRequest.itemTitle}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Target Budget: {currentRequest.targetBudget > 0 ? `₱${currentRequest.targetBudget.toLocaleString()}` : 'Open / Free'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Your Message & Asking Price
                </label>
                <textarea
                  rows={4}
                  required
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder={`Hi ${currentRequest.requesterName}! I have this item available. I can meet you at the campus gate / canteen...`}
                  className="clean-input"
                  style={{ width: '100%', fontSize: '0.84rem', padding: '0.65rem 0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="btn-neutral"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOffer}
                  className="btn-gold"
                  style={{ flex: 1.5, padding: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <MessageSquare size={16} />
                  <span>{isSubmittingOffer ? 'Sending...' : 'Send Offer & Chat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {isImageZoomed && currentRequest.imageUrl && (
        <div
          className="modal-backdrop-custom"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setIsImageZoomed(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={currentRequest.imageUrl}
              alt={currentRequest.itemTitle}
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
            />
            <button
              onClick={() => setIsImageZoomed(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
