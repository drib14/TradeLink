import React, { useState } from 'react';
import { useMarket } from '../../context/MarketContext';
import { useCategories } from '../../hooks/useCategories';
import { RotateCcw, X, SlidersHorizontal, DollarSign, Building2, Tag } from 'lucide-react';
import { ConditionGrade } from '../../types';

export const FilterBar: React.FC = () => {
  const { categories } = useCategories();
  const {
    selectedCampus,
    setSelectedCampus,
    selectedCategory,
    setSelectedCategory,
    selectedTradeMode,
    setSelectedTradeMode,
    selectedCondition,
    setSelectedCondition,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    searchQuery,
    setSearchQuery,
    clearFilters
  } = useMarket();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const tagChips = [
    { id: 'All', label: 'All Categories' },
    ...categories.map((c) => ({
      id: c.name,
      label: c.name
    }))
  ];

  const conditions: { id: 'All' | ConditionGrade; label: string }[] = [
    { id: 'All', label: 'All Conditions' },
    { id: 'Brand New', label: 'Brand New' },
    { id: 'Like New', label: 'Like New' },
    { id: 'Gently Used', label: 'Gently Used' },
    { id: 'Lightly Used', label: 'Lightly Used' },
    { id: 'Well Used', label: 'Well Used' },
    { id: 'Heavily Used', label: 'Heavily Used' },
    { id: 'Fair / Academic Usable', label: 'Fair / Academic Usable' }
  ];

  const pricePresets = [
    { label: 'Under ₱500', range: [0, 500] as [number, number] },
    { label: '₱500 - ₱1,500', range: [500, 1500] as [number, number] },
    { label: '₱1,500 - ₱5,000', range: [1500, 5000] as [number, number] },
    { label: '₱5,000+', range: [5000, 50000] as [number, number] }
  ];

  const hasActiveFilters =
    selectedCampus !== 'All' ||
    selectedCategory !== 'All' ||
    selectedTradeMode !== 'All' ||
    selectedCondition !== 'All' ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000 ||
    Boolean(searchQuery.trim());

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

      {/* Row 2: Primary Controls (Trade Mode, Condition, Sort, Filter Toggle) */}
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
          {/* Campus Filter */}
          <div style={{ position: 'relative', minWidth: '130px', flex: '1 1 130px', maxWidth: '210px' }}>
            <select
              value={selectedCampus}
              onChange={(e: any) => setSelectedCampus(e.target.value)}
              className="clean-input"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)'
              }}
              aria-label="Filter by campus"
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
          </div>

          {/* Trade Mode Filter */}
          <div style={{ position: 'relative', minWidth: '120px', flex: '1 1 120px', maxWidth: '220px' }}>
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
              <option value="All">All Trade Types</option>
              <option value="buy_sell">Buy & Sell Only</option>
              <option value="swap">Swap / Barter Only</option>
              <option value="free_donation">Free Donations Only</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div style={{ position: 'relative', minWidth: '120px', flex: '1 1 120px', maxWidth: '200px' }}>
            <select
              value={selectedCondition}
              onChange={(e: any) => setSelectedCondition(e.target.value)}
              className="clean-input"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {conditions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div style={{ position: 'relative', minWidth: '120px', flex: '1 1 120px', maxWidth: '220px' }}>
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

          {/* Advanced Filters Button (Price Range) */}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: isAdvancedOpen || priceRange[0] > 0 || priceRange[1] < 50000 ? 800 : 600,
              borderRadius: '8px',
              border: isAdvancedOpen ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
              backgroundColor: isAdvancedOpen ? 'var(--uc-blue-subtle)' : 'var(--bg-surface)',
              color: isAdvancedOpen ? 'var(--uc-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Price Range</span>
            {(priceRange[0] > 0 || priceRange[1] < 50000) && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--uc-gold)'
                }}
              />
            )}
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: 'var(--color-danger, #DC2626)',
              fontWeight: 700,
              padding: '0.45rem 0.85rem',
              backgroundColor: '#FEF2F2',
              borderRadius: '8px',
              border: '1px solid #FECACA',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
            title="Reset all active filters"
          >
            <RotateCcw size={13} style={{ flexShrink: 0 }} /> <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Row 3: Expandable Price Range Filter Panel */}
      {isAdvancedOpen && (
        <div
          className="clean-card"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <DollarSign size={14} color="var(--uc-blue)" /> Filter by Price Range (PHP)
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {pricePresets.map((preset) => {
                const isActive = priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                return (
                  <button
                    key={preset.label}
                    onClick={() => setPriceRange(preset.range)}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 800 : 600,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: isActive ? 'var(--uc-blue)' : 'var(--bg-surface)',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '380px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                ₱
              </span>
              <input
                type="number"
                min="0"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Math.max(0, Number(e.target.value)), priceRange[1]])}
                placeholder="Min"
                className="clean-input"
                style={{ paddingLeft: '1.6rem', fontSize: '0.8rem', height: '36px' }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>—</span>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                ₱
              </span>
              <input
                type="number"
                min="0"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Math.max(priceRange[0], Number(e.target.value))])}
                placeholder="Max"
                className="clean-input"
                style={{ paddingLeft: '1.6rem', fontSize: '0.8rem', height: '36px' }}
              />
            </div>
            {(priceRange[0] > 0 || priceRange[1] < 50000) && (
              <button
                onClick={() => setPriceRange([0, 50000])}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: 'var(--text-muted)' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row 4: Active Filter Dismiss Pills */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '2px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>Active filters:</span>

          {selectedCampus !== 'All' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--uc-blue)',
                backgroundColor: 'var(--uc-blue-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 43, 127, 0.15)'
              }}
            >
              <Building2 size={11} /> {selectedCampus}
              <button
                onClick={() => setSelectedCampus('All')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--uc-blue)' }}
                aria-label="Clear campus filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedCategory !== 'All' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--uc-blue)',
                backgroundColor: 'var(--uc-blue-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 43, 127, 0.15)'
              }}
            >
              <Tag size={11} /> {selectedCategory}
              <button
                onClick={() => setSelectedCategory('All')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--uc-blue)' }}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedTradeMode !== 'All' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--uc-blue)',
                backgroundColor: 'var(--uc-blue-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 43, 127, 0.15)'
              }}
            >
              Mode: {selectedTradeMode === 'buy_sell' ? 'Buy & Sell' : selectedTradeMode === 'swap' ? 'Swap' : 'Free'}
              <button
                onClick={() => setSelectedTradeMode('All')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--uc-blue)' }}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedCondition !== 'All' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--uc-blue)',
                backgroundColor: 'var(--uc-blue-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 43, 127, 0.15)'
              }}
            >
              Condition: {selectedCondition}
              <button
                onClick={() => setSelectedCondition('All')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--uc-blue)' }}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(priceRange[0] > 0 || priceRange[1] < 50000) && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--uc-blue)',
                backgroundColor: 'var(--uc-blue-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 43, 127, 0.15)'
              }}
            >
              Price: ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
              <button
                onClick={() => setPriceRange([0, 50000])}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--uc-blue)' }}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {Boolean(searchQuery.trim()) && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--uc-blue)',
                backgroundColor: 'var(--uc-blue-subtle)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 43, 127, 0.15)'
              }}
            >
              "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--uc-blue)' }}
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

