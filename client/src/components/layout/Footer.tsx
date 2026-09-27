import React from 'react';
import { Logo } from '../common/Logo';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="campus-footer">
      <div className="footer-content-container">
        {/* Main Section: Brand & Description on Left, Clean Links on Right */}
        <div className="footer-main-row">
          {/* Brand & Clean Platform Description */}
          <div className="footer-brand-section">
            <Logo size="md" showSubtitle={false} isDark={true} />
            <p className="footer-description">
              Peer-to-peer student marketplace for the University of Cebu community.
              Connect with fellow Webmasters across all campuses to buy, sell, and swap
              textbooks, uniforms, reviewers, and supplies safely.
            </p>
          </div>

          {/* Simple, Essential Navigation Links */}
          <nav className="footer-links-row" aria-label="Essential platform links">
            <button onClick={() => onNavigate('about')} className="footer-link-btn">
              About
            </button>
            <button onClick={() => onNavigate('developers')} className="footer-link-btn">
              Developers
            </button>
            <button onClick={() => onNavigate('help-safety')} className="footer-link-btn">
              Campus Safety
            </button>
            <button onClick={() => onNavigate('faq')} className="footer-link-btn">
              FAQ
            </button>
            <button onClick={() => onNavigate('terms')} className="footer-link-btn">
              Honor Code &amp; Terms
            </button>
          </nav>
        </div>

        {/* Clean Divider & Copyright */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} TradeLink &bull; University of Cebu Student Exchange
          </div>
          <div className="footer-tagline">
            University of Cebu Webmasters
          </div>
        </div>
      </div>
    </footer>
  );
};
