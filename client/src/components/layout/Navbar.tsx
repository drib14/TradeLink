import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Campus } from '../../types';
import {
  Search,
  Plus,
  MessageSquare,
  ChevronDown,
  X,
  LogOut,
  User,
  Bookmark,
  Receipt,
  Settings,
  Shield
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
  onOpenAuth: () => void;
  onOpenVerification?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenChat,
  onOpenAuth,
  onOpenVerification
}) => {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const { selectedCampus, setSelectedCampus, searchQuery, setSearchQuery, favorites } = useMarket();
  const { unreadTotal, swaps, meetups } = useChat();
  const { showToast } = useToast();

  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const campusDropdownRef = useClickOutside<HTMLDivElement>(() => setIsCampusDropdownOpen(false), isCampusDropdownOpen);
  const userMenuRef = useClickOutside<HTMLDivElement>(() => setIsUserMenuOpen(false), isUserMenuOpen);

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
    onNavigate('create-listing');
  };

  const handleSwapsClick = () => {
    onNavigate('swaps');
  };

  const handleMeetupsClick = () => {
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

  const handleFavoritesClick = () => {
    onNavigate('favorites');
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    showToast('Logged Out', 'You have been logged out.', 'info');
  };

  return (
    <header
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border-subtle, #E2E8F0)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        boxShadow: '0 2px 8px -2px rgba(0, 43, 127, 0.05)',
        transition: 'all 0.2s ease'
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
        {/* Left: Brand Logo & Campus Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Logo size="sm" showSubtitle={false} isDark={false} />
          </button>

          {/* Minimal Campus Dropdown (Desktop for all visitors) */}
          <div className="desktop-only" style={{ position: 'relative' }} ref={campusDropdownRef}>
            <button
              onClick={() => setIsCampusDropdownOpen(!isCampusDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)',
                border: '1.5px solid var(--uc-blue-border, #BCD1F7)',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--uc-blue, #002B7F)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{selectedCampus === 'All' ? 'All UC Campuses' : selectedCampus}</span>
              <ChevronDown size={14} style={{ flexShrink: 0 }} />
            </button>

            {isCampusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  backgroundColor: 'var(--bg-surface, #FFFFFF)',
                  border: '1.5px solid var(--uc-blue-border, #BCD1F7)',
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
                      backgroundColor: selectedCampus === c ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                      color: selectedCampus === c ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary, #334155)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{c === 'All' ? 'All UC Campuses' : c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Input (Available to All Visitors) */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: '400px', position: 'relative' }}>
          <Search
            size={15}
            color="var(--text-muted, #64748B)"
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
              backgroundColor: 'var(--bg-subtle, #F8FAFC)',
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
                color: 'var(--text-muted, #64748B)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
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
          {/* Main Desktop Navigation Links (Browseable by everyone) */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => onNavigate('marketplace')}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'marketplace' ? 800 : 600,
                color: currentView === 'marketplace' ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                backgroundColor: currentView === 'marketplace' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
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
                color: currentView === 'wanted' ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                backgroundColor: currentView === 'wanted' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Wanted
            </button>

            <button
              onClick={handleSwapsClick}
              style={{
                position: 'relative',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'swaps' ? 800 : 600,
                color: currentView === 'swaps' ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                backgroundColor: currentView === 'swaps' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
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
                color: currentView === 'meetups' ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                backgroundColor: currentView === 'meetups' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
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
                color: currentView === 'campus-map' ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                backgroundColor: currentView === 'campus-map' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Landmarks
            </button>
          </div>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-subtle, #E2E8F0)', margin: '0 0.2rem' }} />

            {/* Saved / Favorites Button with Counter */}
            <button
              onClick={handleFavoritesClick}
              style={{
                position: 'relative',
                padding: '0.5rem',
                borderRadius: '8px',
                color: currentView === 'favorites' ? 'var(--uc-gold, #B45309)' : 'var(--text-secondary, #334155)',
                backgroundColor: currentView === 'favorites' ? 'var(--uc-gold-light, #FEF3C7)' : 'var(--bg-subtle, #F8FAFC)',
                border: '1px solid var(--border-subtle, #CBD5E1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Saved Items"
            >
              <Bookmark size={16} color={favorites.length > 0 ? '#F59E0B' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
              {favorites.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#F59E0B',
                    color: '#002B7F',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 2px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Authenticated Messaging Drawer */}
            {isAuthenticated && currentUser && (
              <button
                onClick={handleChatClick}
                style={{
                  position: 'relative',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  color: 'var(--text-secondary, #334155)',
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  border: '1px solid var(--border-subtle, #CBD5E1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Messages"
              >
                <MessageSquare size={16} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
                {unreadTotal > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: 'var(--uc-blue, #002B7F)',
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
            )}

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

          {isAuthenticated && currentUser ? (
            <>
              {/* Live Notification Bell */}
              <NotificationDropdown onNavigate={onNavigate} />

              {/* User Menu */}
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.2rem',
                    borderRadius: '9999px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title={`Logged in as ${currentUser.name}`}
                >
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    size="sm"
                    style={{ border: '2px solid var(--uc-blue, #002B7F)' }}
                  />
                  {currentUser.isVerified && (
                    <VerifiedBadge size="xs" variant="green" showTooltip={false} />
                  )}
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '260px',
                      backgroundColor: 'var(--bg-surface, #FFFFFF)',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-subtle, #BCD1F7)',
                      boxShadow: '0 12px 30px rgba(0, 43, 127, 0.15)',
                      zIndex: 100,
                      overflow: 'hidden',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      animation: 'slideDown 0.2s ease-out'
                    }}
                  >
                    <div style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-subtle, #F1F5F9)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary, #002B7F)' }}>
                          {currentUser.name}
                        </span>
                        {currentUser.isVerified && (
                          <VerifiedBadge size="xs" variant="green" showTooltip={false} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                        {currentUser.campus} • ID: {currentUser.studentId}
                      </div>

                      {!currentUser.isVerified && (
                        (!currentUser.isVerified && (currentUser.verificationStatus === 'pending' || !!currentUser.idPhotoUrl)) ? (
                          <div style={{ backgroundColor: 'rgba(0, 43, 127, 0.06)', border: '1px solid rgba(0, 43, 127, 0.15)', borderRadius: '8px', padding: '0.45rem 0.6rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                              ⏳ Verification Pending
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onNavigate('profile');
                              }}
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: 'var(--uc-blue)',
                                backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)',
                                border: '1px solid var(--uc-blue-border, #BCD1F7)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                cursor: 'pointer'
                              }}
                            >
                              Status
                            </button>
                          </div>
                        ) : (
                          <div style={{ backgroundColor: 'rgba(255, 199, 44, 0.15)', border: '1px solid rgba(229, 168, 0, 0.3)', borderRadius: '8px', padding: '0.45rem 0.6rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#B45309' }}>
                              Unverified Account
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                if (onOpenVerification) onOpenVerification();
                              }}
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: '#002B7F',
                                backgroundColor: '#FFC72C',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                cursor: 'pointer'
                              }}
                            >
                              Verify Now
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {/* Admin Moderation Desk */}
                    {(isAdmin || currentUser.role === 'admin') && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="dropdown-item"
                        style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', fontWeight: 700 }}
                      >
                        <Shield size={15} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
                        <span>Admin Moderation Desk</span>
                      </button>
                    )}

                    {/* 1. Profile */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('profile', { userId: currentUser.id });
                      }}
                      className="dropdown-item"
                    >
                      <User size={15} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
                      <span>My Profile & Listings</span>
                    </button>

                    {/* 2. Saved Items */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('favorites');
                      }}
                      className="dropdown-item mobile-only"
                    >
                      <Bookmark size={15} color="#F59E0B" style={{ flexShrink: 0 }} />
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>Saved Items</span>
                        {favorites.length > 0 && (
                          <span className="badge-pill badge-gold" style={{ fontSize: '0.65rem' }}>
                            {favorites.length}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* 3. Transaction History */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('transactions');
                      }}
                      className="dropdown-item"
                    >
                      <Receipt size={15} color="#059669" style={{ flexShrink: 0 }} />
                      <span>Transaction History</span>
                    </button>

                    {/* 4. Settings */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('settings');
                      }}
                      className="dropdown-item"
                    >
                      <Settings size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                      <span>Settings & Privacy</span>
                    </button>

                    <div className="dropdown-divider" />

                    {/* 5. Logout */}
                    <button
                      onClick={handleLogout}
                      className="dropdown-item"
                      style={{ color: '#DC2626' }}
                    >
                      <LogOut size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={onOpenAuth}
                className="btn-primary"
                style={{
                  padding: '0.48rem 1.1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '8px'
                }}
              >
                <span>Sign In</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

