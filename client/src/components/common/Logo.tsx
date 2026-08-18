import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'full' | 'emblem-only' | 'text-only';
  isDark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, variant = 'full', isDark = false }) => {
  const iconDimensions = {
    sm: { width: 44, height: 32 },
    md: { width: 56, height: 40 },
    lg: { width: 72, height: 52 }
  };

  const textSizes = {
    sm: '1.2rem',
    md: '1.45rem',
    lg: '1.85rem'
  };

  const currentDim = iconDimensions[size];

  const [imgError, setImgError] = React.useState(false);

  const UCEmblem = !imgError ? (
    <img
      src="/uc-logo.png"
      alt="University of Cebu Emblem"
      onError={() => setImgError(true)}
      style={{
        width: currentDim.width,
        height: currentDim.height,
        objectFit: 'contain',
        flexShrink: 0
      }}
    />
  ) : (
    <div
      style={{
        width: currentDim.width,
        height: currentDim.height,
        borderRadius: '8px',
        backgroundColor: '#002B7F',
        color: '#FFC72C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: size === 'sm' ? '0.85rem' : size === 'md' ? '1.05rem' : '1.3rem',
        letterSpacing: '-0.02em',
        flexShrink: 0,
        border: '1.5px solid #FFC72C'
      }}
    >
      UC
    </div>
  );

  if (variant === 'emblem-only') return UCEmblem;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
      {variant !== 'text-only' && UCEmblem}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: textSizes[size],
              color: isDark ? '#FFFFFF' : '#002B7F',
              letterSpacing: '-0.025em'
            }}
          >
            Trade<span style={{ color: '#FFC72C' }}>Link</span>
          </span>
        </div>

        {showSubtitle && (
          <span
            style={{
              fontSize: '0.68rem',
              color: isDark ? '#94A3B8' : '#64748B',
              fontWeight: 600,
              letterSpacing: '0.02em',
              marginTop: '0.15rem'
            }}
          >
            Campus Marketplace
          </span>
        )}
      </div>
    </div>
  );
};
