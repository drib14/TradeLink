import React from 'react';
import { Home, ShoppingBag, Plus, Flame, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenChat,
  onOpenAuth
}) => {
  const { unreadTotal } = useChat();
  const { isAuthenticated } = useAuth();

  const handleSellClick = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    onNavigate('create-listing');
  };

  const handleChatClick = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    onOpenChat();
  };

  return (
    <nav className="mobile-nav-bar mobile-only">
      {/* 1. Home */}
      <button
        onClick={() => onNavigate('home')}
        className={`mobile-nav-item ${currentView === 'home' ? 'active' : ''}`}
        aria-label="Home"
      >
        <Home size={19} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: currentView === 'home' ? 800 : 600, marginTop: '2px', lineHeight: 1 }}>Home</span>
      </button>

      {/* 2. Explore / Marketplace */}
      <button
        onClick={() => onNavigate('marketplace')}
        className={`mobile-nav-item ${currentView === 'marketplace' ? 'active' : ''}`}
        aria-label="Marketplace Catalog"
      >
        <ShoppingBag size={19} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: currentView === 'marketplace' ? 800 : 600, marginTop: '2px', lineHeight: 1 }}>Catalog</span>
      </button>

      {/* 3. Center Floating Sell / Swap Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <button
          onClick={handleSellClick}
          className="mobile-sell-btn"
          aria-label="Post Item for Sale or Swap"
          style={{ cursor: 'pointer' }}
        >
          <Plus size={22} strokeWidth={2.8} style={{ flexShrink: 0 }} />
        </button>
      </div>

      {/* 4. Wanted Board */}
      <button
        onClick={() => onNavigate('wanted')}
        className={`mobile-nav-item ${currentView === 'wanted' ? 'active' : ''}`}
        aria-label="Wanted Board"
      >
        <Flame size={19} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: currentView === 'wanted' ? 800 : 600, marginTop: '2px', lineHeight: 1 }}>Wanted</span>
      </button>

      {/* 5. Chat / Messages */}
      <button
        onClick={handleChatClick}
        className="mobile-nav-item"
        aria-label="Student Messages"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={19} style={{ flexShrink: 0 }} />
          {unreadTotal > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '0.55rem',
                fontWeight: 800,
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              {unreadTotal}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px', lineHeight: 1 }}>Messages</span>
      </button>
    </nav>
  );
};
