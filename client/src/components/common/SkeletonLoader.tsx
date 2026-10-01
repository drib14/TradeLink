import React from 'react';

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ width = '100%', height = '20px', borderRadius = '8px', style, className = '' }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

export const ListingCardSkeleton: React.FC = () => {
  return (
    <div
      className="clean-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-surface, #FFFFFF)'
      }}
    >
      {/* Image Skeleton matching 1:1 ratio */}
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '0' }} />

      {/* Body Skeleton */}
      <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Badges row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width="80px" height="18px" borderRadius="4px" />
          <SkeletonBox width="60px" height="18px" borderRadius="4px" />
        </div>

        {/* Title */}
        <SkeletonBox width="90%" height="18px" borderRadius="4px" />
        <SkeletonBox width="60%" height="14px" borderRadius="4px" />

        {/* Price & Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
          <SkeletonBox width="70px" height="24px" borderRadius="6px" />
          <SkeletonBox width="85px" height="28px" borderRadius="8px" />
        </div>

        {/* Seller Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderTop: '1px solid var(--border-subtle, #F1F5F9)', paddingTop: '0.5rem' }}>
          <SkeletonBox width="22px" height="22px" borderRadius="50%" />
          <SkeletonBox width="100px" height="12px" borderRadius="4px" />
        </div>
      </div>
    </div>
  );
};

export const FlashRequestCardSkeleton: React.FC = () => {
  return (
    <div
      className="clean-card"
      style={{
        padding: '1.25rem',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        backgroundColor: 'var(--bg-surface, #FFFFFF)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width="90px" height="20px" borderRadius="9999px" />
        <SkeletonBox width="70px" height="20px" borderRadius="4px" />
      </div>

      <SkeletonBox width="80%" height="20px" borderRadius="4px" />
      <SkeletonBox width="100%" height="36px" borderRadius="6px" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle, #F1F5F9)', paddingTop: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SkeletonBox width="28px" height="28px" borderRadius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SkeletonBox width="80px" height="12px" borderRadius="3px" />
            <SkeletonBox width="60px" height="10px" borderRadius="3px" />
          </div>
        </div>
        <SkeletonBox width="95px" height="32px" borderRadius="8px" />
      </div>
    </div>
  );
};

export const BannerSkeleton: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '380px',
        borderRadius: '18px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#001D59'
      }}
      className="skeleton"
    />
  );
};
