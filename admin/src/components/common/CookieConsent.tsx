import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, Lock } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tradelink_admin_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Lock background scroll to disable everything behind the banner until answered
  useEffect(() => {
    if (isVisible) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isVisible]);

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      document.body.style.overflow = '';
      localStorage.setItem('tradelink_admin_cookie_consent', 'accepted');
    }, 280);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes adminBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes adminBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes adminBannerIn {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes adminBannerOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `}</style>

      {/* Full-screen backdrop disabling all page interactions until acknowledged or closed */}
      <div
        id="tradelink-admin-cookie-backdrop"
        onClick={closeWithAnimation}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99998,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'auto',
          animation: isClosing ? 'adminBackdropOut 0.28s ease forwards' : 'adminBackdropIn 0.3s ease forwards',
          cursor: 'pointer'
        }}
        aria-hidden="true"
        title="Click to acknowledge and continue"
      />

      {/* Bottom-Most Banner Popup */}
      <div
        id="tradelink-admin-cookie-banner"
        role="dialog"
        aria-modal="true"
        aria-label="Administrator Security and Cookie Policy Banner"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '2px solid rgba(37, 99, 235, 0.6)',
          boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.85), 0 -4px 25px rgba(37, 99, 235, 0.4)',
          color: '#F8FAFC',
          fontFamily: 'inherit',
          animation: isClosing ? 'adminBannerOut 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'adminBannerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: '1.25rem 2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem'
          }}
        >
          {/* Left Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Cookie size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Administrative Security & Session Cookies
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34D399',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  <ShieldCheck size={12} />
                  <span>Mandatory Security</span>
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(37, 99, 235, 0.25)',
                    border: '1px solid rgba(37, 99, 235, 0.5)',
                    color: '#60A5FA',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  <Lock size={10} />
                  <span>Action Required</span>
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                The UC Administration Portal requires strictly necessary HttpOnly cookies and CSRF double-submit tokens to protect administrative sessions, audit logging, and moderation commands against cross-origin attacks. All portal actions remain paused until acknowledged.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <button
              onClick={closeWithAnimation}
              style={{
                padding: '0.7rem 1.4rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
            >
              Acknowledge & Enable Portal
            </button>

            <button
              onClick={closeWithAnimation}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#94A3B8';
              }}
              title="Close notice"
              aria-label="Close notice"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
