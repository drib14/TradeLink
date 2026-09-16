import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, ChevronDown, ChevronUp, Check, SlidersHorizontal, Lock } from 'lucide-react';

interface CookieConsentProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if consent has already been saved
    const consent = localStorage.getItem('tradelink_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 400);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkMobile);
      };
    }

    // Allow re-triggering from Footer "Cookie Preferences" link
    const handleOpen = () => {
      setIsClosing(false);
      setIsVisible(true);
    };
    window.addEventListener('tradelink_open_cookie_consent', handleOpen);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('tradelink_open_cookie_consent', handleOpen);
    };
  }, []);

  // Lock background scroll whenever the cookie consent banner is open to disable everything behind it
  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);

  const closeWithAnimation = (callback: () => void) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      document.body.style.overflow = '';
      callback();
    }, 280);
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
      {/* Component animations */}
      <style>{`
        @keyframes cookieBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cookieBackdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes bannerSlideUp {
          0% {
            transform: translateY(100%);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes bannerSlideDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `}</style>

      {/* 1. Full-screen backdrop that disables interactions, clicks, and touches across the entire website */}
      <div
        id="tradelink-cookie-consent-backdrop"
        onClick={handleEssentialOnly}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99998,
          backgroundColor: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'auto',
          animation: isClosing ? 'cookieBackdropFadeOut 0.28s ease forwards' : 'cookieBackdropFadeIn 0.3s ease forwards',
          cursor: 'pointer'
        }}
        aria-hidden="true"
        title="Click to dismiss with essential cookies"
      />

      {/* 2. Bottom-Most Banner Popup */}
      <div
        id="tradelink-cookie-consent-banner"
        role="dialog"
        aria-modal="true"
        aria-label="Campus Privacy and Cookie Consent Banner"
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
          borderTop: '2px solid rgba(255, 199, 44, 0.5)',
          boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.85), 0 -4px 25px rgba(0, 43, 127, 0.5)',
          color: '#F8FAFC',
          fontFamily: 'var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif)',
          animation: isClosing ? 'bannerSlideDown 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'bannerSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: isMobile ? '1.15rem 1.15rem 1.5rem 1.15rem' : '1.4rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Main Banner Row */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? '1rem' : '2rem'
            }}
          >
            {/* Left: Icon & Explanatory Details */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 199, 44, 0.16)',
                  border: '1.5px solid rgba(255, 199, 44, 0.4)',
                  color: '#FFC72C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(255, 199, 44, 0.15)'
                }}
              >
                <Cookie size={26} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <h3 style={{ margin: 0, fontSize: isMobile ? '0.98rem' : '1.08rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    University Campus Privacy & Cookie Consent
                  </h3>
                  <div
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
                    <span>CSRF & Student Auth Guarded</span>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(0, 43, 127, 0.4)',
                      border: '1px solid rgba(255, 199, 44, 0.3)',
                      color: '#FFC72C',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}
                  >
                    <Lock size={10} />
                    <span>Action Required</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.55 }}>
                  TradeLink requires essential cookies and CSRF double-submit tokens to authenticate university sessions, protect peer-to-peer buy/sell/swap transactions, and prevent fraudulent postings across all 8 University of Cebu campuses.
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('terms', { tab: 'privacy' })}
                      style={{
                        marginLeft: '8px',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#FFC72C',
                        textDecoration: 'underline',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Read Privacy Policy &rarr;
                    </button>
                  )}
                </p>

                <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#94A3B8',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    <SlidersHorizontal size={13} />
                    <span>{showDetails ? 'Hide Cookie Settings' : 'Customize Cookie Settings'}</span>
                    {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons & Dismiss */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: isMobile ? '100%' : 'auto',
                flexShrink: 0
              }}
            >
              <button
                onClick={handleEssentialOnly}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#E2E8F0',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Essential Only
              </button>

              <button
                onClick={handleAcceptAll}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #002B7F 0%, #0A3EA8 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 43, 127, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
              >
                <span>Accept All Cookies</span>
                <span style={{ color: '#FFC72C' }}>&bull;</span>
                <span style={{ color: '#FFC72C', fontSize: '0.76rem' }}>8 Campuses</span>
              </button>

              <button
                onClick={handleEssentialOnly}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#94A3B8';
                }}
                title="Dismiss and use essential only"
                aria-label="Dismiss cookie notice"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Expandable Preferences Drawer */}
          {showDetails && (
            <div
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.7)',
                border: '1px solid rgba(51, 65, 85, 0.7)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto',
                gap: '1.25rem',
                alignItems: 'center'
              }}
            >
              {/* Category 1: Strictly Necessary */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF' }}>Strictly Necessary Security</span>
                  <span style={{ fontSize: '0.68rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.18)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                    Always Active
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                  Cryptographic CSRF double-submit tokens, JWT student credentials, anti-tampering guards, and security rate limiting.
                </p>
              </div>

              {/* Category 2: Campus Experience & Analytics */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF' }}>Campus Preferences & Speed</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                    Saves your chosen campus filter (e.g. UC Main, Banilad, LM, Prieto), quick filters, and UI performance cache.
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      inset: 0,
                      backgroundColor: analyticsEnabled ? '#002B7F' : '#334155',
                      border: analyticsEnabled ? '1.5px solid #FFC72C' : '1.5px solid #475569',
                      borderRadius: '24px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: analyticsEnabled ? '19px' : '3px',
                        bottom: '1.5px',
                        backgroundColor: analyticsEnabled ? '#FFC72C' : '#94A3B8',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Save Custom Preferences Button */}
              <div>
                <button
                  onClick={handleSaveCustom}
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 199, 44, 0.4)',
                    backgroundColor: 'rgba(255, 199, 44, 0.12)',
                    color: '#FFC72C',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 199, 44, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 199, 44, 0.12)';
                  }}
                >
                  Save Custom Choice
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
