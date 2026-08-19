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
      title="Propose Item-for-Item Swap"
      subtitle={`Offering a trade for "${targetListing.title}"`}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Target Item Summary Banner */}
        <div
          style={{
            backgroundColor: 'var(--uc-blue-subtle, #EFF6FF)',
            border: '1px solid var(--border-subtle, #BFDBFE)',
            borderRadius: '10px',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <img
            src={targetListing.images[0]}
            alt={targetListing.title}
            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{targetListing.title}</h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--uc-blue)' }}>
              Seller: {targetListing.sellerName} ({targetListing.sellerCampus}) • Est. Value: ₱{targetListing.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Section 1: Choose Item to Offer */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            1. Select What You Are Offering in Return
          </label>

          {myListings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select
                value={selectedMyListingId}
                onChange={(e) => setSelectedMyListingId(e.target.value)}
                className="clean-input"
              >
                {myListings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (Valued at ₱{item.price})
                  </option>
                ))}
                <option value="">+ Offer custom / unlisted item</option>
              </select>
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              You have no active listings posted yet. You can describe your item below:
            </p>
          )}

          {(!selectedMyListingId || myListings.length === 0) && (
            <div style={{ marginTop: '0.5rem' }}>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe offered item and condition"
                className="clean-input"
              />
            </div>
          )}
        </div>

        {/* Section 2: Cash Adjustment (Top-up) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            2. Cash Top-Up Adjustment (Optional)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
              ₱
            </span>
            <input
              type="number"
              value={cashTopUp || ''}
              onChange={(e) => setCashTopUp(Number(e.target.value))}
              placeholder="0"
              className="clean-input"
              style={{ paddingLeft: '2.2rem', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Section 3: Campus Meetup Spot */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            3. Proposed Campus Meetup Landmark
          </label>
          <select
            value={selectedSpot}
            onChange={(e) => setSelectedSpot(e.target.value)}
            className="clean-input"
          >
            {CAMPUS_MEETUP_SPOTS.map((spot) => (
              <option key={spot.id} value={spot.name}>
                [{spot.campus}] {spot.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section 4: Preferred Date & Time */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            4. Preferred Meetup Date & Time
          </label>
          <input
            type="text"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            placeholder="e.g. Tomorrow at 3:00 PM during break"
            className="clean-input"
          />
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeftRight size={16} /> Send Swap Proposal
          </button>
        </div>
      </form>
    </Modal>
  );
};
