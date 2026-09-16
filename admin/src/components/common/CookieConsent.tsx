import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tradelink_admin_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('tradelink_admin_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
      maxWidth: '420px',
      zIndex: 9999,
      backgroundColor: '#0F172A',
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      color: '#F8FAFC',
      fontFamily: 'inherit'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            padding: '0.4rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Cookie size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Portal Security & Tokens
              <ShieldCheck size={14} color="#10B981" />
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Administrator Environment</span>
          </div>
        </div>
        <button
          onClick={handleAccept}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px'
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.5 }}>
        The UC Administration Portal uses strictly necessary HttpOnly cookies and CSRF double-submit tokens to protect administrative sessions, auditing, and moderation desk commands.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button
          onClick={handleAccept}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '10px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
          }}
        >
          Acknowledge & Continue
        </button>
      </div>
    </div>
  );
};
