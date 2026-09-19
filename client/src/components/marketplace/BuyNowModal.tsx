import React, { useState, useEffect } from 'react';
import { Listing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { PaymentMethodSelector } from '../common/PaymentLogos';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  MessageSquare,
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
  const { createDirectOrder, openChatWithSeller } = useChat();
  const { showToast } = useToast();

  const availableMethods = (listing.acceptedPaymentMethods && listing.acceptedPaymentMethods.length > 0)
    ? listing.acceptedPaymentMethods
    : (['cash', 'gcash', 'maya'] as ('cash' | 'gcash' | 'maya')[]);

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'maya'>(
    availableMethods[0] || 'cash'
  );

  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0]);
    }
  }, [availableMethods, paymentMethod]);

  const [buyerNotes, setBuyerNotes] = useState('');
  const maxQuantity = listing.quantity !== undefined && listing.quantity > 0 ? listing.quantity : 1;
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedTransaction, setConfirmedTransaction] = useState<any>(null);

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
            To protect buyers and sellers across all UC campuses, placing direct purchase orders requires official student ID verification.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={onClose} className="btn-neutral" style={{ flex: 1 }}>Cancel</button>
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
  const displayImage = (listing.media && listing.media[0]?.url) || (listing.images && listing.images[0]) || '';

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tx = await createDirectOrder({
        listing,
        paymentMethod,
        notes: `Qty: ${orderQuantity}${buyerNotes.trim() ? ` — ${buyerNotes.trim()}` : ''}`,
        quantity: orderQuantity,
        amount: listing.price * orderQuantity
      } as any);

      setConfirmedTransaction(tx);
      showToast(
        'Order Placed!',
        `Order ${tx.referenceNo || 'confirmed'}. Coordinate directly with the seller in chat.`,
        'success'
      );

      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to place order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '540px',
          padding: '1.75rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {confirmedTransaction ? 'Order Placed!' : 'Direct Order Confirmation'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {confirmedTransaction ? 'Direct transaction active' : 'Purchase directly & coordinate via Campus Chat'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {confirmedTransaction ? (
          /* SUCCESS SCREEN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Successful
              </span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                Ref: {confirmedTransaction.referenceNo || `TL-TX-${confirmedTransaction.id?.slice(0, 6)}`}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Your order for <strong>"{listing.title}"</strong> has been confirmed. Open chat now to coordinate where and when you and <strong>{listing.sellerName}</strong> will meet!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openChatWithSeller(listing);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <MessageSquare size={16} /> Open Chat with Seller
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ORDER CHECKOUT FORM */
          <form onSubmit={handleConfirmOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={listing.title}
                  style={{ width: '68px', height: '68px', borderRadius: '8px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '68px', height: '68px', borderRadius: '8px', backgroundColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={24} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--uc-blue)', fontWeight: 700 }}>
                  <span>{listing.sellerCampus}</span>
                  <span>•</span>
                  <span>{listing.condition}</span>
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listing.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uc-blue)', fontFamily: 'var(--font-display)' }}>
                    {isFree ? 'FREE DONATION' : `₱${listing.price.toLocaleString()}`}
                  </span>
                  {listing.originalSrp && listing.originalSrp > listing.price && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ₱{listing.originalSrp.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <UserAvatar src={listing.sellerAvatar} name={listing.sellerName} size="sm" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{listing.sellerName}</span>
                    {listing.sellerIsVerified && <VerifiedBadge size="xs" variant="green" />}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {listing.sellerCampus} • {listing.rating ? `★ ${Number(listing.rating).toFixed(1)} rating` : 'Verified Student'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Stepper if more than 1 */}
            {maxQuantity > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Quantity to Buy
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {maxQuantity} available in stock
                  </span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity((prev) => Math.max(1, prev - 1))}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}
                  >
                    −
                  </button>
                  <span style={{ width: '36px', textAlign: 'center', fontWeight: 800, fontSize: '0.88rem', color: 'var(--uc-blue)' }}>
                    {orderQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            {!isFree && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Accepted Settlement Method
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 800, backgroundColor: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    0% Processing Fee
                  </span>
                </div>
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onSelect={(method) => setPaymentMethod(method)}
                  disabled={isSubmitting}
                  availableMethods={availableMethods}
                />
              </div>
            )}

            {/* Note to Seller */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Note to Seller (Optional)
              </label>
              <input
                type="text"
                placeholder="Meetup preference"
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                className="clean-input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
              />
            </div>

            {/* Security notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#15803D', backgroundColor: '#F0FDF4', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <Lock size={14} />
              <span>Campus Safety: You and the seller will coordinate directly in chat where and when to complete the trade.</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-neutral"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold"
                style={{ flex: 2, padding: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <ShoppingBag size={16} />
                <span>
                  {isSubmitting
                    ? 'Placing Order...'
                    : isFree
                    ? 'Claim Free Donation'
                    : `Confirm Order • ₱${(listing.price * orderQuantity).toLocaleString()}${orderQuantity > 1 ? ` (${orderQuantity} items)` : ''}`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
