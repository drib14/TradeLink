import React, { useState } from 'react';
import { useFlashMarket } from '../../context/FlashMarketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus } from '../../types';
import { X, Zap, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CreateFlashRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFlashRequestModal: React.FC<CreateFlashRequestModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const { addRequest } = useFlashMarket();
  const { showToast } = useToast();

  const [itemTitle, setItemTitle] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [targetBudget, setTargetBudget] = useState(500);
  const [urgency, setUrgency] = useState<'Immediate / Urgent' | 'This Week' | 'Flexible'>('Immediate / Urgent');
  const [durationHours, setDurationHours] = useState<number>(24);
  const [preferredCampus, setPreferredCampus] = useState<Campus>(currentUser?.campus || 'UC Main');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      showToast('Title Required', 'Please enter the item name.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await addRequest({
        itemTitle: itemTitle.trim(),
        category,
        targetBudget,
        urgency,
        durationHours,
        description: description.trim() || `Looking for ${itemTitle} in ${preferredCampus}.`,
        preferredCampus
      });

      showToast('Flash Request Posted!', `"${itemTitle}" is now live on the Flash Market.`, 'success');
      onClose();
      setItemTitle('');
      setDescription('');
    } catch (err: any) {
      showToast('Posting Failed', err?.message || 'Unable to post flash request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop-custom"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-card-custom"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Flash Market styling */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #002B7F 0%, #001D59 100%)',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 199, 44, 0.2)',
                border: '1px solid #FFC72C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFC72C'
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Post a Flash Request
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#CBD5E1', margin: '2px 0 0' }}>
                Need an item urgently? Broadcast to campus students now.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
              What item are you looking for? *
            </label>
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="e.g. Nursing Scrub Set (Medium), CAS Reviewer..."
              className="clean-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.82rem', color: '#0F172A', outline: 'none' }}
              >
                <option value="Textbooks">Textbooks & Reviewers</option>
                <option value="Electronics">Electronics & Calculators</option>
                <option value="Uniforms & Gear">Uniforms & Scrubs</option>
                <option value="Instruments">Instruments & Tools</option>
                <option value="Fashion">Fashion & Shoes</option>
                <option value="Dorm">Dorm & Supplies</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                Target Budget (₱) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={targetBudget}
                onChange={(e) => setTargetBudget(Number(e.target.value))}
                className="clean-input"
                required
              />
            </div>
          </div>

          {/* Urgency Level connected dynamically to expiration window */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                Urgency Level *
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Expiration dynamically set by urgency
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                {
                  label: 'Immediate / Urgent' as const,
                  title: 'Immediate / Urgent',
                  hours: 24,
                  windowLabel: '24 Hours (Urgent)',
                  helper: 'Active for 24h on the Flash board, then automatically disabled.',
                  icon: <AlertCircle size={13} />,
                  color: '#DC2626',
                  bg: '#FEF2F2',
                  border: '#FECACA'
                },
                {
                  label: 'This Week' as const,
                  title: 'This Week',
                  hours: 72,
                  windowLabel: '3 Days / 72 Hours',
                  helper: 'Active for 72h across campus, then automatically disabled.',
                  icon: <Clock size={13} />,
                  color: '#D97706',
                  bg: '#FFFBEB',
                  border: '#FDE68A'
                },
                {
                  label: 'Flexible' as const,
                  title: 'Flexible',
                  hours: 168,
                  windowLabel: '7 Days / 168 Hours',
                  helper: 'Active for 7 days, then automatically disabled.',
                  icon: <CheckCircle2 size={13} />,
                  color: '#059669',
                  bg: '#ECFDF5',
                  border: '#A7F3D0'
                }
              ].map((opt) => {
                const selected = urgency === opt.label;
                return (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => {
                      setUrgency(opt.label);
                      setDurationHours(opt.hours);
                    }}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: selected ? 800 : 600,
                      cursor: 'pointer',
                      border: selected ? `2px solid ${opt.color}` : '1.5px solid #E2E8F0',
                      backgroundColor: selected ? opt.bg : '#FFFFFF',
                      color: selected ? opt.color : '#64748B',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {opt.icon}
                      <span>{opt.title}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: selected ? 1 : 0.75 }}>
                      {opt.hours === 24 ? '24h' : opt.hours === 72 ? '72h (3d)' : '7d'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
              Preferred UC Campus
            </label>
            <select
              value={preferredCampus}
              onChange={(e: any) => setPreferredCampus(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.82rem', color: '#0F172A', outline: 'none' }}
            >
              <option value="UC Main">UC Main</option>
              <option value="UC Banilad">UC Banilad</option>
              <option value="UC LM">UC LM</option>
              <option value="UC METC">UC METC</option>
              <option value="UC Pardo-Talisay">UC Pardo-Talisay</option>
              <option value="UC South Campus">UC South Campus</option>
              <option value="UC Medical Center">UC Medical Center</option>
              <option value="UC PRI">UC PRI</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify edition, condition preference, or preferred meetup spot..."
              className="clean-input"
              style={{ resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold"
            style={{
              padding: '0.75rem',
              width: '100%',
              fontSize: '0.88rem',
              fontWeight: 800,
              marginTop: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Zap size={16} />
            <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast Flash Request'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// Backward compatibility alias
export const CreateWantedModal = CreateFlashRequestModal;
