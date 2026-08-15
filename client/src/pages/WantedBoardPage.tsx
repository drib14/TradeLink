import React, { useState } from 'react';
import { useWanted } from '../context/WantedContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { CreateWantedModal } from '../components/marketplace/CreateWantedModal';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { WantedCardSkeleton } from '../components/common/SkeletonLoader';
import { Campus, WantedRequest } from '../types';
import {
  Search,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Filter,
  Flame,
  Building2
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
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#002B7F',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem clamp(1.25rem, 4vw, 2.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 10px 25px rgba(0, 43, 127, 0.2)'
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFC72C', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={16} /> Student Request Hub (LTB / Pasabuy)
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 800, color: '#FFFFFF', marginTop: '0.35rem', lineHeight: 1.2 }}>
            University of Cebu Wanted Board
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginTop: '0.5rem', lineHeight: 1.55 }}>
            Need a specific textbook, scrub set, drawing board, or calculator? Post your target budget, and fellow UCians will reach out to fulfill it!
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-gold"
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', fontWeight: 800 }}
        >
          <Plus size={18} /> Post a "Looking For" Item
        </button>
      </div>

      {/* Search & Campus Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requested books, calculators, scrubs, tracks..."
              className="clean-input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        {/* Campus Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '3px' }}>
          {campuses.map((c) => {
            const isSelected = selectedCampus === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCampus(c)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 600,
                  backgroundColor: isSelected ? '#002B7F' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  border: isSelected ? '1.5px solid #002B7F' : '1px solid #CBD5E1',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {c === 'All' ? 'All UC Campuses' : c}
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
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1.5px solid #CBD5E1',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 4px 12px rgba(0, 43, 127, 0.05)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* Top Meta Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, color: '#002B7F' }}>
                  <MapPin size={12} />
                  <span>{req.preferredCampus}</span>
                  <span style={{ color: '#CBD5E1' }}>•</span>
                  <span>{req.requesterCollege}</span>
                </div>

                {req.urgency === 'Immediate / Urgent' ? (
                  <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Flame size={11} /> Urgent
                  </span>
                ) : (
                  <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {req.urgency}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.35 }}>
                {req.itemTitle}
              </h3>

              {/* Description */}
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, flex: 1 }}>
                {req.description}
              </p>

              {/* Target Budget & Offers */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Target Budget
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#002B7F', fontFamily: 'var(--font-display)' }}>
                    ₱{req.targetBudget.toLocaleString()}
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                  {req.offersCount} {req.offersCount === 1 ? 'student offered' : 'students offered'}
                </span>
              </div>

              {/* Requester Profile & Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <img
                    src={req.requesterAvatar}
                    alt={req.requesterName}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                      <span>{req.requesterName}</span>
                      <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
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
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '3.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={32} color="#002B7F" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
            No Wanted Requests Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px' }}>
            No student has posted a request matching your criteria. Be the first to broadcast what you need!
          </p>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary" style={{ padding: '0.6rem 1.25rem', marginTop: '0.5rem' }}>
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
