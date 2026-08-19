import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { ListingCard } from '../components/marketplace/ListingCard';
import { SwapProposalModal } from '../components/marketplace/SwapProposalModal';
import { Listing, SwapOffer } from '../types';
import {
  ArrowLeftRight,
  Plus,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

interface SwapsPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenChat: () => void;
}

export const SwapsPage: React.FC<SwapsPageProps> = ({ onNavigate, onOpenChat }) => {
  const { listings } = useMarket();
  const { currentUser } = useAuth();
  const { swaps, respondToSwap } = useChat();

  const [activeTab, setActiveTab] = useState<'catalog' | 'proposals'>('catalog');
  const [selectedTargetForSwap, setSelectedTargetForSwap] = useState<Listing | null>(null);

  const swapListings = listings.filter((l: Listing) => l.tradeMode === 'swap' && !l.isSold);
  const mySwaps = currentUser
    ? swaps.filter(
        (s: SwapOffer) => s.targetSellerId === currentUser.id || s.offererId === currentUser.id
      )
    : [];

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <ArrowLeftRight size={14} style={{ flexShrink: 0 }} /> Cashless Student Barter
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary, #002B7F)', marginTop: '0.2rem' }}>
            Campus Swap Hub
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748B)', marginTop: '0.15rem' }}>
            Direct item-for-item student barter across all 8 University of Cebu campuses
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-listing')}
          className="btn-gold"
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={15} style={{ flexShrink: 0 }} />
          <span>Post Swap Item</span>
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-subtle, #F1F5F9)', padding: '3px', borderRadius: 'var(--radius-full)', alignSelf: 'flex-start', border: '1px solid var(--border-subtle, #CBD5E1)' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`segmented-tab ${activeTab === 'catalog' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeftRight size={14} style={{ flexShrink: 0 }} />
          <span>Available Swaps ({swapListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`segmented-tab ${activeTab === 'proposals' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Clock size={14} style={{ flexShrink: 0 }} />
          <span>My Proposals ({mySwaps.length})</span>
        </button>
      </div>

      {/* Tab 1: Swap Catalog */}
      {activeTab === 'catalog' && (
        <div>
          {swapListings.length > 0 ? (
            <div className="grid-responsive-listings">
              {swapListings.map((item: Listing) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <ListingCard
                    listing={item}
                    onClick={() => onNavigate('item-detail', { id: item.id })}
                  />
                  {currentUser && item.sellerId !== currentUser.id && (
                    <button
                      onClick={() => setSelectedTargetForSwap(item)}
                      className="btn-secondary"
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        width: '100%',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <ArrowLeftRight size={13} style={{ flexShrink: 0 }} />
                      <span>Propose Direct Swap</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-title">No items currently listed for swap</h3>
              <p className="empty-state-desc">Post an item and choose Swap mode to initiate student peer barter.</p>
              <button onClick={() => onNavigate('create-listing')} className="btn-primary" style={{ marginTop: '0.75rem' }}>
                Post a Swap Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Swap Proposals */}
      {activeTab === 'proposals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mySwaps.length > 0 ? (
            mySwaps.map((swap: SwapOffer) => {
              const isReceiver = !!currentUser && swap.targetSellerId === currentUser.id;

              return (
                <div
                  key={swap.id}
                  className="clean-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--uc-blue)' }}>
                        {isReceiver ? 'Received Swap Proposal' : 'Your Sent Proposal'}
                      </span>
                      <span style={{ color: 'var(--border-subtle)' }}>•</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(swap.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor:
                          swap.status === 'accepted'
                            ? 'var(--accent-green-subtle, #ECFDF5)'
                            : swap.status === 'declined'
                            ? 'var(--accent-red-subtle, #FEF2F2)'
                            : 'var(--uc-gold-light, #FFFBEB)',
                        color:
                          swap.status === 'accepted'
                            ? 'var(--accent-green, #047857)'
                            : swap.status === 'declined'
                            ? 'var(--accent-red, #DC2626)'
                            : '#B45309',
                        border:
                          swap.status === 'accepted'
                            ? '1px solid var(--accent-green)'
                            : swap.status === 'declined'
                            ? '1px solid var(--accent-red)'
                            : '1px solid var(--uc-gold-border)'
                      }}
                    >
                      {swap.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Visual Barter Pair */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      padding: '1.15rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, #E2E8F0)'
                    }}
                  >
                    {/* Target Item */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={swap.targetListingImage}
                        alt=""
                        style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {swap.targetListingTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Owner: {swap.targetSellerName}</div>
                      </div>
                    </div>

                    {/* Arrow Divider */}
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--uc-blue)' }}>
                      <div style={{ background: 'var(--uc-blue-subtle, #EBF1FC)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-subtle)' }}>
                        <ArrowLeftRight size={18} color="var(--uc-blue)" style={{ flexShrink: 0 }} />
                      </div>
                    </div>

                    {/* Offered Item */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {swap.offeredListingImage && (
                        <img
                          src={swap.offeredListingImage}
                          alt=""
                          style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {swap.offeredDescription}
                        </div>
                        {swap.cashTopUp !== 0 && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: swap.cashTopUp > 0 ? 'var(--accent-green)' : '#D97706', marginTop: '2px' }}>
                            Top-up Adjustment: {swap.cashTopUp > 0 ? `+₱${swap.cashTopUp}` : `-₱${Math.abs(swap.cashTopUp)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Proposed Spot & Date */}
                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={14} color="#002B7F" style={{ flexShrink: 0 }} />
                      <span>{swap.proposedMeetupSpot}</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="#002B7F" style={{ flexShrink: 0 }} />
                      <span>{swap.proposedDateTime}</span>
                    </div>
                  </div>

                  {/* Receiver Actions */}
                  {isReceiver && swap.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => respondToSwap(swap.id, 'accepted')}
                        className="btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <CheckCircle size={14} style={{ flexShrink: 0 }} />
                        <span>Accept Offer</span>
                      </button>
                      <button
                        onClick={() => respondToSwap(swap.id, 'declined')}
                        className="btn-secondary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <XCircle size={14} style={{ flexShrink: 0 }} />
                        <span>Decline</span>
                      </button>
                      <button
                        onClick={onOpenChat}
                        style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#002B7F', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                      >
                        <MessageSquare size={14} style={{ flexShrink: 0 }} />
                        <span>Open Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="clean-card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              You have no active swap proposals yet. Propose a swap on any listing with the SWAP badge!
            </div>
          )}
        </div>
      )}

      {/* Target Swap Modal */}
      {selectedTargetForSwap && (
        <SwapProposalModal
          isOpen={!!selectedTargetForSwap}
          onClose={() => setSelectedTargetForSwap(null)}
          targetListing={selectedTargetForSwap}
        />
      )}
    </div>
  );
};
