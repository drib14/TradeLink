import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useChat } from '../../context/ChatContext';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../common/Toast';
import { Campus } from '../../types';
import {
  Search,
  Plus,
  MessageSquare,
  ChevronDown,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  MapPin,
  Sparkles,
  ShoppingBag,
  User,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenChat,
  onOpenAuth
}) => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { selectedCampus, setSelectedCampus, searchQuery, setSearchQuery } = useMarket();
  const { unreadTotal, swaps, meetups } = useChat();
  const { pendingVerificationsCount, pendingFlagsCount } = useAdmin();
  const { showToast } = useToast();

  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const campuses: Array<'All' | Campus> = [
    'All',
    'UC Main',
    'UC Banilad',
    'UC LM',
    'UC METC',
    'UC PRI',
    'UC Pardo-Talisay',
    'UC South Campus',
    'UC Medical Center'
  ];

  const pendingSwapsCount = currentUser
    ? swaps.filter(
        (s) => (s.targetSellerId === currentUser.id || s.offererId === currentUser.id) && s.status === 'pending'
      ).length
    : 0;

  const activeMeetupsCount = currentUser
    ? meetups.filter(
        (m) => (m.sellerId === currentUser.id || m.buyerId === currentUser.id) && m.status === 'scheduled'
      ).length
    : 0;

  const handlePostClick = () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please log in to your UC student account to post items.', 'warning');
      onOpenAuth();
      return;
    }
    onNavigate('create-listing');
  };

  const handleSwapsClick = () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please log in to view and propose campus swaps.', 'warning');
      onOpenAuth();
      return;
    }
    onNavigate('swaps');
  };

  const handleMeetupsClick = () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please log in to view your scheduled meetups.', 'warning');
      onOpenAuth();
      return;
    }
    onNavigate('meetups');
  };

  const handleChatClick = () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please log in to message student buyers and sellers.', 'warning');
      onOpenAuth();
      return;
    }
    onOpenChat();
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    showToast('Logged Out', 'You have been logged out. You can still browse all campus items as a guest!', 'info');
  };

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1.5px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '0.85rem'
        }}
      >
        {/* Left: Brand Logo & Campus Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <button onClick={() => onNavigate('home')} style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size="sm" showSubtitle={false} />
          </button>

          {/* Minimal Campus Dropdown (Desktop Only) */}
          <div className="desktop-only" style={{ position: 'relative' }}>
            <button
              onClick={() => setIsCampusDropdownOpen(!isCampusDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#EBF1FC',
                border: '1px solid #BCD1F7',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#002B7F',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{selectedCampus === 'All' ? 'All UC Campuses' : selectedCampus}</span>
              <ChevronDown size={13} color="#002B7F" />
            </button>

            {isCampusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0, 43, 127, 0.12)',
                  width: '210px',
                  zIndex: 60,
                  padding: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem'
                }}
              >
                {campuses.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedCampus(c);
                      setIsCampusDropdownOpen(false);
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      textAlign: 'left',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: selectedCampus === c ? 800 : 500,
                      backgroundColor: selectedCampus === c ? '#EBF1FC' : 'transparent',
                      color: selectedCampus === c ? '#002B7F' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{c === 'All' ? 'All UC Campuses' : c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Input */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: '400px', position: 'relative' }}>
          <Search
            size={15}
            color="#64748B"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== 'marketplace') {
                onNavigate('marketplace');
              }
            }}
            className="clean-input"
            style={{
              padding: '0.45rem 0.85rem 0.45rem 2.25rem',
              backgroundColor: '#F8FAFC',
              fontSize: '0.84rem'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <button
              onClick={() => onNavigate('marketplace')}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'marketplace' ? 800 : 600,
                color: currentView === 'marketplace' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'marketplace' ? '#EBF1FC' : 'transparent'
              }}
            >
              Explore
            </button>

            <button
              onClick={() => onNavigate('wanted')}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'wanted' ? 800 : 600,
                color: currentView === 'wanted' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'wanted' ? '#EBF1FC' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Sparkles size={13} color="#D97706" />
              <span>Wanted</span>
            </button>

            <button
              onClick={handleSwapsClick}
              style={{
                position: 'relative',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'swaps' ? 800 : 600,
                color: currentView === 'swaps' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'swaps' ? '#EBF1FC' : 'transparent'
              }}
            >
              <span>Swaps</span>
              {pendingSwapsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '2px',
                    backgroundColor: '#E5A800',
                    color: '#002B7F',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pendingSwapsCount}
                </span>
              )}
            </button>

            <button
              onClick={handleMeetupsClick}
              style={{
                position: 'relative',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'meetups' ? 800 : 600,
                color: currentView === 'meetups' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'meetups' ? '#EBF1FC' : 'transparent'
              }}
            >
              <span>Meetups</span>
              {activeMeetupsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '2px',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {activeMeetupsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('campus-map')}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'campus-map' ? 800 : 600,
                color: currentView === 'campus-map' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'campus-map' ? '#EBF1FC' : 'transparent'
              }}
            >
              Landmarks
            </button>
          </div>

          {/* Admin link */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              style={{
                position: 'relative',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'admin' ? 800 : 600,
                color: currentView === 'admin' ? '#002B7F' : '#64748B',
                backgroundColor: currentView === 'admin' ? '#FFF2CC' : 'transparent'
              }}
            >
              <span>Admin Desk</span>
              {pendingVerificationsCount + pendingFlagsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '2px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pendingVerificationsCount + pendingFlagsCount}
                </span>
              )}
            </button>
          )}

          <div className="desktop-only" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1px', height: '18px', backgroundColor: '#E2E8F0', margin: '0 0.1rem' }} />

            {/* Chat Drawer */}
            <button
              onClick={handleChatClick}
              style={{
                position: 'relative',
                padding: '0.45rem',
                borderRadius: '8px',
                color: '#334155',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Messages"
            >
              <MessageSquare size={16} color="#002B7F" />
              {unreadTotal > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#002B7F',
                    color: '#FFC72C',
                    fontSize: '0.6rem',
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
            </button>

            {/* Post Listing CTA */}
            <button
              onClick={handlePostClick}
              className="btn-primary"
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 800
              }}
            >
              <Plus size={14} />
              <span>Post</span>
            </button>
          </div>

          {/* Live Notification Bell */}
          <NotificationDropdown onNavigate={onNavigate} />

          {/* Auth State (Logged In User Avatar or Log In CTA) */}
          {isAuthenticated && currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem',
                  borderRadius: '9999px',
                  backgroundColor: 'transparent'
                }}
                title={`Logged in as ${currentUser.name} (${currentUser.role})`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #002B7F' }}
                />
                {currentUser.isVerified && (
                  <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
                )}
              </button>

              {/* User Dropdown Menu with Log Out */}
              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1.5px solid #BCD1F7',
                    boxShadow: '0 12px 30px rgba(0, 43, 127, 0.15)',
                    zIndex: 100,
                    overflow: 'hidden',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#002B7F' }}>
                        {currentUser.name}
                      </span>
                      {currentUser.isVerified && (
                        <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                      {currentUser.campus} • ID: {currentUser.studentId}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('profile', { userId: currentUser.id });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#334155',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EBF1FC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <User size={14} color="#002B7F" />
                    <span>My Profile & Listings</span>
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('admin');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#002B7F',
                        backgroundColor: '#EBF1FC',
                        textAlign: 'left'
                      }}
                    >
                      <ShieldCheck size={14} color="#002B7F" />
                      <span>Admin Moderation Desk</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#DC2626',
                      textAlign: 'left',
                      borderTop: '1px solid #F8FAFC'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={14} color="#DC2626" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={onOpenAuth}
                className="btn-gold"
                style={{
                  padding: '0.42rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}
              >
                <LogIn size={13} />
                <span>Log In</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
