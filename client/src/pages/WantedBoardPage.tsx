import React, { useState } from 'react';
import { useWanted } from '../context/WantedContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { CreateWantedModal } from '../components/marketplace/CreateWantedModal';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { WantedCardSkeleton } from '../components/common/SkeletonLoader';
import { Campus, WantedRequest } from '../types';
import {
  Search,
  Plus,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Filter,
  Flame,
  Building2,
  Megaphone
} from 'lucide-react';

interface WantedBoardPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
}

export const WantedBoardPage: React.FC<WantedBoardPageProps> = ({ onNavigate, onOpenChat }) => {
  const { requests, respondToRequest } = useWanted();
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsSimulatingLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCampus, searchQuery]);

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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.itemTitle.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q) ||
        req.category.toLowerCase().includes(q) ||
        req.requesterCollege.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in with your UC account to broadcast a looking-for item.', 'warning');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleRespond = (req: WantedRequest) => {
    if (!isAuthenticated) {
      showToast('Log In Required', 'Please log in to respond with an item offer.', 'warning');
      return;
    }
    respondToRequest(req.id);
    showToast(
      'Offer Sent!',
      `You notified ${req.requesterName} that you have this item for ₱${req.targetBudget}.`,
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
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#FFC72C', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Megaphone size={16} style={{ flexShrink: 0 }} /> <span>Student Request Hub (LTB / Pasabuy)</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 900, color: '#FFFFFF', marginTop: '0.4rem', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
            TradeLink Wanted Board
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginTop: '0.55rem', lineHeight: 1.6 }}>
            Need a specific textbook, scrub set, drawing board, or calculator? Post your target budget, and fellow UCians will reach out to fulfill it!
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-gold"
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Plus size={18} style={{ flexShrink: 0 }} /> <span>Post a "Looking For" Item</span>
        </button>
      </div>

      {/* Search & Campus Filter Controls */}
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
            style={{ paddingLeft: '2.25rem' }}
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

      {/* Requests Grid / Skeletons */}
      {isSimulatingLoading ? (
        <div className="grid-responsive-wanted">
          {Array.from({ length: 6 }).map((_, i) => (
            <WantedCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid-responsive-wanted">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="clean-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Top Meta Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  <MapPin size={12} />
                  <span>{req.preferredCampus}</span>
                  <span style={{ color: 'var(--border-subtle)' }}>•</span>
                  <span>{req.requesterCollege}</span>
                </div>

                {req.urgency === 'Immediate / Urgent' ? (
                  <span className="badge-pill badge-sold" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Flame size={11} /> Urgent
                  </span>
                ) : (
                  <span className="badge-pill badge-gray">
                    {req.urgency}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {req.itemTitle}
              </h3>

              {/* Description */}
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                {req.description}
              </p>

              {/* Target Budget & Offers */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Target Budget
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--uc-blue)', fontFamily: 'var(--font-display)' }}>
                    ₱{req.targetBudget.toLocaleString()}
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {req.offersCount} {req.offersCount === 1 ? 'student offered' : 'students offered'}
                </span>
              </div>

              {/* Requester Profile & Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <UserAvatar
                    src={req.requesterAvatar}
                    name={req.requesterName}
                    size={28}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span>{req.requesterName}</span>
                      <VerifiedBadge size="xs" variant="green" showTooltip={false} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRespond(req)}
                  className="btn-gold"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 800 }}
                >
                  <MessageSquare size={13} /> I Have This!
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={32} color="var(--uc-blue)" />
          <h3 className="empty-state-title">No Wanted Requests Found</h3>
          <p className="empty-state-desc">No student has posted a request matching your criteria. Be the first to broadcast what you need!</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary" style={{ marginTop: '0.75rem' }}>
            <Plus size={15} /> Post Item Request
          </button>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateWantedModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};
