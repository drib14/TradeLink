import React from 'react';
import { Compass, Search, Home } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Campus } from '../types';

interface NotFoundPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const { setSelectedCampus, setSearchQuery } = useMarket();

  const handleCampusRedirect = (campus: Campus) => {
    setSelectedCampus(campus);
    onNavigate('marketplace');
  };

  return (
    <div
      className="container"
      style={{
        padding: '5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '680px'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)',
          color: 'var(--uc-blue, #002B7F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <Compass size={36} />
      </div>

      <span
        style={{
          backgroundColor: 'var(--uc-gold-light, #FFF2CC)',
          color: '#B45309',
          padding: '0.2rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '0.5rem'
        }}
      >
        404 • Campus Page Missing
      </span>

      <h1
        style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          lineHeight: 1.2
        }}
      >
        Looks like you took a wrong turn in the campus corridors!
      </h1>

      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
        The item or page you're searching for might have been sold, deleted, or moved to another UC campus hub.
      </p>

      {/* Shortcuts */}
      <div
        className="clean-card"
        style={{
          width: '100%',
          padding: '1.25rem',
          marginTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Explore Popular University of Cebu Campus Hubs:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {(['UC Main', 'UC Banilad', 'UC LM', 'UC METC'] as Campus[]).map((c) => (
            <button
              key={c}
              onClick={() => handleCampusRedirect(c)}
              className="btn-secondary"
              style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Browse {c}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Search Bar Recovery */}
      <div className="search-bar-wrapper" style={{ width: '100%', maxWidth: '460px', marginTop: '1.5rem' }}>
        <Search size={16} className="search-icon" style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
        <input
          type="text"
          placeholder="Search items, textbooks, uniforms across UC..."
          className="clean-input search-input"
          style={{ paddingLeft: '2.75rem', fontSize: '0.86rem' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) {
                setSearchQuery(val);
                onNavigate('marketplace');
              }
            }
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => onNavigate('home')}
          className="btn-primary"
          style={{ padding: '0.65rem 1.4rem' }}
        >
          <Home size={15} /> Return Home
        </button>

        <button
          onClick={() => onNavigate('marketplace')}
          className="btn-gold"
          style={{ padding: '0.65rem 1.4rem' }}
        >
          <Search size={15} /> Browse Marketplace
        </button>
      </div>
    </div>
  );
};
