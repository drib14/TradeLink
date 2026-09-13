import React from 'react';
import { Logo } from '../common/Logo';
import {
  ShieldCheck,
  Mail,
  CheckCircle2,
  Users,
  Info
} from 'lucide-react';

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
        paddingTop: '3.25rem',
        paddingBottom: '2.25rem',
        marginTop: 'auto'
      }}
    >
      <div className="container" style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Main 3-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Col 1: Brand & UC Student Community */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Logo size="md" showSubtitle={true} isDark={true} />
            <p style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#94A3B8' }}>
              The official student-to-student marketplace and barter network for the University of Cebu community. Built by students, for students with zero platform fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={14} color="#FFC72C" />
                <span>8 Official Campuses Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={14} color="#FFC72C" />
                <span>Zero Platform Fees • 100% Free</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={14} color="#FFC72C" />
                <span>Guarded Security Checkpoints</span>
              </div>
            </div>

            <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#94A3B8' }}>
              <Mail size={14} color="#FFC72C" />
              <span>Student Support: </span>
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

          {/* Col 2: Safety & Campus Policies (Unique Links, Mentioned Only Once) */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <ShieldCheck size={15} style={{ flexShrink: 0 }} /> <span>Safety & Policies</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', padding: 0, margin: 0 }}>
              {[
                { label: 'Safe Meetup Checkpoints', view: 'help-safety', params: {} },
                { label: '8 Campuses Guard Directory & Hotlines', view: 'help-safety', params: {} },
                { label: 'Student ID & Live Selfie Verification', view: 'help-safety', params: {} },
                { label: 'Campus Honor Code & Rules', view: 'terms', params: { tab: 'honor-code' } },
                { label: 'Data Privacy Policy (RA 10173)', view: 'terms', params: { tab: 'privacy' } },
                { label: 'Frequently Asked Questions (FAQ)', view: 'faq', params: {} }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view, link.params)}
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

          {/* Col 3: About & Platform (Single Resources Link, Mentioned Only Once) */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Info size={15} style={{ flexShrink: 0 }} /> <span>About & Platform</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.84rem', padding: 0, margin: 0 }}>
              <li>
                <button
                  onClick={() => onNavigate('about')}
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
                  About TradeLink & Campus Mission
                </button>
              </li>

              {/* Single Non-Redundant Resources Link */}
              <li>
                <button
                  onClick={() => onNavigate('resources')}
                  style={{
                    color: '#FFC72C',
                    textAlign: 'left',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'color 0.15s ease',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FFC72C')}
                >
                  <Users size={15} />
                  <span>Platform Resources & Team</span>
                </button>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  Meet the 8 creators, developers, hierarchy & platform guides.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar (Clean Copyright & Info - NO REDUNDANT LINKS) */}
        <div
          style={{
            paddingTop: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.78rem',
            color: '#64748B'
          }}
        >
          <p style={{ margin: 0 }}>
            © 2026 TradeLink • University of Cebu Student Exchange. All Rights Reserved.
          </p>

          <div style={{ color: '#94A3B8', fontSize: '0.76rem' }}>
            Unified 8-Campus Student Network • Cebu, Philippines
          </div>
        </div>
      </div>
    </footer>
  );
};
