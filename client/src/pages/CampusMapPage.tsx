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
  Mail
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
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="btn-ghost"
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.82rem',
            marginBottom: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Navigation size={15} /> Campus & Outside Meetup Directory
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary, #002B7F)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Meetup Spots & Security Directory
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748B)' }}>
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
              className={`segmented-tab ${isSelected ? 'active' : ''}`}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Main Showcase Card */}
      <div
        className="clean-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          padding: '1.75rem'
        }}
      >
        {/* Left: Campus Info, Contacts & Outside Hubs */}
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
                  boxShadow: 'var(--shadow-sm)'
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
                      backgroundColor: 'var(--uc-gold, #FFC72C)',
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentDetails?.name || selectedCampus}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              <MapPin size={15} color="var(--uc-blue)" />
              <span>{currentDetails?.address}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Landmark: <strong style={{ color: 'var(--text-primary)' }}>{currentDetails?.landmark}</strong>
            </div>
          </div>

          {/* Campus Security Hotline Box */}
          {currentDetails && (
            <div style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', borderRadius: '10px', padding: '0.85rem', border: '1px solid var(--border-subtle, #BCD1F7)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--uc-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={13} /> Campus Guard Desk Hotline:
                </span>
                <a href={`tel:${currentDetails.phone.replace(/[^0-9]/g, '')}`} style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  {currentDetails.phone}
                </a>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={12} /> Email: {currentDetails.email}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={11} /> Operating Hours: {currentDetails.operatingHours}
              </div>
            </div>
          )}

          {/* Popular Outside Spots */}
          {currentDetails?.outsideHubs && (
            <div style={{ backgroundColor: 'var(--uc-gold-light, #FFFBEB)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--uc-gold-border, #FDE68A)' }}>
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

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--uc-blue)', marginBottom: '0.25rem' }}>Colleges & Tracks:</div>
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
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={18} color="var(--accent-green)" /> Inside & Outside Meetup Options ({spots.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {spots.map((spot) => (
              <div
                key={spot.id}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--uc-blue)' }}>{spot.name}</span>
                  <span
                    style={{
                      backgroundColor: spot.locationType.includes('Inside') ? 'var(--accent-green-subtle)' : 'var(--uc-gold-light)',
                      color: spot.locationType.includes('Inside') ? 'var(--accent-green)' : '#B45309',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      border: spot.locationType.includes('Inside') ? '1px solid var(--accent-green)' : '1px solid var(--uc-gold-border)'
                    }}
                  >
                    {spot.locationType.includes('Inside') ? 'Campus Gate' : 'Outside Spot'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {spot.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <Clock size={12} color="var(--uc-blue)" /> Best Hours: {spot.bestHours}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
