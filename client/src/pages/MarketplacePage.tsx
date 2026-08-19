import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { FilterBar } from '../components/marketplace/FilterBar';
import { ListingCard } from '../components/marketplace/ListingCard';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import { Listing } from '../types';
import { Plus, SearchX, RotateCcw } from 'lucide-react';

interface MarketplacePageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const { filteredListings, selectedCampus, selectedCategory, searchQuery, clearFilters } = useMarket();
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSimulatingLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCampus, selectedCategory, searchQuery]);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#002B7F' }}>
            {selectedCampus === 'All' ? 'Campus Marketplace Catalog' : `${selectedCampus} Items`}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.15rem' }}>
            {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} available for buy, sell, or swap
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-listing')}
          className="btn-gold"
          style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem' }}
        >
          <Plus size={15} /> Sell / Swap Item
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Product Grid / Dynamic Skeletons / Empty State */}
      {isSimulatingLoading ? (
        <SkeletonGrid count={8} />
      ) : filteredListings.length > 0 ? (
        <div className="grid-responsive-listings">
          {filteredListings.map((listing: Listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => onNavigate('item-detail', { id: listing.id })}
            />
          ))}
        </div>
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
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => onNavigate('create-listing')}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
            >
              <Plus size={14} /> Post an Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
