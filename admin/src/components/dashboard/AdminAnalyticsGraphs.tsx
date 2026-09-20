import React, { useState } from 'react';
import { TrendingUp, Building2, ShoppingBag, RefreshCw, Calendar, ArrowUpRight, BarChart2 } from 'lucide-react';
import { AdminAnalytics } from '../../context/AdminContext';

interface AdminAnalyticsGraphsProps {
  analytics: AdminAnalytics | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const AdminAnalyticsGraphs: React.FC<AdminAnalyticsGraphsProps> = ({
  analytics,
  isLoading = false,
  onRefresh
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const timeline = analytics?.monthlyTimeline || [];
  const campuses = analytics?.campusDistribution || [];
  const categories = analytics?.categoryDistribution || [];

  // Calculate volume peak for SVG Y-axis scaling
  const maxVolume = Math.max(...timeline.map((m) => m.volume), 1000);
  const maxTrades = Math.max(...timeline.map((m) => m.trades), 10);
  const totalPeriodVolume = timeline.reduce((acc, curr) => acc + curr.volume, 0);
  const totalPeriodTrades = timeline.reduce((acc, curr) => acc + curr.trades, 0);

  // SVG Chart Dimensions
  const svgWidth = 740;
  const svgHeight = 210;
  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 45;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = timeline.map((m, idx) => {
    const x = paddingLeft + (idx / Math.max(timeline.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - (m.volume / maxVolume) * chartHeight;
    const barHeight = (m.trades / maxTrades) * (chartHeight * 0.7);
    return {
      x,
      y,
      barHeight: Math.max(barHeight, m.trades > 0 ? 6 : 0),
      ...m
    };
  });

  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${paddingTop + chartHeight} L ${points[0].x.toFixed(1)} ${paddingTop + chartHeight} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Main Time-Series Graph Card */}
      <div
        className="clean-card"
        style={{
          padding: '1.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px -4px rgba(0, 43, 127, 0.06)',
          position: 'relative'
        }}
      >
        {/* Graph Header with dynamic aggregates and live reload */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 800, color: '#002B7F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <TrendingUp size={15} />
              <span>Real-Time Platform Performance</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: '0.2rem 0 0 0', fontFamily: 'var(--font-display)' }}>
              Gross Trade Volume &amp; Transaction Activity
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
              Dynamic 6-month aggregate from fulfilled orders, swaps, and campus listings
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>6-Month Volume</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                ₱{totalPeriodVolume.toLocaleString()}
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', backgroundColor: '#E2E8F0' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Trades</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#002B7F' }}>
                {totalPeriodTrades}
              </div>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh Live Data"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Responsive Interactive SVG Graph */}
        <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '560px', height: 'auto', display: 'block' }}
            aria-label="Dynamic platform volume chart"
          >
            <defs>
              <linearGradient id="tradeVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#002B7F" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#002B7F" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartHeight * (1 - ratio);
              const val = Math.round(maxVolume * ratio);
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? 'none' : '4 4'}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#94A3B8"
                  >
                    ₱{val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#tradeVolumeGrad)" />}

            {/* Completed Trades Bar Representation */}
            {points.map((pt, idx) => {
              const isHovered = hoveredPointIndex === idx;
              const barX = pt.x - 16;
              const barY = paddingTop + chartHeight - pt.barHeight;
              return (
                <g key={`bar-${idx}`}>
                  <rect
                    x={barX}
                    y={barY}
                    width="32"
                    height={pt.barHeight}
                    rx="4"
                    fill={isHovered ? '#EAB308' : '#FFC72C'}
                    opacity={isHovered ? 1 : 0.85}
                    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                </g>
              );
            })}

            {/* Volume Curve Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#002B7F"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Point Circles & X-Axis Month Labels */}
            {points.map((pt, idx) => {
              const isHovered = hoveredPointIndex === idx;
              return (
                <g key={`pt-${idx}`}>
                  {/* Vertical Guideline on Hover */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={paddingTop + chartHeight}
                      stroke="#002B7F"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Outer glow circle on hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="#002B7F"
                      opacity="0.15"
                    />
                  )}

                  {/* Point Circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4.5}
                    fill="#FFFFFF"
                    stroke="#002B7F"
                    strokeWidth="3"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />

                  {/* X-Axis Month Label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered ? '800' : '600'}
                    fill={isHovered ? '#002B7F' : '#64748B'}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Overlay */}
          {hoveredPointIndex !== null && points[hoveredPointIndex] && (
            <div
              style={{
                position: 'absolute',
                top: `${Math.max(10, (points[hoveredPointIndex].y / svgHeight) * 100 - 15)}%`,
                left: `${(points[hoveredPointIndex].x / svgWidth) * 100}%`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '0.65rem 0.9rem',
                fontSize: '0.74rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 10,
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ fontWeight: 800, color: '#FFC72C', marginBottom: '0.2rem' }}>
                {points[hoveredPointIndex].label} {points[hoveredPointIndex].year}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div>Trade Volume: <strong>₱{points[hoveredPointIndex].volume.toLocaleString()}</strong></div>
                <div>Completed Trades: <strong>{points[hoveredPointIndex].trades}</strong></div>
                {points[hoveredPointIndex].newListings > 0 && (
                  <div>New Listings: <strong>{points[hoveredPointIndex].newListings}</strong></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.5rem', fontSize: '0.76rem', color: '#64748B', marginTop: '0.65rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#002B7F', borderRadius: '2px', display: 'inline-block' }} />
            Gross Volume (₱)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#FFC72C', borderRadius: '3px', display: 'inline-block' }} />
            Completed Trades
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Visual Charts: Campus Distribution & Category Market Share */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Campus Market Breakdown Visual Meter */}
        <div
          className="clean-card"
          style={{
            padding: '1.4rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
              <Building2 size={17} color="#002B7F" />
              <span>Campus Distribution &amp; Verified Share</span>
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>8 UC Hubs</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campuses.map((c) => {
              const maxCampusUsers = Math.max(...campuses.map((cp) => cp.users), 1);
              const userBarWidth = Math.round((c.users / maxCampusUsers) * 100);

              return (
                <div key={c.campus} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{c.campus}</span>
                    <span style={{ color: '#64748B' }}>
                      <strong style={{ color: '#002B7F' }}>{c.users}</strong> students • <span style={{ color: c.verifiedRate >= 50 ? '#059669' : '#D97706', fontWeight: 700 }}>{c.verifiedRate}% verified</span>
                    </span>
                  </div>
                  {/* Dual Bar (Total vs Verified) */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${userBarWidth}%`,
                        height: '100%',
                        backgroundColor: '#002B7F',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share Visual Breakdown */}
        <div
          className="clean-card"
          style={{
            padding: '1.4rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
              <ShoppingBag size={17} color="#002B7F" />
              <span>Marketplace Categories &amp; Trade Share</span>
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>{categories.length} Categories</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.slice(0, 6).map((cat) => {
              const maxCategoryTotal = Math.max(...categories.map((cg) => cg.total), 1);
              const barWidth = Math.round((cat.total / maxCategoryTotal) * 100);

              return (
                <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{cat.category}</span>
                    <span style={{ color: '#64748B' }}>
                      <strong style={{ color: '#059669' }}>{cat.active} active</strong> • <strong>{cat.sold} sold</strong> • ₱{cat.avgPrice} avg
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        backgroundColor: '#FFC72C',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                No active category listings found in current snapshot.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
