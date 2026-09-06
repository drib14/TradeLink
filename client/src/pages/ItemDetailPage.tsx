import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { SwapProposalModal } from '../components/marketplace/SwapProposalModal';
import { BuyNowModal } from '../components/marketplace/BuyNowModal';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { listingsService } from '../services/listings.service';
import { Listing } from '../types';
import {
  ArrowLeftRight,
  Gift,
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Share2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Zap,
  MapPin,
  Maximize2,
  ShoppingBag,
  X
} from 'lucide-react';

import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const REPORT_CATEGORIES = [
  'Prohibited or Restricted Item',
  'Suspected Scam or Fake Listing',
  'Academic Dishonesty Material (Exam/Leaked)',
  'Wrong Campus or Inaccurate Details',
  'Other Safety Concern'
];

interface ItemDetailPageProps {
  listingId: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
  onOpenAuth?: () => void;
  onOpenVerification?: () => void;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  listingId,
  onNavigate,
  onOpenChat,
  onOpenAuth,
  onOpenVerification
}) => {
  const { listings, favorites, toggleFavorite } = useMarket();
  const { currentUser, isAuthenticated } = useAuth();
  const { openChatWithSeller } = useChat();
  const { showToast } = useToast();

  const listing = listings.find((l: Listing) => l.id === listingId) || listings[0];
  const isFavorite = favorites.includes(listing?.id || '');

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORIES[0]);
  const [reportReason, setReportReason] = useState('');

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen || !listing?.images) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight' && listing.images.length > 1) {
        setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
      } else if (e.key === 'ArrowLeft' && listing.images.length > 1) {
        setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, listing?.images]);

  if (!listing) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="empty-state">
          <h3 className="empty-state-title">Item not found</h3>
          <p className="empty-state-desc">This listing may have been sold or removed by campus moderation.</p>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const isOwner = !!currentUser && currentUser.id === listing.sellerId;
  const isSoldOut = Boolean(listing.isSold || (listing.quantity !== undefined && listing.quantity <= 0));
  const similarItems = listings
    .filter((l: Listing) => l.id !== listing.id && (l.category === listing.category || l.sellerCampus === listing.sellerCampus))
    .slice(0, 4);

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in to save items to your favorites.', 'info');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    toggleFavorite(listing.id);
    showToast(
      isFavorite ? 'Removed' : 'Saved',
      isFavorite ? `"${listing.title}" removed from saved items.` : `"${listing.title}" added to saved items.`,
      'info'
    );
  };

  const handleBuyClick = () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Log In Required', 'Please log in with your UC account to purchase or schedule a meetup.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!currentUser.isVerified) {
      showToast('Verification Required', 'Student ID verification is required before placing orders.', 'warning');
      if (onOpenVerification) onOpenVerification();
      else setIsVerificationModalOpen(true);
      return;
    }
    setIsBuyModalOpen(true);
  };

  const handleSwapClick = () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Log In Required', 'Please log in with your UC account to propose a swap.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!currentUser.isVerified) {
      showToast('Verification Required', 'Student ID verification is required before proposing item swaps.', 'warning');
      if (onOpenVerification) onOpenVerification();
      else setIsVerificationModalOpen(true);
      return;
    }
    setIsSwapModalOpen(true);
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC account to chat with the seller.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    openChatWithSeller(listing);
    onOpenChat();
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = `[${reportCategory}] ${reportReason.trim()}`.trim();
    if (fullReason.length < 10) {
      showToast('Reason Too Short', 'Please provide at least 10 characters explaining your concern.', 'warning');
      return;
    }

    try {
      await listingsService.flagListing(listing.id, fullReason);
      showToast('Report Submitted', 'Our campus moderation desk will review this listing shortly.', 'info');
      setIsReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      showToast('Report Failed', err?.message || 'Unable to submit report. Please try again.', 'error');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${listing.title} - TradeLink UC`,
      text: `Check out ${listing.title} on TradeLink University of Cebu:`,
      url: window.location.href
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared', 'Listing link shared successfully.', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied', 'Listing link copied to clipboard.', 'success');
    }
  };

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Back Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          onClick={() => onNavigate('marketplace')}
          className="btn-ghost"
          style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
        >
          <ChevronLeft size={16} /> Back to Catalog
        </button>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer', color: 'var(--uc-blue)' }} onClick={() => onNavigate('home')}>Home</span> /{' '}
          <span style={{ cursor: 'pointer', color: 'var(--uc-blue)' }} onClick={() => onNavigate('marketplace')}>{listing.category}</span> /{' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            {listing.title.length > 35 ? `${listing.title.slice(0, 35)}...` : listing.title}
          </span>
        </div>
      </div>

      {/* Main Grid: Gallery Left + Details Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(1.25rem, 3vw, 2.5rem)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Image & Price Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Photo with Lightbox Trigger */}
          <div
            onClick={() => setIsLightboxOpen(true)}
            style={{
              backgroundColor: 'var(--bg-subtle, #F1F5F9)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, #CBD5E1)',
              overflow: 'hidden',
              height: 'clamp(240px, 35vw, 420px)',
              position: 'relative',
              cursor: 'zoom-in'
            }}
            title="Click to zoom image"
          >
            <img
              src={listing.images[activeImageIdx] || listing.images[0]}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Sold Out Dark Overlay */}
            {isSoldOut && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 4
                }}
              >
                <span
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    padding: '0.45rem 1.25rem',
                    borderRadius: '24px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    border: '2px solid rgba(255, 255, 255, 0.5)'
                  }}
                >
                  Sold Out
                </span>
              </div>
            )}

            {/* Mode Tag */}
            {listing.tradeMode === 'swap' ? (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: '#002B7F',
                  color: '#FFC72C',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  letterSpacing: '0.04em'
                }}
              >
                <ArrowLeftRight size={12} /> FOR SWAP / BARTER
              </div>
            ) : listing.tradeMode === 'free_donation' ? (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Gift size={12} /> FREE DONATION
              </div>
            ) : null}

            {/* Maximize Icon Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#FFFFFF',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Maximize2 size={14} />
            </div>
          </div>

          {/* Thumbnail Strip */}
          {listing.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {listing.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: activeImageIdx === idx ? '2.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing Details & Seller Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Category & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 800, color: 'var(--uc-blue)' }}>{listing.sellerCampus}</span>
              <span>•</span>
              <span>{listing.category}</span>
              {listing.createdAt && (
                <>
                  <span>•</span>
                  <span>Posted {formatRelativeTime(listing.createdAt)}</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={handleFavoriteClick}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: isFavorite ? 'var(--uc-gold-light, #FEF3C7)' : 'var(--bg-subtle, #F1F5F9)',
                  color: isFavorite ? '#B45309' : 'var(--text-secondary, #64748B)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                title={isFavorite ? 'Remove from saved' : 'Save item'}
              >
                <Bookmark size={15} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : 'currentColor'} />
                <span>{isFavorite ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handleShare}
                className="btn-icon"
                style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
                title="Share link"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-primary, #0F172A)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}
          >
            {listing.title}
          </h1>

          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge-pill badge-blue">
              Condition: {listing.condition}
            </span>
            {listing.tags?.map((t) => (
              <span key={t} className="badge-pill badge-gray">
                #{t}
              </span>
            ))}
          </div>

          {/* Price Box */}
          <div
            className="clean-card"
            style={{
              padding: '1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-subtle, #F8FAFC)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Asking Price
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)' }}>
                  {listing.tradeMode === 'free_donation' ? 'FREE' : `₱${listing.price.toLocaleString()}`}
                </span>
                {listing.originalSrp > listing.price && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94A3B8)', textDecoration: 'line-through' }}>
                    SRP ₱{listing.originalSrp.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              {isSoldOut ? (
                <span className="badge-pill" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', fontWeight: 800, fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                  Out of Stock / Sold Out
                </span>
              ) : listing.quantity !== undefined ? (
                <span className="badge-pill badge-blue" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                  Stock: {listing.quantity} {listing.quantity === 1 ? 'unit' : 'units'} available
                </span>
              ) : null}

              {listing.originalSrp > listing.price && !isSoldOut && (
                <span className="badge-pill badge-green" style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}>
                  Save {Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Custom Meetup Spot Callout */}
          {listing.customMeetupSpot && (
            <div style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.82rem', fontWeight: 600 }}>
              <MapPin size={15} style={{ flexShrink: 0 }} />
              <span>Seller's Preferred Meetup Spot: <strong>{listing.customMeetupSpot}</strong></span>
            </div>
          )}

          {/* Swap Preference Box */}
          {listing.tradeMode === 'swap' && listing.swapPreference && (
            <div
              style={{
                backgroundColor: 'var(--uc-gold-light, #FFFBEB)',
                border: '1px solid var(--uc-gold-border, #FDE68A)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B45309', fontSize: '0.8rem', fontWeight: 800 }}>
                <ArrowLeftRight size={14} />
                <span>Seller Wants to Swap For:</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#78350F', fontWeight: 600 }}>
                {listing.swapPreference}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Item Details & Notes
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {listing.description}
            </p>
          </div>

          {/* Actions: Buy Now as primary, Swap, Chat */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
            {!isOwner ? (
              <>
                {isSoldOut ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', textAlign: 'center', fontSize: '0.86rem', fontWeight: 700 }}>
                      This item is currently out of stock or marked as sold.
                    </div>
                    <button
                      onClick={handleContactSeller}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        width: '100%'
                      }}
                    >
                      <MessageSquare size={16} style={{ flexShrink: 0 }} />
                      <span>Chat with Seller for Restock Inquiries</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 1. Primary Action: Buy Now */}
                    <button
                      onClick={handleBuyClick}
                      className="btn-gold"
                      style={{
                        flex: 1,
                        minWidth: '160px',
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <Zap size={17} style={{ flexShrink: 0 }} />
                      <span>{listing.tradeMode === 'free_donation' ? 'Claim for Free' : 'Buy Now'}</span>
                    </button>

                    {/* 2. Swap Button */}
                    <button
                      onClick={handleSwapClick}
                      className="btn-secondary"
                      style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <ArrowLeftRight size={15} style={{ flexShrink: 0 }} />
                      <span>Propose Swap</span>
                    </button>

                    {/* 3. Contact Seller Chat */}
                    <button
                      onClick={handleContactSeller}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <MessageSquare size={16} style={{ flexShrink: 0 }} />
                      <span>Chat</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                You posted this listing.
              </div>
            )}
          </div>

          {/* Seller Trust Profile Card */}
          <div
            className="clean-card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.95rem',
              marginTop: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                onClick={() => onNavigate('profile', { userId: listing.sellerId })}
              >
                <UserAvatar
                  src={listing.sellerAvatar}
                  name={listing.sellerName}
                  size="md"
                  style={{ border: '1.5px solid var(--border-subtle)' }}
                />
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.2 }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {listing.sellerName}
                    </span>
                    {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {listing.sellerCollege} • {listing.sellerCampus}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('profile', { userId: listing.sellerId })}
                style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                View Profile →
              </button>
            </div>

            {/* Trust Meter */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', padding: '0.75rem 0.95rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} /> Campus Trust Score
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {listing.sellerTrustScore}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill green" style={{ width: `${listing.sellerTrustScore}%` }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsReportModalOpen(true)}
                style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0 }} /> Report safety concern
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Campus Items */}
      {similarItems.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            More Items in {listing.sellerCampus}
          </h3>
          <div className="grid-responsive-listings">
            {similarItems.map((item: Listing) => (
              <ListingCard
                key={item.id}
                listing={item}
                onClick={() => onNavigate('item-detail', { id: item.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {isBuyModalOpen && (
        <BuyNowModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          listing={listing}
        />
      )}

      {isSwapModalOpen && (
        <SwapProposalModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          targetListing={listing}
        />
      )}

      {/* Student ID Verification Modal */}
      <StudentVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* Report Modal */}
      {isReportModalOpen && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Report Safety Concern"
          subtitle="Help keep our campus safe by reporting prohibited or non-compliant listings."
          maxWidth="480px"
        >
          <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Primary Concern *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      border: reportCategory === cat ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                      backgroundColor: reportCategory === cat ? 'var(--uc-blue-subtle)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: reportCategory === cat ? 700 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="reportCategory"
                      checked={reportCategory === cat}
                      onChange={() => setReportCategory(cat)}
                      style={{ accentColor: 'var(--uc-blue)' }}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Detailed Description *
                </label>
                <span style={{ fontSize: '0.72rem', color: reportReason.trim().length < 10 ? '#EA580C' : 'var(--text-muted)' }}>
                  {reportReason.trim().length} chars {reportReason.trim().length < 10 ? '(min 10)' : ''}
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Explain why this listing violates campus guidelines, with any specifics..."
                className="clean-textarea"
                style={{ fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportReason.trim().length < 10}
                className="btn-danger"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.82rem',
                  opacity: reportReason.trim().length < 10 ? 0.6 : 1,
                  cursor: reportReason.trim().length < 10 ? 'not-allowed' : 'pointer'
                }}
              >
                Submit Report
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* LIGHTBOX ZOOM MODAL */}
      {isLightboxOpen && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setIsLightboxOpen(false)}
          style={{ zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with counter and close */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#FFFFFF',
                marginBottom: '0.75rem',
                padding: '0 0.5rem'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                Photo {activeImageIdx + 1} of {listing.images.length || 1}
              </span>
              <button
                onClick={() => setIsLightboxOpen(false)}
                style={{
                  color: '#FFFFFF',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close photo zoom"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo with arrow controls */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {listing.images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
                  }}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <img
                src={listing.images[activeImageIdx] || listing.images[0]}
                alt={listing.title}
                style={{ maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: '10px' }}
              />

              {listing.images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.6rem' }}>
              Tip: Use ← → arrow keys to navigate, Esc to close
            </span>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      {!isOwner && !isSoldOut && (
        <div className="mobile-detail-sticky-bar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Price</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--uc-blue)', fontFamily: 'var(--font-display)' }}>
              {listing.tradeMode === 'free_donation' ? 'FREE' : `₱${listing.price.toLocaleString()}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={handleContactSeller}
              className="btn-secondary"
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <MessageSquare size={15} />
              <span>Chat</span>
            </button>
            {listing.tradeMode === 'swap' ? (
              <button
                onClick={handleSwapClick}
                className="btn-primary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeftRight size={15} />
                <span>Swap</span>
              </button>
            ) : (
              <button
                onClick={handleBuyClick}
                className="btn-gold"
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ShoppingBag size={15} />
                <span>Buy Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

