import React, { useState } from 'react';
import { Listing } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { BuyNowModal } from './BuyNowModal';
import { SwapProposalModal } from './SwapProposalModal';
import { Bookmark, ArrowLeftRight, Gift, ShoppingBag, Eye, Zap } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const { favorites, toggleFavorite } = useMarket();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isFavorite = favorites.includes(listing.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC student account to purchase or swap this item.', 'warning');
      return;
    }
    if (listing.tradeMode === 'swap') {
      setIsSwapModalOpen(true);
    } else {
      setIsBuyModalOpen(true);
    }
  };

  const savingsPct =
    listing.originalSrp && listing.price < listing.originalSrp
      ? Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)
      : 0;

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="premium-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          position: 'relative',
          borderRadius: '14px',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          border: isHovered ? '1.5px solid var(--uc-blue-border, #BCD1F7)' : '1px solid var(--border-subtle, #E2E8F0)',
          transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 16px 32px -4px rgba(0, 43, 127, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)'
            : '0 2px 8px -2px rgba(0, 43, 127, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Bookmark Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: isFavorite ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, rgba(255, 255, 255, 0.92))',
            color: isFavorite ? '#FFC72C' : 'var(--text-muted, #64748B)',
            padding: '0.45rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transform: isFavorite ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.05))'
          }}
          title={isFavorite ? 'Remove saved' : 'Save item'}
        >
          <Bookmark size={14} fill={isFavorite ? '#FFC72C' : 'none'} color={isFavorite ? '#FFC72C' : 'currentColor'} style={{ flexShrink: 0 }} />
        </button>

        {/* Image Container with Zoom Effect */}
        <div
          style={{
            width: '100%',
            height: 'clamp(145px, 16vw, 205px)',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle, #F1F5F9)',
            borderTopLeftRadius: '13px',
            borderTopRightRadius: '13px'
          }}
        >
          <img
            src={listing.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
            alt={listing.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* Trade Mode Pill Badge */}
          {listing.tradeMode === 'swap' ? (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                background: 'linear-gradient(135deg, #002B7F 0%, #001D59 100%)',
                color: '#FFC72C',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                letterSpacing: '0.04em',
                boxShadow: '0 2px 6px rgba(0, 43, 127, 0.3)',
                lineHeight: 1
              }}
            >
              <ArrowLeftRight size={11} style={{ flexShrink: 0 }} /> <span>SWAP</span>
            </div>
          ) : listing.tradeMode === 'free_donation' ? (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                lineHeight: 1
              }}
            >
              <Gift size={11} style={{ flexShrink: 0 }} /> <span>FREE</span>
            </div>
          ) : null}

          {/* Boosted Indicator */}
          {listing.isBoosted && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #FFC72C 0%, #E5A800 100%)',
                color: '#002B7F',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 2px 6px rgba(229, 168, 0, 0.35)',
                lineHeight: 1
              }}
            >
              <Zap size={11} fill="#002B7F" style={{ flexShrink: 0 }} /> <span>FEATURED</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div style={{ padding: 'clamp(0.75rem, 1.4vw, 1rem)', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.35rem' }}>
          {/* Campus & Condition Line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
            <span style={{ fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>{listing.sellerCampus}</span>
            <span style={{ color: 'var(--border-subtle, #CBD5E1)' }}>•</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>{listing.condition}</span>
          </div>

          {/* Item Title */}
          <h4
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--text-primary, #0F172A)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.4em'
            }}
          >
            {listing.title}
          </h4>

          {/* Price & Savings Row */}
          <div style={{ marginTop: 'auto', paddingTop: '0.4rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              {listing.tradeMode === 'free_donation' ? (
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-green, #059669)', letterSpacing: '-0.01em' }}>
                  FREE
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                    ₱{listing.price.toLocaleString()}
                  </span>
                  {listing.originalSrp > listing.price && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94A3B8)', textDecoration: 'line-through' }}>
                      ₱{listing.originalSrp.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {savingsPct > 0 && listing.tradeMode !== 'free_donation' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--accent-green, #047857)',
                  backgroundColor: 'var(--accent-green-subtle, #ECFDF5)',
                  border: '1px solid var(--accent-green-border, #A7F3D0)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px'
                }}
              >
                {savingsPct}% OFF
              </span>
            )}
          </div>

          {/* Direct Action Button */}
          <div style={{ paddingTop: '0.45rem', marginTop: '0.25rem' }}>
            <button
              onClick={handleActionClick}
              className={listing.tradeMode === 'swap' ? 'btn-secondary' : 'btn-primary'}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              {listing.tradeMode === 'swap' ? (
                <>
                  <ArrowLeftRight size={13} style={{ flexShrink: 0 }} />
                  <span>Propose Swap</span>
                </>
              ) : listing.tradeMode === 'free_donation' ? (
                <>
                  <Gift size={13} style={{ flexShrink: 0 }} />
                  <span>Claim Free</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={13} style={{ flexShrink: 0 }} />
                  <span>Buy Now</span>
                </>
              )}
            </button>
          </div>

          {/* Seller Footer Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-subtle, #F1F5F9)',
              marginTop: '0.25rem'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <img
                src={listing.sellerAvatar}
                alt={listing.sellerName}
                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle, #E2E8F0)', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>
                {listing.sellerName.split(' ')[0]}
              </span>
              {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" showTooltip={false} />}
            </div>

            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Eye size={12} style={{ flexShrink: 0 }} /> <span>{listing.views}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Buy Now & Swap Proposals Modals */}
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
    </>
  );
};
