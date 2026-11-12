import React, { useState } from 'react';
import { useFlashMarket } from '../../context/FlashMarketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus } from '../../types';
import { DragDropUpload } from '../common/DragDropUpload';
import { CategoryDropdown } from '../common/CategoryDropdown';
import { CampusDropdown } from '../common/CampusDropdown';
import {
  X,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  HelpCircle,
  Gift,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Camera,
  MapPin,
  Check
} from 'lucide-react';

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

  // Wizard Step State (1: Item & Campus, 2: Budget & Urgency, 3: Photo & Confirm)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [itemTitle, setItemTitle] = useState('');
  const [category, setCategory] = useState('Textbooks & Reviewers');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [preferredCampus, setPreferredCampus] = useState<Campus>(currentUser?.campus || 'UC Main');

  const [priceMode, setPriceMode] = useState<FlashPriceMode>('fixed');
  const [targetBudget, setTargetBudget] = useState<number | ''>('');
  const [urgency, setUrgency] = useState<'Immediate / Urgent' | 'This Week' | 'Flexible'>('Immediate / Urgent');
  const [durationHours, setDurationHours] = useState<number>(24);

  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const handleClose = React.useCallback(() => {
    if (isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      setCurrentStep(1);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      onClose();
    }, 200);
  }, [isSubmitting, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setCurrentStep(1);
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

  // Step 1 Validation & Next
  const handleNextToStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!itemTitle.trim()) {
      showToast('Item Name Required', 'Please specify what item or gear you are looking for.', 'warning');
      return;
    }
    if ((category === 'Other' || isCustomCategory) && !customCategoryName.trim()) {
      showToast('Category Required', 'Please type your custom category name.', 'warning');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Next
  const handleNextToStep3 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (priceMode === 'fixed') {
      if (targetBudget === '' || isNaN(Number(targetBudget)) || Number(targetBudget) < 0) {
        showToast('Target Budget Required', 'Please enter your proposed budget amount in PHP.', 'warning');
        return;
      }
    }
    setCurrentStep(3);
  };

  // Final Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      showToast('Title Required', 'Please enter the item name.', 'warning');
      setCurrentStep(1);
      return;
    }

    let budgetValue = 0;
    if (priceMode === 'fixed') {
      if (targetBudget === '' || isNaN(Number(targetBudget)) || Number(targetBudget) < 0) {
        showToast('Budget Required', 'Please enter a target budget amount.', 'warning');
        setCurrentStep(2);
        return;
      }
      budgetValue = Number(targetBudget);
    } else {
      budgetValue = 0;
    }

    const priceLabel = priceMode === 'free' ? ' [FREE Donation Request]' : priceMode === 'negotiable' ? ' [Open to Offers]' : '';

    let finalCategory = category;
    if (category === 'Other' || isCustomCategory) {
      finalCategory = customCategoryName.trim();
      if (!finalCategory) {
        showToast('Category Required', 'Please enter your custom category name.', 'warning');
        setCurrentStep(1);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addRequest({
        itemTitle: `${itemTitle.trim()}${priceLabel}`,
        category: finalCategory,
        urgency,
        preferredCampus,
        targetBudget: budgetValue,
        description: description.trim() || `Urgent flash request for ${itemTitle} at ${preferredCampus}.`,
        durationHours,
        imageUrl: images[0] || undefined
      });

      showToast('Flash Request Posted!', 'Broadcasted live to fellow UC students.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to post flash request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Item & Campus', desc: 'Item details' },
    { num: 2, title: 'Budget & Urgency', desc: 'Price & timeframe' },
    { num: 3, title: 'Review & Broadcast', desc: 'Photo & confirm' }
  ];

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
          width: '92vw',
          maxHeight: '92vh',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          boxShadow: '0 20px 40px rgba(0, 43, 127, 0.22), 0 4px 12px rgba(0, 0, 0, 0.12)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Unified Blue Brand */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--uc-blue, #002B7F)',
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
                border: '1.5px solid #FFC72C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFC72C',
                flexShrink: 0
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Post a Flash Request
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#CBD5E1', margin: '2px 0 0' }}>
                Broadcast urgent item needs to fellow UC students in real time
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="modal-close-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF'
            }}
            title="Close dialog (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sequential Step Progress Indicator */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          {stepsList.map((s, idx) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => {
                    if (s.num < currentStep) setCurrentStep(s.num as any);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: s.num < currentStep ? 'pointer' : 'default',
                    minWidth: 0
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted
                        ? '#059669'
                        : isActive
                        ? 'var(--uc-blue, #002B7F)'
                        : 'var(--border-subtle, #E2E8F0)',
                      color: isCompleted || isActive ? '#FFFFFF' : 'var(--text-muted, #64748B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {isCompleted ? <Check size={13} /> : s.num}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isActive
                          ? 'var(--uc-blue, #002B7F)'
                          : isCompleted
                          ? '#059669'
                          : 'var(--text-muted, #64748B)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {s.title}
                    </div>
                  </div>
                </div>

                {idx < stepsList.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: currentStep > s.num ? '#059669' : 'var(--border-subtle, #E2E8F0)',
                      borderRadius: '2px',
                      minWidth: '15px'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: ITEM & CAMPUS */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  What item are you looking for? *
                </label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Casio FX-991CW Calculator, Level 2 Scrub Suit (M), Purposive Comm Book"
                  className="clean-input"
                  style={{ fontSize: '0.88rem', padding: '0.65rem 0.85rem' }}
                  autoFocus
                  required
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNextToStep2();
                    }
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Be clear and specific so peers in your college know right away.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Category *
                </label>
                <CategoryDropdown
                  value={isCustomCategory ? 'Other' : category}
                  customValue={customCategoryName}
                  onChange={(cat, isCustom) => {
                    if (isCustom || cat === 'Other') {
                      setIsCustomCategory(true);
                      setCategory('Other');
                    } else {
                      setIsCustomCategory(false);
                      setCategory(cat);
                    }
                  }}
                  onCustomChange={(val) => setCustomCategoryName(val)}
                  allowCustom={true}
                  placeholder="Choose an item category"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Preferred UC Campus *
                </label>
                <CampusDropdown
                  value={preferredCampus}
                  onChange={(c: any) => setPreferredCampus(c)}
                  placeholder="Choose your preferred campus meetup location"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Flash alerts prioritize peers enrolled or active near this campus.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET & URGENCY */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Target Budget Mode *
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Fixed, negotiable, or free
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { id: 'fixed' as const, label: 'Target Budget', icon: <Tag size={14} />, badge: '₱ Amount' },
                    { id: 'negotiable' as const, label: 'Open to Offers', icon: <HelpCircle size={14} />, badge: 'Negotiable' },
                    { id: 'free' as const, label: 'Free / Donation', icon: <Gift size={14} />, badge: '₱0 Gift' }
                  ].map((m) => {
                    const active = priceMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPriceMode(m.id)}
                        style={{
                          padding: '0.65rem 0.4rem',
                          borderRadius: '10px',
                          fontSize: '0.76rem',
                          fontWeight: active ? 800 : 600,
                          backgroundColor: active ? 'var(--uc-blue, #002B7F)' : 'var(--bg-subtle, #F8FAFC)',
                          color: active ? '#FFFFFF' : 'var(--text-primary, #475569)',
                          border: active ? '1.5px solid var(--uc-blue, #002B7F)' : '1px solid var(--border-subtle, #E2E8F0)',
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
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        ₱
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={targetBudget}
                        onChange={(e) => setTargetBudget(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        placeholder="Enter your target budget (e.g. 250)"
                        className="clean-input"
                        style={{ paddingLeft: '1.95rem', fontSize: '0.88rem' }}
                        autoFocus
                        required
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextToStep3();
                          }
                        }}
                      />
                    </div>
                    {/* Quick chip presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick:</span>
                      {[50, 100, 200, 350, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTargetBudget(amt)}
                          style={{
                            padding: '0.22rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: targetBudget === amt ? '#EBF1FC' : 'var(--bg-subtle, #F1F5F9)',
                            color: targetBudget === amt ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                            border: targetBudget === amt ? '1px solid #BCD1F7' : '1px solid var(--border-subtle, #E2E8F0)',
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
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '0.76rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <HelpCircle size={15} style={{ flexShrink: 0 }} />
                    <span>Open to peer offers. Classmates will message their price directly on encrypted chat.</span>
                  </div>
                )}

                {priceMode === 'free' && (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '0.76rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Gift size={15} style={{ flexShrink: 0 }} />
                    <span>Looking for a free passed-down student reviewer, surplus notes, or study aid (₱0).</span>
                  </div>
                )}
              </div>

              {/* Urgency Level */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Urgency & Expiration Window *
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Auto-expires after time
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    {
                      label: 'Immediate / Urgent' as const,
                      title: 'Urgent',
                      hours: 24,
                      windowLabel: '24 Hours',
                      icon: <AlertCircle size={14} />,
                      color: '#DC2626',
                      bg: '#FEF2F2',
                      border: '#FECACA'
                    },
                    {
                      label: 'This Week' as const,
                      title: 'This Week',
                      hours: 72,
                      windowLabel: '3 Days (72h)',
                      icon: <Clock size={14} />,
                      color: '#D97706',
                      bg: '#FFFBEB',
                      border: '#FDE68A'
                    },
                    {
                      label: 'Flexible' as const,
                      title: 'Flexible',
                      hours: 168,
                      windowLabel: '7 Days',
                      icon: <CheckCircle2 size={14} />,
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
                          padding: '0.65rem 0.4rem',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: selected ? 800 : 600,
                          cursor: 'pointer',
                          border: selected ? `2px solid ${opt.color}` : '1px solid var(--border-subtle, #E2E8F0)',
                          backgroundColor: selected ? opt.bg : 'var(--bg-surface, #FFFFFF)',
                          color: selected ? opt.color : 'var(--text-muted, #64748B)',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {opt.icon}
                          <span>{opt.title}</span>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: selected ? 1 : 0.8 }}>
                          {opt.windowLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTO & CONFIRM */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Item Reference Photo (Optional)
                </label>
                <DragDropUpload
                  images={images}
                  onChange={setImages}
                  maxFiles={1}
                  isMultiple={false}
                  acceptVideos={false}
                  label=""
                  helperText="Upload sample photo of the exact book edition, uniform style, or calculator model."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify preferred campus meetup spot (e.g. Near Library, Main Gate, Student Lounge)..."
                  className="clean-input"
                  style={{ resize: 'none', fontSize: '0.82rem' }}
                />
              </div>

              {/* Review summary preview card */}
              <div
                style={{
                  padding: '0.75rem 0.95rem',
                  borderRadius: '12px',
                  backgroundColor: '#EBF1FC',
                  border: '1px solid #BCD1F7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Flash Request Summary
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Zap size={12} />
                    {durationHours === 24 ? 'Expires in 24h' : durationHours === 72 ? 'Expires in 3 days' : 'Expires in 7 days'}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {itemTitle}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--uc-blue, #002B7F)' }}>
                    {priceMode === 'free' ? 'FREE (₱0)' : priceMode === 'negotiable' ? 'Open to Offers' : `Target: ₱${targetBudget}`}
                  </span>
                  <span style={{ color: '#94A3B8' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {preferredCampus}
                  </span>
                  <span style={{ color: '#94A3B8' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isCustomCategory ? customCategoryName : category}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Footer Controls */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              className="btn-neutral"
              style={{
                padding: '0.65rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '10px'
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="btn-neutral"
              style={{
                padding: '0.65rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '10px'
              }}
            >
              Cancel
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => handleNextToStep2()}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '10px'
                }}
              >
                <span>Continue to Budget</span>
                <ArrowRight size={15} />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => handleNextToStep3()}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '10px'
                }}
              >
                <span>Review & Finalize</span>
                <ArrowRight size={15} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-gold"
                style={{
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '10px'
                }}
              >
                <Zap size={16} />
                <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast Flash Request'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
