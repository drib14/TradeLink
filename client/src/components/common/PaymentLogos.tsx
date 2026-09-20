import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official GCash Brand Emblem SVG
 * Characteristic blue rounded sphere with white inner stylized 'g'
 */
export const GCashLogo: React.FC<LogoProps> = ({ size = 24, className = '', style = {} }) => {
  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;

  return (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-label="GCash"
      role="img"
    >
      <circle cx="24" cy="24" r="23" fill="#005CEE" />
      {/* GCash stylized 'g' and signal arcs */}
      <path
        d="M24 10C16.268 10 10 16.268 10 24C10 31.732 16.268 38 24 38C29.6 38 34.45 34.73 36.68 30.04L30.98 28.05C29.74 30.7 27.08 32.5 24 32.5C19.306 32.5 15.5 28.694 15.5 24C15.5 19.306 19.306 15.5 24 15.5C27.08 15.5 29.74 17.3 30.98 19.95L36.68 17.96C34.45 13.27 29.6 10 24 10Z"
        fill="white"
      />
      <path
        d="M33 22H24V26H38C38 24.6 37.8 23.3 37.4 22H33Z"
        fill="white"
      />
    </svg>
  );
};

/**
 * Official Maya (formerly PayMaya) Brand Emblem SVG
 * Signature ultra-black background with vibrant electric neon green fluid logo
 */
export const MayaLogo: React.FC<LogoProps> = ({ size = 24, className = '', style = {} }) => {
  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;

  return (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-label="Maya"
      role="img"
    >
      <rect width="48" height="48" rx="12" fill="#0A0D14" />
      {/* Maya signature lime dynamic 'm' ribbon */}
      <path
        d="M11 31V17C11 15.343 12.343 14 14 14C15.657 14 17 15.343 17 17V27C17 28.105 17.895 29 19 29C20.105 29 21 28.105 21 27V19C21 17.343 22.343 16 24 16C25.657 16 27 17.343 27 19V27C27 28.105 27.895 29 29 29C30.105 29 31 28.105 31 27V17C31 15.343 32.343 14 34 14C35.657 14 37 15.343 37 17V31C37 32.657 35.657 34 34 34C32.343 34 31 32.657 31 31V30.5C30.1 31.8 28.6 33 26.5 33C24.4 33 23 31.9 22 30.6C21 31.9 19.6 33 17.5 33C14 33 11 30.5 11 27V31C11 32.657 9.657 34 8 34"
        fill="#00E676"
      />
      <circle cx="15.5" cy="24" r="3.5" fill="#00FF7F" />
      <circle cx="25.5" cy="23" r="3.5" fill="#00FF7F" />
      <path
        d="M13 32.5C13 30 16 28 20 28C24 28 27 30 27 32.5"
        stroke="#00E676"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M23 32.5C23 30 26 28 30 28C34 28 37 30 37 32.5"
        stroke="#00FF7F"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Official Cash on Meetup / Handover Emblem SVG
 * Green banknote with Philippine Peso symbol
 */
export const CashLogo: React.FC<LogoProps> = ({ size = 24, className = '', style = {} }) => {
  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;

  return (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-label="Cash on Meetup"
      role="img"
    >
      <rect x="3" y="10" width="42" height="28" rx="6" fill="#059669" />
      <rect x="5" y="12" width="38" height="24" rx="4" fill="#10B981" />
      <rect x="7" y="14" width="34" height="20" rx="3" stroke="#D1FAE5" strokeWidth="1.5" strokeDasharray="2 2" />
      {/* Central Peso medallion */}
      <circle cx="24" cy="24" r="8" fill="#047857" />
      <circle cx="24" cy="24" r="6.8" fill="#ECFDF5" />
      {/* Philippine Peso symbol ₱ */}
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#065F46"
      >
        ₱
      </text>
      {/* Corner security accents */}
      <circle cx="10" cy="18" r="1.5" fill="#D1FAE5" />
      <circle cx="38" cy="18" r="1.5" fill="#D1FAE5" />
      <circle cx="10" cy="30" r="1.5" fill="#D1FAE5" />
      <circle cx="38" cy="30" r="1.5" fill="#D1FAE5" />
    </svg>
  );
};

/**
 * GrabPay Brand Emblem SVG (Optional for extended PH wallet support)
 */
export const GrabPayLogo: React.FC<LogoProps> = ({ size = 24, className = '', style = {} }) => {
  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;

  return (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-label="GrabPay"
      role="img"
    >
      <circle cx="24" cy="24" r="23" fill="#00B14F" />
      <path
        d="M26 14C19.37 14 14 19.37 14 26C14 32.63 19.37 38 26 38C30.31 38 34.1 35.72 36.23 32.28L31.62 29.8C30.41 31.75 28.34 33 26 33C22.13 33 19 29.87 19 26C19 22.13 22.13 19 26 19C28.34 19 30.41 20.25 31.62 22.2L36.23 19.72C34.1 16.28 30.31 14 26 14Z"
        fill="white"
      />
      <rect x="25" y="23" width="13" height="5" rx="2.5" fill="white" />
    </svg>
  );
};

/**
 * Official Bank Transfer / InstaPay Emblem SVG
 * Indigo badge with classical pillars representing Philippine bank transfers (BDO, BPI, UnionBank, etc.)
 */
export const BankTransferLogo: React.FC<LogoProps> = ({ size = 24, className = '', style = {} }) => {
  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;

  return (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-label="Bank Transfer"
      role="img"
    >
      <rect width="48" height="48" rx="12" fill="#4338CA" />
      <path d="M24 11L10 18V20H38V18L24 11Z" fill="white" />
      <rect x="13" y="22" width="4" height="12" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="22" y="22" width="4" height="12" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="31" y="22" width="4" height="12" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="10" y="36" width="28" height="3" rx="1" fill="white" />
    </svg>
  );
};

export type ValidPaymentMethod = 'cash' | 'gcash' | 'maya' | 'bank_transfer' | 'grabpay';

interface PaymentBadgeProps {
  method: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Elegant brand pill badge displaying official logo and name
 */
export const PaymentMethodBadge: React.FC<PaymentBadgeProps> = ({
  method,
  size = 'sm',
  showLabel = true,
  className = '',
  style = {}
}) => {
  const normalized = (method || '').toLowerCase().trim();

  let logoSize = 16;
  let fontSize = '0.72rem';
  let padding = '0.2rem 0.55rem';

  if (size === 'xs') {
    logoSize = 13;
    fontSize = '0.65rem';
    padding = '0.15rem 0.45rem';
  } else if (size === 'md') {
    logoSize = 20;
    fontSize = '0.8rem';
    padding = '0.35rem 0.75rem';
  } else if (size === 'lg') {
    logoSize = 24;
    fontSize = '0.88rem';
    padding = '0.5rem 1rem';
  }

  if (normalized.includes('gcash')) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE',
          borderRadius: '9999px',
          padding,
          fontSize,
          fontWeight: 800,
          letterSpacing: '0.01em',
          boxShadow: '0 1px 2px rgba(0, 92, 238, 0.08)',
          ...style
        }}
      >
        <GCashLogo size={logoSize} />
        {showLabel && <span>GCash</span>}
      </span>
    );
  }

  if (normalized.includes('maya')) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#0F172A',
          color: '#4ADE80',
          border: '1px solid #1E293B',
          borderRadius: '9999px',
          padding,
          fontSize,
          fontWeight: 800,
          letterSpacing: '0.01em',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          ...style
        }}
      >
        <MayaLogo size={logoSize} />
        {showLabel && <span>Maya</span>}
      </span>
    );
  }

  if (normalized.includes('grab')) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#F0FDF4',
          color: '#15803D',
          border: '1px solid #BBF7D0',
          borderRadius: '9999px',
          padding,
          fontSize,
          fontWeight: 800,
          letterSpacing: '0.01em',
          ...style
        }}
      >
        <GrabPayLogo size={logoSize} />
        {showLabel && <span>GrabPay</span>}
      </span>
    );
  }

  if (normalized.includes('bank') || normalized.includes('transfer')) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#EEF2FF',
          color: '#4338CA',
          border: '1px solid #C7D2FE',
          borderRadius: '9999px',
          padding,
          fontSize,
          fontWeight: 800,
          letterSpacing: '0.01em',
          boxShadow: '0 1px 2px rgba(67, 56, 202, 0.08)',
          ...style
        }}
      >
        <BankTransferLogo size={logoSize} />
        {showLabel && <span>Bank Transfer</span>}
      </span>
    );
  }

  // Default: Cash on Meetup / Handover
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        backgroundColor: '#ECFDF5',
        color: '#047857',
        border: '1px solid #A7F3D0',
        borderRadius: '9999px',
        padding,
        fontSize,
        fontWeight: 800,
        letterSpacing: '0.01em',
        boxShadow: '0 1px 2px rgba(16, 185, 129, 0.08)',
        ...style
      }}
    >
      <CashLogo size={logoSize} />
      {showLabel && <span>Cash on Meetup</span>}
    </span>
  );
};

interface PaymentSelectorProps {
  selected: string;
  onSelect: (method: 'cash' | 'gcash' | 'maya') => void;
  disabled?: boolean;
  availableMethods?: ('cash' | 'gcash' | 'maya')[];
}

/**
 * Interactive selector strictly presenting GCash, Maya, and Cash on Meetup
 */
export const PaymentMethodSelector: React.FC<PaymentSelectorProps> = ({
  selected,
  onSelect,
  disabled = false,
  availableMethods
}) => {
  const allOptions = [
    {
      id: 'cash' as const,
      label: 'Cash on Meetup',
      tagline: 'Handover in person',
      logo: <CashLogo size={28} />,
      badge: 'Zero Fee',
      bgActive: '#F0FDF4',
      borderActive: '#10B981'
    },
    {
      id: 'gcash' as const,
      label: 'GCash',
      tagline: 'Scan / send via QR',
      logo: <GCashLogo size={28} />,
      badge: 'Instant QR',
      bgActive: '#EFF6FF',
      borderActive: '#005CEE'
    },
    {
      id: 'maya' as const,
      label: 'Maya',
      tagline: 'e-Wallet transfer',
      logo: <MayaLogo size={28} />,
      badge: 'Zero Fee',
      bgActive: '#F8FAFC',
      borderActive: '#0A0D14'
    }
  ];

  const options = availableMethods && availableMethods.length > 0
    ? allOptions.filter((opt) => availableMethods.includes(opt.id))
    : allOptions;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.max(1, options.length)}, 1fr)`,
      gap: '0.65rem'
    }}>
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.85rem 0.6rem',
              borderRadius: '12px',
              border: isSelected
                ? `2px solid ${opt.borderActive}`
                : '1.5px solid var(--border-subtle, #E2E8F0)',
              backgroundColor: isSelected ? opt.bgActive : 'var(--bg-surface, #FFFFFF)',
              color: 'var(--text-primary, #0F172A)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSelected
                ? '0 4px 12px rgba(0, 43, 127, 0.1)'
                : '0 1px 2px rgba(0, 0, 0, 0.02)',
              position: 'relative',
              textAlign: 'center',
              minHeight: '100px'
            }}
          >
            {isSelected && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: opt.borderActive
                }}
              />
            )}
            <div style={{ marginBottom: '0.45rem' }}>{opt.logo}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.2 }}>
              {opt.label}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
              {opt.tagline}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export interface PaymentMethodCheckboxGroupProps {
  selectedMethods: ('cash' | 'gcash' | 'maya' | 'bank_transfer')[];
  onChange: (methods: ('cash' | 'gcash' | 'maya' | 'bank_transfer')[]) => void;
  disabled?: boolean;
}

/**
 * Custom-styled Payment Method Checkbox Group for Sellers & Students
 * Features custom branded tiles with official SVG emblems, animated checkmarks, and single-method guard.
 * Strictly excludes cards since peer-to-peer campus trades do not use credit gateways.
 */
export const PaymentMethodCheckboxGroup: React.FC<PaymentMethodCheckboxGroupProps> = ({
  selectedMethods = ['cash', 'gcash', 'maya', 'bank_transfer'],
  onChange,
  disabled = false
}) => {
  const methods = [
    {
      id: 'cash' as const,
      title: 'Cash on Meetup',
      subtitle: 'In-person cash handover at campus spot',
      logo: <CashLogo size={32} />,
      accentColor: '#10B981',
      bgSelected: '#F0FDF4',
      badge: 'Zero Fee'
    },
    {
      id: 'gcash' as const,
      title: 'GCash',
      subtitle: 'Direct peer-to-peer e-Wallet QR transfer',
      logo: <GCashLogo size={32} />,
      accentColor: '#005CEE',
      bgSelected: '#EFF6FF',
      badge: 'Instant QR'
    },
    {
      id: 'maya' as const,
      title: 'Maya',
      subtitle: 'Fast e-Wallet transfer or Maya scan',
      logo: <MayaLogo size={32} />,
      accentColor: '#0A0D14',
      bgSelected: '#F8FAFC',
      badge: 'Zero Fee'
    },
    {
      id: 'bank_transfer' as const,
      title: 'Bank Transfer',
      subtitle: 'InstaPay or online banking QR transfer',
      logo: <BankTransferLogo size={32} />,
      accentColor: '#4338CA',
      bgSelected: '#EEF2FF',
      badge: 'InstaPay'
    }
  ];

  const handleToggle = (id: 'cash' | 'gcash' | 'maya' | 'bank_transfer') => {
    if (disabled) return;
    const exists = selectedMethods.includes(id);
    if (exists) {
      // Must keep at least 1 method selected
      if (selectedMethods.length <= 1) return;
      onChange(selectedMethods.filter((m) => m !== id));
    } else {
      onChange([...selectedMethods, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {methods.map((method) => {
          const isChecked = selectedMethods.includes(method.id);
          const isOnlyOneLeft = isChecked && selectedMethods.length === 1;

          return (
            <div
              key={method.id}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleToggle(method.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleToggle(method.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                border: isChecked
                  ? `2px solid ${method.accentColor}`
                  : '1.5px solid var(--border-subtle, #E2E8F0)',
                backgroundColor: isChecked ? method.bgSelected : 'var(--bg-surface, #FFFFFF)',
                cursor: disabled ? 'not-allowed' : (isOnlyOneLeft ? 'not-allowed' : 'pointer'),
                boxShadow: isChecked
                  ? '0 4px 14px rgba(0, 43, 127, 0.08)'
                  : '0 1px 3px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none',
                position: 'relative'
              }}
            >
              {/* Custom Branded Checkbox Icon */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '7px',
                  border: isChecked
                    ? `2px solid ${method.accentColor}`
                    : '2px solid var(--border-subtle, #CBD5E1)',
                  backgroundColor: isChecked ? method.accentColor : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.18s ease'
                }}
              >
                {isChecked && (
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path
                      d="M1.5 5L4.8 8.3L11.5 1.5"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Brand Logo */}
              <div style={{ flexShrink: 0 }}>
                {method.logo}
              </div>

              {/* Text Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {method.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(0, 43, 127, 0.08)',
                      color: 'var(--uc-blue)'
                    }}
                  >
                    {method.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.25 }}>
                  {method.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        <span>Peers will settle transactions using the methods you select here.</span>
        <span style={{ fontWeight: 700, color: selectedMethods.length === 1 ? '#F59E0B' : 'var(--text-muted)' }}>
          {selectedMethods.length} of 4 accepted {selectedMethods.length === 1 && '(Minimum 1 required)'}
        </span>
      </div>
    </div>
  );
};

