import React, { useState } from 'react';
import { Listing } from '../../types';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { ArrowLeftRight, MessageSquare } from 'lucide-react';

interface SwapProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing;
  onOpenVerification?: () => void;
}

export const SwapProposalModal: React.FC<SwapProposalModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  onOpenVerification
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { listings } = useMarket();
  const { proposeSwap } = useChat();
  const { showToast } = useToast();

  // User's own active listings
  const myListings = currentUser ? listings.filter((l) => l.sellerId === currentUser.id && !l.isSold) : [];

  const [selectedMyListingId, setSelectedMyListingId] = useState<string>(myListings[0]?.id || '');
  const [customDescription, setCustomDescription] = useState('');
  const [cashTopUp, setCashTopUp] = useState<number>(0);

  if (!isOpen) return null;

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="modal-backdrop-custom" onClick={onClose}>
        <div className="modal-card-custom" style={{ maxWidth: '440px', textAlign: 'center', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uc-blue)' }}>Sign In Required</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.25rem 0' }}>
            Please log in with your University of Cebu student account to propose a swap.
          </p>
          <button onClick={onClose} className="btn-gold" style={{ width: '100%' }}>Close</button>
        </div>
      </div>
    );
  }

  if (!currentUser.isVerified) {
    return (
      <div className="modal-backdrop-custom" onClick={onClose}>
        <div className="modal-card-custom" style={{ maxWidth: '460px', textAlign: 'center', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: 'rgba(255, 199, 44, 0.2)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <ArrowLeftRight size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uc-blue)' }}>Student ID Verification Required</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.25rem 0', lineHeight: 1.5 }}>
            To ensure trust and physical security across campus barter transactions, proposing item swaps requires student verification.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button
              onClick={() => {
                onClose();
                if (onOpenVerification) onOpenVerification();
              }}
              className="btn-gold"
              style={{ flex: 1.3 }}
            >
              Verify Student ID
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedMyListing = myListings.find((l) => l.id === selectedMyListingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const offeredDesc = selectedMyListing
      ? selectedMyListing.title
      : customDescription.trim();

    if (!offeredDesc) {
      showToast('Offer Incomplete', 'Please select an item or describe what you want to trade.', 'warning');
      return;
    }

    proposeSwap({
      targetListing,
      offeredListingId: selectedMyListing?.id,
      offeredListingTitle: selectedMyListing?.title,
      offeredListingImage: selectedMyListing?.images[0],
      offeredDescription: offeredDesc,
      cashTopUp
    });

    showToast(
      'Swap Proposal Sent!',
      `Sent trade offer to ${targetListing.sellerName}. Open chat to follow up.`,
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propose Item Swap"
      subtitle={`Offering a trade for "${targetListing.title}"`}
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {/* Side-by-Side Trade Comparison Preview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '0.65rem',
            alignItems: 'center',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            border: '1px solid var(--border-subtle, #E2E8F0)',
            borderRadius: '12px',
            padding: '0.85rem'
          }}
        >
          {/* Left: Target Item (Seller) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              They Give
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {targetListing.images && targetListing.images.length > 0 && targetListing.images[0] ? (
                <img
                  src={targetListing.images[0]}
                  alt={targetListing.title}
                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <ArrowLeftRight size={18} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {targetListing.title}
                </h5>
                <span style={{ fontSize: '0.74rem', color: 'var(--uc-blue)', fontWeight: 800 }}>
                  ₱{targetListing.price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Exchange Icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--uc-blue-subtle, #EFF6FF)',
              color: 'var(--uc-blue, #002B7F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeftRight size={16} />
          </div>

          {/* Right: Your Offer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              You Give
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedMyListing?.images?.[0] ? (
                <img
                  src={selectedMyListing.images[0]}
                  alt={selectedMyListing.title}
                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <ArrowLeftRight size={18} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {selectedMyListing ? selectedMyListing.title : (customDescription.trim() || 'Custom Item')}
                </h5>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-green, #059669)', fontWeight: 800 }}>
                  {selectedMyListing ? `₱${selectedMyListing.price.toLocaleString()}` : 'Custom Value'}
                  {cashTopUp > 0 && ` + ₱${cashTopUp.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Choose Item to Offer */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            What are you offering? *
          </label>

          {myListings.length > 0 ? (
            <select
              value={selectedMyListingId}
              onChange={(e) => setSelectedMyListingId(e.target.value)}
              className="clean-input"
            >
              {myListings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} (₱{item.price.toLocaleString()})
                </option>
              ))}
              <option value="">+ Offer custom item not yet in your listings</option>
            </select>
          ) : (
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Item title or description"
              className="clean-input"
              required
            />
          )}

          {selectedMyListingId === '' && myListings.length > 0 && (
            <div style={{ marginTop: '0.4rem' }}>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe your custom item offer..."
                className="clean-input"
                required
              />
            </div>
          )}
        </div>

        {/* Section 2: Cash Top-up with Quick Adjustment Chips */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cash Top-Up (Optional)
            </label>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Balances out differences in trade value
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>
              ₱
            </span>
            <input
              type="number"
              min="0"
              value={cashTopUp || ''}
              onChange={(e) => setCashTopUp(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="clean-input"
              style={{ paddingLeft: '1.75rem', fontWeight: 700 }}
            />
          </div>

          {/* Quick preset top-up chips */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
            {[50, 100, 200, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCashTopUp((prev) => prev + amt)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-subtle, #F1F5F9)',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                +₱{amt}
              </button>
            ))}
            {cashTopUp > 0 && (
              <button
                type="button"
                onClick={() => setCashTopUp(0)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Campus Chat Coordination Note */}
        <div style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', border: '1px solid rgba(0, 43, 127, 0.15)', borderRadius: '8px', padding: '0.75rem 0.95rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
          <MessageSquare size={18} color="var(--uc-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <strong style={{ color: 'var(--uc-blue)' }}>Direct Chat Coordination:</strong> Once the seller reviews and accepts your swap proposal, you can agree on the exact meeting spot and time on campus directly in Campus Chat.
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.55rem 1.35rem', fontSize: '0.84rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeftRight size={15} /> Send Swap Proposal
          </button>
        </div>
      </form>
    </Modal>
  );
};
