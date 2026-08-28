import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { MeetupTransaction, SwapOffer } from '../types';
import {
  Receipt,
  ShoppingBag,
  ArrowLeftRight,
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface TransactionHistoryPageProps {
  onNavigate: (view: string, param?: any) => void;
}

type TxnFilter = 'all' | 'bought' | 'sold' | 'swapped';

export const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { meetups, swaps } = useChat();
  const [filter, setFilter] = useState<TxnFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const myMeetups = currentUser
    ? meetups.filter(
        (m: MeetupTransaction) => m.sellerId === currentUser.id || m.buyerId === currentUser.id
      )
    : [];

  const mySwaps = currentUser
    ? swaps.filter(
        (s: SwapOffer) =>
          (s.targetSellerId === currentUser.id || s.offererId === currentUser.id) &&
          s.status === 'completed'
      )
    : [];

  const filteredMeetups = myMeetups.filter((m) => {
    if (filter === 'bought') return m.buyerId === currentUser?.id;
    if (filter === 'sold') return m.sellerId === currentUser?.id;
    if (filter === 'swapped') return m.tradeMode === 'swap';
    return true;
  }).filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.listingTitle.toLowerCase().includes(q) || m.landmarkSpot.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      scheduled: { cls: 'badge-pill badge-blue', label: 'Scheduled' },
      on_the_way: { cls: 'badge-pill badge-gold', label: 'On the Way' },
      completed: { cls: 'badge-pill badge-green', label: 'Completed' },
      cancelled: { cls: 'badge-pill badge-red', label: 'Cancelled' }
    };
    const info = map[status] || { cls: 'badge-pill badge-gray', label: status };
    return <span className={info.cls}>{info.label}</span>;
  };

  const getTradeIcon = (mode: string) => {
    if (mode === 'swap') return <ArrowLeftRight size={14} />;
    if (mode === 'free_donation') return <Gift size={14} />;
    return <ShoppingBag size={14} />;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const totalSpent = filteredMeetups
    .filter((m) => m.buyerId === currentUser?.id && m.status === 'completed')
    .reduce((acc, m) => acc + m.finalPrice, 0);
  const totalEarned = filteredMeetups
    .filter((m) => m.sellerId === currentUser?.id && m.status === 'completed')
    .reduce((acc, m) => acc + m.finalPrice, 0);

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-eyebrow">
            <Receipt size={14} style={{ flexShrink: 0 }} /> Trade History
          </div>
          <h1 className="page-header-title" style={{ marginTop: '0.2rem' }}>
            Transaction History
          </h1>
          <p className="page-header-subtitle">
            {myMeetups.length} total transactions across all campuses
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="stat-card-value">{myMeetups.filter((m) => m.status === 'completed').length}</div>
          <div className="stat-card-label">Completed Trades</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-card-value">₱{totalEarned.toLocaleString()}</div>
          <div className="stat-card-label">Total Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--uc-gold-light)', color: '#B45309' }}>
            <Receipt size={20} />
          </div>
          <div className="stat-card-value">₱{totalSpent.toLocaleString()}</div>
          <div className="stat-card-label">Total Spent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="clean-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['all', 'bought', 'sold', 'swapped'] as TxnFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`segmented-tab ${filter === f ? 'active' : ''}`}
            >
              {f === 'all' && 'All'}
              {f === 'bought' && 'Bought'}
              {f === 'sold' && 'Sold'}
              {f === 'swapped' && 'Swapped'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clean-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.82rem', padding: '0.45rem 0.85rem 0.45rem 2.25rem' }}
          />
        </div>
      </div>

      {/* Transaction List */}
      {filteredMeetups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredMeetups.map((meetup: MeetupTransaction) => {
            const isBuyer = meetup.buyerId === currentUser?.id;
            return (
              <div
                key={meetup.id}
                className="card-interactive"
                style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem' }}
                onClick={() => onNavigate('item-detail', { id: meetup.listingId })}
              >
                {/* Item Image */}
                <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--bg-subtle)' }}>
                  <img src={meetup.listingImage} alt={meetup.listingTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meetup.listingTitle}
                    </h4>
                    {getStatusBadge(meetup.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {getTradeIcon(meetup.tradeMode)}
                      {isBuyer ? `Bought from ${meetup.sellerName}` : `Sold to ${meetup.buyerName}`}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {meetup.landmarkSpot}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {formatDate(meetup.scheduledDateTime)}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isBuyer ? 'var(--accent-red)' : 'var(--accent-green)', fontFamily: 'var(--font-display)' }}>
                    {isBuyer ? '-' : '+'}₱{meetup.finalPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    {meetup.campus}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Receipt size={28} />
          </div>
          <h3 className="empty-state-title">No transactions yet</h3>
          <p className="empty-state-desc">
            Your completed trades will appear here. Start by browsing listings or posting an item for sale.
          </p>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '0.5rem' }}>
            Browse Marketplace
          </button>
        </div>
      )}
    </div>
  );
};
