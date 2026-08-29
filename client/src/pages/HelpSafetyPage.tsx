import React from 'react';
import {
  ShieldCheck,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  MapPin,
  Clock,
  Mail,
  ExternalLink
} from 'lucide-react';
import { CAMPUS_DETAILS, SAFE_MEETUP_CHECKLIST } from '../data/campusLocations';
import { Campus } from '../types';

interface HelpSafetyPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const HelpSafetyPage: React.FC<HelpSafetyPageProps> = ({ onNavigate }) => {
  const campusList: Campus[] = [
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC PRI',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center'
  ];

  return (
    <div className="container" style={{ maxWidth: '960px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* Page Header */}
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
            marginBottom: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={16} /> Campus Trust & Safety Manual
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Trade Safely Across University of Cebu
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.35rem' }}>
          TradeLink connects verified students across all 8 University of Cebu campuses. Every transaction takes place in designated, guarded campus zones with encrypted handshake codes for zero-scam trading.
        </p>
      </div>

      {/* 4-Step Safety Pillar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Student Verification</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Sellers authenticate with their official UC Student ID or Study Load (COR) for administrative review.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-gold-light)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Guarded Landmarks</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Meetups occur strictly at designated security booths or verified public spots across all 8 UC hubs.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>3. 4-Digit Handshake</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Inspect the physical item on site and exchange the encrypted 4-digit code to finalize and build trust.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-red-subtle)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>4. Active Moderation</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Reported listings and suspicious student accounts are quickly investigated and suspended by administrators.
          </p>
        </div>
      </div>

      {/* Complete 8 UC Campuses Security Directory & Contact Information */}
      <div
        style={{
          backgroundColor: 'var(--uc-blue-dark, #001D59)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem clamp(1.25rem, 3vw, 2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1.5px solid rgba(255, 199, 44, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={22} color="var(--uc-gold, #FFC72C)" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                Official University of Cebu Campus Security & Directory
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                Direct hotlines, guard desks, and contact information for all 8 UC campuses
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('campus-map')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(255, 199, 44, 0.15)',
              color: 'var(--uc-gold, #FFC72C)',
              border: '1px solid rgba(255, 199, 44, 0.4)',
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>View Meetup Map</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem' }}>
          {campusList.map((campusKey) => {
            const details = CAMPUS_DETAILS[campusKey];
            return (
              <div
                key={campusKey}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--uc-gold, #FFC72C)' }}>
                    {details.shortName}
                  </span>
                  <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {details.studentCountEst}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                  <strong>Address:</strong> {details.address}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={13} style={{ flexShrink: 0 }} />
                  <a href={`tel:${details.phone.replace(/[^0-9]/g, '')}`} style={{ color: '#93C5FD', fontWeight: 700 }}>
                    {details.phone}
                  </a>
                  {details.altPhone && <span style={{ color: '#CBD5E1' }}>/ {details.altPhone}</span>}
                </div>

                <div style={{ fontSize: '0.74rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={13} style={{ flexShrink: 0 }} />
                  <span>{details.email}</span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: 600 }}>Security Desk:</div>
                  <div>{details.securityDesk}</div>
                </div>

                <div style={{ fontSize: '0.7rem', color: '#86EFAC', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={11} style={{ flexShrink: 0 }} />
                  <span>Hours: {details.operatingHours}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Trade Checklist */}
      <div className="clean-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <CheckCircle2 size={20} color="var(--accent-green)" /> Safe Trade Checklist for Students
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          {SAFE_MEETUP_CHECKLIST.map((tip, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', lineHeight: 1.5 }}>
              <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
