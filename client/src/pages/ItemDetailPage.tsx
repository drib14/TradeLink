import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { SwapProposalModal } from '../components/marketplace/SwapProposalModal';
import { BuyNowModal } from '../components/marketplace/BuyNowModal';
import { SmartPriceWidget } from '../components/marketplace/SmartPriceWidget';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
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
  Zap,
  MapPin,
  Maximize2,
  X
} from 'lucide-react';

interface ItemDetailPageProps {
  listingId: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  listingId,
  onNavigate,
  onOpenChat
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
  const [reportReason, setReportReason] = useState('');

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
  const similarItems = listings
    .filter((l: Listing) => l.id !== listing.id && (l.category === listing.category || l.sellerCampus === listing.sellerCampus))
    .slice(0, 4);

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in to save items to your favorites.', 'info');
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
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC account to purchase or schedule a meetup.', 'warning');
      return;
    }
    setIsBuyModalOpen(true);
  };

  const handleSwapClick = () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC account to propose a swap.', 'warning');
      return;
    }
    setIsSwapModalOpen(true);
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC account to chat with the seller.', 'warning');
      return;
    }
    openChatWithSeller(listing);
    onOpenChat();
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      const existingFlags = JSON.parse(window.localStorage.getItem('tradelink_flags') || '[]');
      const newFlag = {
        id: `flag-${Date.now()}`,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images[0] || '',
        sellerName: listing.sellerName,
        reporterName: currentUser?.name || 'Anonymous UCian',
        reason: reportReason.trim(),
        campus: listing.sellerCampus,
        reportedAt: new Date().toISOString(),
        status: 'pending'
      };
      window.localStorage.setItem('tradelink_flags', JSON.stringify([newFlag, ...existingFlags]));
    } catch (err) {
      // Ignore
    }

    showToast('Report Submitted', 'Our campus moderation desk will review this listing shortly.', 'info');
    setIsReportModalOpen(false);
    setReportReason('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied! 📋', 'Listing link copied to clipboard.', 'success');
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
          <span style={{ color: 'var(--text-secondary)' }}>{listing.title.slice(0, 24)}...</span>
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

          {/* Smart Price Advisor Widget */}
          <SmartPriceWidget
            initialSrp={listing.originalSrp}
            initialCondition={listing.condition}
            initialCategory={listing.category}
            initialCurrentPrice={listing.price}
            isCompact={true}
          />
        </div>

        {/* Right Column: Listing Details & Seller Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Category & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 800, color: 'var(--uc-blue)' }}>{listing.sellerCampus}</span>
              <span>•</span>
              <span>{listing.category}</span>
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
              alignItems: 'baseline',
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

            {listing.originalSrp > listing.price && (
              <span className="badge-pill badge-green" style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}>
                Save {Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)}%
              </span>
            )}
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
                <img
                  src={listing.sellerAvatar}
                  alt={listing.sellerName}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--border-subtle)' }}
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

      {/* Report Modal */}
      {isReportModalOpen && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Report Safety Concern"
          subtitle="Help keep our campus safe by reporting prohibited or non-compliant listings."
          maxWidth="460px"
        >
          <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue (e.g. counterfeit item, wrong campus, prohibited goods)..."
              className="clean-textarea"
              style={{ fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                className="btn-danger"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}
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
          style={{ zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                color: '#FFFFFF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <X size={24} />
            </button>
            <img
              src={listing.images[activeImageIdx] || listing.images[0]}
              alt={listing.title}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '10px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

