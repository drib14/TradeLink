import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface, #FFFFFF)',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '0'
      }}
    >
      {/* Thumbnail shimmer matching square ratio */}
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '0' }} />

      {/* Content skeleton */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
        {/* Badges row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div className="skeleton" style={{ height: '14px', width: '60px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '14px', width: '50px', borderRadius: '4px' }} />
        </div>

        {/* Title */}
        <div className="skeleton" style={{ height: '16px', width: '90%', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '14px', width: '65%', borderRadius: '4px' }} />

        {/* Price / Trade bar */}
        <div style={{ marginTop: 'auto', paddingTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: '20px', width: '70px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '18px', width: '40px', borderRadius: '4px' }} />
        </div>

        {/* Action button skeleton */}
        <div className="skeleton" style={{ height: '30px', width: '100%', borderRadius: '8px' }} />

        {/* Seller row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle, #F1F5F9)' }}>
          <div className="skeleton" style={{ height: '18px', width: '18px', borderRadius: '50%' }} />
          <div className="skeleton" style={{ height: '12px', width: '70px', borderRadius: '3px' }} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid-responsive-listings">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
