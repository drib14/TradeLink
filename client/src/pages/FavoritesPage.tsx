import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Listing } from '../types';
import { Bookmark, SearchX, RotateCcw, ArrowRight, Trash2 } from 'lucide-react';

interface FavoritesPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ onNavigate }) => {
  const { listings, favorites, toggleFavorite } = useMarket();
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high'>('recent');

  const favListings = listings.filter((l: Listing) => favorites.includes(l.id));
  const availableFavs = favListings.filter((l) => !l.isSold);
  const soldFavs = favListings.filter((l) => l.isSold);

  const sorted = [...availableFavs].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-eyebrow">
            <Bookmark size={14} style={{ flexShrink: 0 }} /> Your Collection
          </div>
          <h1 className="page-header-title" style={{ marginTop: '0.2rem' }}>
            Saved Items
          </h1>
          <p className="page-header-subtitle">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved to your collection
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="clean-select"
            style={{ width: 'auto', minWidth: '140px', fontSize: '0.82rem', padding: '0.4rem 2rem 0.4rem 0.75rem' }}
          >
            <option value="recent">Recently Saved</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            <ArrowRight size={14} /> Browse More
          </button>
        </div>
      </div>

      {/* Available Items */}
      {sorted.length > 0 ? (
        <div className="grid-responsive-listings">
          {sorted.map((listing: Listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => onNavigate('item-detail', { id: listing.id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bookmark size={28} />
          </div>
          <h3 className="empty-state-title">No saved items yet</h3>
          <p className="empty-state-desc">
            Browse the marketplace and tap the bookmark icon on items you love to save them here for quick access.
          </p>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.84rem' }}>
            <ArrowRight size={14} /> Explore Marketplace
          </button>
        </div>
      )}

      {/* Sold/Unavailable Items */}
      {soldFavs.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              No Longer Available ({soldFavs.length})
            </h3>
            <button
              onClick={() => soldFavs.forEach((l) => toggleFavorite(l.id))}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: 'var(--accent-red)' }}
            >
              <Trash2 size={13} /> Clear All
            </button>
          </div>
          <div className="grid-responsive-listings" style={{ opacity: 0.55 }}>
            {soldFavs.map((listing: Listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => onNavigate('item-detail', { id: listing.id })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
