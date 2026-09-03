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

  if (!isOpen) return null;

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
      showToast('Error', 'Counterpart student information missing.', 'error');
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
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '480px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Review Trade with {targetUserName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Item: {meetup.listingTitle} ({meetup.campus})
            </p>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
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
              placeholder="e.g. Arrived 5 minutes early at Banilad canteen, item was clean and functioning perfectly!"
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
