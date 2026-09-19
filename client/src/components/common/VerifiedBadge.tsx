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
  
  // Facebook-style official verified seal color (Emerald Green as requested)
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
      {/* Official Facebook/Meta Scalloped Verified Seal */}
      <svg
        width={currentSize}
        height={currentSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          flexShrink: 0,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))'
        }}
      >
        {/* Scalloped Verified Seal Petals */}
        <path
          d="M 12 1.5 C 13.4 1.5 14.6 2.4 15.2 3.6 C 16.6 3.4 17.9 3.9 18.8 4.8 C 19.7 5.7 20.2 7.0 20.0 8.4 C 21.2 9.0 22.1 10.2 22.1 11.6 C 22.1 13.0 21.2 14.2 20.0 14.8 C 20.2 16.2 19.7 17.5 18.8 18.4 C 17.9 19.3 16.6 19.8 15.2 19.6 C 14.6 20.8 13.4 21.7 12 21.7 C 10.6 21.7 9.4 20.8 8.8 19.6 C 7.4 19.8 6.1 19.3 5.2 18.4 C 4.3 17.5 3.8 16.2 4.0 14.8 C 2.8 14.2 1.9 13.0 1.9 11.6 C 1.9 10.2 2.8 9.0 4.0 8.4 C 3.8 7.0 4.3 5.7 5.2 4.8 C 6.1 3.9 7.4 3.4 8.8 3.6 C 9.4 2.4 10.6 1.5 12 1.5 Z"
          fill={badgeColor}
        />
        {/* Crisp Center Checkmark */}
        <path
          d="M 7.8 11.8 L 10.6 14.6 L 16.4 8.6"
          stroke="#FFFFFF"
          strokeWidth="2.4"
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
