import React, { useState } from 'react';
import { MeetupTransaction, Campus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { X, Star, Sparkles, CheckCircle2, ShieldCheck, ThumbsUp } from 'lucide-react';

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
  const [wasPunctual, setWasPunctual] = useState(true);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['Super Punctual', 'Mint Condition']);

  if (!isOpen) return null;

  const targetUserName = currentUser.id === meetup.sellerId ? meetup.buyerName : meetup.sellerName;

  const availableBadges = [
    { id: 'Super Punctual', label: '⚡ Super Punctual' },
    { id: 'Mint Condition', label: '💎 Mint Condition' },
    { id: 'Friendly UCian', label: '🤝 Friendly UCian' },
    { id: 'Safety Conscious', label: '🛡️ Safety Conscious' },
    { id: 'Fast Responder', label: '💬 Fast Responder' }
  ];

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((b) => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    showToast(
      'Review Submitted!',
      `Thank you! You awarded ${rating} stars and ${selectedBadges.length} trait badges to ${targetUserName}.`,
      'success'
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 29, 89, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #BCD1F7',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 43, 127, 0.25)',
          padding: '1.75rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#002B7F' }}>
              Review Trade with {targetUserName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Item: {meetup.listingTitle} ({meetup.campus})
            </p>
          </div>

          <button onClick={onClose} style={{ color: '#64748B', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Star Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
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
                    color: star <= rating ? '#FFC72C' : '#CBD5E1',
                    padding: '0.2rem',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Star size={32} fill={star <= rating ? '#FFC72C' : 'none'} />
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#002B7F' }}>
              {rating === 5 && '🌟 Excellent / Highly Recommended'}
              {rating === 4 && '👍 Great Trade'}
              {rating === 3 && '👌 Satisfactory'}
              {rating === 2 && '⚠️ Needs Improvement'}
              {rating === 1 && '❌ Poor Experience'}
            </span>
          </div>

          {/* Trait Badges */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
              Award Reputation Badges:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {availableBadges.map((badge) => {
                const isSelected = selectedBadges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggleBadge(badge.id)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 800 : 500,
                      backgroundColor: isSelected ? '#EBF1FC' : '#FFFFFF',
                      color: isSelected ? '#002B7F' : '#64748B',
                      border: isSelected ? '1.5px solid #002B7F' : '1px solid #CBD5E1',
                      cursor: 'pointer'
                    }}
                  >
                    {badge.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Text */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
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

          <button type="submit" className="btn-gold" style={{ padding: '0.75rem', width: '100%', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> Submit Verified Student Review
          </button>
        </form>
      </div>
    </div>
  );
};
