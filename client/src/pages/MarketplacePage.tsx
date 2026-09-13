import React, { useState, useEffect, useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { FilterBar } from '../components/marketplace/FilterBar';
import { ListingCard } from '../components/marketplace/ListingCard';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import { Listing } from '../types';
import { Plus, SearchX, RotateCcw, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';

interface MarketplacePageProps {
  onNavigate: (view: string, param?: any) => void;
}

const ITEMS_PER_PAGE = 12;

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const {
    filteredListings,
    selectedCampus,
    selectedCategory,
    selectedTradeMode,
    selectedCondition,
    priceRange,
    searchQuery,
    clearFilters
  } = useMarket();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampus, selectedCategory, selectedTradeMode, selectedCondition, priceRange, searchQuery]);

  useEffect(() => {
    setIsSimulatingLoading(true);
    const timer = setTimeout(() => {
      setIsSimulatingLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [selectedCampus, selectedCategory, selectedTradeMode, selectedCondition, priceRange, searchQuery, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredListings.length);
  const paginatedListings = useMemo(
    () => filteredListings.slice(startIndex, endIndex),
    [filteredListings, startIndex, endIndex]
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
            {selectedCampus === 'All' ? 'Campus Marketplace Catalog' : `${selectedCampus} Items`}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748B)', marginTop: '0.15rem' }}>
            {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} available for buy, sell, or swap
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Grid vs List View Toggle */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-subtle, #F1F5F9)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--border-subtle, #E2E8F0)'
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface, #FFFFFF)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--uc-blue, #002B7F)' : 'var(--text-muted, #94A3B8)',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                border: 'none',
                background: viewMode === 'list' ? 'var(--bg-surface, #FFFFFF)' : 'transparent',
                color: viewMode === 'list' ? 'var(--uc-blue, #002B7F)' : 'var(--text-muted, #94A3B8)',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => onNavigate('create-listing')}
            className="btn-gold"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem' }}
          >
            <Plus size={15} /> Sell / Swap Item
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Results Header (Count + Page info) */}
      {!isSimulatingLoading && filteredListings.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>
            Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{filteredListings.length}</strong> items
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Product Grid / Dynamic Skeletons / Empty State */}
      {isSimulatingLoading ? (
        <SkeletonGrid count={8} />
      ) : filteredListings.length > 0 ? (
        <>
          <div
            className={viewMode === 'grid' ? 'grid-responsive-listings' : ''}
            style={
              viewMode === 'list'
                ? { display: 'flex', flexDirection: 'column', gap: '0.85rem' }
                : undefined
            }
          >
            {paginatedListings.map((listing: Listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                layout={viewMode}
                onClick={() => onNavigate('item-detail', { id: listing.id })}
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
                // Only show first page, last page, and pages around current page
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

