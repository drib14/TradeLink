import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, ChevronDown, ChevronUp, SlidersHorizontal, Lock, Check } from 'lucide-react';

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
        @keyframes cookieCardSlideIn {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes cookieCardSlideOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
        }
        .tradelink-cookie-card {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: calc(100% - 32px);
          max-width: 440px;
          z-index: 9999;
          font-family: var(--font-sans, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif);
          animation: cookieCardSlideIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          pointer-events: auto;
        }
        .tradelink-cookie-card.closing {
          animation: cookieCardSlideOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 640px) {
          .tradelink-cookie-card {
            bottom: 16px;
            left: 16px;
            right: 16px;
            width: calc(100% - 32px);
            margin: 0 auto;
          }
        }
        .cookie-btn-primary {
          background: linear-gradient(135deg, #002B7F 0%, #0A3EA8 100%);
          border: 1px solid rgba(255, 199, 44, 0.4);
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(0, 43, 127, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cookie-btn-primary:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 43, 127, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .cookie-btn-primary:active {
          transform: translateY(0);
        }
        .cookie-btn-ghost {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #E2E8F0;
          transition: all 0.2s ease;
        }
        .cookie-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.28);
          color: #FFFFFF;
          transform: translateY(-1px);
        }
        .cookie-btn-ghost:active {
          transform: translateY(0);
        }
        .cookie-toggle-track {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
      `}</style>

      {/* Floating Modern Cookie Card */}
      <div
        id="tradelink-cookie-consent-card"
        className={`tradelink-cookie-card ${isClosing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="Privacy & Cookie Preferences"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 20px -2px rgba(0, 43, 127, 0.3)',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Subtle glowing accent top border line */}
        <div
          style={{
            height: '2.5px',
            width: '100%',
            background: 'linear-gradient(90deg, #FFC72C 0%, #0A3EA8 50%, #FFC72C 100%)',
            flexShrink: 0
          }}
        />

        <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, rgba(255, 199, 44, 0.18) 0%, rgba(255, 199, 44, 0.05) 100%)',
                  border: '1px solid rgba(255, 199, 44, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFC72C',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(255, 199, 44, 0.15)'
                }}
              >
                <Cookie size={20} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Privacy & Cookie Choices
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
                  Student marketplace security & session integrity
                </p>
              </div>
            </div>

            {/* Dismiss X Icon */}
            <button
              onClick={handleEssentialOnly}
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
              title="Dismiss with essential cookies only"
              aria-label="Dismiss cookie notice"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description Paragraph */}
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.55 }}>
            TradeLink uses essential cookies to keep your student account securely signed in, authenticate peer-to-peer exchanges, and remember your campus filter. No advertising or cross-site tracking.
            {onNavigate && (
              <button
                onClick={() => onNavigate('terms', { tab: 'privacy' })}
                style={{
                  marginLeft: '6px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#FFC72C',
                  textDecoration: 'underline',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline'
                }}
              >
                Privacy details &rarr;
              </button>
            )}
          </p>

          {/* Preferences Accordion Trigger */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#94A3B8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <SlidersHorizontal size={13} />
              <span>{showDetails ? 'Hide preferences' : 'Customize preferences'}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Expandable Preferences Drawer */}
          {showDetails && (
            <div
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.65)',
                border: '1px solid rgba(51, 65, 85, 0.6)',
                borderRadius: '14px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              {/* Category 1: Strictly Necessary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(51, 65, 85, 0.4)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <Lock size={12} color="#10B981" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                      Security & Authentication
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    CSRF double-submit tokens, JWT student sessions, and anti-tamper security.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  Always Active
                </span>
              </div>

              {/* Category 2: Campus & Preferences */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                    Campus & UI Preferences
                  </span>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Remembers your active campus filter and marketplace speed cache.
                  </p>
                </div>

                {/* Custom Toggle Switch */}
                <label
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '42px',
                    height: '24px',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  />
                  <span
                    className="cookie-toggle-track"
                    style={{
                      display: 'block',
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: analyticsEnabled ? '#0A3EA8' : '#334155',
                      border: analyticsEnabled ? '1.5px solid #FFC72C' : '1.5px solid #475569',
                      borderRadius: '24px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '16px',
                        width: '16px',
                        left: analyticsEnabled ? '20px' : '3px',
                        bottom: '2.5px',
                        backgroundColor: analyticsEnabled ? '#FFC72C' : '#94A3B8',
                        borderRadius: '50%',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Save Preferences Button inside drawer */}
              <button
                onClick={handleSaveCustom}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '9px',
                  border: '1px solid rgba(255, 199, 44, 0.35)',
                  backgroundColor: 'rgba(255, 199, 44, 0.1)',
                  color: '#FFC72C',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  marginTop: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 199, 44, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 199, 44, 0.1)';
                }}
              >
                <Check size={13} />
                <span>Save Selected Preferences</span>
              </button>
            </div>
          )}

          {/* Action Buttons Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              width: '100%'
            }}
          >
            <button
              onClick={handleEssentialOnly}
              className="cookie-btn-ghost"
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '11px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              Essential Only
            </button>

            <button
              onClick={handleAcceptAll}
              className="cookie-btn-primary"
              style={{
                flex: 1.4,
                padding: '0.65rem 1rem',
                borderRadius: '11px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

