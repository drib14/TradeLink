import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'blue';
  showTooltip?: boolean;
  tooltipText?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  variant = 'gold',
  showTooltip = true,
  tooltipText = 'Verified UC Student • Campus ID & Enrollment Confirmed'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const dimensionMap = {
    xs: 14,
    sm: 17,
    md: 20,
    lg: 24
  };

  const currentSize = dimensionMap[size];
  const isBlue = variant === 'blue';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        cursor: showTooltip ? 'help' : 'default',
        marginLeft: '0.2rem'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Official Circular Gold / Blue Verified Badge */}
      <svg
        width={currentSize}
        height={currentSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isBlue
            ? 'drop-shadow(0 1px 2px rgba(0, 43, 127, 0.35))'
            : 'drop-shadow(0 1px 3px rgba(229, 168, 0, 0.45))',
          transition: 'transform 0.15s ease'
        }}
      >
        <defs>
          <linearGradient id="verifiedGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="45%" stopColor="#FFC72C" />
            <stop offset="100%" stopColor="#D49400" />
          </linearGradient>
          <linearGradient id="verifiedBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A3EA8" />
            <stop offset="100%" stopColor="#002B7F" />
          </linearGradient>
        </defs>

        {/* Smooth Circular Badge */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill={isBlue ? 'url(#verifiedBlueGrad)' : 'url(#verifiedGoldGrad)'}
          stroke={isBlue ? '#BCD1F7' : '#FFE082'}
          strokeWidth="1"
        />

        {/* Crisp Checkmark */}
        <path
          d="M7.5 12.2L10.5 15.2L16.5 9"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Popover Tooltip */}
      {showTooltip && isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#001D59',
            color: '#FFFFFF',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 10px 20px rgba(0, 43, 127, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            pointerEvents: 'none',
            border: '1px solid rgba(255, 199, 44, 0.4)'
          }}
        >
          <ShieldCheck size={13} color="#FFC72C" />
          <span>{tooltipText}</span>
        </div>
      )}
    </span>
  );
};
