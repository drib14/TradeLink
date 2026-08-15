import React, { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'blue' | 'green';
  showTooltip?: boolean;
  tooltipText?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  variant = 'blue',
  showTooltip = true,
  tooltipText = 'Verified UC Student'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const dimensionMap = {
    xs: 13,
    sm: 15,
    md: 18,
    lg: 22
  };

  const currentSize = dimensionMap[size];
  const bgColor = variant === 'gold' ? '#D97706' : variant === 'green' ? '#059669' : '#002B7F';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        cursor: showTooltip ? 'help' : 'default',
        marginLeft: '0.25rem',
        flexShrink: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={tooltipText}
    >
      <span
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          borderRadius: '50%',
          backgroundColor: bgColor,
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Check size={currentSize * 0.65} strokeWidth={3} />
      </span>

      {/* Popover Tooltip */}
      {showTooltip && isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            pointerEvents: 'none'
          }}
        >
          <ShieldCheck size={12} color="#FFC72C" />
          <span>{tooltipText}</span>
        </div>
      )}
    </span>
  );
};

