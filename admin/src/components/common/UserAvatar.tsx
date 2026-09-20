import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  style?: React.CSSProperties;
  showOnline?: boolean;
  isOnline?: boolean;
  alt?: string;
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80
};

const FONT_SIZE_MAP: Record<string, string> = {
  xs: '0.62rem',
  sm: '0.75rem',
  md: '0.88rem',
  lg: '1.2rem',
  xl: '1.75rem'
};

const SOLID_COLORS = [
  '#002B7F',
  '#001D59',
  '#0A3EA8',
  '#0F172A',
  '#1E293B'
];

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'Admin',
  size = 'md',
  className = '',
  style = {},
  showOnline = false,
  isOnline = false,
  alt
}) => {
  const [hasError, setHasError] = useState(false);

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || 40;
  const fontSize = typeof size === 'number' ? `${Math.round(dimension * 0.4)}px` : FONT_SIZE_MAP[size] || '0.88rem';

  const getInitials = (str: string): string => {
    if (!str) return 'A';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SOLID_COLORS.length;
    return SOLID_COLORS[index];
  };

  const hasValidImage = !!src && !hasError && src.trim().length > 0;

  return (
    <div
      className={`admin-avatar-wrapper ${className}`}
      style={{
        position: 'relative',
        width: `${dimension}px`,
        height: `${dimension}px`,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {hasValidImage ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: getColor(name),
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize,
            letterSpacing: '-0.02em',
            fontFamily: 'inherit',
            border: '1.5px solid #FFC72C'
          }}
        >
          {getInitials(name)}
        </div>
      )}

      {showOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: `${Math.max(8, Math.round(dimension * 0.26))}px`,
            height: `${Math.max(8, Math.round(dimension * 0.26))}px`,
            borderRadius: '50%',
            backgroundColor: isOnline ? '#059669' : '#94A3B8',
            border: '2px solid #FFFFFF'
          }}
        />
      )}
    </div>
  );
};
