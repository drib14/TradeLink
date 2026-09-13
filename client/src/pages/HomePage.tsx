import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { ListingCard } from '../components/marketplace/ListingCard';
import { CampusCarouselBanner } from '../components/home/CampusCarouselBanner';
import { ListingCardSkeleton } from '../components/common/SkeletonLoader';
import { Campus, Listing } from '../types';
import {
  ArrowRight,
  Bookmark,
  Zap,
  ArrowLeftRight,
  ShoppingBag
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenChat?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenChat: _onOpenChat }) => {
  const { listings, isLoading, setSelectedCampus, favorites } = useMarket();
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'featured' | 'swaps' | 'free'>('all');

  const handleCampusSelect = (campus: Campus | 'ALL') => {
    setSelectedCampus(campus === 'ALL' ? 'All' : campus);
    onNavigate('marketplace');
  };

  // Filter listings based on active tab
  const displayedListings = listings.filter((l: Listing) => {
    if (l.isSold) return false;
    if (activeFeedTab === 'featured') return l.isBoosted;
    if (activeFeedTab === 'swaps') return l.tradeMode === 'swap';
    if (activeFeedTab === 'free') return l.tradeMode === 'free_donation';
    return true;
  });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
      {/* 1. Hero Carousel with Campus Explorer */}
      <section className="container" style={{ paddingTop: '1.25rem' }}>
        <CampusCarouselBanner
          onSelectCampus={handleCampusSelect}
          onPostListing={() => onNavigate('create-listing')}
          onExplore={() => onNavigate('marketplace')}
        />
      </section>

      {/* 2. Quick Feature Navigation Cards */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
          <div
            className="clean-card card-interactive"
            onClick={() => onNavigate('favorites')}
            style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--uc-gold-light, #FEF3C7)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bookmark size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Saved Items</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{favorites.length} items bookmarked</div>
            </div>
          </div>

          <div
            className="clean-card card-interactive"
            onClick={() => onNavigate('flash-market')}
            style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--color-danger-subtle, #FEF2F2)', color: 'var(--color-danger, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Flash Market</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Urgent campus requests</div>
            </div>
          </div>

          <div
            className="clean-card card-interactive"
            onClick={() => onNavigate('swaps')}
            style={{ padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Direct Swaps</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Barter gear & textbooks</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Unified Marketplace Discovery Feed */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShoppingBag size={20} color="var(--uc-blue)" />
              <span>Campus Marketplace Feed</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Verified items from UC students across all colleges & campuses
            </p>
          </div>

          {/* Clean Segmented Tab Control */}
          <div
            className="touch-scroll-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {[
              { id: 'all', label: 'All Items' },
              { id: 'featured', label: 'Featured Deals' },
              { id: 'swaps', label: 'Swaps' },
              { id: 'free', label: 'Free Items' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFeedTab(tab.id as any)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.78rem',
                  fontWeight: activeFeedTab === tab.id ? 800 : 600,
                  backgroundColor: activeFeedTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                  color: activeFeedTab === tab.id ? 'var(--uc-blue)' : 'var(--text-secondary)',
                  boxShadow: activeFeedTab === tab.id ? 'var(--shadow-sm)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid-responsive-listings">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : displayedListings.slice(0, 12).map((item: Listing) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('item-detail', { id: item.id })}
                />
              ))}
        </div>

        {/* Empty state if no items */}
        {!isLoading && displayedListings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <ShoppingBag size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Listings Found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Be the first student to post an item in this category!</p>
            <button
              onClick={() => onNavigate('create-listing')}
              className="btn-primary"
              style={{ marginTop: '1rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
            >
              Post an Item
            </button>
          </div>
        )}

        {/* View Full Catalog Link */}
        {displayedListings.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => onNavigate('marketplace')}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <span>Browse Full Catalog with Filters</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
