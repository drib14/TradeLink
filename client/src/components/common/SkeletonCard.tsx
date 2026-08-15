import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '380px',
        padding: '0'
      }}
    >
      {/* Thumbnail shimmer */}
      <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '0' }} />

      {/* Content skeleton */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
        {/* Badges row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div className="skeleton" style={{ height: '18px', width: '60px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '18px', width: '75px', borderRadius: '20px' }} />
        </div>

        {/* Title */}
        <div className="skeleton" style={{ height: '18px', width: '90%' }} />
        <div className="skeleton" style={{ height: '14px', width: '65%' }} />

        {/* Price / Trade bar */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: '24px', width: '80px' }} />
          <div className="skeleton" style={{ height: '24px', width: '24px', borderRadius: '50%' }} />
        </div>

        {/* Seller row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <div className="skeleton" style={{ height: '22px', width: '22px', borderRadius: '50%' }} />
          <div className="skeleton" style={{ height: '12px', width: '100px' }} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
        width: '100%'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
