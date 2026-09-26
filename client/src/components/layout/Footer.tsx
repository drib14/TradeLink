import React from 'react';
import { Logo } from '../common/Logo';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="campus-footer">
      <div className="container footer-content-container">
        {/* Purpose, Description & Essential Navigation */}
        <div className="footer-main-row">
          <div className="footer-brand-section">
            <Logo size="sm" showSubtitle={false} isDark={true} />
            <p className="footer-description">
              Peer-to-peer student marketplace built exclusively for the University of Cebu community.
              Connecting Webites across campus hubs to trade textbooks, uniforms, reviewers, and college supplies safely.
            </p>
          </div>

          <nav className="footer-nav-row" aria-label="Essential platform links">
            <button onClick={() => onNavigate('about')} className="footer-link-btn">
              About
            </button>
            <button onClick={() => onNavigate('developers')} className="footer-link-btn">
              Developers &amp; Team
            </button>
            <button onClick={() => onNavigate('help-safety')} className="footer-link-btn">
              Campus Safety
            </button>
            <button onClick={() => onNavigate('faq')} className="footer-link-btn">
              FAQ &amp; Help
            </button>
            <button onClick={() => onNavigate('terms')} className="footer-link-btn">
              Honor Code &amp; Terms
            </button>
          </nav>
        </div>

        {/* Copyright with Branded TradeLink Highlight */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()}{' '}
            <span className="brand-text-highlight">
              <span className="brand-trade">Trade</span>
              <span className="brand-link">Link</span>
              <span className="brand-dot" />
            </span>
            {' '}&bull; University of Cebu Student Exchange. All rights reserved.
          </div>
          <div className="footer-tagline">
            Student-Powered Campus Network
          </div>
        </div>
      </div>
    </footer>
  );
};
