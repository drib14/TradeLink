import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  size = 'md',
  className = '',
  id,
  ariaLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === value) || null;
  }, [options, value]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < 240 && spaceAbove > 180;

    const estimatedHeight = Math.min(options.length * 42 + 20, 260);
    const top = shouldOpenUp
      ? Math.max(10, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - estimatedHeight - 10, rect.bottom + 6);

    const left = Math.max(10, Math.min(rect.left, window.innerWidth - rect.width - 10));
    const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 20);

    setCoords({
      top,
      left,
      width,
      openUpward: shouldOpenUp
    });
  }, [options.length]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);

      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span style={{ color: 'var(--uc-blue, #002B7F)', display: 'inline-flex', flexShrink: 0 }}>
                  {selectedOption.icon}
                </span>
              )}
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
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    backgroundColor: selectedOption.badgeBg || '#F1F5F9',
                    color: selectedOption.badgeColor || '#475569'
                  }}
                >
                  {selectedOption.badge}
                </span>
              )}
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

      {/* Floating portal menu */}
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
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '0.35rem',
              gap: '0.2rem',
              animation: 'popoverIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
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
                  {opt.icon && (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#DBEAFE' : 'rgba(0, 43, 127, 0.06)',
                        color: 'var(--uc-blue, #002B7F)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {opt.icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary, #0F172A)'
                      }}
                    >
                      {opt.label}
                    </div>
                    {opt.subtitle && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748B)' }}>
                        {opt.subtitle}
                      </div>
                    )}
                  </div>
                  {opt.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        backgroundColor: opt.badgeBg || '#F1F5F9',
                        color: opt.badgeColor || '#475569'
                      }}
                    >
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check size={14} style={{ color: 'var(--uc-blue, #002B7F)' }} />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

