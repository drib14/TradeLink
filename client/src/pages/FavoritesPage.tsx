import React, { useState, useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Listing } from '../types';
import { Bookmark, ArrowRight, Trash2, LogIn, ShoppingBag, BookOpen, Shirt, Laptop } from 'lucide-react';

interface FavoritesPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { listings, favorites, toggleFavorite, setSelectedCategory } = useMarket();
  const { isAuthenticated } = useAuth();
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high'>('recent');

  const favListings = useMemo(() => listings.filter((l: Listing) => favorites.includes(l.id)), [listings, favorites]);
  const availableFavs = useMemo(() => favListings.filter((l) => !l.isSold), [favListings]);
  const soldFavs = useMemo(() => favListings.filter((l) => l.isSold), [favListings]);

  const totalValue = useMemo(() => {
    return availableFavs.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [availableFavs]);

  const sorted = useMemo(() => {
    return [...availableFavs].sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [availableFavs, sortBy]);

  const quickCategories = [
    { label: 'Textbooks', icon: <BookOpen size={14} />, cat: 'College Textbooks & Reviewers' },
    { label: 'Uniforms', icon: <Shirt size={14} />, cat: 'Uniforms, PE Attire & Scrubs' },
    { label: 'Gadgets', icon: <Laptop size={14} />, cat: 'Electronics & Gadgets' },
    { label: 'All Items', icon: <ShoppingBag size={14} />, cat: 'All' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="container page-enter" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '540px' }}>
        <div className="clean-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bookmark size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
              Sign In to View Saved Items
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', lineHeight: 1.55, marginTop: '0.45rem' }}>
              Keep track of textbook deals, gear, and uniforms across UC campuses by logging in with your verified student account.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onNavigate('home');
              }}
              className="btn-gold"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogIn size={16} /> Log In Now
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {totalValue > 0 && ` • Estimated total: ₱${totalValue.toLocaleString()}`}
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
        <div className="empty-state" style={{ padding: '3.5rem 1.5rem' }}>
          <div className="empty-state-icon">
            <Bookmark size={28} />
          </div>
          <h3 className="empty-state-title">No saved items yet</h3>
          <p className="empty-state-desc" style={{ maxWidth: '440px', margin: '0.5rem auto 1.5rem auto' }}>
            Tap the bookmark icon on any item you love while browsing to save it here for quick comparison and future trades.
          </p>

          {/* Quick Category Discovery */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Explore popular campus categories:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {quickCategories.map((q) => (
                <button
                  key={q.label}
                  onClick={() => {
                    setSelectedCategory(q.cat);
                    onNavigate('marketplace');
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {q.icon}
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sold/Unavailable Items */}
      {soldFavs.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              No Longer Available ({soldFavs.length})
            </h3>
            <button
              onClick={() => soldFavs.forEach((l) => toggleFavorite(l.id))}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: 'var(--accent-red, #DC2626)' }}
            >
              <Trash2 size={13} /> Clear Inactive
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
