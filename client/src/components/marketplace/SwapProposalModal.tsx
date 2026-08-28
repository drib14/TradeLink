import React, { useState } from 'react';
import { Listing, Campus } from '../../types';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { ArrowLeftRight, Plus, MapPin, Calendar, CheckCircle2, Coins } from 'lucide-react';
import { CAMPUS_MEETUP_SPOTS } from '../../data/campusLocations';

interface SwapProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing;
}

export const SwapProposalModal: React.FC<SwapProposalModalProps> = ({
  isOpen,
  onClose,
  targetListing
}) => {
  const { currentUser } = useAuth();
  const { listings } = useMarket();
  const { proposeSwap } = useChat();
  const { showToast } = useToast();

  // User's own active listings
  const myListings = listings.filter((l) => l.sellerId === currentUser.id && !l.isSold);

  const [selectedMyListingId, setSelectedMyListingId] = useState<string>(myListings[0]?.id || '');
  const [customDescription, setCustomDescription] = useState('');
  const [cashTopUp, setCashTopUp] = useState<number>(0);
  const [selectedSpot, setSelectedSpot] = useState<string>(
    CAMPUS_MEETUP_SPOTS.find((s) => s.campus === targetListing.sellerCampus)?.name ||
      CAMPUS_MEETUP_SPOTS[0].name
  );
  const [scheduledDate, setScheduledDate] = useState('Tomorrow at 2:00 PM');

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
      proposedMeetupSpot: selectedSpot,
      proposedDateTime: scheduledDate
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
        {/* Target Item Summary Banner */}
        <div
          style={{
            backgroundColor: 'var(--uc-blue-subtle, #EFF6FF)',
            border: '1px solid var(--border-subtle, #BFDBFE)',
            borderRadius: '10px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <img
            src={targetListing.images[0]}
            alt={targetListing.title}
            style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{targetListing.title}</h5>
            <p style={{ fontSize: '0.74rem', color: 'var(--uc-blue)', marginTop: '2px' }}>
              Seller: {targetListing.sellerName} ({targetListing.sellerCampus}) • Value: ₱{targetListing.price.toLocaleString()}
            </p>
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
                  {item.title} (₱{item.price})
                </option>
              ))}
              <option value="">+ Offer custom item</option>
            </select>
          ) : (
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g. Casio FX-570ES Calculator + 2 notebooks"
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

        {/* Section 2: Cash Top-up & Meetup Spot (2 Column) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Cash Top-Up (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>
                ₱
              </span>
              <input
                type="number"
                value={cashTopUp || ''}
                onChange={(e) => setCashTopUp(Number(e.target.value))}
                placeholder="0"
                className="clean-input"
                style={{ paddingLeft: '1.75rem', fontWeight: 700 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Campus Meetup Zone
            </label>
            <select
              value={selectedSpot}
              onChange={(e) => setSelectedSpot(e.target.value)}
              className="clean-input"
            >
              {CAMPUS_MEETUP_SPOTS.filter(s => s.campus === targetListing.sellerCampus || s.campus === currentUser.campus).map((spot) => (
                <option key={spot.id} value={spot.name}>
                  [{spot.campus}] {spot.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Meetup Time with Quick Presets */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Preferred Meetup Time
          </label>
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            {['Tomorrow at Lunch', 'Tomorrow 4:30 PM (After Class)', 'This Friday 2:00 PM'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setScheduledDate(preset)}
                className="btn-ghost"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', borderRadius: '6px', border: scheduledDate === preset ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)', backgroundColor: scheduledDate === preset ? 'var(--uc-blue-subtle)' : 'transparent', color: scheduledDate === preset ? 'var(--uc-blue)' : 'var(--text-secondary)' }}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            placeholder="e.g. Tomorrow at 2:00 PM"
            className="clean-input"
            style={{ fontSize: '0.82rem' }}
          />
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
