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
import { ArrowLeftRight, Gift, ShoppingBag, Zap, Clock, Film, Eye, Sliders, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  layout?: 'grid' | 'list';
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, layout = 'grid' }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { markAsSold } = useMarket();
  const { showToast } = useToast();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="premium-card"
        style={{
          display: 'flex',
          flexDirection: layout === 'list' ? 'row' : 'column',
          cursor: 'pointer',
          position: 'relative',
          borderRadius: '22px',
          backgroundColor: '#FFFFFF',
          border: isHovered ? '1.5px solid rgba(188, 209, 247, 0.9)' : '1.5px solid rgba(255, 255, 255, 0.85)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 20px 36px -6px rgba(0, 43, 127, 0.14), 0 6px 14px -2px rgba(0, 0, 0, 0.05), inset 3px 3px 6px #FFFFFF, inset -3px -3px 6px rgba(0, 43, 127, 0.06)'
            : '0 12px 24px -4px rgba(0, 43, 127, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03), inset 3px 3px 6px rgba(255, 255, 255, 0.95), inset -3px -3px 6px rgba(0, 43, 127, 0.04)',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isSoldOut ? 0.85 : 1,
          overflow: 'hidden'
        }}
      >
        {/* Your Listing Seller Badge */}
        {isOwner && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'var(--uc-blue, #002B7F)',
              color: '#FFFFFF',
              padding: '0.24rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              zIndex: 6,
              boxShadow: '0 2px 8px rgba(0, 43, 127, 0.35)',
              letterSpacing: '0.03em'
            }}
          >
            <Zap size={12} color="#FFC72C" />
            <span>YOUR LISTING</span>
          </div>
        )}

        {/* Video Sample Badge */}
        {hasVideo && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              color: '#FFFFFF',
              padding: '0.24rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.66rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              zIndex: 6,
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              letterSpacing: '0.03em'
            }}
            title="Actual product video demonstration available"
          >
            <Film size={12} color="#FFC72C" />
            <span>VIDEO</span>
          </div>
        )}

        {/* Image Container with Zoom Effect */}
        <div
          style={{
            position: 'relative',
            width: layout === 'list' ? '220px' : '100%',
            minWidth: layout === 'list' ? '180px' : undefined,
            paddingTop: layout === 'list' ? 0 : '68%',
            height: layout === 'list' ? 'auto' : undefined,
            minHeight: layout === 'list' ? '170px' : undefined,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            borderTopLeftRadius: '13px',
            borderTopRightRadius: layout === 'list' ? 0 : '13px',
            borderBottomLeftRadius: layout === 'list' ? '13px' : 0,
            flexShrink: 0
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

          {/* New Listing Indicator */}
          {isNew && !isSoldOut ? (
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
              <Clock size={11} style={{ flexShrink: 0 }} /> <span>NEW</span>
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
            {isOwner ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.35rem' }}>
                {/* 1. Primary Seller Action: Manage / Edit */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsManageModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    color: '#FFFFFF'
                  }}
                  title="Edit price, quantity, or manage listing"
                >
                  <Sliders size={13} style={{ flexShrink: 0 }} />
                  <span>Manage Listing</span>
                </button>

                {/* 2. Quick Sold / Relist Toggle */}
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
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
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
                      <RotateCcw size={12} />
                      <span>Relist</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} color="var(--accent-green, #10B981)" />
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
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  borderRadius: '14px',
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
            {isOwner ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.74rem', fontWeight: 800 }}>
                <Sliders size={12} />
                <span>{isSoldOut ? 'Sold Out' : 'Active in Marketplace'}</span>
              </div>
            ) : (
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
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} title={`${listing.views || 0} views`}>
                <Eye size={12} style={{ flexShrink: 0 }} /> <span>{listing.views || 0} views</span>
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
