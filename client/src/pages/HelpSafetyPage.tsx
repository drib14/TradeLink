import React, { useState } from 'react';
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
  FileCheck,
  Building2,
  Lock,
  Camera
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

  const [selectedCampus, setSelectedCampus] = useState<string>('All');

  const displayedCampuses = selectedCampus === 'All'
    ? campusList
    : campusList.filter((c) => c === selectedCampus);

  return (
    <div className="container" style={{ maxWidth: '980px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={16} /> Campus Trust, Verification & Safety Manual
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Trade Safely Across the University of Cebu
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.35rem' }}>
          TradeLink connects verified students across all 8 University of Cebu campuses. Every transaction takes place in designated, guarded campus security zones with end-to-end encrypted campus chat and authentic product reviews.
        </p>
      </div>

      {/* 4-Step Safety Pillar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Student Verification</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Students authenticate with their official UC Student ID Card and a live selfie to match facial biometrics and earn the verified checkmark badge.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-gold-light)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Safe Campus Zones</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Meetups occur exclusively at staffed security guard desks and central lobbies across all 8 official UC campuses.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>3. Guarded Settlement & Reviews</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Inspect item condition physically at the guard post before the seller finalizes the transaction. Leave genuine product ratings for other students.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-red-subtle)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>4. Fast Peer Protection</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Suspicious listings, prohibited exam leaks, and fraudulent accounts are swiftly investigated, banned, and escalated to the SAO.
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
          gap: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1.5px solid rgba(255, 199, 44, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Phone size={24} color="var(--uc-gold, #FFC72C)" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                Official University of Cebu Campus Security & Guard Posts
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '2px' }}>
                Direct hotlines, official guard desks, and operating hours for all 8 UC campuses
              </p>
            </div>
          </div>

          {/* Campus Filter */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', maxWidth: '100%' }}>
            {['All', ...campusList].map((camp) => (
              <button
                key={camp}
                onClick={() => setSelectedCampus(camp)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: selectedCampus === camp ? 800 : 500,
                  backgroundColor: selectedCampus === camp ? '#FFC72C' : 'rgba(255,255,255,0.1)',
                  color: selectedCampus === camp ? '#001D59' : '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {camp}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {displayedCampuses.map((campusKey) => {
            const details = CAMPUS_DETAILS[campusKey];
            return (
              <div
                key={campusKey}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--uc-gold, #FFC72C)' }}>
                    {details.shortName}
                  </span>
                  <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {details.studentCountEst}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                  <strong>Address:</strong> {details.address}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} style={{ flexShrink: 0 }} />
                  <a href={`tel:${details.phone.replace(/[^0-9]/g, '')}`} style={{ color: '#93C5FD', fontWeight: 700, textDecoration: 'none' }}>
                    {details.phone}
                  </a>
                  {details.altPhone && <span style={{ color: '#CBD5E1' }}>/ {details.altPhone}</span>}
                </div>

                <div style={{ fontSize: '0.76rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} style={{ flexShrink: 0 }} />
                  <span>{details.email}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={13} color="#FFC72C" /> Guard Station:
                  </div>
                  <div style={{ marginTop: '2px' }}>{details.securityDesk}</div>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#86EFAC', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={12} style={{ flexShrink: 0 }} />
                  <span>Hours: {details.operatingHours}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Trade Checklist */}
      <div className="clean-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <CheckCircle2 size={20} color="var(--accent-green)" /> Safe Trade Checklist for UC Students
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem', color: 'var(--text-secondary)', padding: 0, margin: 0 }}>
          {SAFE_MEETUP_CHECKLIST.map((tip, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', lineHeight: 1.55 }}>
              <CheckCircle2 size={17} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Student ID Verification Section */}
      <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--uc-blue)', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
          <ShieldCheck size={16} /> How Verification Works
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
          Obtaining Your Verified Student Badge
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          All University of Cebu students can unlock the official <strong>Verified Student Badge</strong> to establish instant trust and gain access to unrestricted selling. To get verified:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--uc-blue)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileCheck size={16} /> Step 1: Official UC Student ID Card
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Upload a clear, glare-free photo of your official physical or digital UC Student ID card showing your name, student ID number, and clear face photo.
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Camera size={16} /> Step 2: Live Camera Selfie
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Take a live selfie to match your face with the photo on your student ID. This biometric verification eliminates scammers and fake accounts.
            </p>
          </div>
        </div>
        <div style={{ backgroundColor: '#FEF3C7', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '0.82rem', color: '#92400E', lineHeight: 1.55 }}>
          <strong>Notice on Study Loads / COR:</strong> TradeLink strictly requires an official Student ID with photo. Certificate of Registration (COR) or Study Load is <strong>not accepted</strong> because it lacks a photographic portrait necessary for live face-matching verification.
        </div>
      </div>

      {/* Emergency Assistance Box */}
      <div
        className="clean-card"
        style={{
          padding: '1.75rem',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.75rem'
        }}
      >
        <Mail size={24} color="var(--uc-blue)" />
        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Report an Issue or Contact Campus Support
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '540px', lineHeight: 1.6 }}>
          If you encounter suspicious listings, no-shows, harassment, or need assistance verifying your student account, our moderation desk is available at:
        </p>
        <a
          href="mailto:uc.tradelink@gmail.com"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.4rem', textDecoration: 'none' }}
        >
          <Mail size={16} /> uc.tradelink@gmail.com
        </a>
      </div>
    </div>
  );
};
