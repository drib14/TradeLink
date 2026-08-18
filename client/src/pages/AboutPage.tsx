import React from 'react';
import { Logo } from '../components/common/Logo';
import { ShieldCheck, Heart, Sparkles, Building2, Users, ArrowRight, ChevronLeft } from 'lucide-react';
import { Campus } from '../types';

interface AboutPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const stats = [
    { label: 'Campuses Connected', value: '8 Official Hubs' },
    { label: 'Active Students & SHS', value: '60,000+ UCians' },
    { label: 'Average Savings per Book', value: '65% Off' },
    { label: 'Verified Campus Meetups', value: '100% Guarded' }
  ];

  return (
    <div className="container" style={{ maxWidth: '920px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
            marginBottom: '0.5rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#002B7F', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Building2 size={15} /> University of Cebu Student Initiative
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#002B7F', marginTop: '0.35rem', fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
          Democratizing Quality Education Across All UC Campuses
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#475569', marginTop: '0.75rem', lineHeight: 1.6 }}>
          UC TradeLink is the premier campus marketplace built specifically for the University of Cebu student body—from Junior High School (Grades 7–10) and Senior High School (STEM, ABM, HUMSS, TVL, GAS) to College undergraduates, maritime cadets, and medical students.
        </p>
      </div>

      {/* Stats Counter Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          backgroundColor: '#002B7F',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(0, 43, 127, 0.2)'
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFC72C', fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Core Values */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#002B7F' }}>
          Our Campus Commitments
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EBF1FC', color: '#002B7F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Guarded Handshake Security</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              No anonymous meetups. All trades occur directly inside designated campus security lobbies with encrypted 4-digit codes.
            </p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#D97706" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Affordability for All</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Second-hand textbooks, scrubs, calculators, and tools are traded between students at fair campus prices without middleman markups.
            </p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ flexShrink: 0 }} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>8-Campus Interconnectivity</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Connecting UC Main, Banilad, LM, METC, PRI, Pardo-Talisay, South Campus, and UC Medical Center into one united student trading ecosystem.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1.5px solid #CBD5E1',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <Logo size="md" showSubtitle={true} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#002B7F' }}>
          Ready to trade with your fellow UCians?
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ padding: '0.65rem 1.35rem' }}>
            Explore Marketplace
          </button>
          <button onClick={() => onNavigate('create-listing')} className="btn-gold" style={{ padding: '0.65rem 1.35rem' }}>
            Post an Item
          </button>
        </div>
      </div>
    </div>
  );
};
