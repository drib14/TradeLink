import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { SwapProposalModal } from '../components/marketplace/SwapProposalModal';
import { BuyNowModal } from '../components/marketplace/BuyNowModal';
import { ManageListingModal } from '../components/marketplace/ManageListingModal';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { listingsService } from '../services/listings.service';
import { Listing } from '../types';
import { PaymentMethodBadge } from '../components/common/PaymentLogos';
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
  Play,
  Film,
  Maximize2,
  ShoppingBag,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Star,
  X
} from 'lucide-react';

import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { formatRelativeTime } from '../utils/date';

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
  const { listings, favorites, toggleFavorite, markAsSold, incrementViews, isLoading } = useMarket();
  const { currentUser, isAuthenticated } = useAuth();
  const { openChatWithSeller } = useChat();
  const { showToast } = useToast();

  const listingFromContext = listings.find((l: Listing) => l.id === listingId);
  const [listing, setListing] = useState<Listing | null>(listingFromContext || null);
  const [isFetchingListing, setIsFetchingListing] = useState(!listingFromContext);

  useEffect(() => {
    let isSubscribed = true;
    if (!listingId) {
      onNavigate('not-found');
      return;
    }

    setIsFetchingListing(true);
    listingsService
      .getListing(listingId)
      .then((data) => {
        if (!isSubscribed) return;
        if (data) {
          setListing(data);
          incrementViews(listingId);
        } else if (!listingFromContext) {
          onNavigate('not-found');
        }
      })
      .catch((err) => {
        console.warn('Could not fetch listing directly:', err);
        if (!isSubscribed) return;
        if (listingFromContext) {
          setListing(listingFromContext);
        } else if (!isLoading) {
          onNavigate('not-found');
        }
      })
      .finally(() => {
        if (isSubscribed) setIsFetchingListing(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [listingId]);

  const isFavorite = favorites.includes(listing?.id || '');

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (listing?.variations && listing.variations.length > 0) {
      setSelectedVariationId((prev) => {
        if (prev && listing.variations?.some((v) => v.id === prev)) return prev;
        const firstVar = listing.variations![0];
        if (firstVar.imageIndex !== null && firstVar.imageIndex !== undefined) {
          setActiveImageIdx(firstVar.imageIndex);
        }
        return firstVar.id;
      });
    }
  }, [listing]);

  const selectedVariation = listing?.variations?.find((v) => v.id === selectedVariationId);
  const displayPrice = (selectedVariation && selectedVariation.price !== null && selectedVariation.price !== undefined)
    ? selectedVariation.price
    : (listing?.price || 0);

  const handleSelectVariation = (varItem: any) => {
    setSelectedVariationId(varItem.id);
    if (
      varItem.imageIndex !== null &&
      varItem.imageIndex !== undefined &&
      listing?.images &&
      listing.images[varItem.imageIndex]
    ) {
      setActiveImageIdx(varItem.imageIndex);
    }
  };

  // Product reviews state
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [listingRating, setListingRating] = useState<number>(listing?.rating || 0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    listingsService.getListingReviews(listingId).then((res) => {
      setReviewsList(res.reviews || []);
      if (res.rating) setListingRating(res.rating);
    }).catch(() => {});
  }, [listingId]);

  const handleSubmitReview = async () => {
    if (!listing) return;
    if (newRating < 1 || newRating > 5) return;
    setIsSubmittingReview(true);
    try {
      await listingsService.submitListingReview(listing.id, {
        rating: newRating,
        comment: reviewComment.trim()
      });
      showToast('Review Submitted', 'Thank you for reviewing this campus item!', 'success');
      setIsReviewModalOpen(false);
      setReviewComment('');
      const refreshed = await listingsService.getListingReviews(listing.id);
      setReviewsList(refreshed.reviews || []);
      if (refreshed.rating) setListingRating(refreshed.rating);
    } catch (err: any) {
      showToast('Failed to Submit Review', err?.message || 'Unable to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORIES[0]);
  const [reportReason, setReportReason] = useState('');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !listing?.images || listing.images.length <= 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 45) {
      // Swiped right -> previous image
      setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    } else if (deltaX < -45) {
      // Swiped left -> next image
      setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
    }
    setTouchStartX(null);
  };

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

  if (isFetchingListing && !listing) {
    return (
      <div className="container page-enter" style={{ padding: 'clamp(1rem, 2.5vw, 2rem) 0 5rem 0', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div className="product-breadcrumb-bar" style={{ height: '42px', opacity: 0.6 }} />
        <div className="product-detail-grid">
          <div style={{ height: '420px', backgroundColor: 'var(--bg-subtle, #F1F5F9)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ height: '24px', width: '40%', backgroundColor: 'var(--bg-subtle, #F1F5F9)', borderRadius: '6px' }} />
            <div style={{ height: '36px', width: '85%', backgroundColor: 'var(--bg-subtle, #F1F5F9)', borderRadius: '8px' }} />
            <div style={{ height: '72px', width: '100%', backgroundColor: 'var(--bg-subtle, #F1F5F9)', borderRadius: '12px' }} />
            <div style={{ height: '160px', width: '100%', backgroundColor: 'var(--bg-subtle, #F1F5F9)', borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    );
  }

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
    setIsBuyModalOpen(true);
  };

  const handleSwapClick = () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Log In Required', 'Please log in with your UC account to propose a swap.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsSwapModalOpen(true);
  };

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC account to chat with the seller.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    await openChatWithSeller(listing);
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
    <div className="container page-enter" style={{ padding: 'clamp(1rem, 2.5vw, 2rem) 0 5rem 0', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Back Navigation & Breadcrumb */}
      <div className="product-breadcrumb-bar">
        <button
          onClick={() => onNavigate('marketplace')}
          className="btn-ghost"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ChevronLeft size={16} /> Back to Catalog
        </button>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer', color: 'var(--uc-blue)', fontWeight: 600 }} onClick={() => onNavigate('home')}>Home</span> /{' '}
          <span style={{ cursor: 'pointer', color: 'var(--uc-blue)', fontWeight: 600 }} onClick={() => onNavigate('marketplace')}>{listing.category}</span> /{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {listing.title.length > 35 ? `${listing.title.slice(0, 35)}...` : listing.title}
          </span>
        </div>
      </div>

      {/* Main Grid: Gallery Left + Details Right */}
      <div className="product-detail-grid">
        {/* Left Column: Sticky Image & Video Gallery */}
        <div className="product-gallery-sticky">
          {/* Main Media with Video Support and Lightbox Trigger */}
          {(() => {
            const currentMediaUrl = listing.images[activeImageIdx] || listing.images[0] || '';
            const currentIsVideo = Boolean(
              (listing.media && listing.media[activeImageIdx]?.mediaType === 'video') ||
              currentMediaUrl.match(/\.(mp4|webm|mov|mkv)$/i) ||
              currentMediaUrl.includes('/video/upload/')
            );

            return (
              <div
                onTouchStart={handleGalleryTouchStart}
                onTouchEnd={handleGalleryTouchEnd}
                className="product-gallery-main"
              >
                {currentIsVideo ? (
                  <video
                    src={currentMediaUrl}
                    controls
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000000' }}
                  />
                ) : (
                  <img
                    src={currentMediaUrl}
                    alt={listing.title}
                    onClick={() => setIsLightboxOpen(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', transition: 'transform 0.3s ease' }}
                  />
                )}

                {/* Floating Previous Image Arrow */}
                {listing.images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
                    }}
                    className="product-gallery-nav-btn prev"
                    aria-label="Previous image"
                    title="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {/* Floating Next Image Arrow */}
                {listing.images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
                    }}
                    className="product-gallery-nav-btn next"
                    aria-label="Next image"
                    title="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}

                {/* Image Counter Badge */}
                {listing.images.length > 1 && (
                  <div className="product-gallery-counter">
                    {activeImageIdx + 1} / {listing.images.length}
                  </div>
                )}

                {/* Sold Out Dark Overlay */}
                {isSoldOut && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(3px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 4,
                      pointerEvents: 'none'
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        padding: '0.5rem 1.4rem',
                        borderRadius: '24px',
                        fontWeight: 900,
                        fontSize: '0.92rem',
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
                      padding: '0.3rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      letterSpacing: '0.04em',
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(0, 43, 127, 0.35)'
                    }}
                  >
                    <ArrowLeftRight size={13} /> FOR SWAP / BARTER
                  </div>
                ) : listing.tradeMode === 'free_donation' ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
                    }}
                  >
                    <Gift size={13} /> FREE DONATION
                  </div>
                ) : currentIsVideo ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      zIndex: 3
                    }}
                  >
                    <Film size={13} /> VIDEO PREVIEW
                  </div>
                ) : null}

                {/* Maximize Icon Overlay */}
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    color: '#FFFFFF',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(6px)',
                    cursor: 'pointer',
                    zIndex: 3,
                    transition: 'all 0.18s ease'
                  }}
                  title="Expand photo view"
                >
                  <Maximize2 size={15} />
                </div>
              </div>
            );
          })()}

          {/* Thumbnail Strip */}
          {listing.images.length > 1 && (
            <div className="product-gallery-thumbs">
              {listing.images.map((img: string, idx: number) => {
                const isThumbVid = Boolean(
                  (listing.media && listing.media[idx]?.mediaType === 'video') ||
                  img.match(/\.(mp4|webm|mov|mkv)$/i) ||
                  img.includes('/video/upload/')
                );

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`product-gallery-thumb-btn ${activeImageIdx === idx ? 'active' : ''}`}
                    aria-label={`Select photo ${idx + 1}`}
                  >
                    {isThumbVid ? (
                      <>
                        <video src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                        </div>
                      </>
                    ) : (
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Campus Meetup Safety Guarantee Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={18} color="var(--uc-blue, #002B7F)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                University of Cebu Safe Trade
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                Physical inspection & handover directly at campus landmark spots
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Listing Details & Seller Card */}
        <div className="product-info-column">
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
          <div className="product-price-card">
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Asking Price
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '1.95rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                  {listing.tradeMode === 'free_donation' ? 'FREE' : `₱${displayPrice.toLocaleString()}`}
                </span>
                {listing.originalSrp > displayPrice && (
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-muted, #94A3B8)', textDecoration: 'line-through' }}>
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

              {listing.originalSrp > displayPrice && !isSoldOut && (
                <span className="badge-pill badge-green" style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}>
                  Save {Math.round(((listing.originalSrp - displayPrice) / listing.originalSrp) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Item Variations (e.g. PE 101, PE 102, Math 101-104, Uniform Sizes) */}
          {listing.variations && listing.variations.length > 0 && (
            <div
              className="clean-card"
              style={{
                padding: '1rem 1.15rem',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--border-subtle, #E2E8F0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Options ({listing.variations.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {listing.variations.map((v) => {
                  const isSelected = selectedVariationId === v.id;
                  const vImg = v.imageUrl || (v.imageIndex !== null && v.imageIndex !== undefined && listing.images ? listing.images[v.imageIndex] : null);
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleSelectVariation(v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '9px',
                        border: isSelected ? '2px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--uc-blue-subtle, #EBF1FC)' : 'var(--bg-subtle, #F8FAFC)',
                        color: isSelected ? 'var(--uc-blue)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(0, 43, 127, 0.12)' : 'none'
                      }}
                    >
                      {vImg && (
                        <img
                          src={vImg}
                          alt={v.title}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '5px',
                            objectFit: 'cover',
                            border: isSelected ? '1px solid var(--uc-blue)' : '1px solid #CBD5E1'
                          }}
                        />
                      )}
                      <span>{v.title}</span>
                      {v.price !== null && v.price !== undefined && (
                        <span style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 700 }}>
                          ₱{v.price.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price vs SRP Value Comparison Bar */}
          {listing.originalSrp > listing.price && listing.tradeMode !== 'free_donation' && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Price vs. Original Retail (SRP)</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-green, #047857)' }}>
                  Save ₱{(listing.originalSrp - listing.price).toLocaleString()} ({Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)}% off)
                </span>
              </div>
              <div style={{ position: 'relative', width: '100%', height: '7px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${Math.min(100, Math.max(5, Math.round((listing.price / listing.originalSrp) * 100)))}%`,
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Asking: ₱{listing.price.toLocaleString()}</span>
                <span>Retail SRP: ₱{listing.originalSrp.toLocaleString()}</span>
              </div>
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

          {/* Listing Specifications Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Listing Specifications
            </h4>
            <div className="product-specs-card">
              <div className="product-spec-row">
                <span className="product-spec-label">Condition</span>
                <span className="product-spec-value">{listing.condition}</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Category</span>
                <span className="product-spec-value">{listing.category}</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Trade Format</span>
                <span className="product-spec-value">
                  {listing.tradeMode === 'swap' ? 'Barter / Trade Swap' : listing.tradeMode === 'free_donation' ? 'Free Student Donation' : 'Direct Campus Purchase'}
                </span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Available Quantity</span>
                <span className="product-spec-value">
                  {listing.quantity !== undefined ? `${listing.quantity} available` : '1 available'}
                </span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Campus Location</span>
                <span className="product-spec-value">{listing.sellerCampus}</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Seller Department</span>
                <span className="product-spec-value">{listing.sellerDepartment || listing.sellerCollege || 'University of Cebu'}</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Date Listed</span>
                <span className="product-spec-value">{formatRelativeTime(listing.createdAt) || 'Recent'}</span>
              </div>
            </div>
          </div>

          {/* Accepted Payment Settlements */}
          <div
            style={{
              padding: '0.85rem 1.1rem',
              backgroundColor: 'var(--bg-subtle, #F8FAFC)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment Mode
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PaymentMethodBadge method="cash" size="sm" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Cash on Meetup (handover upon inspection)
              </span>
            </div>
          </div>

          {/* Actions: Buy Now as primary, Swap, Chat */}
          <div className="product-actions-group">
            {!isOwner ? (
              <>
                {isSoldOut ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', textAlign: 'center', fontSize: '0.86rem', fontWeight: 700 }}>
                      This item is currently out of stock or marked as sold.
                    </div>
                    <button
                      onClick={handleContactSeller}
                      className="btn-secondary"
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
                    {/* Dynamic Action Buttons according to transaction type */}
                    {listing.tradeMode === 'swap' ? (
                      <>
                        {/* 1. Swap Primary Action */}
                        <button
                          onClick={handleSwapClick}
                          className="btn-gold"
                        >
                          <ArrowLeftRight size={17} style={{ flexShrink: 0 }} />
                          <span>Propose Swap</span>
                        </button>

                        {/* 2. Chat with Seller (Secondary Action) */}
                        <button
                          onClick={handleContactSeller}
                          className="btn-secondary"
                        >
                          <MessageSquare size={16} style={{ flexShrink: 0 }} />
                          <span>Chat with Seller</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* 1. Buy / Claim Primary Action */}
                        <button
                          onClick={handleBuyClick}
                          className="btn-gold"
                        >
                          {listing.tradeMode === 'free_donation' ? (
                            <>
                              <Gift size={17} style={{ flexShrink: 0 }} />
                              <span>Claim for Free</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={17} style={{ flexShrink: 0 }} />
                              <span>Buy Now</span>
                            </>
                          )}
                        </button>

                        {/* 2. Chat with Seller (Secondary Action) */}
                        <button
                          onClick={handleContactSeller}
                          className="btn-secondary"
                        >
                          <MessageSquare size={16} style={{ flexShrink: 0 }} />
                          <span>Chat with Seller</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 43, 127, 0.05)',
                    border: '1.5px solid var(--uc-blue-border, #BCD1F7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sliders size={16} color="var(--uc-blue)" />
                    <div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                        You Are The Seller of This Item
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Status: <strong>{isSoldOut ? 'Sold / Inactive' : 'Active in Marketplace'}</strong> • {listing.views || 0} total views
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: isSoldOut ? '#FEE2E2' : '#ECFDF5',
                      color: isSoldOut ? '#991B1B' : '#047857'
                    }}
                  >
                    {isSoldOut ? 'Sold Out' : 'Available'}
                  </span>
                </div>

                {/* Seller Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="btn-primary"
                    style={{
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      backgroundColor: 'var(--uc-blue, #002B7F)'
                    }}
                  >
                    <Sliders size={16} />
                    <span>Manage & Edit Listing</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const nextSold = !isSoldOut;
                        await markAsSold(listing.id, nextSold);
                        showToast(
                          nextSold ? 'Item Marked as Sold' : 'Item Relisted',
                          nextSold ? `"${listing.title}" marked as sold.` : `"${listing.title}" is now active.`,
                          'success'
                        );
                      } catch (err: any) {
                        showToast('Failed', err?.message || 'Unable to update status', 'error');
                      }
                    }}
                    style={{
                      padding: '0.75rem 1.15rem',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      border: isSoldOut ? '1px solid var(--accent-green, #10B981)' : '1px solid var(--border-subtle, #CBD5E1)',
                      backgroundColor: isSoldOut ? 'var(--accent-green-subtle, #ECFDF5)' : 'var(--bg-subtle, #F8FAFC)',
                      color: isSoldOut ? 'var(--accent-green, #047857)' : 'var(--text-secondary, #475569)'
                    }}
                  >
                    {isSoldOut ? (
                      <>
                        <RotateCcw size={15} />
                        <span>Relist Item</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} color="var(--accent-green, #10B981)" />
                        <span>Mark as Sold</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seller Trust Profile Card */}
          <div className="product-seller-card">
            <div className="product-seller-header">
              <div
                className="product-seller-info"
                onClick={() => onNavigate('profile', { userId: listing.sellerId })}
              >
                <UserAvatar
                  src={listing.sellerAvatar}
                  name={listing.sellerName}
                  size="md"
                  style={{ border: '2px solid var(--border-subtle)' }}
                />
                <div className="product-seller-meta">
                  <div className="product-seller-name">
                    <span>{listing.sellerName}</span>
                    {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" />}
                  </div>
                  <div className="product-seller-sub">
                    {listing.sellerDepartment || listing.sellerCollege || 'University of Cebu'} • {listing.sellerCampus}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('profile', { userId: listing.sellerId })}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', fontWeight: 800, borderRadius: '8px' }}
              >
                View Profile →
              </button>
            </div>

            <div className="product-seller-footer">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-green, #059669)', fontWeight: 700 }}>
                <ShieldCheck size={14} />
                <span>Verified University Trader</span>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0 }} /> Report listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews & Ratings Section */}
      <section style={{ marginTop: '2rem' }}>
        <div
          className="clean-card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Product Reviews & Ratings
              </h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <span>{listingRating > 0 ? listingRating.toFixed(1) : 'No ratings yet'}</span>
                {reviewsList.length > 0 && <span style={{ color: '#92400E' }}>({reviewsList.length})</span>}
              </div>
            </div>

            {!isOwner && isAuthenticated && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', fontWeight: 700 }}
              >
                Write a Review
              </button>
            )}
          </div>

          {reviewsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Star size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No product reviews yet</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                Completed a meetup for this item? Share your honest feedback to help fellow UC Webmasters.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '0.95rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserAvatar
                        src={rev.reviewerAvatar}
                        name={rev.reviewerName}
                        size="sm"
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {rev.reviewerName}
                          </span>
                          {rev.reviewerIsVerified && <VerifiedBadge size="xs" variant="green" />}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {rev.reviewerDepartment || rev.reviewerCollege || 'UC Student'} • {rev.reviewerCampus || 'UC Main'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            fill={s <= rev.rating ? '#F59E0B' : '#E2E8F0'}
                            color={s <= rev.rating ? '#F59E0B' : '#E2E8F0'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, marginTop: '0.4rem' }}>
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
          initialVariation={selectedVariation?.title}
          onNavigate={onNavigate}
        />
      )}

      {isSwapModalOpen && (
        <SwapProposalModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          targetListing={listing}
          initialVariation={selectedVariation?.title}
        />
      )}

      {/* Write Product Review Modal */}
      {isReviewModalOpen && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Review Item"
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Item Rating (1 to 5 Stars):
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Star
                      size={24}
                      fill={star <= newRating ? '#F59E0B' : 'none'}
                      color={star <= newRating ? '#F59E0B' : '#CBD5E1'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Your Product Review & Condition Notes:
              </label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with the item's condition, functionality, and accuracy..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.84rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="btn-neutral"
                style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.84rem', fontWeight: 800 }}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Seller Manage Listing Modal */}
      {isManageModalOpen && (
        <ManageListingModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          listing={listing}
          onNavigate={onNavigate}
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
                className="btn-neutral"
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

              {(() => {
                const currentUrl = listing.images[activeImageIdx] || listing.images[0] || '';
                const isVid = Boolean(
                  (listing.media && listing.media[activeImageIdx]?.mediaType === 'video') ||
                  currentUrl.match(/\.(mp4|webm|mov|mkv)$/i) ||
                  currentUrl.includes('/video/upload/')
                );

                if (isVid) {
                  return (
                    <video
                      src={currentUrl}
                      controls
                      autoPlay
                      playsInline
                      style={{ maxWidth: '88vw', maxHeight: '78vh', borderRadius: '10px', backgroundColor: '#000000' }}
                    />
                  );
                }

                return (
                  <img
                    src={currentUrl}
                    alt={listing.title}
                    style={{ maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: '10px' }}
                  />
                );
              })()}

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

