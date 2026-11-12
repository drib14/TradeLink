import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useCategories } from '../hooks/useCategories';
import { ListingCard } from '../components/marketplace/ListingCard';
import { CampusCarouselBanner } from '../components/home/CampusCarouselBanner';
import { ListingCardSkeleton } from '../components/common/SkeletonLoader';
import { CampusDropdown } from '../components/common/CampusDropdown';
import { Campus, Listing } from '../types';
import {
  ArrowRight,
  Bookmark,
  ArrowLeftRight,
  ShoppingBag,
  Zap,
  Building2,
  X,
  BookOpen,
  Shirt,
  Laptop,
  Home,
  GraduationCap,
  Gamepad2
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenChat?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenChat: _onOpenChat }) => {
  const { categories } = useCategories();
  const { listings, isLoading, selectedCampus, setSelectedCampus, selectedCategory, setSelectedCategory, favorites } = useMarket();

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('book') || n.includes('text')) return BookOpen;
    if (n.includes('uniform') || n.includes('apparel') || n.includes('cloth')) return Shirt;
    if (n.includes('electron') || n.includes('calc') || n.includes('tech') || n.includes('gadget')) return Laptop;
    if (n.includes('dorm') || n.includes('living')) return Home;
    if (n.includes('game') || n.includes('gaming')) return Gamepad2;
    if (n.includes('high') || n.includes('senior') || n.includes('junior')) return GraduationCap;
    return ShoppingBag;
  };
  const { requests: flashRequests } = useFlashMarket();
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'swaps' | 'free'>('all');

  const openFlashCount = React.useMemo(() => {
    return (flashRequests || []).filter((r) => r.status === 'open' && !r.isExpired).length;
  }, [flashRequests]);

  const activeSwapsCount = React.useMemo(() => {
    return (listings || []).filter((l) => !l.isSold && l.tradeMode === 'swap').length;
  }, [listings]);

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
              <div className="nav-card-sub">{openFlashCount > 0 ? `${openFlashCount} open ${openFlashCount === 1 ? 'request' : 'requests'}` : 'Urgent requests'}</div>
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
              <div className="nav-card-sub">{activeSwapsCount > 0 ? `${activeSwapsCount} available` : 'Barter & trade'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Student Categories Bar */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Popular Categories
          </h3>
          <button
            onClick={() => onNavigate('marketplace')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--uc-blue)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div
          className="touch-scroll-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.35rem',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
          {[
            { id: 'All', label: 'All Items', icon: ShoppingBag },
            ...categories.map((c) => ({
              id: c.name,
              label: c.name,
              icon: getCategoryIcon(c.name)
            }))
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  onNavigate('marketplace');
                }}
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  backgroundColor: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                  border: isSelected ? '1px solid var(--uc-blue, #002B7F)' : '1px solid var(--border-subtle, #CBD5E1)',
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(0, 43, 127, 0.22)'
                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
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
              Verified items from UC students across all departments & campuses
            </p>
          </div>

          {/* Controls: Segmented Feed Tab + On-Page Campus Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Campus Dropdown Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '160px' }}>
              <CampusDropdown
                value={selectedCampus}
                onChange={(c) => setSelectedCampus(c as any)}
                allowAll={true}
                allLabel="All Campuses"
                size="sm"
              />

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
