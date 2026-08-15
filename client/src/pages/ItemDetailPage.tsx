import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useAdmin } from '../context/AdminContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { SwapProposalModal } from '../components/marketplace/SwapProposalModal';
import { BuyNowModal } from '../components/marketplace/BuyNowModal';
import { SmartPriceWidget } from '../components/marketplace/SmartPriceWidget';
import { ListingCard } from '../components/marketplace/ListingCard';
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
  MapPin
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
  const { reportListing } = useAdmin();
  const { showToast } = useToast();

  const listing = listings.find((l: Listing) => l.id === listingId) || listings[0];
  const isFavorite = favorites.includes(listing?.id || '');

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (!listing) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h3>Item not found</h3>
        <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '1rem' }}>
          Back to Market
        </button>
      </div>
    );
  }

  const isOwner = !!currentUser && currentUser.id === listing.sellerId;
  const similarItems = listings
    .filter((l: Listing) => l.id !== listing.id && (l.category === listing.category || l.sellerCampus === listing.sellerCampus))
    .slice(0, 4);

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

    reportListing(
      listing.id,
      listing.title,
      listing.images[0] || '',
      listing.sellerName,
      listing.sellerCampus,
      reportReason.trim()
    );

    showToast('Report Submitted', 'Our campus moderation desk will review this listing shortly.', 'info');
    setIsReportModalOpen(false);
    setReportReason('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied', 'Listing link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back Navigation */}
      <div>
        <button
          onClick={() => onNavigate('marketplace')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#64748B',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <ChevronLeft size={16} /> Back to Catalog
        </button>
      </div>

      {/* Main Grid: Gallery Left + Details Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(1.25rem, 3vw, 2.5rem)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Image & Price Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Photo */}
          <div
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: '14px',
              border: '1px solid #CBD5E1',
              overflow: 'hidden',
              height: 'clamp(240px, 35vw, 420px)',
              position: 'relative'
            }}
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
                    border: activeImageIdx === idx ? '2.5px solid #002B7F' : '1px solid #CBD5E1',
                    padding: 0
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748B' }}>
              <span style={{ fontWeight: 800, color: '#002B7F' }}>{listing.sellerCampus}</span>
              <span>•</span>
              <span>{listing.category}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => toggleFavorite(listing.id)}
                style={{
                  padding: '0.45rem',
                  borderRadius: '6px',
                  backgroundColor: isFavorite ? '#002B7F' : '#F1F5F9',
                  color: isFavorite ? '#FFC72C' : '#64748B',
                  display: 'flex'
                }}
                title="Save item"
              >
                <Bookmark size={16} fill={isFavorite ? '#FFC72C' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                style={{
                  padding: '0.45rem',
                  borderRadius: '6px',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex'
                }}
                title="Share link"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}
          >
            {listing.title}
          </h1>

          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#EBF1FC', color: '#002B7F', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
              Condition: {listing.condition}
            </span>
            {listing.tags?.map((t) => (
              <span key={t} style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                #{t}
              </span>
            ))}
          </div>

          {/* Price Box */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '1.15rem',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Asking Price
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#002B7F', fontFamily: 'var(--font-display)' }}>
                  {listing.tradeMode === 'free_donation' ? 'FREE' : `₱${listing.price.toLocaleString()}`}
                </span>
                {listing.originalSrp > listing.price && (
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                    SRP ₱{listing.originalSrp.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {listing.originalSrp > listing.price && (
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
                Save {Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)}%
              </span>
            )}
          </div>

          {/* Custom Meetup Spot Callout */}
          {listing.customMeetupSpot && (
            <div style={{ backgroundColor: '#EBF1FC', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#002B7F', fontSize: '0.82rem', fontWeight: 600 }}>
              <MapPin size={15} color="#002B7F" />
              <span>Seller's Preferred Meetup Spot: <strong>{listing.customMeetupSpot}</strong></span>
            </div>
          )}

          {/* Swap Preference Box */}
          {listing.tradeMode === 'swap' && listing.swapPreference && (
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
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
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
              Item Details & Notes
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
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
                    gap: '0.4rem'
                  }}
                >
                  <Zap size={17} color="#002B7F" />
                  <span>{listing.tradeMode === 'free_donation' ? 'Claim for Free' : 'Buy Now'}</span>
                </button>

                {/* 2. Swap Button */}
                <button
                  onClick={handleSwapClick}
                  className="btn-secondary"
                  style={{ padding: '0.75rem 1.15rem' }}
                >
                  <ArrowLeftRight size={15} /> Propose Swap
                </button>

                {/* 3. Contact Seller Chat */}
                <button
                  onClick={handleContactSeller}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.15rem' }}
                >
                  <MessageSquare size={16} /> Chat
                </button>
              </>
            ) : (
              <div style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#F1F5F9', textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                You posted this listing.
              </div>
            )}
          </div>

          {/* Seller Trust Profile Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              marginTop: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <img
                  src={listing.sellerAvatar}
                  alt={listing.sellerName}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                      {listing.sellerName}
                    </span>
                    {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="gold" />}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {listing.sellerCollege} • {listing.sellerCampus}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('profile', { userId: listing.sellerId })}
                style={{ fontSize: '0.78rem', fontWeight: 700, color: '#002B7F' }}
              >
                View Profile
              </button>
            </div>

            {/* Trust Meter */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '0.65rem 0.85rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={13} color="#059669" /> Campus Trust Score
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669' }}>
                  {listing.sellerTrustScore}%
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${listing.sellerTrustScore}%`, height: '100%', backgroundColor: '#059669' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsReportModalOpen(true)}
                style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <AlertTriangle size={12} /> Report safety concern
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Campus Items */}
      {similarItems.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
            More Items in {listing.sellerCampus}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem'
            }}
          >
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
    </div>
  );
};
