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
  Sparkles,
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
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#002B7F', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <ArrowLeftRight size={14} style={{ flexShrink: 0 }} /> Cashless Student Barter
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#002B7F', marginTop: '0.2rem' }}>
            Campus Swap Hub
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '0.15rem' }}>
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
      <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '9999px', alignSelf: 'flex-start', border: '1px solid #CBD5E1' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`segmented-tab ${activeTab === 'catalog' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Sparkles size={14} style={{ flexShrink: 0 }} />
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
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              No items currently listed for swap. Post an item to initiate peer barter.
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
                      <span style={{ fontWeight: 800, color: '#002B7F' }}>
                        {isReceiver ? 'Received Swap Proposal' : 'Your Sent Proposal'}
                      </span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ color: '#64748B' }}>
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
                            ? '#ECFDF5'
                            : swap.status === 'declined'
                            ? '#FEF2F2'
                            : '#FFFBEB',
                        color:
                          swap.status === 'accepted'
                            ? '#047857'
                            : swap.status === 'declined'
                            ? '#DC2626'
                            : '#B45309',
                        border:
                          swap.status === 'accepted'
                            ? '1px solid #A7F3D0'
                            : swap.status === 'declined'
                            ? '1px solid #FECACA'
                            : '1px solid #FDE68A'
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
                      backgroundColor: '#F8FAFC',
                      padding: '1.15rem',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    {/* Target Item */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={swap.targetListingImage}
                        alt=""
                        style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #CBD5E1' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                          {swap.targetListingTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Owner: {swap.targetSellerName}</div>
                      </div>
                    </div>

                    {/* Arrow Divider */}
                    <div style={{ display: 'flex', justifyContent: 'center', color: '#002B7F' }}>
                      <div style={{ background: '#EBF1FC', padding: '0.5rem', borderRadius: '50%', border: '1px solid #BCD1F7' }}>
                        <ArrowLeftRight size={18} color="#002B7F" style={{ flexShrink: 0 }} />
                      </div>
                    </div>

                    {/* Offered Item */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {swap.offeredListingImage && (
                        <img
                          src={swap.offeredListingImage}
                          alt=""
                          style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #CBD5E1' }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                          {swap.offeredDescription}
                        </div>
                        {swap.cashTopUp !== 0 && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: swap.cashTopUp > 0 ? '#059669' : '#D97706', marginTop: '2px' }}>
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
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
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
