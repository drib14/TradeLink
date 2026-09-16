import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

interface CookieConsentProps {
  onNavigate?: (view: string) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tradelink_cookie_consent');
    if (!consent) {
      // Small delay for smooth entry after initial page paint
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('tradelink_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('tradelink_cookie_consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl text-white">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                Privacy & Campus Security
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">TradeLink Student Experience</p>
            </div>
          </div>
          <button
            onClick={handleEssentialOnly}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          We use essential cookies and CSRF tokens to keep your campus account secure, authenticate trades, and verify student safety.
          {onNavigate && (
            <button
              onClick={() => onNavigate('privacy')}
              className="ml-1 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-medium"
            >
              Privacy Policy
            </button>
          )}
        </p>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleEssentialOnly}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold transition-all"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02]"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
