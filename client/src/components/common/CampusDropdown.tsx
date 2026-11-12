import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Building2, HeartPulse, Cpu, Anchor, GraduationCap, Compass, Check, X, Search } from 'lucide-react';

export interface CampusOption {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
}

export const CAMPUS_OPTIONS: CampusOption[] = [
  {
    id: 'UC Main',
    name: 'University of Cebu - Main Campus',
    shortName: 'UC Main',
    subtitle: 'Sanciangko St., Cebu City',
    icon: <Building2 size={15} />,
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8',
    badgeBorder: '#BFDBFE'
  },
  {
    id: 'UC Banilad',
    name: 'University of Cebu - Banilad Campus',
    shortName: 'UC Banilad',
    subtitle: 'Gov. M. Cuenco Ave., Banilad',
    icon: <HeartPulse size={15} />,
    badgeBg: '#ECFDF5',
    badgeColor: '#047857',
    badgeBorder: '#A7F3D0'
  },
  {
    id: 'UC LM',
    name: 'University of Cebu - Lapu-Lapu & Mandaue (LM)',
    shortName: 'UC LM',
    subtitle: 'A.C. Cortes Ave., Mandaue City',
    icon: <Cpu size={15} />,
    badgeBg: '#FFFBEB',
    badgeColor: '#B45309',
    badgeBorder: '#FDE68A'
  },
  {
    id: 'UC METC',
    name: 'University of Cebu - METC (Maritime)',
    shortName: 'UC METC',
    subtitle: 'Alumnos, Mambaling, Cebu City',
    icon: <Anchor size={15} />,
    badgeBg: '#F5F3FF',
    badgeColor: '#6D28D9',
    badgeBorder: '#DDD6FE'
  },
  {
    id: 'UC PRI',
    name: 'University of Cebu - PRI (JHS & SHS)',
    shortName: 'UC PRI',
    subtitle: 'Basic Education, JHS & SHS Campus',
    icon: <GraduationCap size={15} />,
    badgeBg: '#ECFDF5',
    badgeColor: '#065F46',
    badgeBorder: '#6EE7B7'
  },
  {
    id: 'UC Pardo-Talisay',
    name: 'University of Cebu - Pardo-Talisay',
    shortName: 'UC Pardo-Talisay',
    subtitle: 'Bulacao, Pardo, Cebu City',
    icon: <Building2 size={15} />,
    badgeBg: '#F0F9FF',
    badgeColor: '#0369A1',
    badgeBorder: '#BAE6FD'
  },
  {
    id: 'UC South Campus',
    name: 'University of Cebu - South Campus',
    shortName: 'UC South Campus',
    subtitle: 'Sanciangko & South Area, Cebu City',
    icon: <Compass size={15} />,
    badgeBg: '#F0FDFA',
    badgeColor: '#0F766E',
    badgeBorder: '#99F6E4'
  },
  {
    id: 'UC Medical Center',
    name: 'University of Cebu - Medical Center (UCMed)',
    shortName: 'UC Medical Center',
    subtitle: 'Subangdaku, Mandaue City',
    icon: <HeartPulse size={15} />,
    badgeBg: '#FFF1F2',
    badgeColor: '#BE123C',
    badgeBorder: '#FECDD3'
  }
];

interface CampusDropdownProps {
  value?: string;
  onChange: (campus: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  allowAll?: boolean;
  allLabel?: string;
  size?: 'sm' | 'md';
}

export const CampusDropdown: React.FC<CampusDropdownProps> = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select UC Campus',
  className = '',
  id,
  allowAll = false,
  allLabel = 'All Campuses',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCampus = useMemo(() => {
    if (allowAll && (value === 'All' || value === 'all' || !value)) {
      return {
        id: 'All',
        name: allLabel,
        shortName: allLabel,
        subtitle: 'Browse listings across all UC campuses',
        icon: <Building2 size={15} />,
        badgeBg: '#F1F5F9',
        badgeColor: '#334155',
        badgeBorder: '#CBD5E1'
      };
    }
    return CAMPUS_OPTIONS.find((c) => c.id === value || c.shortName === value);
  }, [value, allowAll, allLabel]);

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

  const filteredOptions = useMemo(() => {
    let list = CAMPUS_OPTIONS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery]);

  const handleSelect = (campusId: string) => {
    onChange(campusId);
    setIsOpen(false);
    setSearchQuery('');
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
          {selectedCampus ? (
            <>
              <div
                style={{
                  width: isSmall ? '24px' : '28px',
                  height: isSmall ? '24px' : '28px',
                  borderRadius: '7px',
                  backgroundColor: selectedCampus.badgeBg,
                  color: selectedCampus.badgeColor,
                  border: `1px solid ${selectedCampus.badgeBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {selectedCampus.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: isSmall ? '0.8rem' : '0.85rem',
                    color: 'var(--text-primary, #0F172A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {selectedCampus.shortName}
                </div>
                {!isSmall && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted, #64748B)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {selectedCampus.subtitle}
                  </div>
                )}
              </div>
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
                placeholder="Search campus or location..."
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
                  onMouseEnter={(e) => {
                    if (value !== 'All') e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #F8FAFC)';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== 'All') e.currentTarget.style.backgroundColor = 'transparent';
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
                    <Building2 size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                      {allLabel}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748B)' }}>
                      Show items across all University of Cebu campuses
                    </div>
                  </div>
                  {(value === 'All' || !value) && <Check size={14} style={{ color: 'var(--uc-blue, #002B7F)' }} />}
                </button>
              )}

              {filteredOptions.map((c) => {
                const isSelected = value === c.id || value === c.shortName;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
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
                        backgroundColor: c.badgeBg,
                        color: c.badgeColor,
                        border: `1px solid ${c.badgeBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {c.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 800 : 700,
                          color: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary, #0F172A)'
                        }}
                      >
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748B)' }}>
                        {c.subtitle}
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--uc-blue, #002B7F)' }} />}
                  </button>
                );
              })}

              {filteredOptions.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted, #64748B)' }}>
                  No campus matches your search.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

