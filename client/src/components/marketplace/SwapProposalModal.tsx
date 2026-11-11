import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Listing } from '../../types';
import { Modal } from '../common/Modal';
import { TradeLinkIcon } from '../common/TradeLinkIcon';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';

interface SwapProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing;
  initialVariation?: string | null;
  onOpenVerification?: () => void;
  onOpenAuth?: () => void;
}

export const SwapProposalModal: React.FC<SwapProposalModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  initialVariation,
  onOpenVerification,
  onOpenAuth
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { listings } = useMarket();
  const { proposeSwap } = useChat();
  const { showToast } = useToast();

  // User's own active listings
  const myListings = currentUser ? listings.filter((l) => l.sellerId === currentUser.id && !l.isSold) : [];

  const [selectedMyListingId, setSelectedMyListingId] = useState<string>(myListings[0]?.id || '');
  const [selectedVariation, setSelectedVariation] = useState<string | null>(
    initialVariation || (targetListing.variations && targetListing.variations.length > 0 ? targetListing.variations[0].title : null)
  );

  React.useEffect(() => {
    if (initialVariation) {
      setSelectedVariation(initialVariation);
    } else if (targetListing.variations && targetListing.variations.length > 0 && !selectedVariation) {
      setSelectedVariation(targetListing.variations[0].title);
    }
  }, [initialVariation, targetListing]);

  const [customDescription, setCustomDescription] = useState('');
  const [cashTopUp, setCashTopUp] = useState<number>(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="modal-backdrop-custom" onClick={onClose}>
        <div
          className="modal-card-custom"
          style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.15rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <TradeLinkIcon size={56} />
          <div>
            <h3 style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0, letterSpacing: '-0.01em' }}>
              Sign In Required
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary, #64748B)', marginTop: '0.45rem', lineHeight: 1.55 }}>
              Please sign in with your verified University of Cebu student account to propose a barter swap with peers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.25rem' }}>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="btn-gold"
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.88rem', fontWeight: 800 }}
            >
              Sign In to TradeLink
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MVP: Verification check disabled for open access
  /*
  if (!currentUser.isVerified) {
    ...
  }
  */

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
      cashTopUp,
      selectedVariation: selectedVariation || undefined
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
      icon={<ArrowLeftRight size={20} />}
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

        {/* Target Item Variation Selector (if seller listed variations e.g. PE 101, PE 102) */}
        {targetListing.variations && targetListing.variations.length > 0 && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-subtle, #F8FAFC)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                Option
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {targetListing.variations.map((v) => {
                const isSelected = selectedVariation === v.title;
                const vImg = v.imageUrl || (v.imageIndex !== null && v.imageIndex !== undefined && targetListing.images ? targetListing.images[v.imageIndex] : null);
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setSelectedVariation(v.title)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--uc-blue-subtle, #EBF1FC)' : '#FFFFFF',
                      color: isSelected ? 'var(--uc-blue)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {vImg && (
                      <img src={vImg} alt="" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}
                    <span>{v.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
        <div style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', border: '1px solid rgba(0, 43, 127, 0.15)', borderRadius: '8px', padding: '0.75rem 0.95rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <strong style={{ color: 'var(--uc-blue)' }}>Direct Chat Coordination:</strong> Once the seller reviews and accepts your swap proposal, you can agree on the exact meeting spot and time on campus directly in Campus Chat.
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-neutral"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.55rem 1.35rem', fontSize: '0.84rem', fontWeight: 800 }}
          >
            Send Swap Proposal
          </button>
        </div>
      </form>
    </Modal>
  );
};
