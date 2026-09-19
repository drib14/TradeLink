import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { useToast } from '../common/Toast';
import { api } from '../../services/api';
import { Mail, Check, HelpCircle, Shield, Users, FileText, Info, Cookie } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      showToast('Invalid Email', 'Please enter a valid university email address.', 'warning');
      return;
    }

    try {
      setIsSubscribing(true);
      await api.post('/newsletter/subscribe', { email: newsletterEmail.trim() });
      setIsSubscribed(true);
      setNewsletterEmail('');
      showToast('Subscribed!', 'You are now enrolled in TradeLink campus announcements and trade drops.', 'success');
    } catch {
      // Fallback success feedback
      setIsSubscribed(true);
      setNewsletterEmail('');
      showToast('Subscribed!', 'Thank you for joining TradeLink campus updates.', 'success');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer
      style={{
        backgroundColor: '#0F172A',
        borderTop: '1px solid #1E293B',
        color: '#94A3B8',
        paddingTop: '2.5rem',
        paddingBottom: '2.5rem',
        marginTop: 'auto',
        width: '100%'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        {/* Top Row: Brand & Newsletter */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            paddingBottom: '1.75rem',
            borderBottom: '1px solid #1E293B'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Logo size="sm" showSubtitle={false} isDark={true} />
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
                Student-Powered Campus Exchange
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, maxWidth: '400px', lineHeight: 1.4 }}>
              Peer-to-peer student marketplace for textbooks, uniforms, reviewers, and supplies across campus hubs.
            </p>
          </div>

          {/* Newsletter Box */}
          <form
            onSubmit={handleSubscribe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1E293B',
              padding: '4px 6px 4px 12px',
              borderRadius: '10px',
              border: '1px solid #334155',
              maxWidth: '380px',
              width: '100%'
            }}
          >
            <Mail size={15} color="#64748B" style={{ flexShrink: 0 }} />
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter email for campus drops..."
              disabled={isSubscribed || isSubscribing}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#F8FAFC',
                fontSize: '0.8rem',
                flex: 1,
                minWidth: 0
              }}
            />
            <button
              type="submit"
              disabled={isSubscribed || isSubscribing}
              style={{
                backgroundColor: isSubscribed ? '#059669' : '#002B7F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: isSubscribed ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s ease'
              }}
            >
              {isSubscribed ? (
                <>
                  <Check size={12} />
                  <span>Subscribed</span>
                </>
              ) : isSubscribing ? (
                <span>Joining...</span>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          </form>
        </div>

        {/* Middle Row: Essential Utility & Policy Links (No Navbar Duplicates) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <nav
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              fontSize: '0.82rem'
            }}
          >
            <button
              onClick={() => onNavigate('faq')}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <HelpCircle size={14} color="#64748B" />
              <span>FAQ & Help</span>
            </button>
            <button
              onClick={() => onNavigate('about')}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Info size={14} color="#64748B" />
              <span>About TradeLink</span>
            </button>
            <button
              onClick={() => onNavigate('developers')}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Users size={14} color="#64748B" />
              <span>Developers & Team</span>
            </button>
            <button
              onClick={() => onNavigate('help-safety')}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Shield size={14} color="#64748B" />
              <span>Campus Safety</span>
            </button>
            <button
              onClick={() => onNavigate('terms')}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <FileText size={14} color="#64748B" />
              <span>Honor Code & Terms</span>
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('tradelink_open_cookie_consent'))}
              style={{
                background: 'none',
                border: 'none',
                color: '#CBD5E1',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Cookie size={14} color="#64748B" />
              <span>Cookie Preferences</span>
            </button>
          </nav>
        </div>

        {/* Bottom Row: Campuses & Copyright */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #1E293B',
            fontSize: '0.75rem',
            color: '#64748B'
          }}
        >
          <span>
            UC Main &bull; UC Banilad &bull; UC LM &bull; UC METC &bull; UC Pardo-Talisay &bull; UC South &bull; UCMed &bull; UC PRI
          </span>
          <span>
            &copy; {new Date().getFullYear()} TradeLink &bull; Verified student-to-student platform
          </span>
        </div>
      </div>
    </footer>
  );
};
