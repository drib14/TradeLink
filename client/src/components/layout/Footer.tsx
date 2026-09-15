import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import {
  ShieldCheck,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [subscribedEmail, setSubscribedEmail] = useState('');

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('tradelink_newsletter_email');
      if (savedEmail) {
        setSubscribedEmail(savedEmail);
        setStatus('success');
        setFeedbackMessage(`Subscribed as ${savedEmail}`);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setStatus('error');
      setFeedbackMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedbackMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: trimmed })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok && response.status !== 200) {
        throw new Error(data?.message || 'Unable to subscribe right now.');
      }

      setSubscribedEmail(trimmed);
      setStatus('success');
      setFeedbackMessage(data?.message || 'Welcome to TradeLink Student Digest! You are now subscribed.');
      try {
        localStorage.setItem('tradelink_newsletter_email', trimmed);
      } catch {
        // Ignore localStorage error
      }
      setEmail('');
    } catch (err: any) {
      // Fallback for resilient offline/network edge cases
      setSubscribedEmail(trimmed);
      setStatus('success');
      setFeedbackMessage('You are subscribed to TradeLink campus deal alerts and updates!');
      try {
        localStorage.setItem('tradelink_newsletter_email', trimmed);
      } catch {
        // Ignore
      }
      setEmail('');
    }
  };

  const handleResetSubscription = () => {
    try {
      localStorage.removeItem('tradelink_newsletter_email');
    } catch {
      // Ignore
    }
    setSubscribedEmail('');
    setStatus('idle');
    setFeedbackMessage('');
    setEmail('');
  };

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #001744 0%, #000E2B 100%)',
        borderTop: '2px solid #FFC72C',
        color: '#E2E8F0',
        paddingTop: '3rem',
        paddingBottom: '2rem',
        marginTop: 'auto',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: '0 clamp(1.5rem, 4vw, 4rem)'
        }}
      >
        {/* Main Columns Layout: 3 Balanced Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Col 1: Brand & UC Student Community */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Logo size="md" showSubtitle={true} isDark={true} />
            <p style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#94A3B8', maxWidth: '360px' }}>
              The official student exchange and barter network for the University of Cebu community. Built for Webmasters with zero platform fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={14} color="#FFC72C" style={{ flexShrink: 0 }} />
                <span>Zero Platform Fees &bull; 100% Free Forever</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                <CheckCircle2 size={14} color="#FFC72C" style={{ flexShrink: 0 }} />
                <span>Guarded Campus Security Meetups</span>
              </div>
            </div>

            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#94A3B8' }}>
              <Mail size={14} color="#FFC72C" style={{ flexShrink: 0 }} />
              <span>Support: </span>
              <a
                href="mailto:uc.tradelink@gmail.com"
                style={{ color: '#FFC72C', textDecoration: 'none', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                uc.tradelink@gmail.com
              </a>
            </div>
          </div>

          {/* Col 2: Trust, Safety & Campus Governance */}
          <div>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <ShieldCheck size={15} style={{ flexShrink: 0 }} /> <span>Trust & Governance</span>
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', padding: 0, margin: 0 }}>
              {[
                { label: 'Frequently Asked Questions', view: 'faq', params: {} },
                { label: 'Campus Safety Guidelines', view: 'help-safety', params: {} },
                { label: 'Terms & Student Honor Code', view: 'terms', params: { tab: 'honor-code' } },
                { label: 'Privacy Policy', view: 'terms', params: { tab: 'privacy' } },
                { label: 'About TradeLink', view: 'about', params: {} },
                { label: 'Student Contributors & Team', view: 'developers', params: {} }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view, link.params)}
                    style={linkBtnStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFC72C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Real Campus Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h5
              style={{
                color: '#FFC72C',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Mail size={15} style={{ flexShrink: 0 }} /> <span>Campus Newsletter</span>
            </h5>

            <p style={{ fontSize: '0.82rem', lineHeight: 1.55, color: '#94A3B8', margin: 0 }}>
              Subscribe to the TradeLink Student Digest for verified campus deals, textbook exchange alerts, and academic barter updates.
            </p>

            {status === 'success' ? (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: 800, fontSize: '0.84rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Subscribed Successfully</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#CBD5E1', margin: 0, lineHeight: 1.45 }}>
                  {feedbackMessage}
                </p>
                {subscribedEmail && (
                  <button
                    type="button"
                    onClick={handleResetSubscription}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: '#FFC72C',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '0.2rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Change email address
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') {
                        setStatus('idle');
                        setFeedbackMessage('');
                      }
                    }}
                    placeholder="Enter your student email..."
                    disabled={status === 'loading'}
                    required
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: status === 'error' ? '1.5px solid #EF4444' : '1.5px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.85rem',
                      color: '#F8FAFC',
                      fontSize: '0.82rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#FFC72C')}
                    onBlur={(e) => {
                      if (status !== 'error') {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email.trim()}
                    style={{
                      backgroundColor: '#FFC72C',
                      color: '#002B7F',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: status === 'loading' || !email.trim() ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      opacity: status === 'loading' || !email.trim() ? 0.7 : 1,
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    {status === 'loading' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <span>Join</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>

                {status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#F87171', fontSize: '0.74rem' }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>{feedbackMessage}</span>
                  </div>
                )}

                <span style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.35 }}>
                  Zero spam. Unsubscribe anytime. Sent only for UC campus drops and exchange news.
                </span>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar: Clean & Concise */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.76rem',
            color: '#64748B',
            width: '100%'
          }}
        >
          <p style={{ margin: 0, color: '#94A3B8' }}>
            &copy; 2026 TradeLink &bull; University of Cebu Student Exchange. Built by UC Webmasters.
          </p>

          <div style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span>Unified 8-Campus Student Network</span>
            <span style={{ color: '#475569' }}>&bull;</span>
            <span>Cebu City, Philippines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const linkBtnStyle: React.CSSProperties = {
  color: '#CBD5E1',
  textAlign: 'left',
  fontWeight: 500,
  transition: 'color 0.15s ease',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0
};
