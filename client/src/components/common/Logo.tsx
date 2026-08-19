import React from 'react';
import { TradeLinkIcon } from './TradeLinkIcon';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'text-only' | 'with-mark' | 'mark-only';
  isDark?: boolean;
  iconOnlyOnMobile?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = false,
  variant = 'with-mark',
  isDark = false,
  iconOnlyOnMobile = false
}) => {
  const fontSizes = {
    sm: '1.28rem',
    md: '1.65rem',
    lg: '2.1rem',
    xl: '2.6rem'
  };

  const iconSizes = {
    sm: 28,
    md: 34,
    lg: 44,
    xl: 56
  };

  const currentIconSize = iconSizes[size];

  if (variant === 'mark-only') {
    return <TradeLinkIcon size={currentIconSize} />;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        userSelect: 'none'
      }}
    >
      {variant === 'with-mark' && (
        <TradeLinkIcon size={currentIconSize} />
      )}

      <div
        className={iconOnlyOnMobile ? 'desktop-only' : ''}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1, letterSpacing: '-0.035em' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: fontSizes[size],
              color: isDark ? '#FFFFFF' : '#002B7F',
              letterSpacing: '-0.035em'
            }}
          >
            Trade
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: fontSizes[size],
              color: '#FFC72C',
              letterSpacing: '-0.035em'
            }}
          >
            Link
          </span>
          {/* Subtle nexus dot */}
          <span
            style={{
              display: 'inline-block',
              width: size === 'sm' ? '5px' : size === 'md' ? '6px' : '7px',
              height: size === 'sm' ? '5px' : size === 'md' ? '6px' : '7px',
              borderRadius: '50%',
              backgroundColor: '#FFC72C',
              marginLeft: '2px',
              marginBottom: '2px',
              alignSelf: 'flex-end',
              boxShadow: '0 0 6px rgba(255, 199, 44, 0.6)'
            }}
          />
        </div>

        {showSubtitle && (
          <span
            style={{
              fontSize: size === 'sm' ? '0.62rem' : size === 'md' ? '0.7rem' : '0.8rem',
              color: isDark ? '#CBD5E1' : '#64748B',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: '0.22rem'
            }}
          >
            Campus Marketplace & Barter
          </span>
        )}
      </div>
    </div>
  );
};
