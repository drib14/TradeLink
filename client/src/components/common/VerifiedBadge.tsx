import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'green' | 'gold' | 'blue';
  showTooltip?: boolean;
  tooltipText?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  variant = 'green',
  showTooltip = true,
  tooltipText = 'Verified Student'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const dimensionMap = {
    xs: 15,
    sm: 17,
    md: 20,
    lg: 24
  };

  const currentSize = dimensionMap[size];
  const badgeColor = variant === 'green' ? '#10B981' : variant === 'gold' ? '#F59E0B' : '#2563EB';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        cursor: showTooltip ? 'help' : 'default',
        flexShrink: 0,
        lineHeight: 1
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={tooltipText}
    >
      {/* Clean Modern Geometric Verified Disc */}
      <svg
        width={currentSize}
        height={currentSize}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          flexShrink: 0
        }}
      >
        <circle cx="10" cy="10" r="9" fill={badgeColor} />
        <path
          d="M6.2 10.2L8.7 12.7L14.2 7.2"
          stroke="#FFFFFF"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

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
            fontWeight: 700,
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            pointerEvents: 'none'
          }}
        >
          <ShieldCheck size={13} color="#10B981" />
          <span>{tooltipText}</span>
        </div>
      )}
    </span>
  );
};
