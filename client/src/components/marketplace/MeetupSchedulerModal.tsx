import React, { useState } from 'react';
import { Listing } from '../../types';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { ShieldCheck, MapPin } from 'lucide-react';
import { CAMPUS_MEETUP_SPOTS } from '../../data/campusLocations';

interface MeetupSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  counterpartUserId: string;
  counterpartUserName: string;
}

export const MeetupSchedulerModal: React.FC<MeetupSchedulerModalProps> = ({
  isOpen,
  onClose,
  listing,
  counterpartUserId,
  counterpartUserName
}) => {
  const { currentUser } = useAuth();
  const { scheduleMeetup } = useChat();
  const { showToast } = useToast();

  const campusSpots = CAMPUS_MEETUP_SPOTS.filter((s) => s.campus === listing.sellerCampus);
  const defaultSpot = campusSpots[0] || CAMPUS_MEETUP_SPOTS[0];

  const [useCustomSpot, setUseCustomSpot] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState(defaultSpot.id);
  const [customSpotName, setCustomSpotName] = useState(listing.customMeetupSpot || '');
  const [scheduledDateTime, setScheduledDateTime] = useState('Tomorrow at 3:30 PM');
  const [notes, setNotes] = useState('Will meet inside the lobby/canteen. Inspect item together.');

  const chosenSpot = CAMPUS_MEETUP_SPOTS.find((s) => s.id === selectedSpotId) || defaultSpot;

  const isSeller = currentUser.id === listing.sellerId;
  const sellerId = isSeller ? currentUser.id : counterpartUserId;
  const sellerName = isSeller ? currentUser.name : counterpartUserName;
  const buyerId = isSeller ? counterpartUserId : currentUser.id;
  const buyerName = isSeller ? counterpartUserName : currentUser.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalLandmarkSpot = useCustomSpot && customSpotName.trim()
      ? customSpotName.trim()
      : `[${chosenSpot.campus}] ${chosenSpot.name}`;

    scheduleMeetup({
      listing,
      sellerId,
      sellerName,
      buyerId,
      buyerName,
      tradeMode: listing.tradeMode,
      finalPrice: listing.price,
      campus: listing.sellerCampus,
      landmarkSpot: finalLandmarkSpot,
      scheduledDateTime,
      notes
    });

    showToast(
      'Meetup Scheduled!',
      `Campus meetup confirmed at "${finalLandmarkSpot}". 4-digit code generated!`,
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Safe Campus Meetup"
      subtitle={`For "${listing.title}" • Meeting with ${counterpartUserName}`}
      maxWidth="580px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Safety Desk Banner */}
        <div
          style={{
            backgroundColor: 'var(--accent-green-subtle, #ECFDF5)',
            border: '1px solid var(--accent-green, #A7F3D0)',
            borderRadius: '10px',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}
        >
          <ShieldCheck size={20} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', lineHeight: 1.45 }}>
            <strong>Official UC Safe Trade Zone:</strong> Conduct meetups inside designated campus security landmarks during daylight or lighted hours.
          </div>
        </div>

        {/* Spot Selector / Custom spot toggle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              1. Meetup Location on Campus
            </label>
            <button
              type="button"
              onClick={() => setUseCustomSpot(!useCustomSpot)}
              style={{ fontSize: '0.75rem', color: 'var(--uc-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {useCustomSpot ? '← Pick Predefined Landmark' : '✏️ Enter Custom Spot'}
            </button>
          </div>

          {!useCustomSpot ? (
            <div>
              <select
                value={selectedSpotId}
                onChange={(e) => setSelectedSpotId(e.target.value)}
                className="clean-input"
              >
                {CAMPUS_MEETUP_SPOTS.map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    [{spot.campus}] {spot.name}
                  </option>
                ))}
              </select>

              <div
                style={{
                  marginTop: '0.45rem',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <MapPin size={13} color="var(--uc-blue)" />
                <span>{chosenSpot.locationDetails}</span>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={customSpotName}
              onChange={(e) => setCustomSpotName(e.target.value)}
              placeholder="e.g. UC Main 5th Floor AVR / UC Banilad Gym Benches / UC LM Canteen Table 3"
              className="clean-input"
              required
            />
          )}
        </div>

        {/* Date / Time */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            2. Scheduled Date & Time
          </label>
          <input
            type="text"
            value={scheduledDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            placeholder="e.g. Tomorrow at 3:30 PM after class"
            className="clean-input"
            required
          />
        </div>

        {/* Meeting Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            3. Meetup Notes / Clothing / Details
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Wearing black hoodie with guitar case near turnstiles"
            className="clean-input"
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.55rem 1.15rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-gold"
            style={{ padding: '0.55rem 1.45rem', fontSize: '0.85rem' }}
          >
            <ShieldCheck size={16} /> Confirm Campus Meetup
          </button>
        </div>
      </form>
    </Modal>
  );
};
