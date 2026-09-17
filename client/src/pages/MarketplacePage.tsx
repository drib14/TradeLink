import React, { useState, useEffect, useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { FilterBar } from '../components/marketplace/FilterBar';
import { ListingCard } from '../components/marketplace/ListingCard';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import { UserAvatar } from '../components/common/UserAvatar';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { rankAndFilterFeed, UnifiedFeedItem } from '../utils/listingRanking';
import { FlashRequest } from '../types';
import {
  Plus,
  SearchX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  MapPin,
  MessageSquare,
  Tag
} from 'lucide-react';

interface MarketplacePageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
  onOpenVerification?: () => void;
  onOpenChat?: () => void;
}

const ITEMS_PER_PAGE = 12;

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onNavigate,
  onOpenAuth,
  onOpenVerification,
  onOpenChat
}) => {
  const {
    listings,
    selectedCampus,
    selectedCategory,
    selectedTradeMode,
    selectedCondition,
    priceRange,
    searchQuery,
    sortBy,
    clearFilters
  } = useMarket();

  const { requests: flashRequests } = useFlashMarket();
  const { currentUser } = useAuth();
  const { openChatForFlash } = useChat();
  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  // 1. Unified DSA Search, Filter, and Composite Ranking Engine
  const unifiedFeed = useMemo<UnifiedFeedItem[]>(() => {
    return rankAndFilterFeed(listings, flashRequests, {
      searchQuery,
      selectedCampus,
      selectedCategory,
      tradeModeFilter: selectedTradeMode as any,
      conditionFilter: selectedCondition,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
      userCampus: currentUser?.campus,
      sortBy: (sortBy as any) || 'featured',
      pageSize: 200
    });
  }, [
    listings,
    flashRequests,
    searchQuery,
    selectedCampus,
    selectedCategory,
    selectedTradeMode,
    selectedCondition,
    priceRange,
    currentUser?.campus,
    sortBy
  ]);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampus, selectedCategory, selectedTradeMode, selectedCondition, priceRange, searchQuery, sortBy]);

  useEffect(() => {
    setIsSimulatingLoading(true);
    const timer = setTimeout(() => {
      setIsSimulatingLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedCampus, selectedCategory, selectedTradeMode, selectedCondition, priceRange, searchQuery, currentPage]);

  const totalPages = Math.max(1, Math.ceil(unifiedFeed.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, unifiedFeed.length);
  const paginatedFeed = useMemo(
    () => unifiedFeed.slice(startIndex, endIndex),
    [unifiedFeed, startIndex, endIndex]
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFulfillFlash = async (req: FlashRequest) => {
    if (!currentUser) {
      showToast('Sign In Required', 'Please sign in to fulfill campus flash requests.', 'info');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!currentUser.isVerified) {
      showToast('Verification Required', 'Please verify your UC student ID before making offers.', 'warning');
      if (onOpenVerification) onOpenVerification();
      return;
    }

    try {
      await openChatForFlash({
        id: req.id,
        requesterId: req.requesterId,
        itemTitle: req.itemTitle,
        targetBudget: req.targetBudget
      });
      showToast(
        'Connected to Student Chat!',
        `Chat opened with ${req.requesterName} regarding their request for "${req.itemTitle}".`,
        'success'
      );
      if (onOpenChat) onOpenChat();
    } catch {
      showToast('Chat Error', 'Unable to open direct chat for this request.', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)' }}>
            {selectedCampus === 'All' ? 'Campus Marketplace Catalog' : `${selectedCampus} Items`}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748B)', marginTop: '0.15rem' }}>
            {unifiedFeed.length} {unifiedFeed.length === 1 ? 'result' : 'results'} available across buy, sell, swap & flash requests
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => onNavigate('create-listing')}
            className="btn-gold"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem' }}
          >
            <Plus size={15} /> Sell / Swap Item
          </button>
        </div>
      </div>

      {/* Filter Bar with Trade Mode selection including Flash Requests */}
      <FilterBar />

      {/* Results Header (Count + Page info) */}
      {!isSimulatingLoading && unifiedFeed.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>
            Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{unifiedFeed.length}</strong> items
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Product & Flash Request Grid - Strictly Grid Layout */}
      {isSimulatingLoading ? (
        <SkeletonGrid count={8} />
      ) : unifiedFeed.length > 0 ? (
        <>
          <div className="grid-responsive-listings">
            {paginatedFeed.map((item) => {
              if (item.kind === 'listing') {
                return (
                  <ListingCard
                    key={item.id}
                    listing={item.data}
                    onClick={() => onNavigate('item-detail', { id: item.data.id })}
                  />
                );
              }

              // Flash Request Card with distinct visual identity
              const req = item.data;
              const u = (req.urgency || '').toLowerCase();
              const isUrgent = u.includes('immediate') || u.includes('urgent');
              const isThisWeek = u.includes('week');

              return (
                <div
                  key={req.id}
                  className="clean-card"
                  style={{
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    borderRadius: '16px',
                    borderLeft: '4px solid var(--uc-gold, #FFC72C)',
                    borderTop: '1px solid var(--border-subtle, #E2E8F0)',
                    borderRight: '1px solid var(--border-subtle, #E2E8F0)',
                    borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(255, 199, 44, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Top Badges */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.55rem' }}>
                      <span
                        style={{
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Zap size={11} /> FLASH REQUEST
                      </span>

                      {isUrgent ? (
                        <span
                          style={{
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            padding: '0.18rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Clock size={11} /> Urgent (24h)
                        </span>
                      ) : isThisWeek ? (
                        <span
                          style={{
                            backgroundColor: '#FFFBEB',
                            color: '#D97706',
                            border: '1px solid #FDE68A',
                            padding: '0.18rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Clock size={11} /> This Week
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            padding: '0.18rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}
                        >
                          Flexible
                        </span>
                      )}
                    </div>

                    {/* Meta: Campus & Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--uc-blue, #002B7F)', fontWeight: 700 }}>
                        <MapPin size={11} /> {req.preferredCampus || req.targetCampus}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Tag size={11} /> {req.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        color: 'var(--text-primary, #0F172A)',
                        margin: '0 0 0.4rem 0',
                        lineHeight: 1.3
                      }}
                    >
                      {req.itemTitle}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary, #64748B)',
                        lineHeight: 1.45,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {req.description}
                    </p>
                  </div>

                  {/* Pricing Box & Requester CTA Row */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F8FAFC',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          Target Budget
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)' }}>
                          {req.targetBudget <= 0 ? (
                            req.description?.toLowerCase().includes('free') ? (
                              <span style={{ color: '#059669', fontSize: '0.88rem' }}>FREE / Donation</span>
                            ) : (
                              <span style={{ color: '#D97706', fontSize: '0.88rem' }}>Open to Offers</span>
                            )
                          ) : (
                            `₱${req.targetBudget.toLocaleString()}`
                          )}
                        </div>
                      </div>

                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>
                        {req.offersCount} {req.offersCount === 1 ? 'offer' : 'offers'}
                      </span>
                    </div>

                    {/* Footer: Requester info & CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                        <UserAvatar src={req.requesterAvatar} name={req.requesterName} size={24} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.74rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span>{req.requesterName}</span>
                          <VerifiedBadge size="xs" variant="green" showTooltip={false} />
                        </div>
                      </div>

                      {currentUser && req.requesterId === currentUser.id ? (
                        <button
                          onClick={() => onNavigate('profile')}
                          className="btn-secondary"
                          style={{ padding: '0.38rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
                        >
                          Your Post
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFulfillFlash(req)}
                          className="btn-gold"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <MessageSquare size={12} /> Fulfill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '1.5rem'
              }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={15} /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrent = page === currentPage;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: isCurrent ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                        backgroundColor: isCurrent ? 'var(--uc-blue)' : 'var(--bg-surface)',
                        color: isCurrent ? '#FFFFFF' : 'var(--text-primary)',
                        fontWeight: isCurrent ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} style={{ padding: '0 0.25rem', color: 'var(--text-muted)' }}>
                      …
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div
          className="clean-card"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--uc-blue-subtle)',
              color: 'var(--uc-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SearchX size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            No Listings or Requests Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
            No items matched your current filters. Try searching for a different keyword or post your item to the campus.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={clearFilters}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
            <button
              onClick={() => onNavigate('create-listing')}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Post an Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
