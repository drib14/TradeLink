import React from 'react';

interface TradeLinkIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  withContainer?: boolean;
}

export const TradeLinkIcon: React.FC<TradeLinkIconProps> = ({
  size = 32,
  className = '',
  style = {},
  withContainer = true
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
    >
      <defs>
        {/* UC Royal Navy Background Gradient */}
        <linearGradient id="admin_tlicon_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A369D" />
          <stop offset="60%" stopColor="#002B7F" />
          <stop offset="100%" stopColor="#00184A" />
        </linearGradient>

        {/* Radiant Gold Gradient */}
        <linearGradient id="admin_tlicon_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#FFC72C" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Crisp White Gradient */}
        <linearGradient id="admin_tlicon_white" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        {/* Subtle Drop Shadow */}
        <filter id="admin_tlicon_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#000E2E" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Modern Squircle App Icon Container */}
      {withContainer && (
        <>
          <rect width="512" height="512" rx="128" fill="url(#admin_tlicon_bg)" />
          <rect
            width="506"
            height="506"
            x="3"
            y="3"
            rx="125"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="2.5"
          />
        </>
      )}

      {/* Clean Bold Flat "tl" Lettermark Mark */}
      <g filter="url(#admin_tlicon_shadow)">
        {/* Crisp White 't' - Facing Right */}
        <path
          d="M 186 155 C 186 140 198 128 213 128 C 228 128 240 140 240 155 L 240 195 L 268 195 C 283 195 295 207 295 222 C 295 237 283 249 268 249 L 240 249 L 240 325 C 240 348 252 362 272 362 C 284 362 294 357 302 350 C 313 340 330 340 340 350 C 350 360 350 377 340 387 C 322 403 300 412 272 412 C 222 412 186 376 186 325 L 186 249 L 158 249 C 143 249 131 237 131 222 C 131 207 143 195 158 195 L 186 195 Z"
          fill="url(#admin_tlicon_white)"
        />

        {/* Radiant Gold 'l' */}
        <path
          d="M 352 108 C 367 108 379 120 379 135 L 379 385 C 379 400 367 412 352 412 C 337 412 325 400 325 385 L 325 135 C 325 120 337 108 352 108 Z"
          fill="url(#admin_tlicon_gold)"
        />

        {/* Radiant Gold Nexus Dot */}
        <circle cx="282.5" cy="150" r="22" fill="url(#admin_tlicon_gold)" />
      </g>
    </svg>
  );
};
