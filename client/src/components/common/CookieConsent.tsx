import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, ChevronDown, ChevronUp, SlidersHorizontal, Lock, Check } from 'lucide-react';

interface CookieConsentProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Check if consent has already been saved
    const consent = localStorage.getItem('tradelink_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }

    // Allow re-triggering from Footer "Cookie Settings" button
    const handleOpen = () => {
      setIsClosing(false);
      setIsVisible(true);
    };
    window.addEventListener('tradelink_open_cookie_consent', handleOpen);

    return () => {
      window.removeEventListener('tradelink_open_cookie_consent', handleOpen);
    };
  }, []);

  const closeWithAnimation = (callback: () => void) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      callback();
    }, 250);
  };

  const handleAcceptAll = () => {
    closeWithAnimation(() => {
      localStorage.setItem('tradelink_cookie_consent', 'all');
      localStorage.setItem('tradelink_consent_analytics', 'true');
    });
  };

  const handleEssentialOnly = () => {
    closeWithAnimation(() => {
      localStorage.setItem('tradelink_cookie_consent', 'essential');
      localStorage.setItem('tradelink_consent_analytics', 'false');
    });
  };

  const handleSaveCustom = () => {
    closeWithAnimation(() => {
      localStorage.setItem('tradelink_cookie_consent', analyticsEnabled ? 'all' : 'essential');
      localStorage.setItem('tradelink_consent_analytics', analyticsEnabled ? 'true' : 'false');
    });
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes cookieBannerSlideUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes cookieBannerSlideDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        .tradelink-cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          font-family: var(--font-sans, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif);
          animation: cookieBannerSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          background-color: #FFFFFF;
          border-top: 1px solid #E2E8F0;
          box-shadow: 0 -4px 24px rgba(0, 43, 127, 0.08);
        }
        @media (max-width: 768px) {
          .tradelink-cookie-banner {
            bottom: calc(78px + var(--safe-bottom, 0px)) !important;
            left: 12px !important;
            right: 12px !important;
            width: calc(100% - 24px) !important;
            border-radius: 20px !important;
            border: 1px solid #CBD5E1 !important;
            box-shadow: 0 12px 36px rgba(0, 43, 127, 0.22) !important;
            max-height: 80vh;
            overflow-y: auto;
          }
        }
        .tradelink-cookie-banner.closing {
          animation: cookieBannerSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .cookie-btn-primary {
          background-color: #002B7F;
          border: 1px solid #001D59;
          color: #FFFFFF;
          font-weight: 700;
          transition: background-color 0.15s ease, transform 0.15s ease;
        }
        .cookie-btn-primary:hover {
          background-color: #001D59;
        }
        .cookie-btn-secondary {
          background-color: #F1F5F9;
          border: 1px solid #CBD5E1;
          color: #334155;
          font-weight: 600;
          transition: background-color 0.15s ease;
        }
        .cookie-btn-secondary:hover {
          background-color: #E2E8F0;
          color: #0F172A;
        }
        .cookie-btn-ghost {
          background: transparent;
          border: 1px solid transparent;
          color: #002B7F;
          font-weight: 600;
          transition: background-color 0.15s ease;
        }
        .cookie-btn-ghost:hover {
          background-color: #EBF1FC;
        }
        .cookie-toggle-track {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 9999px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
      `}</style>

      {/* Bottom Fixed Banner */}
      <aside
        id="tradelink-cookie-consent-banner"
        className={`tradelink-cookie-banner ${isClosing ? 'closing' : ''}`}
        role="region"
        aria-label="Privacy & Cookie Notice"
      >
        {/* Solid Gold Accent Strip at Top */}
        <div style={{ height: '3px', backgroundColor: '#FFC72C', width: '100%' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Main Banner Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            {/* Notice Text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: '1 1 520px', minWidth: '280px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EBF1FC',
                  border: '1px solid #BCD1F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#002B7F',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              >
                <Cookie size={20} color="#002B7F" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    University of Cebu Privacy &amp; Cookie Consent
                  </h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={12} /> Student Privacy Protected
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
                  We use essential cookies to maintain secure authenticated student sessions, CSRF protection, and trade preferences across all 8 UC campuses. Optional telemetry helps us enhance peer-to-peer performance.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="cookie-btn-ghost"
                style={{
                  padding: '0.55rem 0.95rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <SlidersHorizontal size={14} />
                <span>{showDetails ? 'Hide Settings' : 'Customize'}</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button
                type="button"
                onClick={handleEssentialOnly}
                className="cookie-btn-secondary"
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Essential Only
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="cookie-btn-primary"
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
                <Check size={15} />
                <span>Accept All</span>
              </button>
            </div>
          </div>

          {/* Expandable Preferences Drawer */}
          {showDetails && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginTop: '0.35rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* 1. Strictly Necessary */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Lock size={14} color="#002B7F" />
                      <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>Essential Authentication &amp; CSRF</strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                      Required for secure sign-in, JWT token refresh, and preventing cross-site request forgery. Cannot be deactivated.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#002B7F', backgroundColor: '#EBF1FC', padding: '0.2rem 0.6rem', borderRadius: '6px', flexShrink: 0 }}>
                    Always Active
                  </span>
                </div>

                {/* 2. Campus Analytics */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <SlidersHorizontal size={14} color="#FFC72C" />
                      <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>Performance &amp; Campus Telemetry</strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                      Aggregated metrics measuring listing load times and search responsiveness across UC Main, Banilad, LM, and METC.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className="cookie-toggle-track"
                    style={{
                      backgroundColor: analyticsEnabled ? '#002B7F' : '#CBD5E1',
                      border: 'none',
                      flexShrink: 0
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: analyticsEnabled ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '50%',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Learn more in our{' '}
                  <a
                    href="#terms"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onNavigate) onNavigate('terms');
                    }}
                    style={{ color: '#002B7F', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Campus Community Terms
                  </a>
                </span>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="cookie-btn-primary"
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Save My Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
