import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tradelink_admin_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      localStorage.setItem('tradelink_admin_cookie_consent', 'accepted');
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes adminCookieCardSlideIn {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes adminCookieCardSlideOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
        }
        .admin-cookie-card {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: calc(100% - 32px);
          max-width: 420px;
          z-index: 9999;
          font-family: inherit;
          animation: adminCookieCardSlideIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          pointer-events: auto;
        }
        .admin-cookie-card.closing {
          animation: adminCookieCardSlideOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 640px) {
          .admin-cookie-card {
            bottom: 16px;
            left: 16px;
            right: 16px;
            width: calc(100% - 32px);
            margin: 0 auto;
          }
        }
        .admin-cookie-btn-primary {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          border: 1px solid rgba(147, 197, 253, 0.35);
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .admin-cookie-btn-primary:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
        }
        .admin-cookie-btn-primary:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Floating Modern Admin Cookie Card */}
      <div
        id="tradelink-admin-cookie-card"
        className={`admin-cookie-card ${isClosing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="Admin Security and Cookie Notice"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 20px -2px rgba(37, 99, 235, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Blue Accent Top Line */}
        <div
          style={{
            height: '2.5px',
            width: '100%',
            background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 50%, #3B82F6 100%)',
            flexShrink: 0
          }}
        />

        <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0.08) 100%)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(37, 99, 235, 0.2)'
                }}
              >
                <Cookie size={20} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Admin Session Security
                  </h3>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34D399',
                      fontSize: '0.68rem',
                      fontWeight: 700
                    }}
                  >
                    <ShieldCheck size={11} />
                    <span>Protected</span>
                  </span>
                </div>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#94A3B8' }}>
                  HttpOnly authentication & CSRF tokens
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeWithAnimation}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '8px',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#94A3B8';
              }}
              title="Acknowledge notice"
              aria-label="Acknowledge notice"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description */}
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.55 }}>
            The TradeLink Administration Portal uses strictly necessary HttpOnly cookies and CSRF double-submit tokens to protect administrator sessions and moderation audit logs.
          </p>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
            <button
              onClick={closeWithAnimation}
              className="admin-cookie-btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem 1.2rem',
                borderRadius: '11px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

