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
  ArrowLeftRight,
  ShoppingBag,
  Zap,
  Building2,
  X
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenChat?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenChat: _onOpenChat }) => {
  const { listings, isLoading, selectedCampus, setSelectedCampus, favorites } = useMarket();
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'swaps' | 'free'>('all');

  const handleCampusSelect = (campus: Campus | 'ALL') => {
    setSelectedCampus(campus === 'ALL' ? 'All' : campus);
    onNavigate('marketplace');
  };

  // Filter listings based on active tab and selected campus
  const displayedListings = listings.filter((l: Listing) => {
    if (l.isSold) return false;
    if (selectedCampus !== 'All') {
      const matchSellerCampus = l.sellerCampus && l.sellerCampus.toLowerCase().includes(selectedCampus.toLowerCase());
      const matchItemCampus = (l as any).campus && (l as any).campus.toLowerCase().includes(selectedCampus.toLowerCase());
      if (!matchSellerCampus && !matchItemCampus) return false;
    }
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
        <div className="home-quick-nav-grid">
          <div
            className="clean-card card-interactive home-quick-nav-card"
            onClick={() => onNavigate('favorites')}
          >
            <div className="nav-card-icon" style={{ backgroundColor: 'var(--uc-gold-light, #FEF3C7)', color: '#B45309' }}>
              <Bookmark size={18} />
            </div>
            <div className="nav-card-text">
              <div className="nav-card-title">Saved Items</div>
              <div className="nav-card-sub">{favorites.length} saved</div>
            </div>
          </div>

          <div
            className="clean-card card-interactive home-quick-nav-card"
            onClick={() => onNavigate('flash-market')}
          >
            <div className="nav-card-icon" style={{ backgroundColor: 'var(--color-secondary-light, #FFF2CC)', color: 'var(--uc-blue, #002B7F)' }}>
              <Zap size={18} fill="var(--color-secondary, #FFC72C)" color="var(--color-secondary-dark, #E5A800)" />
            </div>
            <div className="nav-card-text">
              <div className="nav-card-title">Flash Market</div>
              <div className="nav-card-sub">Urgent requests</div>
            </div>
          </div>

          <div
            className="clean-card card-interactive home-quick-nav-card"
            onClick={() => onNavigate('swaps')}
          >
            <div className="nav-card-icon" style={{ backgroundColor: 'var(--color-success-subtle, #ECFDF5)', color: 'var(--accent-green, #059669)' }}>
              <ArrowLeftRight size={18} />
            </div>
            <div className="nav-card-text">
              <div className="nav-card-title">Direct Swaps</div>
              <div className="nav-card-sub">Barter & trade</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Unified Marketplace Discovery Feed */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Campus Marketplace Feed
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Verified items from UC students across all colleges & campuses
            </p>
          </div>

          {/* Controls: Segmented Feed Tab + On-Page Campus Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Campus Dropdown Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value as any)}
                className="clean-input"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.4rem 2rem 0.4rem 0.75rem',
                  cursor: 'pointer',
                  height: '36px',
                  borderRadius: '10px'
                }}
                aria-label="Filter feed by campus"
              >
                <option value="All">All Campuses</option>
                <option value="UC Main">UC Main</option>
                <option value="UC Banilad">UC Banilad</option>
                <option value="UC LM">UC LM</option>
                <option value="UC METC">UC METC</option>
                <option value="UC Pardo-Talisay">UC Pardo-Talisay</option>
                <option value="UC South Campus">UC South Campus</option>
                <option value="UC Medical Center">UC Medical Center</option>
                <option value="UC PRI">UC PRI</option>
              </select>

              {selectedCampus !== 'All' && (
                <button
                  onClick={() => setSelectedCampus('All')}
                  className="btn-neutral"
                  style={{
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    height: '36px',
                    borderRadius: '10px'
                  }}
                  title="Clear campus filter"
                >
                  <X size={13} />
                  <span>Reset</span>
                </button>
              )}
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
                border: '1px solid var(--border-subtle)',
                height: '36px'
              }}
            >
              {[
                { id: 'all', label: 'All Items' },
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
                  onNavigate={onNavigate}
                />
              ))}
        </div>

        {/* Empty state if no items */}
        {!isLoading && displayedListings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <ShoppingBag size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Listings Found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {selectedCampus !== 'All'
                ? `No items currently found for ${selectedCampus}. Try selecting All Campuses or post the first one!`
                : 'Be the first student to post an item in this category!'}
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              {selectedCampus !== 'All' && (
                <button
                  onClick={() => setSelectedCampus('All')}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Show All Campuses
                </button>
              )}
              <button
                onClick={() => onNavigate('create-listing')}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                Post an Item
              </button>
            </div>
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
