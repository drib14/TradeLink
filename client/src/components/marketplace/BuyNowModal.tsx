import React, { useState } from 'react';
import { Listing, Campus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { CAMPUS_MEETUP_SPOTS } from '../../data/campusLocations';
import {
  X,
  ShieldCheck,
  CreditCard,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Lock
} from 'lucide-react';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess?: () => void;
  onOpenVerification?: () => void;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
  onOpenVerification
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { scheduleMeetup } = useChat();
  const { showToast } = useToast();

  const [step, setStep] = useState<'checkout' | 'meetup' | 'success'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
  const [selectedCampus, setSelectedCampus] = useState<Campus>(listing.sellerCampus);
  const [selectedSpot, setSelectedSpot] = useState<string>(
    listing.customMeetupSpot || CAMPUS_MEETUP_SPOTS.find((s) => s.campus === listing.sellerCampus)?.name || 'Main Gate Security Station'
  );
  const [isCustomSpot, setIsCustomSpot] = useState(false);
  const [customSpotInput, setCustomSpotInput] = useState('');
  const [meetupDate, setMeetupDate] = useState('Tomorrow');
  const [meetupTime, setMeetupTime] = useState('1:30 PM');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  if (!isOpen) return null;

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="modal-backdrop-custom" onClick={onClose}>
        <div className="modal-card-custom" style={{ maxWidth: '440px', textAlign: 'center', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uc-blue)' }}>Sign In Required</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.25rem 0' }}>
            Please log in with your University of Cebu student account to place an order.
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
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uc-blue)' }}>Student ID Verification Required</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.25rem 0', lineHeight: 1.5 }}>
            To protect buyers and sellers across all UC campuses, placing orders and scheduling meetups requires official student ID verification.
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

  const isFree = listing.tradeMode === 'free_donation';
  const availableSpots = CAMPUS_MEETUP_SPOTS.filter((s) => s.campus === selectedCampus);

  const handleProceedToMeetup = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('meetup');
  };

  const handleFinalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSpot = isCustomSpot && customSpotInput.trim() ? customSpotInput.trim() : selectedSpot;
    const finalDateTime = `${meetupDate} at ${meetupTime}`;

    const newTransaction = await scheduleMeetup({
      listing,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      tradeMode: listing.tradeMode,
      finalPrice: isFree ? 0 : listing.price,
      campus: selectedCampus,
      landmarkSpot: finalSpot,
      scheduledDateTime: finalDateTime,
      notes: buyerNotes.trim() || `Payment: ${paymentMethod === 'cash' ? 'Cash on Meetup' : 'GCash / Maya on Inspection'}`
    });

    setGeneratedCode(newTransaction.verificationCode);
    setStep('success');
    showToast(
      'Order & Meetup Confirmed!',
      `You purchased "${listing.title}". Handshake safety code: ${newTransaction.verificationCode}`,
      'success'
    );

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '560px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Modal Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {step === 'checkout' && 'Complete Purchase'}
                {step === 'meetup' && 'Schedule Handshake (Inside or Outside Campus)'}
                {step === 'success' && 'Transaction Confirmed!'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {step === 'checkout' && 'Step 1 of 2 • Order Summary & Payment'}
                {step === 'meetup' && 'Step 2 of 2 • Pick Guarded Spot or Nearby Mall'}
                {step === 'success' && 'Your 4-digit code is ready'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: CHECKOUT & PAYMENT */}
        {step === 'checkout' && (
          <form onSubmit={handleProceedToMeetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Item Card Preview */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.85rem',
                alignItems: 'center'
              }}
            >
              {listing.images && listing.images.length > 0 && listing.images[0] && listing.images[0].trim() !== '' ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  style={{ width: '68px', height: '68px', borderRadius: '8px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '68px', height: '68px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={24} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--uc-blue)', fontWeight: 700 }}>
                  <span>{listing.sellerCampus}</span>
                  <span>•</span>
                  <span>{listing.condition}</span>
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginTop: '2px' }}>
                  {listing.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--uc-blue)', fontFamily: 'var(--font-display)' }}>
                    {isFree ? 'FREE DONATION' : `₱${listing.price.toLocaleString()}`}
                  </span>
                  {listing.originalSrp > listing.price && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ₱{listing.originalSrp.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Reputation Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '0.75rem 0.95rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <UserAvatar
                  src={listing.sellerAvatar}
                  name={listing.sellerName}
                  size={36}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{listing.sellerName}</span>
                    {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" />}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{listing.sellerCollege} • Trust Score {listing.sellerTrustScore}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 700 }}>
                <ShieldCheck size={14} />
                <span>Verified Seller</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            {!isFree && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                  Payment Preference (Paid on Handshake Inspection)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: paymentMethod === 'cash' ? '2px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                      backgroundColor: paymentMethod === 'cash' ? 'var(--uc-blue-subtle)' : 'var(--bg-surface)',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--uc-blue)', fontWeight: 700, fontSize: '0.84rem' }}>
                      <Banknote size={16} /> Cash on Meetup
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inspect item and pay physical cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gcash')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: paymentMethod === 'gcash' ? '2px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                      backgroundColor: paymentMethod === 'gcash' ? 'var(--uc-blue-subtle)' : 'var(--bg-surface)',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--uc-blue)', fontWeight: 700, fontSize: '0.84rem' }}>
                      <CreditCard size={16} /> GCash / Maya
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scan seller QR code in person</span>
                  </button>
                </div>
              </div>
            )}

            {/* Buyer Guarantee Callout */}
            <div style={{ backgroundColor: 'var(--accent-green-subtle)', border: '1px solid var(--accent-green)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-green)' }}>
              <Lock size={15} color="var(--accent-green)" style={{ flexShrink: 0 }} />
              <span><strong>TradeLink Protection:</strong> No advance payments required. You only exchange payment after inspecting the item during the meetup (inside campus or at public malls/cafes).</span>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.75rem', width: '100%', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
              <span>Proceed to Schedule Meetup</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: MEETUP SCHEDULING */}
        {step === 'meetup' && (
          <form onSubmit={handleFinalizeOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Campus Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Primary UC Campus / Area *
              </label>
              <select
                value={selectedCampus}
                onChange={(e: any) => setSelectedCampus(e.target.value)}
                className="clean-input"
                style={{ fontWeight: 600 }}
              >
                <option value="UC Main">UC Main (Downtown Cebu / E-Mall)</option>
                <option value="UC Banilad">UC Banilad (Gov. Cuenco / Country Mall / IT Park)</option>
                <option value="UC LM">UC LM (Mandaue / Parkmall)</option>
                <option value="UC METC">UC METC (Mambaling / SM Seaside / IL Corso)</option>
                <option value="UC Pardo-Talisay">UC Pardo-Talisay (Talisay / Minglanilla)</option>
                <option value="UC South Campus">UC South Campus (Sanciangko)</option>
                <option value="UC Medical Center">UC Medical Center (UCMC Mandaue)</option>
              </select>
            </div>

            {/* Meetup Spot Selection (Inside & Outside Options) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Meetup Location *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSpot(!isCustomSpot)}
                  style={{ fontSize: '0.75rem', color: 'var(--uc-blue)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {isCustomSpot ? 'Select from Suggested Spots' : '+ Enter Custom Location'}
                </button>
              </div>

              {!isCustomSpot ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableSpots.map((spot) => (
                    <label
                      key={spot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: selectedSpot === spot.name ? '2px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                        backgroundColor: selectedSpot === spot.name ? 'var(--uc-blue-subtle)' : 'var(--bg-surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="meetupSpot"
                        checked={selectedSpot === spot.name}
                        onChange={() => setSelectedSpot(spot.name)}
                        style={{ marginTop: '3px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{spot.name}</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{spot.locationDetails || spot.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Meetup location (e.g. E-Mall, Banilad Canteen)"
                  value={customSpotInput}
                  onChange={(e) => setCustomSpotInput(e.target.value)}
                  className="clean-input"
                  required
                />
              )}
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Date *
                </label>
                <select
                  value={meetupDate}
                  onChange={(e) => setMeetupDate(e.target.value)}
                  className="clean-input"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Time *
                </label>
                <select
                  value={meetupTime}
                  onChange={(e) => setMeetupTime(e.target.value)}
                  className="clean-input"
                >
                  <option value="9:00 AM">9:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="12:00 PM (Lunch)">12:00 PM</option>
                  <option value="1:30 PM">1:30 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="4:30 PM">4:30 PM</option>
                  <option value="5:30 PM">5:30 PM</option>
                  <option value="6:30 PM (Evening Mall)">6:30 PM</option>
                </select>
              </div>
            </div>

            {/* Note to Seller */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Note to Seller (Optional)
              </label>
              <input
                type="text"
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Notes for seller (optional)"
                className="clean-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="btn-secondary"
                style={{ padding: '0.7rem 1rem' }}
              >
                Back
              </button>
              <button type="submit" className="btn-gold" style={{ flex: 1, padding: '0.7rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                <CheckCircle2 size={16} /> Confirm Order & Schedule
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS & HANDSHAKE CODE */}
        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem', padding: '1rem 0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Order & Meetup Confirmed!
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                A notification and chat message have been dispatched to {listing.sellerName}.
              </p>
            </div>


            {/* Security Code Card */}
            <div
              style={{
                backgroundColor: '#002B7F',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.25rem',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#FFC72C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your 4-Digit Handshake Code
              </span>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.25em', color: '#FFFFFF', fontFamily: 'monospace' }}>
                {generatedCode}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                Show or share this code with {listing.sellerName} after inspecting the item to complete the trade.
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Done & View Meetups
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
