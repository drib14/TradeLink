import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  BookOpen,
  Shirt,
  Laptop,
  PenTool,
  Stethoscope,
  Palette,
  Trophy,
  ShoppingBag,
  PlusCircle,
  Check,
  X,
  Search,
  Tag,
  Layers
} from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

export interface CategoryItem {
  id?: string;
  name: string;
  slug?: string;
  icon?: string | null;
}

interface CategoryDropdownProps {
  value?: string;
  onChange: (categoryName: string, isCustom?: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  allowAll?: boolean;
  allLabel?: string;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (val: string) => void;
  size?: 'sm' | 'md';
}

export const getCategoryIcon = (catName: string, size = 15) => {
  const lower = catName.toLowerCase();
  if (lower.includes('textbook') || lower.includes('book') || lower.includes('reviewer')) {
    return <BookOpen size={size} />;
  }
  if (lower.includes('uniform') || lower.includes('scrub') || lower.includes('polo')) {
    return <Shirt size={size} />;
  }
  if (lower.includes('electronic') || lower.includes('calculator') || lower.includes('laptop') || lower.includes('gadget')) {
    return <Laptop size={size} />;
  }
  if (lower.includes('drafting') || lower.includes('supply') || lower.includes('stationery') || lower.includes('pen')) {
    return <PenTool size={size} />;
  }
  if (lower.includes('lab') || lower.includes('medical') || lower.includes('nursing') || lower.includes('stethoscope')) {
    return <Stethoscope size={size} />;
  }
  if (lower.includes('art') || lower.includes('design') || lower.includes('palette')) {
    return <Palette size={size} />;
  }
  if (lower.includes('pe') || lower.includes('sport') || lower.includes('fitness')) {
    return <Trophy size={size} />;
  }
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('accessory')) {
    return <ShoppingBag size={size} />;
  }
  return <Tag size={size} />;
};

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select Item Category',
  className = '',
  id,
  allowAll = false,
  allLabel = 'All Categories',
  allowCustom = true,
  customValue = '',
  onCustomChange,
  size = 'md'
}) => {
  const { categories, addCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(value === 'Other');
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState(customValue || '');

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(() => {
    if (allowAll && (value === 'All' || value === 'all' || !value)) {
      return {
        name: allLabel,
        isAll: true
      };
    }
    if (value === 'Other') {
      return {
        name: customValue ? `Other: ${customValue}` : 'Other (Custom)',
        isOther: true
      };
    }
    const found = categories.find((c) => c.name.toLowerCase() === value.toLowerCase());
    return found || (value ? { name: value } : null);
  }, [value, customValue, categories, allowAll, allLabel]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < 300 && spaceAbove > 240;

    const estimatedHeight = 310;
    const top = shouldOpenUp
      ? Math.max(10, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - estimatedHeight - 10, rect.bottom + 6);

    const left = Math.max(10, Math.min(rect.left, window.innerWidth - rect.width - 10));
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 20);

    setCoords({
      top,
      left,
      width,
      openUpward: shouldOpenUp
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        clearTimeout(timer);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const handleSelect = (catName: string) => {
    if (catName === 'Other') {
      setIsAddingCustom(true);
      onChange('Other', true);
    } else {
      setIsAddingCustom(false);
      onChange(catName, false);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSaveCustom = async () => {
    if (!newCustomCategoryInput.trim()) return;
    const trimmed = newCustomCategoryInput.trim();
    if (onCustomChange) onCustomChange(trimmed);
    await addCategory(trimmed);
    onChange(trimmed, false);
    setIsAddingCustom(false);
  };

  const isSmall = size === 'sm';

  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isSmall ? '0.42rem 0.65rem' : '0.62rem 0.85rem',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid var(--uc-blue, #002B7F)' : '1px solid var(--border-subtle, #CBD5E1)',
          backgroundColor: disabled ? 'var(--bg-subtle, #F1F5F9)' : 'var(--bg-surface, #FFFFFF)',
          color: 'var(--text-primary, #0F172A)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontSize: isSmall ? '0.8rem' : '0.85rem',
          fontWeight: 600,
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 43, 127, 0.12)' : 'none',
          transition: 'all 0.15s ease',
          gap: '0.45rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
          {selectedCategory ? (
            <>
              <div
                style={{
                  width: isSmall ? '24px' : '28px',
                  height: isSmall ? '24px' : '28px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(0, 43, 127, 0.08)',
                  color: 'var(--uc-blue, #002B7F)',
                  border: '1px solid rgba(0, 43, 127, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {selectedCategory.name === allLabel ? <Layers size={15} /> : getCategoryIcon(selectedCategory.name, isSmall ? 13 : 15)}
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: isSmall ? '0.8rem' : '0.85rem',
                  color: 'var(--text-primary, #0F172A)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {selectedCategory.name}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted, #94A3B8)', fontSize: isSmall ? '0.8rem' : '0.85rem' }}>
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={isSmall ? 14 : 16}
          style={{
            color: 'var(--text-muted, #64748B)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Floating portal dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              border: '1.5px solid var(--border-subtle, #CBD5E1)',
              borderRadius: '12px',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
              zIndex: 9999999,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '330px',
              overflow: 'hidden',
              animation: 'popoverIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Search Filter Header */}
            <div
              style={{
                padding: '0.5rem 0.65rem',
                borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Search size={14} style={{ color: 'var(--text-muted, #94A3B8)', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0F172A)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #94A3B8)',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* List options */}
            <div style={{ overflowY: 'auto', padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {allowAll && !searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSelect('All')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: value === 'All' || !value ? '#EBF1FC' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.12s ease'
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      backgroundColor: '#EFF6FF',
                      color: 'var(--uc-blue, #002B7F)',
                      border: '1px solid #BFDBFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Layers size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                    {allLabel}
                  </div>
                  {(value === 'All' || !value) && <Check size={14} style={{ color: 'var(--uc-blue, #002B7F)' }} />}
                </button>
              )}

              {filteredCategories.map((c) => {
                const isSelected = value.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => handleSelect(c.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? '#EBF1FC' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #F8FAFC)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 43, 127, 0.08)',
                        color: 'var(--uc-blue, #002B7F)',
                        border: '1px solid rgba(0, 43, 127, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getCategoryIcon(c.name, 14)}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary, #0F172A)'
                      }}
                    >
                      {c.name}
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--uc-blue, #002B7F)' }} />}
                  </button>
                );
              })}

              {allowCustom && (
                <button
                  type="button"
                  onClick={() => handleSelect('Other')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-subtle, #CBD5E1)',
                    background: value === 'Other' ? '#FFFBEB' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    marginTop: '0.2rem',
                    transition: 'background 0.12s ease'
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <PlusCircle size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 700, color: '#B45309' }}>
                    Other (Create Custom Category)
                  </div>
                  {value === 'Other' && <Check size={14} style={{ color: '#B45309' }} />}
                </button>
              )}

              {filteredCategories.length === 0 && !allowCustom && (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted, #64748B)' }}>
                  No categories found.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* If "Other" is chosen, render the custom category name input cleanly below */}
      {isAddingCustom && allowCustom && (
        <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
          <input
            type="text"
            value={newCustomCategoryInput}
            onChange={(e) => {
              setNewCustomCategoryInput(e.target.value);
              if (onCustomChange) onCustomChange(e.target.value);
            }}
            placeholder="Type custom category name..."
            className="clean-input"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem', flex: 1 }}
            required
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveCustom();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

