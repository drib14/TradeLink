import React, { useState } from 'react';
import { MeetupTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { reviewsService } from '../../services/reviews.service';
import {
  X,
  Star,
  CheckCircle2,
  ShieldCheck,
  ThumbsUp,
  Zap,
  Gem,
  Users,
  MessageSquare,
  Award,
  AlertTriangle,
  Smile,
  Loader2
} from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup: MeetupTransaction;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  meetup,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['Super Punctual', 'Mint Condition']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const handleClose = React.useCallback(() => {
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

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else if (shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen]);

  React.useEffect(() => {
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

  const targetUserName = currentUser?.id === meetup.sellerId ? meetup.buyerName : meetup.sellerName;
  const targetUserId = currentUser?.id === meetup.sellerId ? meetup.buyerId : meetup.sellerId;

  const availableBadges = [
    { id: 'Super Punctual', label: 'Super Punctual', icon: Zap },
    { id: 'Mint Condition', label: 'Mint Condition', icon: Gem },
    { id: 'Friendly UCian', label: 'Friendly UCian', icon: Users },
    { id: 'Safety Conscious', label: 'Safety Conscious', icon: ShieldCheck },
    { id: 'Fast Responder', label: 'Fast Responder', icon: MessageSquare }
  ];

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((b) => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('Log In Required', 'Please log in to submit a student review.', 'warning');
      return;
    }

    if (!targetUserId) {
      showToast('Missing Student Info', 'Could not find the other student profile. Please refresh the page and try again.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsService.createReview({
        transactionId: meetup.id,
        targetUserId,
        rating,
        comment: comment.trim(),
        itemTitle: meetup.listingTitle,
        tradeType: meetup.tradeMode,
        wasPunctual: selectedBadges.includes('Super Punctual'),
        traitBadges: selectedBadges
      });

      showToast(
        'Review Submitted!',
        `Thank you! You awarded ${rating} stars and ${selectedBadges.length} trait badges to ${targetUserName}.`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Review Failed', err?.message || 'Failed to submit review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingFeedback = () => {
    switch (rating) {
      case 5:
        return { label: 'Excellent / Highly Recommended', icon: Award, color: '#002B7F' };
      case 4:
        return { label: 'Great Campus Trade', icon: ThumbsUp, color: '#059669' };
      case 3:
        return { label: 'Satisfactory Experience', icon: Smile, color: '#0284C7' };
      case 2:
        return { label: 'Needs Improvement', icon: AlertTriangle, color: '#D97706' };
      case 1:
      default:
        return { label: 'Poor Experience', icon: AlertTriangle, color: '#DC2626' };
    }
  };

  const feedback = getRatingFeedback();
  const FeedbackIcon = feedback.icon;

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
          maxWidth: '480px',
          padding: '1.75rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>
              Review Trade with {targetUserName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', margin: '2px 0 0 0' }}>
              Item: {meetup.listingTitle} ({meetup.campus})
            </p>
          </div>

          <button onClick={handleClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Star Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Rate your overall campus trade experience:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= rating ? '#FFC72C' : 'var(--border-strong, #CBD5E1)',
                    padding: '0.2rem',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Star size={32} fill={star <= rating ? '#FFC72C' : 'none'} />
                </button>
              ))}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 800, color: feedback.color }}>
              <FeedbackIcon size={16} />
              <span>{feedback.label}</span>
            </div>
          </div>

          {/* Trait Badges with SVG Icons */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Award Peer Reputation Badges:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableBadges.map((badge) => {
                const isSelected = selectedBadges.includes(badge.id);
                const BadgeIcon = badge.icon;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggleBadge(badge.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 800 : 600,
                      backgroundColor: isSelected ? 'var(--uc-blue-subtle)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--uc-blue)' : 'var(--text-muted)',
                      border: isSelected ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BadgeIcon size={14} color={isSelected ? 'var(--uc-blue)' : 'var(--text-muted)'} />
                    <span>{badge.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Text */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Feedback / Notes for Fellow UCians:
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review..."
              className="clean-input"
              style={{ resize: 'none' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold"
            style={{ padding: '0.75rem', width: '100%', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Submitting Review...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Submit Verified Student Review</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
