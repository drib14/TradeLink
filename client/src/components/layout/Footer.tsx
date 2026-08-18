import React from 'react';
import { Logo } from '../common/Logo';
import { Campus } from '../../types';
import { ShieldCheck, MapPin, PhoneCall, HelpCircle, FileText, ArrowUpRight, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const campuses: Campus[] = [
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
    <footer
      style={{
        background: 'linear-gradient(180deg, #001744 0%, #000E2B 100%)',
        borderTop: '2px solid #FFC72C',
        color: '#E2E8F0',
        paddingTop: '3.5rem',
        paddingBottom: '3rem',
        marginTop: 'auto'
      }}
    >
      <div className="container">
        {/* Top Trust Banner inside Footer */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 199, 44, 0.2)',
            borderRadius: '16px',
            padding: '1.25rem 1.75rem',
            marginBottom: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 199, 44, 0.15)',
                color: '#FFC72C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                University of Cebu Safe Campus Exchange Network
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                100% Student-Verified Community • Guarded Campus Meetup Zones • 4-Digit Handshake PIN
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('help-safety')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#FFC72C',
                backgroundColor: 'rgba(255, 199, 44, 0.1)',
                border: '1px solid rgba(255, 199, 44, 0.3)',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Safety Rules <ArrowUpRight size={13} />
            </button>
            <button
              onClick={() => onNavigate('campus-map')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Meetup Map <MapPin size={13} />
            </button>
          </div>
        </div>

        {/* 4 Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Col 1: Brand & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Logo size="sm" showSubtitle={true} isDark={true} />
            <p style={{ fontSize: '0.84rem', lineHeight: 1.65, color: '#94A3B8' }}>
              The exclusive verified student-to-student marketplace for all 8 campuses of the University of Cebu. Trade gadgets, textbooks, clinical scrubs, and SHS reviewers safely within campus gates.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Built for UCians</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#FFC72C' }} />
              <span style={{ fontSize: '0.75rem', color: '#FFC72C', fontWeight: 700 }}>Zero Transaction Fees</span>
            </div>
          </div>

          {/* Col 2: Official Campuses */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <MapPin size={15} style={{ flexShrink: 0 }} /> <span>UC Campuses</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              {campuses.map((campus) => (
                <li key={campus}>
                  <button
                    onClick={() => onNavigate('marketplace', { campus })}
                    style={{
                      color: '#CBD5E1',
                      textAlign: 'left',
                      fontWeight: 500,
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#FFC72C';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#CBD5E1';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span>›</span> {campus}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Student Hub & Services */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Sparkles size={15} style={{ flexShrink: 0 }} /> <span>Student Hub</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              {[
                { label: 'Browse Marketplace', view: 'marketplace' },
                { label: 'Post Sell / Swap Listing', view: 'create-listing' },
                { label: 'Student Wanted Board', view: 'wanted' },
                { label: 'Campus Swap Exchange', view: 'swaps' },
                { label: 'AI Fair Price Advisor', view: 'price-advisor' },
                { label: 'Scheduled Meetups & Codes', view: 'meetups' },
                { label: 'About UC TradeLink', view: 'about' },
                { label: 'Frequently Asked Questions (FAQ)', view: 'faq' }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view)}
                    style={{
                      color: '#CBD5E1',
                      textAlign: 'left',
                      fontWeight: 500,
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#38BDF8';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#CBD5E1';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Campus Security & Helpdesk */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <PhoneCall size={15} style={{ flexShrink: 0 }} /> <span>Campus Guard Desks</span>
            </h5>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#F1F5F9' }}>UC Main Sanciangko:</strong>
                <div style={{ color: '#38BDF8' }}>(032) 255-7100</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#F1F5F9' }}>UC Banilad Gate:</strong>
                <div style={{ color: '#38BDF8' }}>(032) 231-8623</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#F1F5F9' }}>UC LM Mandaue Desk:</strong>
                <div style={{ color: '#38BDF8' }}>(032) 345-6540</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#F1F5F9' }}>UC METC Maritime Guard:</strong>
                <div style={{ color: '#38BDF8' }}>(032) 261-3781</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.78rem',
            color: '#64748B'
          }}
        >
          <p>© 2026 UC TradeLink • University of Cebu Student Marketplace. All Rights Reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('terms')}
              style={{ color: '#94A3B8', fontSize: '0.78rem', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Honor Code & Guidelines
            </button>
            <button
              onClick={() => onNavigate('help-safety')}
              style={{ color: '#94A3B8', fontSize: '0.78rem', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Safety First
            </button>
            <button
              onClick={() => onNavigate('campus-map')}
              style={{ color: '#94A3B8', fontSize: '0.78rem', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Landmarks & Meetup Zones
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
