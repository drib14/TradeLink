import React, { useState, useRef, useEffect } from 'react';
import { Logo } from '../common/Logo';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
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
  Receipt,
  Settings,
  Shield,
  Clock,
  Check,
  Zap,
  ArrowLeftRight
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
  const { selectedCampus, setSelectedCampus, searchQuery, setSearchQuery } = useMarket();
  const { unreadTotal, swaps, transactions } = useChat();
  const { showToast } = useToast();

  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const pendingTransactionsCount = currentUser
    ? transactions.filter(
        (t) => (t.sellerId === currentUser.id || t.buyerId === currentUser.id) && t.status === 'pending'
      ).length
    : 0;

  const handlePostClick = () => {
    onNavigate('create-listing');
  };

  const handleSwapsClick = () => {
    onNavigate('swaps');
  };

  const handleTransactionsClick = () => {
    onNavigate('transactions');
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

  return (
    <header
      className="sticky-top-nav glass-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
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
            <Logo size="sm" showSubtitle={false} isDark={false} iconOnlyOnMobile={true} />
          </button>

          {/* Minimal Campus Dropdown (Desktop for all visitors) */}
          <div className="desktop-only" style={{ position: 'relative' }} ref={campusDropdownRef}>
            <button
              onClick={() => setIsCampusDropdownOpen(!isCampusDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '175px',
                gap: '0.4rem',
                backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)',
                border: '1px solid var(--color-primary-border, #BCD1F7)',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--uc-blue, #002B7F)',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title={selectedCampus === 'All' ? 'All UC Campuses' : selectedCampus}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                {selectedCampus === 'All' ? 'All UC Campuses' : selectedCampus}
              </span>
              <ChevronDown
                size={14}
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isCampusDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {isCampusDropdownOpen && (
              <div
                className="glass-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '220px',
                  zIndex: 60,
                  padding: '0.5rem',
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
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: selectedCampus === c ? 800 : 500,
                      backgroundColor: selectedCampus === c ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                      color: selectedCampus === c ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary, #334155)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
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
        <div className="search-bar-wrapper" style={{ flex: 1, minWidth: '100px', maxWidth: '440px', position: 'relative' }}>
          <Search
            size={16}
            className="search-icon"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search marketplace items, books, calculators..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== 'marketplace') {
                onNavigate('marketplace');
              }
            }}
            className={`clean-input search-input navbar-search-input ${searchQuery ? 'has-query' : ''}`}
          />
          {!searchQuery && (
            <span className="search-kbd-hint desktop-only">
              Ctrl K
            </span>
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2
              }}
              title="Clear search"
            >
              <X size={13} />
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
              onClick={() => onNavigate('flash-market')}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: currentView === 'flash-market' || currentView === 'flash-detail' ? 800 : 600,
                color: currentView === 'flash-market' || currentView === 'flash-detail' ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                backgroundColor: currentView === 'flash-market' || currentView === 'flash-detail' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap
                size={14}
                fill={currentView === 'flash-market' || currentView === 'flash-detail' ? '#FFC72C' : 'none'}
                color={currentView === 'flash-market' || currentView === 'flash-detail' ? '#B45309' : '#E5A800'}
                style={{ flexShrink: 0 }}
              />
              <span>Flash Market</span>
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
          </div>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-subtle, #E2E8F0)', margin: '0 0.2rem' }} />

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
                padding: '0.48rem 1.05rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #002B7F 0%, #0A3EA8 100%)',
                boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} style={{ flexShrink: 0 }} />
              <span>Post</span>
            </button>
          </div>



          {isAuthenticated && currentUser ? (
            <>
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

                {/* User Dropdown Menu (Spacious & Uncompressed) */}
                {isUserMenuOpen && (
                  <div className="dropdown-menu-user" role="menu">
                    {/* User Identity Card */}
                    <div className="dropdown-user-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentUser.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--uc-blue)', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                          {currentUser.campus}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)' }}>
                        Student ID: <strong>{currentUser.studentId}</strong>
                      </div>
                    </div>

                    {/* Admin Moderation Desk (if admin) */}
                    {(isAdmin || currentUser.role === 'admin') && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          const adminUrl = import.meta.env.VITE_ADMIN_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5174' : 'https://tradelink-admin.vercel.app');
                          const opened = window.open(adminUrl, '_blank');
                          if (!opened) {
                            window.location.href = adminUrl;
                          }
                        }}
                        className="dropdown-item"
                        style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', fontWeight: 700 }}
                      >
                        <Shield size={16} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
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
                      <User size={16} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
                      <span>My Profile</span>
                    </button>

                    {/* Flash Market */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('flash-market');
                      }}
                      className="dropdown-item"
                    >
                      <Zap size={16} color="#E5A800" style={{ flexShrink: 0 }} />
                      <span>Flash Market & Requests</span>
                    </button>

                    {/* Campus Swaps */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('swaps');
                      }}
                      className="dropdown-item"
                    >
                      <ArrowLeftRight size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span>Campus Swaps</span>
                    </button>

                    {/* 2. Transaction History */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('transactions');
                      }}
                      className="dropdown-item"
                    >
                      <Receipt size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span>Transaction History</span>
                    </button>

                    {/* 3. Settings */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('settings');
                      }}
                      className="dropdown-item"
                    >
                      <Settings size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                      <span>Settings & Privacy</span>
                    </button>

                    <div className="dropdown-divider" />

                    {/* 4. Logout */}
                    <button
                      onClick={handleLogout}
                      className="dropdown-item"
                      style={{ color: '#DC2626' }}
                    >
                      <LogOut size={16} color="#DC2626" style={{ flexShrink: 0 }} />
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

