import React from 'react';
import { useMarket } from '../../context/MarketContext';
import { RotateCcw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedTradeMode,
    setSelectedTradeMode,
    sortBy,
    setSortBy,
    clearFilters
  } = useMarket();

  const tagChips = [
    { id: 'All', label: 'All Categories' },
    { id: 'Junior High', label: 'Junior High (JHS)' },
    { id: 'Senior High', label: 'Senior High (SHS)' },
    { id: 'Electronics', label: 'Tech & Gadgets' },
    { id: 'Fashion', label: 'Fashion & Footwear' },
    { id: 'Music', label: 'Music & Audio' },
    { id: 'Textbooks', label: 'Textbooks & Reviewers' },
    { id: 'Uniforms', label: 'Uniforms & Scrubs' },
    { id: 'Gaming', label: 'Gaming & PC Gear' },
    { id: 'Dorm', label: 'Dorm & Living' }
  ];

  const hasActiveFilters = selectedCategory !== 'All' || selectedTradeMode !== 'All';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', minWidth: 0 }}>
      {/* Row 1: Quick Category Chips (Touch Scrollable) */}
      <div
        className="touch-scroll-row"
        style={{
          width: '100%',
          minWidth: 0,
          paddingBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}
      >
        {tagChips.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 800 : 600,
                backgroundColor: isSelected ? 'var(--uc-blue)' : 'var(--bg-surface)',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                border: isSelected ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? '0 2px 8px rgba(0, 43, 127, 0.2)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Row 2: Secondary Controls (Trade Mode & Sort Dropdowns + Reset) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          width: '100%',
          minWidth: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {/* Trade Mode Filter */}
          <div style={{ position: 'relative', minWidth: '170px', flex: '1 1 auto', maxWidth: '240px' }}>
            <select
              value={selectedTradeMode}
              onChange={(e: any) => setSelectedTradeMode(e.target.value)}
              className="clean-input"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <option value="All">All Types (Buy / Swap / Free)</option>
              <option value="buy_sell">Buy & Sell Only</option>
              <option value="swap">Swap / Barter Only</option>
              <option value="free_donation">Free Donations Only</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div style={{ position: 'relative', minWidth: '170px', flex: '1 1 auto', maxWidth: '240px' }}>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="clean-input"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <option value="recent">Recently Listed</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="trust_high">Highest Seller Trust</option>
              <option value="views_high">Most Popular</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: 'var(--accent-red, #DC2626)',
              fontWeight: 700,
              padding: '0.45rem 0.85rem',
              backgroundColor: 'var(--accent-red-subtle, #FEF2F2)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #FECACA)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
            title="Reset active category and trade filters"
          >
            <RotateCcw size={13} style={{ flexShrink: 0 }} /> <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
