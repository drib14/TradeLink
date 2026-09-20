import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check } from 'lucide-react';

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
        @keyframes adminCookieBannerSlideUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes adminCookieBannerSlideDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        .admin-cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
          animation: adminCookieBannerSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          background-color: #FFFFFF;
          border-top: 1px solid #E2E8F0;
          box-shadow: 0 -4px 24px rgba(0, 43, 127, 0.08);
        }
        .admin-cookie-banner.closing {
          animation: adminCookieBannerSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .admin-cookie-btn-primary {
          background-color: #002B7F;
          border: 1px solid #001D59;
          color: #FFFFFF;
          font-weight: 700;
          transition: background-color 0.15s ease;
        }
        .admin-cookie-btn-primary:hover {
          background-color: #001D59;
        }
      `}</style>

      {/* Admin Bottom-Fixed Security Banner */}
      <aside
        id="tradelink-admin-cookie-banner"
        className={`admin-cookie-banner ${isClosing ? 'closing' : ''}`}
        role="region"
        aria-label="Admin Security and Cookie Notice"
      >
        {/* Solid Gold Accent Strip at Top */}
        <div style={{ height: '3px', backgroundColor: '#FFC72C', width: '100%' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 500px', minWidth: '280px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EBF1FC',
                border: '1px solid #BCD1F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#002B7F',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={20} color="#002B7F" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                University of Cebu · Administrative Moderation Security Notice
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                This portal requires secure HttpOnly session cookies, signed audit tracking, and CSRF authentication to protect campus student moderation and dispute operations.
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={closeWithAnimation}
              className="admin-cookie-btn-primary"
              style={{
                padding: '0.55rem 1.35rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Check size={14} />
              <span>Acknowledge &amp; Continue</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
