import React, { useState } from 'react';
import { CAMPUS_DETAILS, CAMPUS_MEETUP_SPOTS } from '../data/campusLocations';
import { CAMPUS_SLIDES } from '../components/home/CampusCarouselBanner';
import { Campus } from '../types';
import {
  MapPin,
  ShieldCheck,
  Clock,
  Navigation,
  Phone,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Store,
  Sparkles
} from 'lucide-react';

interface CampusMapPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const CampusMapPage: React.FC<CampusMapPageProps> = ({ onNavigate }) => {
  const [selectedCampus, setSelectedCampus] = useState<Campus>('UC Main');

  const campusKeys: Campus[] = [
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC PRI',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center'
  ];

  const currentDetails = CAMPUS_DETAILS[selectedCampus];
  const spots = CAMPUS_MEETUP_SPOTS.filter((s) => s.campus === selectedCampus);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#64748B',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '0.5rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#002B7F', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
          <Navigation size={15} /> Campus & Outside Meetup Directory
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#002B7F', marginTop: '0.25rem' }}>
          Meetup Spots Guide (Inside & Outside Campus)
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
          Explore guarded security booths inside campus or high-traffic public spots outside campus (malls, fastfood, cafes) across all 8 University of Cebu hubs.
        </p>
      </div>

      {/* Campus Selector Tabs */}
      <div
        className="touch-scroll-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingBottom: '4px'
        }}
      >
        {campusKeys.map((c) => {
          const isSelected = selectedCampus === c;
          return (
            <button
              key={c}
              onClick={() => setSelectedCampus(c)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 800 : 600,
                backgroundColor: isSelected ? '#002B7F' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#334155',
                border: isSelected ? '1.5px solid #002B7F' : '1px solid #CBD5E1',
                boxShadow: isSelected ? '0 4px 12px rgba(0, 43, 127, 0.18)' : 'none',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Main Showcase Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #BCD1F7',
          padding: '1.75rem',
          boxShadow: '0 8px 24px rgba(0, 43, 127, 0.08)'
        }}
      >
        {/* Left: Campus Info & Outside Hubs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Campus Photo Header */}
          {(() => {
            const slide = CAMPUS_SLIDES.find((s) => s.shortTag === selectedCampus) || CAMPUS_SLIDES[0];
            return (
              <div
                style={{
                  height: '160px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundImage: `url(${slide.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 4px 12px rgba(0, 43, 127, 0.15)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0, 29, 89, 0.85) 0%, rgba(0, 29, 89, 0.2) 60%)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}
                >
                  <span
                    style={{
                      backgroundColor: '#FFC72C',
                      color: '#002B7F',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}
                  >
                    Official Campus Zone
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#E2E8F0', fontWeight: 600 }}>
                    {slide.highlight}
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#002B7F' }}>
              {currentDetails?.name || selectedCampus}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              <MapPin size={15} color="#002B7F" />
              <span>{currentDetails?.address}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
              Landmark: <strong>{currentDetails?.landmark}</strong>
            </div>
          </div>

          {/* Popular Outside Spots */}
          {currentDetails?.outsideHubs && (
            <div style={{ backgroundColor: '#FFFBEB', padding: '0.85rem', borderRadius: '10px', border: '1px solid #FDE68A' }}>
              <div style={{ fontWeight: 800, color: '#B45309', fontSize: '0.82rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Store size={14} /> Popular Outside Campus Spots:
              </div>
              <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.78rem', color: '#78350F', lineHeight: 1.5 }}>
                {currentDetails.outsideHubs.map((hub, i) => (
                  <li key={i}>{hub}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#334155' }}>
            <div style={{ fontWeight: 700, color: '#002B7F', marginBottom: '0.25rem' }}>Colleges & Tracks:</div>
            <div>{currentDetails?.colleges?.join(' • ')}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => onNavigate('marketplace', { campus: selectedCampus })}
              className="btn-primary"
              style={{ flex: 1, padding: '0.65rem' }}
            >
              Browse {selectedCampus} Items
            </button>
            <button
              onClick={() => onNavigate('wanted', { campus: selectedCampus })}
              className="btn-gold"
              style={{ padding: '0.65rem 1rem' }}
            >
              Wanted in {selectedCampus}
            </button>
          </div>
        </div>

        {/* Right: Designated Meetup Landmarks (Inside & Outside) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={18} color="#059669" /> Inside & Outside Meetup Options ({spots.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {spots.map((spot) => (
              <div
                key={spot.id}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#002B7F' }}>{spot.name}</span>
                  <span
                    style={{
                      backgroundColor: spot.locationType.includes('Inside') ? '#ECFDF5' : '#FFFBEB',
                      color: spot.locationType.includes('Inside') ? '#047857' : '#B45309',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      border: spot.locationType.includes('Inside') ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                    }}
                  >
                    {spot.locationType.includes('Inside') ? 'Campus Gate' : 'Outside Spot'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
                  {spot.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                  <Clock size={12} color="#002B7F" /> Best Hours: {spot.bestHours}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
