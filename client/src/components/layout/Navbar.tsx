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
  ExternalLink,
  Crown
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
  const { currentUser, isAuthenticated, logout, isSuperAdmin } = useAuth();
  const { selectedCampus, setSelectedCampus, searchQuery, setSearchQuery } = useMarket();
  const { unreadTotal, swaps, meetups } = useChat();
  const { pendingVerificationsCount, pendingFlagsCount, pendingDisputesCount } = useAdmin();
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
    showToast('Logged Out', 'You have been logged out.', 'info');
  };

  if (currentUser?.role === 'superadmin') {
    return (
      <header
        style={{
          background: 'linear-gradient(90deg, #450A0A 0%, #7F1D1D 50%, #991B1B 100%)',
          borderBottom: '2px solid #EF4444',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          color: '#FFFFFF'
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            gap: '1rem'
          }}
        >
          {/* Left: Brand Logo & Super Admin Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Logo size="sm" showSubtitle={false} isDark={true} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FEF08A',
                border: '1px solid rgba(254, 240, 138, 0.4)',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              <Crown size={14} color="#FEF08A" style={{ flexShrink: 0 }} />
              <span>Super Administration Console</span>
            </div>
          </div>

          {/* Center: System Scope Info */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#FEE2E2' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#86EFAC', fontWeight: 700 }}>
              ● Full Platform Oversight
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              Root Controls
            </span>
          </div>

          {/* Right: Moderator Profile & Sign Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #EF4444', objectFit: 'cover', flexShrink: 0 }}
              />
              <div className="desktop-only" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#FCA5A5' }}>superadmin@uc.edu.ph</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} style={{ flexShrink: 0 }} />
              <span>Exit Super Admin</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  if (currentUser?.role === 'admin') {
    return (
      <header
        style={{
          backgroundColor: '#001D59',
          borderBottom: '2px solid #FFC72C',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          color: '#FFFFFF'
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            gap: '1rem'
          }}
        >
          {/* Left: Brand Logo & Moderation Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Logo size="sm" showSubtitle={false} isDark={true} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 199, 44, 0.15)',
                color: '#FFC72C',
                border: '1px solid rgba(255, 199, 44, 0.4)',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              <ShieldCheck size={14} color="#FFC72C" style={{ flexShrink: 0 }} />
              <span>Campus Administration Desk</span>
            </div>
          </div>

          {/* Center: System Scope Info */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#CBD5E1' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#38BDF8', fontWeight: 700 }}>
              ● All 8 Campuses Moderation Live
            </span>
            {pendingVerificationsCount > 0 && (
              <span style={{ backgroundColor: '#D97706', color: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                {pendingVerificationsCount} KYC Pending
              </span>
            )}
            {pendingFlagsCount > 0 && (
              <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                {pendingFlagsCount} Flags
              </span>
            )}
          </div>

          {/* Right: Moderator Profile & Sign Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #FFC72C', objectFit: 'cover', flexShrink: 0 }}
              />
              <div className="desktop-only" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>admin@uc.edu.ph</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} style={{ flexShrink: 0 }} />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1.5px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        boxShadow: '0 2px 8px -2px rgba(0, 43, 127, 0.05)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '1rem'
        }}
      >
        {/* Left: Brand Logo & Campus Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
          <button onClick={() => onNavigate('home')} style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size="sm" showSubtitle={false} />
          </button>

          {/* Minimal Campus Dropdown (Desktop Only) */}
          <div className="desktop-only" style={{ position: 'relative' }}>
            <button
              onClick={() => setIsCampusDropdownOpen(!isCampusDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#EBF1FC',
                border: '1.5px solid #BCD1F7',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#002B7F',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{selectedCampus === 'All' ? 'All UC Campuses' : selectedCampus}</span>
              <ChevronDown size={14} color="#002B7F" style={{ flexShrink: 0 }} />
            </button>

            {isCampusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #BCD1F7',
                  borderRadius: '10px',
                  boxShadow: '0 12px 28px rgba(0, 43, 127, 0.12)',
                  width: '220px',
                  zIndex: 60,
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
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
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
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
        <div style={{ flex: 1, minWidth: 0, maxWidth: '420px', position: 'relative' }}>
          <Search
            size={15}
            color="#64748B"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search marketplace items, books, calculators..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== 'marketplace') {
                onNavigate('marketplace');
              }
            }}
            className="clean-input"
            style={{
              padding: '0.5rem 0.85rem 0.5rem 2.35rem',
              backgroundColor: '#F8FAFC',
              fontSize: '0.84rem'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => onNavigate('marketplace')}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
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
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'wanted' ? 800 : 600,
                color: currentView === 'wanted' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'wanted' ? '#EBF1FC' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Sparkles size={14} color="#D97706" style={{ flexShrink: 0 }} />
              <span>Wanted</span>
            </button>

            <button
              onClick={handleSwapsClick}
              style={{
                position: 'relative',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
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
                    top: '2px',
                    right: '2px',
                    backgroundColor: '#E5A800',
                    color: '#002B7F',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
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
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
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
                    top: '2px',
                    right: '2px',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
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
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'campus-map' ? 800 : 600,
                color: currentView === 'campus-map' ? '#002B7F' : '#475569',
                backgroundColor: currentView === 'campus-map' ? '#EBF1FC' : 'transparent'
              }}
            >
              Landmarks
            </button>
          </div>

          <div className="desktop-only" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0', margin: '0 0.2rem' }} />

            {/* Chat Drawer */}
            <button
              onClick={handleChatClick}
              style={{
                position: 'relative',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#334155',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Messages"
            >
              <MessageSquare size={16} color="#002B7F" style={{ flexShrink: 0 }} />
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
                    width: '15px',
                    height: '15px',
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
                padding: '0.48rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 800
              }}
            >
              <Plus size={15} style={{ flexShrink: 0 }} />
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.2rem',
                  borderRadius: '9999px',
                  backgroundColor: 'transparent'
                }}
                title={`Logged in as ${currentUser.name} (${currentUser.role})`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #002B7F', flexShrink: 0 }}
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
                    width: '250px',
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
                  <div style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#002B7F' }}>
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#334155',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EBF1FC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <User size={15} color="#002B7F" style={{ flexShrink: 0 }} />
                    <span>My Profile & Listings</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#DC2626',
                      textAlign: 'left',
                      borderTop: '1px solid #F8FAFC'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={15} color="#DC2626" style={{ flexShrink: 0 }} />
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
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 800
                }}
              >
                <LogIn size={14} style={{ flexShrink: 0 }} />
                <span>Log In</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
