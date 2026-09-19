import React from 'react';
import { Logo } from '../components/common/Logo';
import {
  ShieldCheck,
  Building2,
  Users,
  ChevronLeft,
  BadgePercent,
  MapPin,
  KeyRound,
  CheckCircle2,
  Mail,
  Scale
} from 'lucide-react';
import { CAMPUS_DETAILS } from '../data/campusLocations';
import { Campus } from '../types';
import { useMarket } from '../context/MarketContext';

interface AboutPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { setSelectedCampus } = useMarket();
  const stats = [
    { label: 'Campuses Connected', value: '8 Official Hubs' },
    { label: 'Active Students & SHS', value: '60,000+ UCians' },
    { label: 'Average Savings per Book', value: '65% Off' },
    { label: 'Verified Campus Meetups', value: '100% Guarded' }
  ];

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

  return (
    <div className="container" style={{ maxWidth: '960px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Back Button */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Building2 size={15} /> University of Cebu Student Initiative
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
          Democratizing Quality Education Across All 8 UC Campuses
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.6 }}>
          TradeLink is the campus marketplace and peer-to-peer barter network created exclusively for the University of Cebu community. From Junior High School (Grades 7–10) and Senior High School (STEM, ABM, HUMSS, TVL, GAS) to College undergraduates, maritime cadets, and medical students, TradeLink provides a safe, transparent, and fee-free environment to trade second-hand textbooks, uniforms, gadgets, and academic supplies.
        </p>
      </div>

      {/* Stats Counter Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          backgroundColor: 'var(--uc-blue)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--uc-gold, #FFC72C)', fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Core Campus Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Our Core Commitments
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Guarded Campus Settlement</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              No stranger danger or unsafe off-campus meetups. All trades occur directly inside designated campus guard checkpoints with verified student ID authentication and peer reviews.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-gold-light)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BadgePercent size={20} color="#B45309" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>100% Free • Zero Fees</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              TradeLink takes zero commissions, zero listing fees, and zero hidden cuts. 100% of student funds stay within the student community.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Direct Student Autonomy</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Automated password reset codes dispatched straight to student inboxes without administrative delays or bottleneck approvals.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>8-Campus Interconnectivity</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Connecting UC Main, Banilad, LM, METC, PRI, Pardo-Talisay, South Campus, and UC Medical Center into one unified student network.
            </p>
          </div>
        </div>
      </div>

      {/* 8 UC Campuses Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <MapPin size={20} color="var(--uc-blue)" /> The 8 University of Cebu Campuses
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {campusKeys.map((c) => {
            const info = CAMPUS_DETAILS[c];
            return (
              <div
                key={c}
                className="clean-card card-interactive"
                onClick={() => {
                  setSelectedCampus(c);
                  onNavigate('marketplace');
                }}
                style={{
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                title={`Browse items available at ${info.shortName}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--uc-blue)' }}>{info.shortName}</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--uc-blue)', fontWeight: 800 }}>Explore &rarr;</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{info.address}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>Tel: {info.phone}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Guard Desk: {info.securityDesk}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Box */}
      <div
        className="clean-card"
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'var(--bg-subtle)'
        }}
      >
        <Logo size="md" showSubtitle={true} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Ready to join your fellow UCians?
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
          Start trading today with zero fees, guaranteed campus safety, and a trusted student community.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Explore Marketplace
          </button>
          <button onClick={() => onNavigate('create-listing')} className="btn-gold" style={{ padding: '0.65rem 1.5rem' }}>
            Post an Item
          </button>
        </div>
      </div>
    </div>
  );
};
