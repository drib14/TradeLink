import React, { useState } from 'react';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { CreateFlashRequestModal } from '../components/marketplace/CreateFlashRequestModal';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { WantedCardSkeleton } from '../components/common/SkeletonLoader';
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
  CheckCircle2
} from 'lucide-react';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';

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
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'this_week' | 'flexible'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

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
    if (selectedCampus !== 'All' && req.preferredCampus !== selectedCampus) return false;

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
        (req.requesterCollege && req.requesterCollege.toLowerCase().includes(q))
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
    if (!currentUser.isVerified) {
      showToast('Verification Required', 'Student ID verification is required before posting flash requests.', 'warning');
      setIsVerificationModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const { openChatForWanted } = useChat();

  const handleRespond = async (req: FlashRequest) => {
    if (!isAuthenticated || !currentUser) {
      showToast('Log In Required', 'Please log in to respond with an item offer.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!currentUser.isVerified) {
      showToast('Verification Required', 'Student ID verification is required before submitting trade offers.', 'warning');
      setIsVerificationModalOpen(true);
      return;
    }
    const isExpired = req.isExpired || req.status === 'expired' || (Boolean(req.expiresAt) && new Date(req.expiresAt!).getTime() <= Date.now());
    if (isExpired) {
      showToast('Request Expired', 'This flash request has reached its expiration window and is no longer accepting offers.', 'warning');
      return;
    }
    await openChatForWanted({
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
          background: 'linear-gradient(135deg, #002B7F 0%, #001D59 100%)',
          color: '#FFFFFF',
          borderRadius: '18px',
          padding: '2.25rem clamp(1.25rem, 4vw, 2.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 12px 30px rgba(0, 43, 127, 0.22)'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#FFC72C', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Zap size={16} style={{ flexShrink: 0 }} /> <span>Urgent Campus Marketplace</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: '#FFFFFF', marginTop: '0.4rem', lineHeight: 1.2, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={28} color="#FFC72C" /> <span>Flash Market</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginTop: '0.55rem', lineHeight: 1.6 }}>
            Need an item today or this week? Broadcast urgent requests for uniforms, calculators, reviewers, or tools. Verified students respond with what they have!
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-gold"
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Zap size={18} style={{ flexShrink: 0 }} /> <span>Post Flash Request</span>
        </button>
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
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value as any)}
              className="clean-input"
              style={{
                paddingLeft: '2.35rem',
                paddingRight: '2rem',
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--text-primary)',
                appearance: 'auto'
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
        <div className="grid-responsive-wanted">
          {Array.from({ length: 6 }).map((_, i) => (
            <WantedCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid-responsive-wanted">
          {filteredRequests.map((req) => {
            const u = (req.urgency || '').toLowerCase();
            const isUrgent = u.includes('immediate') || u.includes('urgent');
            const isThisWeek = u.includes('week');
            const isCardExpired = Boolean(req.isExpired || req.status === 'expired' || (req.expiresAt && new Date(req.expiresAt).getTime() <= Date.now()));
            const timeLeft = getTimeRemaining(req.expiresAt);

            const urgencyBadge = isUrgent ? (
              <span className="badge-pill badge-sold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                <Zap size={11} /> Urgent (24h)
              </span>
            ) : isThisWeek ? (
              <span className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                <Clock size={11} /> This Week
              </span>
            ) : (
              <span className="badge-pill badge-gray">
                Flexible
              </span>
            );

            return (
              <div
                key={req.id}
                className="clean-card"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  borderRadius: '14px',
                  border: isCardExpired ? '1px dashed #CBD5E1' : '1px solid var(--border-subtle, #E2E8F0)',
                  backgroundColor: isCardExpired ? '#F8FAFC' : '#FFFFFF',
                  opacity: isCardExpired ? 0.72 : 1,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.15s ease'
                }}
              >
                {/* Top Meta Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                    <MapPin size={11} />
                    <span>{req.preferredCampus}</span>
                    <span style={{ color: 'var(--border-subtle)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{req.requesterCollege}</span>
                  </div>

                  {isCardExpired ? (
                    <span className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', fontSize: '0.65rem', fontWeight: 700 }}>
                      <Clock size={10} /> Expired
                    </span>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {timeLeft && (
                        <span style={{ fontSize: '0.66rem', color: '#D97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', backgroundColor: '#FFFBEB', padding: '1px 5px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                          <Clock size={9} /> {timeLeft}
                        </span>
                      )}
                      {urgencyBadge}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: isCardExpired ? '#64748B' : 'var(--text-primary)', lineHeight: 1.35, margin: 0 }}>
                  {req.itemTitle}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '0.8rem', color: isCardExpired ? '#94A3B8' : 'var(--text-secondary)', lineHeight: 1.45, flex: 1, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {req.description}
                </p>

                {/* Target Budget & Offers */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isCardExpired ? '#F1F5F9' : 'var(--bg-subtle, #F8FAFC)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                  <div>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Target Budget
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: isCardExpired ? '#64748B' : 'var(--uc-blue)', fontFamily: 'var(--font-display)' }}>
                      {req.targetBudget <= 0 ? (
                        req.description?.toLowerCase().includes('free') ? (
                          <span style={{ color: '#059669', fontSize: '0.92rem' }}>FREE / Donation</span>
                        ) : (
                          <span style={{ color: '#D97706', fontSize: '0.92rem' }}>Open to Offers</span>
                        )
                      ) : (
                        `₱${req.targetBudget.toLocaleString()}`
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isCardExpired ? '#94A3B8' : 'var(--accent-green)' }}>
                    {req.offersCount} {req.offersCount === 1 ? 'offer' : 'offers'}
                  </span>
                </div>

                {/* Requester Profile & Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px solid var(--border-subtle, #F1F5F9)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                    <UserAvatar
                      src={req.requesterAvatar}
                      name={req.requesterName}
                      size={24}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.74rem', fontWeight: 700, color: isCardExpired ? '#64748B' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span>{req.requesterName}</span>
                      <VerifiedBadge size="xs" variant="green" showTooltip={false} />
                    </div>
                  </div>

                  {isCardExpired ? (
                    <button
                      disabled
                      style={{
                        padding: '0.4rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#E2E8F0',
                        color: '#64748B',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
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
                      onClick={() => onNavigate('profile')}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px' }}
                    >
                      Your Request
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRespond(req)}
                      className="btn-gold"
                      style={{ padding: '0.42rem 0.75rem', fontSize: '0.76rem', fontWeight: 800, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <MessageSquare size={12} /> Offer Item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Zap size={36} color="var(--uc-blue)" />
          <h3 className="empty-state-title">No Flash Requests Found</h3>
          <p className="empty-state-desc">No student has posted an urgent request matching your filters. Be the first to broadcast what you need!</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
      <StudentVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};

// Backward compatibility alias
export const WantedBoardPage = FlashMarketPage;
