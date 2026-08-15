import React from 'react';
import { Logo } from '../common/Logo';
import { Campus } from '../../types';

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
        backgroundColor: '#FFFFFF',
        borderTop: '1.5px solid #E2E8F0',
        paddingTop: '2.75rem',
        paddingBottom: '2.75rem',
        marginTop: 'auto'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.25rem',
            paddingBottom: '2.25rem',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          {/* Col 1: Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Logo size="sm" showSubtitle={true} />
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#64748B' }}>
              Official campus marketplace for the University of Cebu community. Dedicated to Junior High School, Senior High School, and College students across all 8 official campuses.
            </p>
          </div>

          {/* Col 2: Campuses */}
          <div>
            <h5 style={{ color: '#002B7F', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              UC Campuses
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', color: '#475569' }}>
              {campuses.map((campus) => (
                <li key={campus}>
                  <button
                    onClick={() => onNavigate('marketplace', { campus })}
                    style={{ color: '#475569', textAlign: 'left', fontWeight: 500 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#002B7F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                  >
                    {campus}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Marketplace & Custom Pages */}
          <div>
            <h5 style={{ color: '#002B7F', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform & Knowledge Base
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
              <li>
                <button onClick={() => onNavigate('marketplace')} style={{ color: '#475569' }}>
                  Explore Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wanted')} style={{ color: '#475569' }}>
                  Student Wanted Board
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('swaps')} style={{ color: '#475569' }}>
                  Campus Swap Hub
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('price-advisor')} style={{ color: '#475569' }}>
                  Fair Price Advisor
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} style={{ color: '#475569' }}>
                  About UC TradeLink
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} style={{ color: '#475569' }}>
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('campus-map')} style={{ color: '#475569' }}>
                  Meetup Spots (Inside & Outside)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Security Contacts */}
          <div>
            <h5 style={{ color: '#002B7F', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Campus Security Hotlines
            </h5>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><strong>UC Main Desk:</strong> (032) 255-7100</div>
              <div><strong>UC Banilad Desk:</strong> (032) 231-8623</div>
              <div><strong>UC LM Desk:</strong> (032) 345-6540</div>
              <div><strong>UC METC Desk:</strong> (032) 261-3781</div>
              <div><strong>UC Pardo-Talisay:</strong> (032) 273-0491</div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <p>© 2026 UC TradeLink • University of Cebu Student Marketplace</p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <button onClick={() => onNavigate('terms')} style={{ color: '#64748B', fontSize: '0.75rem' }}>
              Community Guidelines & Honor Code
            </button>
            <button onClick={() => onNavigate('help-safety')} style={{ color: '#64748B', fontSize: '0.75rem' }}>
              Safety First Policy
            </button>
            <button onClick={() => onNavigate('campus-map')} style={{ color: '#64748B', fontSize: '0.75rem' }}>
              Campus & Outside Landmarks
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
