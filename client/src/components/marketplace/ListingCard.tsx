import React, { useState, useMemo } from 'react';
import { Listing } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { BuyNowModal } from './BuyNowModal';
import { SwapProposalModal } from './SwapProposalModal';
import { Bookmark, ArrowLeftRight, Gift, ShoppingBag, Eye, Zap, Heart, Sparkles } from 'lucide-react';

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
  const [isFavPulsing, setIsFavPulsing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isFavorite = favorites.includes(listing.id);

  const isNew = useMemo(() => {
    if (!listing.createdAt) return false;
    return (Date.now() - new Date(listing.createdAt).getTime()) < 24 * 60 * 60 * 1000;
  }, [listing.createdAt]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in to save items to your favorites.', 'info');
      return;
    }
    setIsFavPulsing(true);
    setTimeout(() => setIsFavPulsing(false), 300);
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

  const isSoldOut = Boolean(listing.isSold || (listing.quantity !== undefined && listing.quantity <= 0));

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
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isSoldOut ? 0.85 : 1
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
            transform: isFavPulsing ? 'scale(1.3)' : isFavorite ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
            position: 'relative',
            width: '100%',
            paddingTop: '68%',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            borderTopLeftRadius: '13px',
            borderTopRightRadius: '13px'
          }}
        >
          {/* Shimmer loading placeholder */}
          {!imgLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
                backgroundSize: '200% 100%',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            />
          )}

          {/* Sold Out Dark Overlay Badge */}
          {isSoldOut && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.55)',
                backdropFilter: 'blur(1.5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5
              }}
            >
              <span
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontWeight: 900,
                  fontSize: '0.74rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)'
                }}
              >
                Sold Out
              </span>
            </div>
          )}

          {listing.images && listing.images.length > 0 && listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgLoaded ? 1 : 0,
                transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'opacity 0.25s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: isSoldOut ? 'grayscale(0.65)' : 'none'
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-muted)'
              }}
            >
              <ShoppingBag size={32} />
            </div>
          )}

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

          {/* Boosted or New Indicator */}
          {listing.isBoosted && !isSoldOut ? (
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
                lineHeight: 1,
                zIndex: 4
              }}
            >
              <Zap size={11} fill="#002B7F" style={{ flexShrink: 0 }} /> <span>FEATURED</span>
            </div>
          ) : isNew && !isSoldOut ? (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
                lineHeight: 1,
                zIndex: 4
              }}
            >
              <Sparkles size={11} style={{ flexShrink: 0 }} /> <span>NEW</span>
            </div>
          ) : null}
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

          {/* Low Stock Indicator */}
          {listing.quantity !== undefined && !isSoldOut && listing.quantity <= 3 && (
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#EA580C', marginTop: '0.1rem' }}>
              Only {listing.quantity} {listing.quantity === 1 ? 'item' : 'items'} left!
            </div>
          )}

          {/* Direct Action Button */}
          <div style={{ paddingTop: '0.45rem', marginTop: '0.25rem' }}>
            {isSoldOut ? (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  backgroundColor: 'var(--bg-subtle, #F1F5F9)',
                  color: 'var(--text-muted, #94A3B8)',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  cursor: 'not-allowed'
                }}
              >
                <span>Sold Out</span>
              </button>
            ) : (
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
            )}
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
              <UserAvatar
                src={listing.sellerAvatar}
                name={listing.sellerName}
                size={20}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>
                {listing.sellerName.split(' ')[0]}
              </span>
              {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" showTooltip={false} />}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} title={`${listing.favoritesCount} saved`}>
                <Heart size={11} fill={listing.favoritesCount > 0 ? '#EF4444' : 'none'} color={listing.favoritesCount > 0 ? '#EF4444' : 'currentColor'} style={{ flexShrink: 0 }} />
                <span>{listing.favoritesCount}</span>
              </span>
              <span style={{ color: 'var(--border-subtle, #CBD5E1)', fontSize: '0.6rem' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} title={`${listing.views} views`}>
                <Eye size={12} style={{ flexShrink: 0 }} /> <span>{listing.views}</span>
              </span>
            </div>
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
