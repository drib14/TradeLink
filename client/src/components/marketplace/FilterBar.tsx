import React from 'react';
import { useMarket } from '../../context/MarketContext';
import { Campus } from '../../types';
import { RotateCcw } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const {
    selectedCampus,
    setSelectedCampus,
    selectedCategory,
    setSelectedCategory,
    selectedTradeMode,
    setSelectedTradeMode,
    sortBy,
    setSortBy,
    clearFilters
  } = useMarket();

  const campuses: Array<'All' | Campus> = [
    'All',
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC PRI',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center'
  ];

  const tagChips = [
    { id: 'All', label: 'All Items' },
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

  const hasActiveFilters =
    selectedCampus !== 'All' ||
    selectedCategory !== 'All' ||
    selectedTradeMode !== 'All';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', minWidth: 0 }}>
      {/* Row 1: Campus Segmented Control + Trade Mode & Sort dropdowns */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          width: '100%',
          minWidth: 0
        }}
      >
        {/* Campus Tabs */}
        <div
          className="touch-scroll-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid #CBD5E1',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0
          }}
        >
          {campuses.map((campus) => {
            const isSelected = selectedCampus === campus;
            return (
              <button
                key={campus}
                onClick={() => setSelectedCampus(campus)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 600,
                  backgroundColor: isSelected ? '#002B7F' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {campus === 'All' ? 'All Campuses' : campus}
              </button>
            );
          })}
        </div>

        {/* Trade Mode & Sort dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
          {/* Trade Mode Filter */}
          <select
            value={selectedTradeMode}
            onChange={(e: any) => setSelectedTradeMode(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              color: '#334155',
              cursor: 'pointer',
              flex: '1 1 auto',
              minWidth: '140px'
            }}
          >
            <option value="All">All Types (Buy / Swap / Free)</option>
            <option value="buy_sell">Buy & Sell Only</option>
            <option value="swap">Swap / Barter Only</option>
            <option value="free_donation">Free Donations Only</option>
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              color: '#334155',
              cursor: 'pointer',
              flex: '1 1 auto',
              minWidth: '140px'
            }}
          >
            <option value="newest">Recently Listed</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="trust_score">Highest Seller Trust</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                color: '#DC2626',
                fontWeight: 700,
                padding: '0.4rem 0.75rem',
                backgroundColor: '#FEF2F2',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
              title="Reset all filters"
            >
              <RotateCcw size={13} style={{ flexShrink: 0 }} /> <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Tag Chips */}
      <div
        className="touch-scroll-row"
        style={{
          width: '100%',
          minWidth: 0,
          paddingBottom: '2px'
        }}
      >
        {tagChips.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 800 : 500,
                backgroundColor: isSelected ? '#EBF1FC' : '#FFFFFF',
                color: isSelected ? '#002B7F' : '#475569',
                border: isSelected ? '1.5px solid #002B7F' : '1px solid #CBD5E1',
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
    </div>
  );
};
