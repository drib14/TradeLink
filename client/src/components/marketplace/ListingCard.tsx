import React, { useState, useMemo } from 'react';
import { Listing } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useToast } from '../common/Toast';
import { BuyNowModal } from './BuyNowModal';
import { SwapProposalModal } from './SwapProposalModal';
import { ManageListingModal } from './ManageListingModal';
import { ArrowLeftRight, Gift, ShoppingBag, Zap, Clock, Film, Eye, Sliders, RotateCcw, CheckCircle2, MapPin } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  layout?: 'grid' | 'list';
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { markAsSold } = useMarket();
  const { showToast } = useToast();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isOwner = Boolean(
    currentUser &&
    (currentUser.id === listing.sellerId ||
     (listing.sellerStudentId && currentUser.studentId === listing.sellerStudentId) ||
     (listing.sellerEmail && currentUser.email === listing.sellerEmail))
  );

  const hasVideo = Boolean(
    listing.hasVideo ||
    listing.media?.some((m) => m.mediaType === 'video') ||
    listing.images?.some((img) => img.match(/\.(mp4|webm|mov|mkv)$/i) || img.includes('/video/upload/'))
  );

  const isNew = useMemo(() => {
    if (!listing.createdAt) return false;
    return (Date.now() - new Date(listing.createdAt).getTime()) < 24 * 60 * 60 * 1000;
  }, [listing.createdAt]);

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
        className="product-card-modern"
        style={{
          opacity: isSoldOut ? 0.85 : 1
        }}
      >
        {/* Product Media Box */}
        <div className="product-card-media">
          {/* Shimmer placeholder */}
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
                  fontSize: '0.72rem',
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

          {/* Product Image or Fallback */}
          {listing.images && listing.images.length > 0 && listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              style={{
                opacity: imgLoaded ? 1 : 0,
                filter: isSoldOut ? 'grayscale(0.65)' : 'none'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                color: 'var(--text-muted, #94A3B8)'
              }}
            >
              <ShoppingBag size={32} />
            </div>
          )}

          {/* Floating Badges (Clean, Non-overlapping) */}
          {/* Top-Left Badge: YOURS or NEW */}
          {isOwner ? (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: '#002B7F',
                color: '#FFC72C',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.64rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(0, 43, 127, 0.35)'
              }}
            >
              <Zap size={11} color="#FFC72C" />
              <span>YOURS</span>
            </span>
          ) : isNew && !isSoldOut ? (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.64rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Clock size={10} />
              <span>NEW</span>
            </span>
          ) : null}

          {/* Top-Right Badge: Video Demo */}
          {hasVideo && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.78)',
                color: '#FFFFFF',
                padding: '3px 7px',
                borderRadius: '6px',
                fontSize: '0.62rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backdropFilter: 'blur(4px)',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}
              title="Actual product video demonstration available"
            >
              <Film size={11} color="#FFC72C" />
              <span>VIDEO</span>
            </span>
          )}

          {/* Bottom-Left Badge: Trade Mode (SWAP or FREE) */}
          {listing.tradeMode === 'swap' ? (
            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: '#002B7F',
                color: '#FFC72C',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.64rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(0, 43, 127, 0.3)'
              }}
            >
              <ArrowLeftRight size={10} />
              <span>SWAP</span>
            </span>
          ) : listing.tradeMode === 'free_donation' ? (
            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.64rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Gift size={10} />
              <span>FREE</span>
            </span>
          ) : null}

          {/* Bottom-Right Badge: Campus Location */}
          <span
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              color: 'var(--uc-blue, #002B7F)',
              padding: '2px 7px',
              borderRadius: '6px',
              fontSize: '0.64rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backdropFilter: 'blur(4px)',
              zIndex: 4,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
            }}
          >
            <MapPin size={10} />
            <span>{listing.sellerCampus}</span>
          </span>
        </div>

        {/* Card Body */}
        <div className="product-card-body">
          {/* Category & Condition Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted, #64748B)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
              {listing.category}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', flexShrink: 0 }}>
              {listing.condition}
            </span>
          </div>

          {/* Item Title */}
          <h4
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-primary, #0F172A)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.4em',
              margin: 0
            }}
          >
            {listing.title}
          </h4>

          {/* Price & Savings Row */}
          <div style={{ marginTop: 'auto', paddingTop: '0.35rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
            <div>
              {listing.tradeMode === 'free_donation' ? (
                <span style={{ fontSize: '1.12rem', fontWeight: 900, color: 'var(--accent-green, #059669)', letterSpacing: '-0.01em' }}>
                  FREE
                </span>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display, inherit)', letterSpacing: '-0.02em' }}>
                    ₱{listing.price.toLocaleString()}
                  </span>
                  {listing.originalSrp > listing.price && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94A3B8)', textDecoration: 'line-through' }}>
                      ₱{listing.originalSrp.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {savingsPct > 0 && listing.tradeMode !== 'free_donation' && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--accent-green, #047857)',
                  backgroundColor: 'var(--accent-green-subtle, #ECFDF5)',
                  border: '1px solid var(--accent-green-border, #A7F3D0)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}
              >
                {savingsPct}% OFF
              </span>
            )}
          </div>

          {/* Low Stock Warning */}
          {listing.quantity !== undefined && !isSoldOut && listing.quantity <= 3 && (
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#EA580C', marginTop: '0.1rem' }}>
              Only {listing.quantity} {listing.quantity === 1 ? 'item' : 'items'} left!
            </div>
          )}

          {/* Action CTA Button */}
          <div style={{ paddingTop: '0.35rem', marginTop: '0.15rem' }}>
            {isOwner ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsManageModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{
                    padding: '0.45rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    color: '#FFFFFF'
                  }}
                  title="Edit price, quantity, or manage listing"
                >
                  <Sliders size={12} style={{ flexShrink: 0 }} />
                  <span>Manage</span>
                </button>

                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const nextSold = !isSoldOut;
                      await markAsSold(listing.id, nextSold);
                      showToast(
                        nextSold ? 'Marked as Sold' : 'Listing Relisted',
                        nextSold ? `"${listing.title}" marked as sold.` : `"${listing.title}" is now active in marketplace.`,
                        'success'
                      );
                    } catch (err: any) {
                      showToast('Action Failed', err?.message || 'Unable to update status', 'error');
                    }
                  }}
                  style={{
                    padding: '0.45rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    border: isSoldOut ? '1px solid var(--accent-green, #10B981)' : '1px solid var(--border-subtle, #CBD5E1)',
                    backgroundColor: isSoldOut ? 'var(--accent-green-subtle, #ECFDF5)' : 'var(--bg-subtle, #F8FAFC)',
                    color: isSoldOut ? 'var(--accent-green, #047857)' : 'var(--text-secondary, #475569)',
                    transition: 'all 0.15s ease'
                  }}
                  title={isSoldOut ? 'Reactivate listing' : 'Quickly mark as sold'}
                >
                  {isSoldOut ? (
                    <>
                      <RotateCcw size={11} />
                      <span>Relist</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={11} color="var(--accent-green, #10B981)" />
                      <span>Sold</span>
                    </>
                  )}
                </button>
              </div>
            ) : isSoldOut ? (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  padding: '0.48rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                {listing.tradeMode === 'swap' ? (
                  <>
                    <ArrowLeftRight size={12} style={{ flexShrink: 0 }} />
                    <span>Propose Swap</span>
                  </>
                ) : listing.tradeMode === 'free_donation' ? (
                  <>
                    <Gift size={12} style={{ flexShrink: 0 }} />
                    <span>Claim Free</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={12} style={{ flexShrink: 0 }} />
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
              paddingTop: '0.4rem',
              borderTop: '1px solid var(--border-subtle, #F1F5F9)',
              marginTop: '0.2rem'
            }}
          >
            {isOwner ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.72rem', fontWeight: 700 }}>
                <Sliders size={11} />
                <span>{isSoldOut ? 'Sold Out' : 'Active'}</span>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                <UserAvatar
                  src={listing.sellerAvatar}
                  name={listing.sellerName}
                  size={18}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #475569)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listing.sellerName ? listing.sellerName.split(' ')[0] : 'Student'}
                </span>
                {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" showTooltip={false} />}
              </div>
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted, #94A3B8)', flexShrink: 0 }}>
              <Eye size={11} style={{ flexShrink: 0 }} />
              <span>{listing.views || 0}</span>
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

      {/* Seller Quick Manage Modal */}
      {isManageModalOpen && (
        <ManageListingModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          listing={listing}
        />
      )}
    </>
  );
};
