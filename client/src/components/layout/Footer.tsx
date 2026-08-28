import React from 'react';
import { Logo } from '../common/Logo';
import { Compass, HelpCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #001744 0%, #000E2B 100%)',
        borderTop: '2px solid #FFC72C',
        color: '#E2E8F0',
        paddingTop: '3rem',
        paddingBottom: '2.5rem',
        marginTop: 'auto'
      }}
    >
      <div className="container">
        {/* Clean 3-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Col 1: Brand & Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Logo size="md" showSubtitle={true} isDark={true} />
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#94A3B8' }}>
              The verified student-to-student marketplace and barter network for the University of Cebu community. Trade textbooks, gear, and supplies safely.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Verified Student Network</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#FFC72C' }} />
              <span style={{ fontSize: '0.74rem', color: '#FFC72C', fontWeight: 700 }}>Zero Platform Fees</span>
            </div>
          </div>

          {/* Col 2: Marketplace Navigation */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Compass size={14} style={{ flexShrink: 0 }} /> <span>Marketplace</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              {[
                { label: 'Browse Catalog', view: 'marketplace' },
                { label: 'Wanted Board (LTB)', view: 'wanted' },
                { label: 'Direct Item Swaps', view: 'swaps' },
                { label: 'Guarded Meetup Zones', view: 'campus-map' }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view)}
                    style={{
                      color: '#CBD5E1',
                      textAlign: 'left',
                      fontWeight: 500,
                      transition: 'color 0.15s ease',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Trust & Safety */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <HelpCircle size={14} style={{ flexShrink: 0 }} /> <span>Trust & Support</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              {[
                { label: 'Guarded Meetup Zones', view: 'campus-map' },
                { label: 'Safety & Verification Help', view: 'help-safety' },
                { label: 'Frequently Asked Questions (FAQ)', view: 'faq' },
                { label: 'Honor Code & Terms', view: 'terms' }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view)}
                    style={{
                      color: '#CBD5E1',
                      textAlign: 'left',
                      fontWeight: 500,
                      transition: 'color 0.15s ease',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Minimal Copyright Bottom Bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.76rem',
            color: '#64748B'
          }}
        >
          <p>© 2026 TradeLink • University of Cebu Student Exchange. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};
