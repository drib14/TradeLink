import React, { useState, useEffect, useCallback } from 'react';
import { Listing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UserAvatar } from '../common/UserAvatar';
import { PaymentMethodSelector } from '../common/PaymentLogos';
import { TradeLinkIcon } from '../common/TradeLinkIcon';
import { encodeHashedId } from '../../utils/security';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  MessageSquare,
  Lock,
  Loader2
} from 'lucide-react';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  initialVariation?: string | null;
  onSuccess?: () => void;
  onOpenVerification?: () => void;
  onNavigate?: (view: string, params?: any) => void;
  onOpenAuth?: () => void;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({
  isOpen,
  onClose,
  listing,
  initialVariation,
  onSuccess,
  onOpenVerification,
  onNavigate,
  onOpenAuth
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { createDirectOrder, openChatWithSeller } = useChat();
  const { showToast } = useToast();

  const [selectedVariation, setSelectedVariation] = useState<string | null>(
    initialVariation || (listing.variations && listing.variations.length > 0 ? listing.variations[0].title : null)
  );

  useEffect(() => {
    if (initialVariation) {
      setSelectedVariation(initialVariation);
    } else if (listing.variations && listing.variations.length > 0 && !selectedVariation) {
      setSelectedVariation(listing.variations[0].title);
    }
  }, [initialVariation, listing]);

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

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      onClose();
    }, 200);
  }, [isSubmitting, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else if (shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, handleClose]);

  if (!shouldRender) return null;

  if (!isAuthenticated || !currentUser) {
    return (
      <div
        className={`modal-backdrop-custom ${isClosing ? 'closing' : ''}`}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      >
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
              Please sign in with your verified University of Cebu student account to place orders and connect with student peers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.25rem' }}>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
                else if (onNavigate) onNavigate('home');
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

  const isFree = listing.tradeMode === 'free_donation';
  const matchedVar = listing.variations?.find((v) => v.title === selectedVariation);
  const activeVarImage = matchedVar?.imageUrl || (matchedVar && matchedVar.imageIndex !== null && matchedVar.imageIndex !== undefined && listing.images ? listing.images[matchedVar.imageIndex] : null);
  const displayImage = activeVarImage || (listing.media && listing.media[0]?.url) || (listing.images && listing.images[0]) || '';
  const itemUnitPrice = (matchedVar && matchedVar.price !== null && matchedVar.price !== undefined) ? matchedVar.price : listing.price;
  const totalAmount = itemUnitPrice * orderQuantity;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tx = await createDirectOrder({
        listing,
        paymentMethod,
        selectedVariation: selectedVariation || undefined,
        variationId: matchedVar?.id,
        notes: `Qty: ${orderQuantity}${selectedVariation ? ` [Option: ${selectedVariation}]` : ''}${buyerNotes.trim() ? ` — ${buyerNotes.trim()}` : ''}`,
        quantity: orderQuantity,
        amount: totalAmount
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

  

  const handleOpenChat = async () => {
    setIsOpeningChat(true);
    try {
      const convId = await openChatWithSeller(listing);
      onClose();
      if (onNavigate) {
        onNavigate('messages', { conversationId: convId || undefined });
      } else {
        const targetPath = convId ? `/messages/${encodeHashedId(convId, 'conversation')}` : '/messages';
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err: any) {
      console.error('Failed to open chat with seller:', err);
      onClose();
      if (onNavigate) {
        onNavigate('messages');
      } else {
        window.history.pushState({}, '', '/messages');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } finally {
      setIsOpeningChat(false);
    }
  };

  return (
    <div
      className={`modal-backdrop-custom ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
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

          <button onClick={handleClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {confirmedTransaction ? (
          /* SUCCESS SCREEN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Confirmed
              </span>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                Ref: {confirmedTransaction.referenceNo || `TL-TX-${confirmedTransaction.id?.slice(0, 6)}`}
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                Your order is confirmed! Coordinate safe meetup and item inspection directly with <strong>{listing.sellerName}</strong>.
              </p>
            </div>

            {/* Clear Purchased Item Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                borderRadius: '12px',
                padding: '0.85rem',
                textAlign: 'left',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'center'
              }}
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={listing.title}
                  style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShoppingBag size={22} color="var(--text-muted)" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--uc-blue)', fontWeight: 700 }}>
                  {listing.sellerCampus || 'UC Campus'} • {listing.sellerName}
                </span>
                <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listing.title}
                </h5>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.76rem' }}>
                  {selectedVariation && (
                    <span style={{ backgroundColor: 'var(--uc-blue-subtle, #EEF4FF)', color: 'var(--uc-blue)', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      Option: {selectedVariation}
                    </span>
                  )}
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    ₱{totalAmount.toLocaleString()} ({paymentMethod.toUpperCase()})
                  </span>
                  {orderQuantity > 1 && (
                    <span style={{ color: 'var(--text-muted)' }}>• Qty: {orderQuantity}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Buyer Handshake Verification Code (if available) */}
            {confirmedTransaction.verificationCode && (
              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>
                    Buyer Handshake Code
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#92400E' }}>
                    Give to seller only after checking item.
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    letterSpacing: '0.15em',
                    fontFamily: 'monospace',
                    color: '#B45309',
                    backgroundColor: '#FEF3C7',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px'
                  }}
                >
                  {confirmedTransaction.verificationCode}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={isOpeningChat}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isOpeningChat ? (
                  <>
                    <Loader2 size={16} className="spin" /> Opening Chat...
                  </>
                ) : (
                  <>
                    <MessageSquare size={16} /> Open Chat with Seller
                  </>
                )}
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
                    {isFree ? 'FREE DONATION' : `₱${itemUnitPrice.toLocaleString()}`}
                  </span>
                  {listing.originalSrp && listing.originalSrp > itemUnitPrice && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ₱{listing.originalSrp.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Variations Picker (e.g. PE 101, PE 102, etc.) */}
            {listing.variations && listing.variations.length > 0 && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                    Option
                  </label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {listing.variations.map((v) => {
                    const isSelected = selectedVariation === v.title;
                    const vImg = v.imageUrl || (v.imageIndex !== null && v.imageIndex !== undefined && listing.images ? listing.images[v.imageIndex] : null);
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
                        {v.price !== null && v.price !== undefined && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 700 }}>
                            ₱{v.price.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {listing.sellerCampus}{listing.rating ? ` • ${Number(listing.rating).toFixed(1)} / 5.0` : ''}
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

            {/* Payment Method - Cash on Meetup */}
            {!isFree && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Payment Mode
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 800, backgroundColor: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Direct Cash Handover
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cash on Meetup</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Pay in person upon inspecting the item)</span>
                </div>
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
                    : `Confirm Order • ₱${totalAmount.toLocaleString()}${orderQuantity > 1 ? ` (${orderQuantity} items)` : ''}`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
