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
  Calendar
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#18181B' }}>
            Campus Swap Hub
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#71717A', marginTop: '0.15rem' }}>
            Direct item-for-item student barter without spending cash
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-listing')}
          className="btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          <Plus size={15} /> Post Swap Item
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div style={{ display: 'inline-flex', backgroundColor: '#F4F4F5', padding: '3px', borderRadius: '9999px', alignSelf: 'flex-start' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`segmented-tab ${activeTab === 'catalog' ? 'active' : ''}`}
        >
          Available Swaps ({swapListings.length})
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`segmented-tab ${activeTab === 'proposals' ? 'active' : ''}`}
        >
          My Proposals ({mySwaps.length})
        </button>
      </div>

      {/* Tab 1: Swap Catalog */}
      {activeTab === 'catalog' && (
        <div>
          {swapListings.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem'
              }}
            >
              {swapListings.map((item: Listing) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <ListingCard
                    listing={item}
                    onClick={() => onNavigate('item-detail', { id: item.id })}
                  />
                  {item.sellerId !== currentUser.id && (
                    <button
                      onClick={() => setSelectedTargetForSwap(item)}
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem',
                        fontSize: '0.78rem',
                        width: '100%'
                      }}
                    >
                      <ArrowLeftRight size={13} /> Propose Swap
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#71717A', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              No items currently listed for swap. Post an item to initiate trades.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Swap Proposals */}
      {activeTab === 'proposals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mySwaps.length > 0 ? (
            mySwaps.map((swap: SwapOffer) => {
              const isReceiver = swap.targetSellerId === currentUser.id;

              return (
                <div
                  key={swap.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: '#18181B' }}>
                        {isReceiver ? 'Received Offer' : 'Sent Offer'}
                      </span>
                      <span style={{ color: '#A1A1AA' }}>•</span>
                      <span style={{ color: '#71717A' }}>
                        {new Date(swap.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
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
                            : '#B45309'
                      }}
                    >
                      {swap.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Visual Barter Pair */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem',
                      alignItems: 'center',
                      backgroundColor: '#FAFAFA',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #F4F4F5'
                    }}
                  >
                    {/* Target */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <img
                        src={swap.targetListingImage}
                        alt=""
                        style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18181B' }}>
                          {swap.targetListingTitle}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#71717A' }}>Owner: {swap.targetSellerName}</div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', justifyContent: 'center', color: '#71717A' }}>
                      <ArrowLeftRight size={18} />
                    </div>

                    {/* Offered */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {swap.offeredListingImage && (
                        <img
                          src={swap.offeredListingImage}
                          alt=""
                          style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18181B' }}>
                          {swap.offeredDescription}
                        </div>
                        {swap.cashTopUp !== 0 && (
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: swap.cashTopUp > 0 ? '#059669' : '#D97706' }}>
                            Adjustment: {swap.cashTopUp > 0 ? `+₱${swap.cashTopUp}` : `-₱${Math.abs(swap.cashTopUp)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Proposed Spot */}
                  <div style={{ fontSize: '0.78rem', color: '#52525B', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building2 size={13} color="#71717A" />
                      <span>{swap.proposedMeetupSpot}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} color="#71717A" />
                      <span>{swap.proposedDateTime}</span>
                    </div>
                  </div>

                  {/* Receiver Actions */}
                  {isReceiver && swap.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => respondToSwap(swap.id, 'accepted')}
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => respondToSwap(swap.id, 'declined')}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', color: '#DC2626' }}
                      >
                        Decline
                      </button>
                      <button
                        onClick={onOpenChat}
                        style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}
                      >
                        Open Chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#71717A', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              You have no active swap proposals yet.
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
