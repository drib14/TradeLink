import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'full' | 'emblem-only' | 'text-only';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, variant = 'full' }) => {
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

  // Authentic University of Cebu Brand Mark (Using user-provided official logo)
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
    <svg
      width={currentDim.width}
      height={currentDim.height}
      viewBox="0 0 160 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Glow & 3D Shading for Cyan Orbit Sphere */}
        <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#99E6FF" />
          <stop offset="35%" stopColor="#00A3FF" />
          <stop offset="75%" stopColor="#0047AB" />
          <stop offset="100%" stopColor="#002166" />
        </radialGradient>

        {/* Dynamic Swoosh Gradient */}
        <linearGradient id="swooshGrad" x1="10%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#00B4D8" />
          <stop offset="40%" stopColor="#0077B6" />
          <stop offset="85%" stopColor="#023E8A" />
          <stop offset="100%" stopColor="#03045E" />
        </linearGradient>

        {/* Drop shadow for bottom text */}
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodColor="#002B7F" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Main "U" Serif Letter */}
      <path
        d="M 18 16 L 38 16 L 38 22 L 31 22 L 31 52 C 31 66 38 73 49 73 C 60 73 66 66 66 52 L 66 22 L 59 22 L 59 16 L 79 16 L 79 22 L 72 22 L 72 52 C 72 73 59 81 49 81 C 38 81 25 73 25 52 L 25 22 L 18 22 Z"
        fill="#00438F"
      />

      {/* Main "C" Serif Letter */}
      <path
        d="M 136 28 C 131 20 120 16 108 16 C 88 16 75 30 75 51 C 75 71 88 84 109 84 C 122 84 133 79 138 68 L 133 65 C 129 73 120 77 109 77 C 93 77 82 66 82 51 C 82 34 93 23 108 23 C 119 23 127 27 131 34 Z"
        fill="#00438F"
      />

      {/* Golden Globe Grid with Blue Core Dot at Top Right */}
      <g transform="translate(114, 10)">
        {/* Globe Outer Circle */}
        <ellipse cx="14" cy="14" rx="13" ry="13" stroke="#FFD000" strokeWidth="2.5" fill="none" />
        {/* Latitude & Longitude Arcs */}
        <ellipse cx="14" cy="14" rx="7" ry="13" stroke="#FFD000" strokeWidth="1.8" fill="none" />
        <line x1="1" y1="14" x2="27" y2="14" stroke="#FFD000" strokeWidth="1.8" />
        <ellipse cx="14" cy="14" rx="12" ry="7" stroke="#FFD000" strokeWidth="1.5" fill="none" />
        {/* Blue Inner Focus Core */}
        <circle cx="16" cy="11" r="5" fill="#00438F" />
      </g>

      {/* Dynamic Cyan / Blue Arc Swoosh across U and C */}
      <path
        d="M 28 82 C 34 68 56 46 95 24 C 114 14 130 10 134 11 C 132 14 116 20 93 30 C 58 49 37 72 30 84 Z"
        fill="url(#swooshGrad)"
      />

      {/* Glowing Sphere Origin at bottom left of the swoosh */}
      <circle cx="28" cy="83" r="7.5" fill="url(#sphereGrad)" filter="drop-shadow(0 2px 4px rgba(0, 33, 102, 0.4))" />

      {/* Subtext: "university of cebu" */}
      <text
        x="80"
        y="104"
        textAnchor="middle"
        fontSize="17.5"
        fontFamily="'Times New Roman', Georgia, serif"
        fontWeight="bold"
        letterSpacing="1.2"
        fill="#FFD000"
        filter="url(#softShadow)"
      >
        university of cebu
      </text>
    </svg>
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
              color: '#002B7F',
              letterSpacing: '-0.025em'
            }}
          >
            Trade<span style={{ color: '#E5A800' }}>Link</span>
          </span>
        </div>

        {showSubtitle && (
          <span
            style={{
              fontSize: '0.68rem',
              color: '#64748B',
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
