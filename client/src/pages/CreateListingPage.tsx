import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useToast } from '../components/common/Toast';
import { DragDropUpload } from '../components/common/DragDropUpload';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { TradeMode, ConditionGrade } from '../types';
import {
  ShoppingBag,
  Film,
  Tag,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Gift,
  ArrowLeftRight,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  X,
  Sparkles as _Sparkles,
  MapPin,
  Check
} from 'lucide-react';

interface CreateListingPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
}

const CATEGORY_OPTIONS = [
  'Electronics & Gadgets',
  'College Textbooks & Reviewers',
  'Uniforms, PE Attire & Scrubs',
  'Scientific Calculators & Tools',
  'Drafting, Art & Lab Supplies',
  'Fashion & Sneakers',
  'Music & Instruments',
  'Gaming & PC Gear',
  'Dorm & Appliances',
  'Hobbies & Collectibles',
  'General Campus Item'
];

export const CreateListingPage: React.FC<CreateListingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { addListing } = useMarket();
  const { showToast } = useToast();

  // Wizard Step (1: Details, 2: Media, 3: Pricing, 4: Preview)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [condition, setCondition] = useState<ConditionGrade>('Gently Used');
  const [quantity, setQuantity] = useState<number>(1);
  const [tradeMode, setTradeMode] = useState<TradeMode>('buy_sell');
  const [price, setPrice] = useState<number>(0);
  const [originalSrp, setOriginalSrp] = useState<number>(0);
  const [swapPreference, setSwapPreference] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const isDirty = Boolean(title.trim() || description.trim() || images.length > 0 || customTagInput.trim() || price > 0);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!title.trim() || title.trim().length < 5) {
        showToast('Title Too Short', 'Item title must be at least 5 characters long.', 'warning');
        return false;
      }
      if (description.trim().length < 10) {
        showToast('Description Required', 'Please provide at least 10 characters describing the item.', 'warning');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (images.length === 0) {
        showToast('Media Required', 'Please upload at least 1 clear photo or video of the item.', 'warning');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (tradeMode === 'buy_sell' && price <= 0) {
        showToast('Price Required', 'Please set a valid price in PHP or choose Free Gift.', 'warning');
        return false;
      }
      if (tradeMode === 'swap' && !swapPreference.trim()) {
        showToast('Swap Preference Required', 'Please specify what item you want in exchange.', 'warning');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onNavigate('marketplace');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const newListing = await addListing({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        price: tradeMode === 'free_donation' ? 0 : price,
        originalSrp: originalSrp > 0 ? originalSrp : (tradeMode === 'free_donation' ? 0 : price),
        condition,
        quantity: Math.max(1, quantity),
        tradeMode,
        swapPreference: tradeMode === 'swap' ? swapPreference.trim() : undefined,
        images,
        media: images.map((url, idx) => ({
          url,
          mediaType: (url.match(/\.(mp4|webm|mov|mkv)$/i) || url.includes('/video/upload/')) ? 'video' : 'image',
          isPrimary: idx === 0
        })),
        tags: tags.length > 0 ? tags.slice(0, 10) : [category.split(' ')[0] || 'Campus'],
        sellerId: currentUser?.id,
        sellerName: currentUser?.name,
        sellerAvatar: currentUser?.avatar,
        sellerCampus: currentUser?.campus,
        sellerCollege: currentUser?.college,
        sellerIsVerified: currentUser?.isVerified,
        sellerTrustScore: currentUser?.trustScore,
        isBoosted: false
      });

      showToast('Listing Published!', `"${newListing.title}" is now active in the campus catalog.`, 'success');
      onNavigate('item-detail', { id: newListing.id });
    } catch (err: any) {
      const msg = err?.message || 'Failed to post item listing.';
      if (msg.toLowerCase().includes('verif')) {
        showToast('Verification Required', 'Please complete your student ID verification before posting.', 'warning');
        setIsVerificationModalOpen(true);
      } else {
        showToast('Posting Failed', msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="container page-enter" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '560px' }}>
        <div className="clean-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Sign In Required to Post Items
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55, marginTop: '0.45rem' }}>
              To keep our University of Cebu marketplace safe and verified, students must log in before listing items for sale or barter.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onNavigate('home');
              }}
              className="btn-gold"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.88rem', fontWeight: 800 }}
            >
              Log In to TradeLink
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPendingVerification = !currentUser.isVerified && (currentUser.verificationStatus === 'pending' || !!currentUser.idPhotoUrl);

  if (currentUser && !currentUser.isVerified) {
    if (isPendingVerification) {
      return (
        <div className="container page-enter" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '580px' }}>
          <div className="clean-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0, 43, 127, 0.08)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                Verification Request In Review
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.55 }}>
                Your student ID and live selfie are currently under review by campus moderators. Once verified, you can immediately post listings across all UC campuses.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <button
                onClick={() => onNavigate('profile')}
                className="btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem', fontWeight: 800 }}
              >
                View Profile Status
              </button>
              <button
                onClick={() => onNavigate('marketplace')}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
              >
                Browse Catalog
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container page-enter" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '580px' }}>
        <div className="clean-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255, 199, 44, 0.2)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
              Student ID Verification Required
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.55 }}>
              To maintain a verified, scam-free student exchange environment, creating listings requires an active University of Cebu student badge.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="btn-gold"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.88rem', fontWeight: 800 }}
            >
              Verify Student ID Now
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              Browse Catalog
            </button>
          </div>
        </div>
        <StudentVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
        />
      </div>
    );
  }

  const stepsConfig = [
    { num: 1, label: 'Item Details', icon: <ShoppingBag size={15} /> },
    { num: 2, label: 'Photos & Media', icon: <Film size={15} /> },
    { num: 3, label: 'Pricing & Mode', icon: <Tag size={15} /> },
    { num: 4, label: 'Preview & Post', icon: <Eye size={15} /> }
  ];

  return (
    <div className="container page-enter" style={{ maxWidth: '760px', padding: '2rem 1.25rem 5rem 1.25rem' }}>
      {/* Header Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={handleCancel}
          className="btn-ghost"
          style={{
            padding: '0.3rem 0.6rem',
            fontSize: '0.82rem',
            marginBottom: '0.4rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Catalog
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', margin: 0 }}>
              Create a Listing
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #64748B)', marginTop: '0.2rem' }}>
              Publish your items to verified students across UC campuses.
            </p>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)' }}>
            Step {currentStep} of 4
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.75rem'
        }}
      >
        {stepsConfig.map((s) => {
          const isCompleted = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (isCompleted) setCurrentStep(s.num as any);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                backgroundColor: isCurrent ? 'var(--uc-blue)' : isCompleted ? '#F1F5F9' : '#FAFAFA',
                color: isCurrent ? '#FFFFFF' : isCompleted ? 'var(--uc-blue)' : '#94A3B8',
                border: isCurrent ? '1.5px solid var(--uc-blue)' : '1px solid #E2E8F0',
                cursor: isCompleted ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: isCurrent ? 'var(--uc-gold)' : isCompleted ? 'var(--uc-blue)' : '#CBD5E1',
                  color: isCurrent ? '#002B7F' : '#FFFFFF',
                  flexShrink: 0
                }}
              >
                {isCompleted ? <Check size={12} /> : s.num}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: ITEM DETAILS */}
      {currentStep === 1 && (
        <div className="clean-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.75rem' }}>
            <ShoppingBag size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Step 1: Item Details
            </h3>
          </div>

          {/* Title */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Item Title *
              </label>
              <span style={{ fontSize: '0.72rem', color: title.length > 190 ? '#DC2626' : title.length > 0 && title.length < 5 ? '#EA580C' : 'var(--text-muted)' }}>
                {title.length}/200 {title.length > 0 && title.length < 5 ? '(min 5 chars)' : ''}
              </span>
            </div>
            <input
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio FX-991CW Calculator, BSN Scrubs (Medium), Java Programming 8th Ed."
              className="clean-input"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="clean-input"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Grade */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Condition Grade *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {(['Brand New', 'Like New', 'Gently Used', 'Fair / Academic Usable'] as ConditionGrade[]).map((cond) => {
                const isSelected = condition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    style={{
                      padding: '0.55rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 800 : 600,
                      backgroundColor: isSelected ? 'var(--uc-blue)' : 'var(--bg-subtle, #F8FAFC)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      border: isSelected ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle, #E2E8F0)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Quantity Available *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid var(--border-subtle, #CBD5E1)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  style={{ width: '38px', height: '38px', border: 'none', backgroundColor: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '55px', height: '38px', border: 'none', textAlign: 'center', fontWeight: 800, color: 'var(--uc-blue)' }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  style={{ width: '38px', height: '38px', border: 'none', backgroundColor: '#F8FAFC', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {quantity === 1 ? '1 unit (will mark as Sold once settled)' : `${quantity} units in stock`}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Item Description *
              </label>
              <span style={{ fontSize: '0.72rem', color: description.length > 4900 ? '#DC2626' : description.length > 0 && description.length < 10 ? '#EA580C' : 'var(--text-muted)' }}>
                {description.length}/5000 {description.length > 0 && description.length < 10 ? '(min 10 chars)' : ''}
              </span>
            </div>
            <textarea
              rows={4}
              value={description}
              maxLength={5000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail item condition, book edition, inclusions (e.g., charger, pouch, stylus), and reasons for selling..."
              className="clean-input"
              style={{ fontSize: '0.84rem' }}
              required
            />
          </div>
        </div>
      )}

      {/* STEP 2: PHOTOS & MEDIA */}
      {currentStep === 2 && (
        <div className="clean-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.75rem' }}>
            <Film size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Step 2: Media & Product Demonstration
            </h3>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Photos & Optional Product Video *
              </label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: images.length === 0 ? '#DC2626' : 'var(--accent-green, #059669)' }}>
                {images.length}/10 uploaded {images.length === 0 ? '(at least 1 required)' : ''}
              </span>
            </div>
            <DragDropUpload
              images={images}
              onChange={setImages}
              maxFiles={10}
              acceptVideos={true}
              label=""
              helperText="Upload up to 10 photos or sample videos (PNG, JPG, WEBP, MP4 up to 50MB). The 1st photo is used as thumbnail."
              isMultiple={true}
            />
          </div>

          <div style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', border: '1px solid rgba(0, 43, 127, 0.15)', borderRadius: '10px', padding: '0.9rem 1.1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={20} color="var(--uc-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--uc-blue)', margin: '0 0 0.2rem 0' }}>
                Authentic Campus Media Guidelines
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                Upload actual photos of your items on campus desks or lockers. Items with realistic photos and condition videos receive 3x more campus trade responses and pass moderation faster.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PRICING & TRADE MODE */}
      {currentStep === 3 && (
        <div className="clean-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.75rem' }}>
            <Tag size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Step 3: Pricing & Trade Mode
            </h3>
          </div>

          {/* Trade Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Trade Mode *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              {[
                { id: 'buy_sell', label: 'For Sale', desc: 'Direct cash / e-wallet sale', icon: <ShoppingBag size={16} /> },
                { id: 'swap', label: 'Barter Swap', desc: 'Exchange for other items', icon: <ArrowLeftRight size={16} /> },
                { id: 'free_donation', label: 'Free Gift', desc: 'Pay-it-forward donation', icon: <Gift size={16} /> }
              ].map((mode) => {
                const isSelected = tradeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTradeMode(mode.id as TradeMode)}
                    style={{
                      padding: '0.75rem 0.65rem',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'var(--uc-blue-subtle)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--uc-blue)' : 'var(--text-secondary)',
                      border: isSelected ? '2px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, fontSize: '0.86rem' }}>
                      {mode.icon}
                      <span>{mode.label}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mode.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing fields if buy_sell */}
          {tradeMode === 'buy_sell' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Selling Price (PHP) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--uc-blue)' }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    value={price || ''}
                    onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="clean-input"
                    style={{ paddingLeft: '1.85rem', fontWeight: 800, fontSize: '1rem', color: 'var(--uc-blue)' }}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Original SRP / Store Price (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    value={originalSrp || ''}
                    onChange={(e) => setOriginalSrp(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="clean-input"
                    style={{ paddingLeft: '1.85rem', fontSize: '0.95rem' }}
                    placeholder="e.g. 1500"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Discount badge preview */}
          {tradeMode === 'buy_sell' && originalSrp > price && price > 0 && (
            <div style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>Great Student Deal: <strong>{Math.round(((originalSrp - price) / originalSrp) * 100)}% off</strong> original store price!</span>
            </div>
          )}

          {/* Swap details if swap */}
          {tradeMode === 'swap' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Item(s) Desired in Exchange *
              </label>
              <input
                type="text"
                value={swapPreference}
                onChange={(e) => setSwapPreference(e.target.value)}
                placeholder="e.g. Scientific Calculator FX-991, Architecture T-Square, or Open to any offer"
                className="clean-input"
                required
              />
            </div>
          )}

          {/* Free Donation note */}
          {tradeMode === 'free_donation' && (
            <div style={{ backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gift size={18} />
              <span>This listing is marked as a <strong>Free Campus Gift (₱0)</strong> to support fellow University of Cebu peers.</span>
            </div>
          )}

          {/* Tags */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Search Tags (Max 10)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: tags.length > 0 ? '0.5rem' : '0' }}>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                disabled={tags.length >= 10}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customTagInput.trim() && !tags.includes(customTagInput.trim()) && tags.length < 10) {
                      setTags([...tags, customTagInput.trim().replace(/^#/, '')]);
                      setCustomTagInput('');
                    }
                  }
                }}
                placeholder={tags.length >= 10 ? 'Limit 10 tags reached' : 'Type keyword (e.g. midterm, ccs, scrubs) and press Enter'}
                className="clean-input"
                style={{ fontSize: '0.84rem' }}
              />
              <button
                type="button"
                disabled={tags.length >= 10 || !customTagInput.trim()}
                onClick={() => {
                  if (customTagInput.trim() && !tags.includes(customTagInput.trim()) && tags.length < 10) {
                    setTags([...tags, customTagInput.trim().replace(/^#/, '')]);
                    setCustomTagInput('');
                  }
                }}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}
              >
                Add Tag
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--uc-blue-subtle)',
                      color: 'var(--uc-blue)',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((tag) => tag !== t))}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW & PUBLISH */}
      {currentStep === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Eye size={18} color="var(--uc-blue)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Step 4: Live Marketplace Preview
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                This is how your item appears to buyers on campus.
              </span>
            </div>

            {/* Live Preview Card */}
            <div
              style={{
                maxWidth: '340px',
                margin: '0 auto',
                borderRadius: '16px',
                border: '1.5px solid var(--border-subtle, #E2E8F0)',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(0, 43, 127, 0.08)'
              }}
            >
              {/* Media preview */}
              <div style={{ height: '200px', backgroundColor: '#0F172A', position: 'relative' }}>
                {images.length > 0 ? (
                  images[0].match(/\.(mp4|webm|mov|mkv)$/i) ? (
                    <video src={images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={images[0]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                    No image uploaded
                  </div>
                )}
                {/* Trade Mode Pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: tradeMode === 'swap' ? 'var(--uc-blue)' : tradeMode === 'free_donation' ? '#059669' : 'rgba(15, 23, 42, 0.85)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  {tradeMode === 'buy_sell' ? 'For Sale' : tradeMode === 'swap' ? 'Barter Swap' : 'Free Gift'}
                </div>
                {/* Campus Pill */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    color: 'var(--uc-blue)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <MapPin size={11} /> {currentUser.campus}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{category}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                    {condition}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {title || 'Item Title Preview'}
                </h4>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                  <div>
                    {tradeMode === 'buy_sell' ? (
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
                        ₱{price.toLocaleString()}
                      </span>
                    ) : tradeMode === 'swap' ? (
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                        ⇄ Swap: {swapPreference || 'Open'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                        FREE (₱0)
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Qty: {quantity}
                  </span>
                </div>

                {/* Seller snippet */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 800, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={11} />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle, #E2E8F0)'
        }}
      >
        <div>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.86rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="btn-ghost"
              style={{ padding: '0.65rem 1rem', fontSize: '0.84rem' }}
            >
              Discard
            </button>
          )}
        </div>

        <div>
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-gold"
              style={{
                padding: '0.65rem 1.6rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Next Step</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="btn-gold"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(255, 199, 44, 0.35)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <Tag size={16} />
                  <span>Publish Listing to Catalog</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Listing Draft?"
        message="You have unsaved changes in this listing wizard. Leaving now will discard your entered data."
        confirmText="Discard Draft"
        cancelText="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onNavigate('marketplace');
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
};
