import React, { useState } from 'react';
import { useFlashMarket } from '../../context/FlashMarketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus } from '../../types';
import { DragDropUpload } from '../common/DragDropUpload';
import { X, Zap, CheckCircle2, Clock, AlertCircle, Tag, HelpCircle, Gift } from 'lucide-react';

interface CreateFlashRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type FlashPriceMode = 'fixed' | 'negotiable' | 'free';

export const CreateFlashRequestModal: React.FC<CreateFlashRequestModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const { addRequest } = useFlashMarket();
  const { showToast } = useToast();

  const [itemTitle, setItemTitle] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [priceMode, setPriceMode] = useState<FlashPriceMode>('fixed');
  const [targetBudget, setTargetBudget] = useState<number | ''>('');
  const [urgency, setUrgency] = useState<'Immediate / Urgent' | 'This Week' | 'Flexible'>('Immediate / Urgent');
  const [durationHours, setDurationHours] = useState<number>(24);
  const [preferredCampus, setPreferredCampus] = useState<Campus>(currentUser?.campus || 'UC Main');
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      showToast('Title Required', 'Please enter the item name.', 'warning');
      return;
    }

    let budgetValue = 0;
    if (priceMode === 'fixed') {
      if (targetBudget === '' || isNaN(Number(targetBudget)) || Number(targetBudget) < 0) {
        showToast('Budget Required', 'Please enter a target budget amount.', 'warning');
        return;
      }
      budgetValue = Number(targetBudget);
    } else if (priceMode === 'free') {
      budgetValue = 0;
    } else {
      budgetValue = 0;
    }

    const priceLabel = priceMode === 'free' ? ' [FREE Donation Request]' : priceMode === 'negotiable' ? ' [Open to Offers]' : '';

    setIsSubmitting(true);
    try {
      await addRequest({
        itemTitle: `${itemTitle.trim()}${priceLabel}`,
        category,
        urgency,
        preferredCampus,
        targetBudget: budgetValue,
        description: description.trim() || `Urgent request for ${itemTitle} in ${preferredCampus}.`,
        durationHours,
        imageUrl: images[0] || undefined
      });

      showToast('Flash Request Posted!', 'Campus peers have been notified.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to post flash request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
    >
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
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
            backgroundColor: '#002B7F',
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
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
              What item are you looking for? *
            </label>
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="Item name"
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
                Preferred Campus
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
          </div>

          {/* Pricing & Budget Mode */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                Pricing / Budget *
              </label>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                Accepts any amount, negotiable, or free
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.65rem' }}>
              {[
                { id: 'fixed' as const, label: 'Target Budget (₱)', icon: <Tag size={13} /> },
                { id: 'negotiable' as const, label: 'Open to Offers', icon: <HelpCircle size={13} /> },
                { id: 'free' as const, label: 'Free / Donation', icon: <Gift size={13} /> }
              ].map((m) => {
                const active = priceMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPriceMode(m.id)}
                    style={{
                      padding: '0.55rem 0.35rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: active ? 800 : 600,
                      backgroundColor: active ? '#002B7F' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#475569',
                      border: active ? '1.5px solid #002B7F' : '1.5px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m.icon}
                    <span style={{ textAlign: 'center', lineHeight: 1.15 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {priceMode === 'fixed' && (
              <div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B', fontSize: '0.9rem' }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    placeholder="Enter your target budget"
                    className="clean-input"
                    style={{ paddingLeft: '1.85rem' }}
                    required
                  />
                </div>
                {/* Quick chip presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Quick:</span>
                  {[50, 100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTargetBudget(amt)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: targetBudget === amt ? '#EBF1FC' : '#F1F5F9',
                        color: targetBudget === amt ? '#002B7F' : '#475569',
                        border: targetBudget === amt ? '1px solid #BCD1F7' : '1px solid #E2E8F0',
                        cursor: 'pointer'
                      }}
                    >
                      ₱{amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {priceMode === 'negotiable' && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '0.75rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <HelpCircle size={15} style={{ flexShrink: 0 }} />
                <span>Open to peer offers. Campus classmates can message you their suggested price on chat.</span>
              </div>
            )}

            {priceMode === 'free' && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '0.75rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Gift size={15} style={{ flexShrink: 0 }} />
                <span>Looking for a free student donation or passed-down study reviewer (₱0).</span>
              </div>
            )}
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
              Item Reference Photo (Optional)
            </label>
            <DragDropUpload
              images={images}
              onChange={setImages}
              maxFiles={1}
              isMultiple={false}
              acceptVideos={false}
              label=""
              helperText="Add a photo of the item you are looking for to display in explore and flash cards."
            />
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
