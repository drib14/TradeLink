import React from 'react';
import { Wrench, Clock, ShieldCheck, Home, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/common/Logo';

interface MaintenancePageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onNavigate }) => {
  return (
    <div
      className="container"
      style={{
        padding: '5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '650px'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#FFF2CC',
          color: '#B45309',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <Wrench size={36} />
      </div>

      <span
        style={{
          backgroundColor: '#EBF1FC',
          color: '#002B7F',
          padding: '0.2rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '0.5rem'
        }}
      >
        Campus Server Upgrade Notice
      </span>

      <h1
        style={{
          fontSize: '2.2rem',
          fontWeight: 900,
          color: '#002B7F',
          fontFamily: 'var(--font-display)',
          lineHeight: 1.2
        }}
      >
        UC TradeLink System Maintenance
      </h1>

      <p style={{ fontSize: '0.95rem', color: '#64748B', marginTop: '0.75rem', lineHeight: 1.6 }}>
        Our university server infrastructure is currently undergoing scheduled semester optimization to enhance student verification speed and handshake encryption across all 7 campuses.
      </p>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #CBD5E1',
          borderRadius: '12px',
          padding: '1.25rem',
          marginTop: '1.75rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#002B7F' }}>
          <Clock size={16} /> Estimated Service Resumption:
        </div>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
          Tonight at 11:30 PM PHT • All active scheduled meetups remain saved in offline secure storage.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
        <button
          onClick={() => onNavigate('home')}
          className="btn-primary"
          style={{ padding: '0.65rem 1.4rem' }}
        >
          <Home size={15} /> Return to Home
        </button>

        <button
          onClick={() => onNavigate('help-safety')}
          className="btn-secondary"
          style={{ padding: '0.65rem 1.4rem' }}
        >
          <ShieldCheck size={15} /> View Safety Hotlines
        </button>
      </div>
    </div>
  );
};
