import React, { useState, useEffect, useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { FilterBar } from '../components/marketplace/FilterBar';
import { ListingCard } from '../components/marketplace/ListingCard';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import { rankAndFilterFeed, UnifiedFeedItem } from '../utils/listingRanking';
import {
  Plus,
  SearchX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight
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

  const { currentUser } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  // 1. Unified DSA Search, Filter, and Composite Ranking Engine (Marketplace listings exclusively)
  const unifiedFeed = useMemo<UnifiedFeedItem[]>(() => {
    return rankAndFilterFeed(listings, [], {
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

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)' }}>
            {selectedCampus === 'All' ? 'Campus Marketplace Catalog' : `${selectedCampus} Items`}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748B)', marginTop: '0.15rem' }}>
            {unifiedFeed.length} {unifiedFeed.length === 1 ? 'item' : 'items'} available across buy, sell, swap & donations
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

      {/* Filter Bar with Trade Mode selection */}
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

      {/* Product Grid - Strictly Regular Marketplace Listings */}
      {isSimulatingLoading ? (
        <SkeletonGrid count={8} />
      ) : unifiedFeed.length > 0 ? (
        <>
          <div className="grid-responsive-listings">
            {paginatedFeed.map((item) => (
              <ListingCard
                key={item.id}
                listing={item.data as any}
                onClick={() => onNavigate('item-detail', { id: item.data.id })}
              />
            ))}
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
            No Listings Found
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
