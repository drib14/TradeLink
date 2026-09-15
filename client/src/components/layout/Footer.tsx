import React from 'react';
import { Logo } from '../common/Logo';
import {
  ShieldCheck,
  Mail,
  CheckCircle2,
  Info,
  ShoppingBag
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { setSelectedCategory } = useMarket();

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    onNavigate('marketplace');
  };

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #001744 0%, #000E2B 100%)',
        borderTop: '2px solid #FFC72C',
        color: '#E2E8F0',
        paddingTop: '3.5rem',
        paddingBottom: '2.25rem',
        marginTop: 'auto',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip'
      }}
    >
      {/* Full-width edge-to-edge container */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: '0 clamp(1.5rem, 3.5vw, 4.5rem)'
        }}
      >
        {/* Main 4-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Col 1: Brand & UC Student Community */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Logo size="md" showSubtitle={true} isDark={true} />
            <p style={{ fontSize: '0.84rem', lineHeight: 1.65, color: '#94A3B8', maxWidth: '340px' }}>
              The official student-to-student marketplace and barter network for the University of Cebu community. Built by Webmasters, for Webmasters with zero platform fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={15} color="#FFC72C" style={{ flexShrink: 0 }} />
                <span>Zero Platform Fees • 100% Free Forever</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={15} color="#FFC72C" style={{ flexShrink: 0 }} />
                <span>Guarded Security Meetup Checkpoints</span>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#94A3B8' }}>
              <Mail size={14} color="#FFC72C" style={{ flexShrink: 0 }} />
              <span>Support: </span>
              <a
                href="mailto:uc.tradelink@gmail.com"
                style={{ color: '#FFC72C', textDecoration: 'none', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                uc.tradelink@gmail.com
              </a>
            </div>
          </div>

          {/* Col 2: Popular Categories */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <ShoppingBag size={15} style={{ flexShrink: 0 }} /> <span>Popular Categories</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.84rem', padding: 0, margin: 0 }}>
              {[
                { label: 'Textbooks & Reviewers', category: 'Textbooks' },
                { label: 'Uniforms & Scrubs', category: 'Uniforms' },
                { label: 'Tech, Gadgets & Calculators', category: 'Electronics' },
                { label: 'Art & Drafting Supplies', category: 'Supplies' }
              ].map((item) => (
                <li key={item.category}>
                  <button
                    onClick={() => handleCategoryClick(item.category)}
                    style={linkBtnStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Trust, Safety & Support */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <ShieldCheck size={15} style={{ flexShrink: 0 }} /> <span>Trust & Safety</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.84rem', padding: 0, margin: 0 }}>
              {[
                { label: 'Help & Safety Center', view: 'help-safety', params: {} },
                { label: 'Frequently Asked Questions', view: 'faq', params: {} },
                { label: 'Student Honor Code', view: 'terms', params: { tab: 'honor-code' } },
                { label: 'Terms of Service', view: 'terms', params: { tab: 'honor-code' } },
                { label: 'Privacy Policy', view: 'terms', params: { tab: 'privacy' } }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view, link.params)}
                    style={linkBtnStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Platform, Team & Live System Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h5
                style={{
                  color: '#FFC72C',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  marginBottom: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Info size={15} style={{ flexShrink: 0 }} /> <span>About & Community</span>
              </h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.84rem', padding: 0, margin: 0 }}>
                <li>
                  <button
                    onClick={() => onNavigate('about')}
                    style={linkBtnStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    About TradeLink
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('developers')}
                    style={linkBtnStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    Student Developers & Contributors
                  </button>
                </li>
              </ul>
            </div>

            {/* Live Campus Hub Network Status Card */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 10px #10B981',
                    display: 'inline-block'
                  }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F1F5F9' }}>
                  All 8 Campus Hubs Operational
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Instant peer chat, verified exchange checkpoints, and zero fees active 24/7.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Full Screen Edge-to-Edge with University of Cebu Attribution */}
        <div
          style={{
            paddingTop: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.78rem',
            color: '#64748B',
            width: '100%'
          }}
        >
          <p style={{ margin: 0, color: '#94A3B8' }}>
            © 2026 TradeLink • University of Cebu Student Exchange. All Rights Reserved. Built by UC Webmasters.
          </p>

          <div style={{ color: '#94A3B8', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>Unified 8-Campus Student Network</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>Cebu City, Philippines</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ color: '#FFC72C', fontWeight: 600 }}>Zero Platform Fees</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const linkBtnStyle: React.CSSProperties = {
  color: '#CBD5E1',
  textAlign: 'left',
  fontWeight: 500,
  transition: 'color 0.15s ease',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0
};
