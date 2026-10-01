import React, { useState } from 'react';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { CreateFlashRequestModal } from '../components/marketplace/CreateFlashRequestModal';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { FlashRequestCardSkeleton } from '../components/common/SkeletonLoader';
import { Campus, FlashRequest } from '../types';
import {
  Search,
  Plus,
  MapPin,
  MessageSquare,
  Zap,
  Building2,
  Clock,
  Filter,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { FlashMarketTutorialModal } from '../components/marketplace/FlashMarketTutorialModal';

interface FlashMarketPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
  onOpenAuth?: () => void;
}

const getTimeRemaining = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
};

export const FlashMarketPage: React.FC<FlashMarketPageProps> = ({ onNavigate, onOpenChat, onOpenAuth }) => {
  const { requests, respondToRequest } = useFlashMarket();
  const { selectedCampus: globalCampus, setSelectedCampus: setGlobalCampus } = useMarket();
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>(globalCampus || 'All');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'this_week' | 'flexible'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  // Sync when global campus filter changes
  React.useEffect(() => {
    if (globalCampus) {
      setSelectedCampus(globalCampus);
    }
  }, [globalCampus]);

  const handleCampusChange = (c: 'All' | Campus) => {
    setSelectedCampus(c);
    setGlobalCampus(c);
  };

  // Tutorial only opens when user explicitly clicks the help button


  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsSimulatingLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCampus, searchQuery, urgencyFilter]);

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

  const filteredRequests = requests.filter((req) => {
    if (selectedCampus !== 'All') {
      const matchPref = req.preferredCampus && req.preferredCampus.toLowerCase().includes(selectedCampus.toLowerCase());
      const matchReq = req.requesterCampus && req.requesterCampus.toLowerCase().includes(selectedCampus.toLowerCase());
      if (!matchPref && !matchReq) return false;
    }

    if (urgencyFilter !== 'all') {
      const u = (req.urgency || '').toLowerCase();
      if (urgencyFilter === 'urgent' && !u.includes('immediate') && !u.includes('urgent')) return false;
      if (urgencyFilter === 'this_week' && !u.includes('week')) return false;
      if (urgencyFilter === 'flexible' && !u.includes('flexible')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.itemTitle.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q) ||
        req.category.toLowerCase().includes(q) ||
        ((req.requesterDepartment || req.requesterCollege) && (req.requesterDepartment || req.requesterCollege)!.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Log In Required', 'Please log in with your UC account to broadcast a flash request.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsCreateModalOpen(true);
  };

  const { openChatForFlash } = useChat();

  const handleRespond = async (req: FlashRequest) => {
    if (!isAuthenticated || !currentUser) {
      showToast('Log In Required', 'Please log in to respond with an item offer.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const isExpired = req.isExpired || req.status === 'expired' || (Boolean(req.expiresAt) && new Date(req.expiresAt!).getTime() <= Date.now());
    if (isExpired) {
      showToast('Request Expired', 'This flash request has reached its expiration window and is no longer accepting offers.', 'warning');
      return;
    }
    await openChatForFlash({
      id: req.id,
      requesterId: req.requesterId,
      itemName: req.itemTitle,
      targetBudget: req.targetBudget
    });
    respondToRequest(req.id);
    showToast(
      'Flash Chat Connected!',
      `Connected with ${req.requesterName} to fulfill their flash request for "${req.itemTitle}".`,
      'success'
    );
    onOpenChat();
  };

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--uc-blue, #002B7F)',
          color: '#FFFFFF',
          borderRadius: '14px',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 14px rgba(0, 43, 127, 0.12)'
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          <h1 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.25, fontFamily: 'var(--font-display)' }}>
            Flash Market
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#E2E8F0', marginTop: '0.35rem', marginBottom: 0, lineHeight: 1.45 }}>
            Broadcast urgent requests for books, uniforms, reviewers, or tools across campuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setIsTutorialOpen(true)}
            id="how-flash-market-works-btn"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '10px',
              padding: '0.55rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <HelpCircle size={15} color="#FFC72C" />
            <span>Guide</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="btn-gold"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.86rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px' }}
          >
            <Zap size={16} style={{ flexShrink: 0 }} /> <span>Post Request</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Search, Campus, Urgency */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requested books, calculators, scrubs, tracks..."
              className="clean-input"
              style={{ paddingLeft: '2.65rem' }}
            />
          </div>

          {/* Campus Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                value={selectedCampus}
                onChange={(e) => handleCampusChange(e.target.value as any)}
                className="clean-input"
                style={{
                  paddingLeft: '2.35rem',
                  paddingRight: '2rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  height: '42px',
                  borderRadius: '10px'
                }}
                aria-label="Filter by UC Campus"
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All UC Campuses' : c}
                  </option>
                ))}
              </select>
            </div>

            {selectedCampus !== 'All' && (
              <button
                onClick={() => handleCampusChange('All')}
                className="btn-neutral"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  height: '42px',
                  borderRadius: '10px'
                }}
                title="Clear campus filter"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Urgency Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Urgency:
          </span>
          {[
            { id: 'all', label: 'All Urgencies' },
            { id: 'urgent', label: 'Urgent (24h)', icon: <AlertCircle size={12} color="#DC2626" /> },
            { id: 'this_week', label: 'This Week', icon: <Clock size={12} color="#D97706" /> },
            { id: 'flexible', label: 'Flexible', icon: <CheckCircle2 size={12} color="#059669" /> }
          ].map((pill) => {
            const isActive = urgencyFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setUrgencyFilter(pill.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? '1.5px solid var(--color-primary, #002B7F)' : '1px solid #CBD5E1',
                  backgroundColor: isActive ? 'var(--color-primary-subtle, #EBF1FC)' : '#FFFFFF',
                  color: isActive ? 'var(--color-primary, #002B7F)' : '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {pill.icon}
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Grid / Skeletons */}
      {isSimulatingLoading ? (
        <div className="grid-responsive-flash grid-responsive-wanted">
          {Array.from({ length: 6 }).map((_, i) => (
            <FlashRequestCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid-responsive-flash grid-responsive-wanted">
          {filteredRequests.map((req) => {
            const u = (req.urgency || '').toLowerCase();
            const isUrgent = u.includes('immediate') || u.includes('urgent');
            const isThisWeek = u.includes('week');
            const isCardExpired = Boolean(req.isExpired || req.status === 'expired' || (req.expiresAt && new Date(req.expiresAt).getTime() <= Date.now()));
            const timeLeft = getTimeRemaining(req.expiresAt);

            return (
              <div
                key={req.id}
                className="clean-card card-interactive"
                onClick={() => onNavigate('flash-detail', { id: req.id })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: isCardExpired ? '1px dashed #CBD5E1' : '1px solid var(--border-subtle, #E2E8F0)',
                  backgroundColor: isCardExpired ? '#F8FAFC' : 'var(--bg-surface, #FFFFFF)',
                  opacity: isCardExpired ? 0.75 : 1,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Media Preview / Request Visual Banner with Floating Glass Badges */}
                <div
                  style={{
                    width: '100%',
                    height: '145px',
                    overflow: 'hidden',
                    backgroundColor: '#0F172A',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {req.imageUrl ? (
                    <img
                      src={req.imageUrl}
                      alt={req.itemTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallbackEl) fallbackEl.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: req.imageUrl ? 'none' : 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#002B7F',
                      color: '#FFFFFF',
                      padding: '1rem',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255, 199, 44, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={22} color="#FFC72C" />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                      {req.category || 'Urgent Request'}
                    </span>
                  </div>

                  {/* Floating Glassmorphic Badges Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    {/* Urgency Badge */}
                    {isCardExpired ? (
                      <span
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#CBD5E1',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <Clock size={11} /> Expired
                      </span>
                    ) : isUrgent ? (
                      <span
                        style={{
                          backgroundColor: 'rgba(220, 38, 38, 0.92)',
                          backdropFilter: 'blur(8px)',
                          color: '#FFFFFF',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                        }}
                      >
                        <Zap size={11} /> Urgent (24h)
                      </span>
                    ) : isThisWeek ? (
                      <span
                        style={{
                          backgroundColor: 'rgba(217, 119, 6, 0.92)',
                          backdropFilter: 'blur(8px)',
                          color: '#FFFFFF',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)'
                        }}
                      >
                        <Clock size={11} /> This Week
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: 'rgba(5, 150, 105, 0.9)',
                          backdropFilter: 'blur(8px)',
                          color: '#FFFFFF',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.35)'
                        }}
                      >
                        Flexible
                      </span>
                    )}

                    {/* Countdown Timer Badge */}
                    {!isCardExpired && timeLeft && (
                      <span
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#FFC72C',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        <Clock size={10} /> {timeLeft}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body Container */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.55rem' }}>
                  {/* Full-width Campus & College Meta Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                    <MapPin size={12} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.preferredCampus}</span>
                    <span style={{ color: 'var(--border-subtle)', flexShrink: 0 }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.requesterDepartment || req.requesterCollege}</span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: isCardExpired ? '#64748B' : 'var(--text-primary)',
                      lineHeight: 1.35,
                      margin: 0,
                      minHeight: '2.6em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={req.itemTitle}
                  >
                    {req.itemTitle}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: isCardExpired ? '#94A3B8' : 'var(--text-secondary)',
                      lineHeight: 1.45,
                      margin: 0,
                      minHeight: '2.8em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {req.description}
                  </p>

                  {/* Target Budget & Responses Valuation Box */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isCardExpired ? '#F1F5F9' : 'var(--bg-subtle, #F8FAFC)',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, #E2E8F0)',
                      marginTop: '0.2rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Target Budget
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: isCardExpired ? '#64748B' : 'var(--uc-blue)', fontFamily: 'var(--font-display)', marginTop: '1px' }}>
                        {req.targetBudget <= 0 ? (
                          req.description?.toLowerCase().includes('free') ? (
                            <span style={{ color: '#059669', fontSize: '0.88rem' }}>FREE / Donation</span>
                          ) : (
                            <span style={{ color: '#D97706', fontSize: '0.88rem' }}>Open to Offers</span>
                          )
                        ) : (
                          `₱${req.targetBudget.toLocaleString()}`
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Responses
                      </span>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: req.offersCount > 0 ? '#059669' : 'var(--text-muted)', marginTop: '2px' }}>
                        {req.offersCount} {req.offersCount === 1 ? 'offer' : 'offers'}
                      </div>
                    </div>
                  </div>

                  {/* Requester Profile & Action Footer (Anchored to bottom) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-subtle, #F1F5F9)',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', minWidth: 0, flex: 1 }}>
                      <UserAvatar
                        src={req.requesterAvatar}
                        name={req.requesterName}
                        size={24}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.74rem', fontWeight: 700, color: isCardExpired ? '#64748B' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.requesterName}>{req.requesterName}</span>
                        <VerifiedBadge size="xs" variant="green" showTooltip={false} />
                      </div>
                    </div>

                    {isCardExpired ? (
                      <button
                        disabled
                        style={{
                          padding: '0.4rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: '#E2E8F0',
                          color: '#64748B',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          cursor: 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Clock size={11} /> Closed
                      </button>
                    ) : currentUser && req.requesterId === currentUser.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('profile');
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px' }}
                      >
                        Your Request
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespond(req);
                        }}
                        className="btn-gold"
                        style={{ padding: '0.42rem 0.8rem', fontSize: '0.76rem', fontWeight: 800, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MessageSquare size={13} /> Offer Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Zap size={36} color="var(--uc-blue)" />
          <h3 className="empty-state-title">No Flash Requests Found</h3>
          <p className="empty-state-desc">
            {selectedCampus !== 'All'
              ? `No student has posted an urgent request for ${selectedCampus}. Try selecting All Campuses or post what you need!`
              : 'No student has posted an urgent request matching your filters. Be the first to broadcast what you need!'}
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectedCampus !== 'All' && (
              <button onClick={() => handleCampusChange('All')} className="btn-secondary">
                Show All Campuses
              </button>
            )}
            <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
              <Plus size={15} /> Post Flash Request
            </button>
            <button onClick={() => onNavigate('marketplace')} className="btn-secondary">
              Browse Marketplace
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateFlashRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Student Verification Modal */}
      {isVerificationModalOpen && (
        <StudentVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
        />
      )}

      {/* Flash Market Tutorial Walkthrough Modal */}
      <FlashMarketTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => {
          setIsTutorialOpen(false);
          localStorage.setItem('tradelink_flash_tutorial_seen', 'true');
        }}
      />
    </div>
  );
};
