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
  ArrowRight,
  ArrowLeftRight,
  Sparkles
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
    { label: 'Platform Fees', value: '0% Free' },
    { label: 'Student Identity', value: 'Verified Peers' },
    { label: 'Campuses Connected', value: '8 Campus Hubs' },
    { label: 'Average Savings', value: 'Up to 70% Off' }
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
    <div className="container page-enter" style={{ maxWidth: '960px', paddingTop: 'clamp(1rem, 2.5vw, 2rem)', paddingBottom: '5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back Button & Header */}
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
            marginBottom: '0.75rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={15} color="#FFC72C" /> Built by Students, For Students
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
          TradeLink — The Student-Powered Campus Marketplace
        </h1>
        <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', marginTop: '0.85rem', lineHeight: 1.65 }}>
          TradeLink was built to solve a problem every student faces: textbooks, drafting instruments, uniforms, calculators, and gadgets sitting unused after finals, while incoming peers pay full retail prices for the exact same supplies. 
        </p>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.65 }}>
          We give students an independent, direct platform to buy, sell, swap, and donate academic gear safely. Zero platform commissions, genuine student verification, and complete freedom for buyers and sellers to decide where and how they want to meet.
        </p>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <a
            href="https://uc-tradelink.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1.1rem', textDecoration: 'none' }}
          >
            Visit TradeLink <ArrowRight size={16} />
          </a>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <a href="https://uc-tradelink.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--uc-blue)', fontWeight: 700 }}>
              uc-tradelink.vercel.app
            </a>
          </span>
        </div>
      </div>

      {/* Value Pillars Counter */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          backgroundColor: '#002B7F',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFC72C', fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Core Platform Commitments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          What Sets TradeLink Apart
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Your Choice of Meetup Spot</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              You decide where to meet. Whether you prefer the campus library, cafeteria, quadrangle benches, or a favorite coffee shop across the street, coordinate directly in peer chat at your mutual convenience.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-gold-light)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BadgePercent size={20} color="#B45309" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>100% Free • Zero Commissions</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              TradeLink takes zero commissions, zero listing fees, and zero cuts. 100% of the funds stay between students, keeping campus education affordable for everyone.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Verified Student Trust</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Trade with confidence. Our student verification badges and peer review system ensure you are transacting with genuine peers from your school community.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Direct Swaps & Urgent Requests</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Barter books and gear 1-to-1 without spending cash, or use Flash Market to post urgent requests when you need a calculator or reviewer before exams.
            </p>
          </div>
        </div>
      </div>

      {/* Campus Hub Explorer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Campus Trading Hubs
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Select any campus hub to filter items and find fellow students near you.
          </p>
        </div>

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
                  gap: '0.45rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                title={`Browse items available at ${info.shortName}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--uc-blue)' }}>{info.shortName}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--uc-blue)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    Explore <ArrowRight size={12} />
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{info.address}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {info.landmark}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
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
          Ready to trade with fellow students?
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
          Join TradeLink today. List pre-loved items in minutes, barter books with verified peers, and save on campus essentials.
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
