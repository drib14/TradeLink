import React, { useState } from 'react';
import { Listing } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { BuyNowModal } from './BuyNowModal';
import { SwapProposalModal } from './SwapProposalModal';
import { Bookmark, ArrowLeftRight, Gift, ShoppingBag, Zap } from 'lucide-react';

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
      isFavorite ? `"${listing.title}" removed.` : `"${listing.title}" saved.`,
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
        className="clean-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Bookmark Button */}
        <button
          onClick={handleFavoriteClick}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: isFavorite ? '#002B7F' : 'rgba(255, 255, 255, 0.9)',
            color: isFavorite ? '#FFC72C' : '#64748B',
            padding: '0.4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease'
          }}
          title={isFavorite ? 'Remove saved' : 'Save item'}
        >
          <Bookmark size={13} fill={isFavorite ? '#FFC72C' : 'none'} />
        </button>

        {/* Image Container */}
        <div
          style={{
            width: '100%',
            height: 'clamp(135px, 16vw, 195px)',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#F1F5F9'
          }}
        >
          <img
            src={listing.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
            alt={listing.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          {/* Mode Tag on Corner */}
          {listing.tradeMode === 'swap' ? (
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '6px',
                backgroundColor: '#002B7F',
                color: '#FFC72C',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                letterSpacing: '0.04em'
              }}
            >
              <ArrowLeftRight size={10} /> SWAP
            </div>
          ) : listing.tradeMode === 'free_donation' ? (
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '6px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <Gift size={10} /> FREE
            </div>
          ) : null}
        </div>

        {/* Card Info */}
        <div style={{ padding: 'clamp(0.65rem, 1.2vw, 0.95rem)', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.3rem' }}>
          {/* Campus & Condition Line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
            <span style={{ fontWeight: 800, color: '#002B7F' }}>{listing.sellerCampus}</span>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <span>{listing.condition}</span>
          </div>

          {/* Title */}
          <h4
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#0F172A',
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

          {/* Price Row */}
          <div style={{ marginTop: 'auto', paddingTop: '0.35rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              {listing.tradeMode === 'free_donation' ? (
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                  FREE
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#002B7F', fontFamily: 'var(--font-display)' }}>
                    ₱{listing.price.toLocaleString()}
                  </span>
                  {listing.originalSrp > listing.price && (
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                      ₱{listing.originalSrp.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {savingsPct > 0 && listing.tradeMode !== 'free_donation' && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                {savingsPct}% off
              </span>
            )}
          </div>

          {/* Direct Action Button: Buy Now / Propose Swap */}
          <div style={{ paddingTop: '0.45rem', marginTop: '0.2rem', display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={handleActionClick}
              className={listing.tradeMode === 'swap' ? 'btn-secondary' : 'btn-primary'}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              {listing.tradeMode === 'swap' ? (
                <>
                  <ArrowLeftRight size={13} />
                  <span>Propose Swap</span>
                </>
              ) : listing.tradeMode === 'free_donation' ? (
                <>
                  <Gift size={13} />
                  <span>Claim Free</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={13} />
                  <span>Buy Now</span>
                </>
              )}
            </button>
          </div>

          {/* Seller Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.4rem',
              borderTop: '1px solid #F1F5F9',
              marginTop: '0.2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <img
                src={listing.sellerAvatar}
                alt={listing.sellerName}
                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                {listing.sellerName.split(' ')[0]}
              </span>
              {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="gold" showTooltip={false} />}
            </div>

            <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{listing.views} views</span>
          </div>
        </div>
      </div>

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
    </>
  );
};
