import React from 'react';
import { Home, ShoppingBag, Plus, Flame, MessageSquare, MapPin, User } from 'lucide-react';
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
  const { isAuthenticated, currentUser } = useAuth();

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
        <Home size={19} />
        <span>Home</span>
      </button>

      {/* 2. Explore / Marketplace */}
      <button
        onClick={() => onNavigate('marketplace')}
        className={`mobile-nav-item ${currentView === 'marketplace' ? 'active' : ''}`}
        aria-label="Marketplace Catalog"
      >
        <ShoppingBag size={19} />
        <span>Catalog</span>
      </button>

      {/* 3. Center Floating Sell / Swap Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <button
          onClick={handleSellClick}
          className="mobile-sell-btn"
          aria-label="Post Item for Sale or Swap"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>
      </div>

      {/* 4. Wanted Board */}
      <button
        onClick={() => onNavigate('wanted')}
        className={`mobile-nav-item ${currentView === 'wanted' ? 'active' : ''}`}
        aria-label="Wanted Board"
      >
        <Flame size={19} />
        <span>Wanted</span>
      </button>

      {/* 5. Chat / Messages */}
      <button
        onClick={handleChatClick}
        className="mobile-nav-item"
        aria-label="Student Messages"
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={19} />
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
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {unreadTotal}
            </span>
          )}
        </div>
        <span>Messages</span>
      </button>
    </nav>
  );
};
