import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, Building2, X } from 'lucide-react';
import { DEPARTMENTS, Department, getDepartment } from '../../constants/departments';

interface DepartmentDropdownProps {
  value?: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  direction?: 'auto' | 'up' | 'down';
}

export const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value = '',
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select your UC College / Department',
  className = '',
  id,
  direction = 'auto'
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

  // Position calculation with viewport boundary detection
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = direction === 'up' || (direction === 'auto' && spaceBelow < 330 && spaceAbove > 260);

    const estimatedHeight = 320;
    const top = shouldOpenUp
      ? Math.max(10, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - estimatedHeight - 10, rect.bottom + 6);

    const left = Math.max(10, Math.min(rect.left, window.innerWidth - rect.width - 10));
    const width = Math.min(rect.width, window.innerWidth - 20);

    setCoords({
      top,
      left,
      width,
      openUpward: shouldOpenUp
    });
  }, [direction]);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);

      // Auto-focus search input with smooth delay
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

  // Active selected department
  const selectedDept: Department | undefined = useMemo(() => {
    return getDepartment(value);
  }, [value]);

  // Filtered list
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return DEPARTMENTS;
    const query = searchQuery.trim().toLowerCase();
    return DEPARTMENTS.filter(
      (dept) =>
        dept.code.toLowerCase().includes(query) ||
        dept.name.toLowerCase().includes(query) ||
        dept.shortName.toLowerCase().includes(query) ||
        dept.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Close when clicking outside both trigger button and portaled popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`department-dropdown-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Hidden input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            height: 0,
            width: 0,
            bottom: 0
          }}
          tabIndex={-1}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          padding: '0.65rem 0.85rem',
          backgroundColor: disabled ? 'var(--bg-subtle)' : 'var(--bg-surface)',
          border: `1.5px solid ${isOpen ? 'var(--uc-blue)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 43, 127, 0.12)' : 'var(--shadow-xs)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          textAlign: 'left',
          color: 'var(--text-primary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          {selectedDept ? (
            <>
              <img
                src={selectedDept.logo}
                alt={`${selectedDept.code} badge`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--uc-blue)',
                      backgroundColor: 'var(--uc-blue-subtle)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-xs)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    {selectedDept.code}
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {selectedDept.name}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--uc-blue-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--uc-blue)'
                }}
              >
                <Building2 size={18} />
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}
              >
                {placeholder}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
          {selectedDept && !disabled && (
            <span
              onClick={handleClear}
              title="Clear selection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted)',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'none'
            }}
          />
        </div>
      </button>

      {/* Portaled Popover Menu — Floats completely outside parent containers & modals */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: '320px',
              zIndex: 9999999,
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              border: '1.5px solid var(--border-strong, #CBD5E1)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: '0 20px 40px -8px rgba(0, 43, 127, 0.22), 0 0 1px 1px rgba(0, 43, 127, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Search Bar */}
            <div
              style={{
                padding: '0.65rem 0.8rem',
                borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by college or code (e.g. CCS, Law, SHS)..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department List with High-Performance Scroll */}
            <div
              className="custom-scrollbar"
              style={{
                overflowY: 'auto',
                flex: 1,
                padding: '0.35rem 0',
                overscrollBehavior: 'contain'
              }}
            >
              {filteredDepartments.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem'
                  }}
                >
                  No matching UC college or strand found for "{searchQuery}".
                </div>
              ) : (
                filteredDepartments.map((dept) => {
                  const isSelected = selectedDept?.code === dept.code;
                  return (
                    <div
                      key={dept.code}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(dept.code)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.55rem 0.85rem',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--uc-blue, #002B7F)' : '3px solid transparent',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover, #F1F5F9)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <img
                          src={dept.logo}
                          alt={`${dept.code} logo`}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'contain',
                            flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                color: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary)',
                                backgroundColor: isSelected ? '#FFFFFF' : 'var(--uc-blue-subtle, #EBF1FC)',
                                padding: '0.08rem 0.38rem',
                                borderRadius: 'var(--radius-xs, 4px)',
                                letterSpacing: '0.02em'
                              }}
                            >
                              {dept.code}
                            </span>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: isSelected ? 700 : 600,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {dept.name}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: '0.15rem 0 0 0',
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {dept.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <Check
                          size={16}
                          style={{ color: 'var(--uc-blue, #002B7F)', flexShrink: 0, strokeWidth: 2.5 }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
