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
  Loader2,
  X,
  MapPin,
  Check,
  Sparkles
} from 'lucide-react';

export type PostingFormMode = 'sell' | 'swap';

interface CreateListingPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
  initialMode?: PostingFormMode;
}

const CATEGORY_OPTIONS = [
  'Electronics & Gadgets',
  'Textbooks & Reviewers',
  'Uniforms & Apparel',
  'Calculators & Electronics',
  'Fashion & Sneakers',
  'Music & Instruments',
  'Audio & Gadgets',
  'Dorm & Living',
  'Gaming & Tech',
  'Medical Equipment',
  'Junior High School Books & Reviewers',
  'Senior High Reviewers & Books',
  'General Supplies'
];

const SWAP_INSPIRATION_CHIPS = [
  'Open to any fair offer',
  'Casio FX-991CW Calculator',
  'Nursing Scrubs / PE Uniform',
  'Drafting Board & T-Square',
  'College Textbook / Reviewer',
  'USB-C Hub or Tech Gear'
];

export const CreateListingPage: React.FC<CreateListingPageProps> = ({
  onNavigate,
  onOpenAuth,
  initialMode = 'sell'
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { addListing } = useMarket();
  const { showToast } = useToast();

  // Active Posting Form Mode: 'sell' (Cash/E-Wallet sale) vs 'swap' (Cashless barter)
  const [formMode, setFormMode] = useState<PostingFormMode>(
    initialMode === 'swap' ? 'swap' : 'sell'
  );

  // Wizard Step (1: Details, 2: Media, 3: Pricing/Barter, 4: Preview)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [condition, setCondition] = useState<ConditionGrade>('Gently Used');
  const [quantity, setQuantity] = useState<number>(1);
  const [sellType, setSellType] = useState<'paid' | 'free'>('paid');
  const [price, setPrice] = useState<number | ''>('');
  const [originalSrp, setOriginalSrp] = useState<number | ''>('');
  const [swapPreference, setSwapPreference] = useState('');
  const [swapConditionNote, setSwapConditionNote] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Sync initialMode if passed or navigated
  useEffect(() => {
    if (initialMode && (initialMode === 'swap' || initialMode === 'sell')) {
      setFormMode(initialMode);
    }
  }, [initialMode]);

  const isDirty = Boolean(
    title.trim() ||
    description.trim() ||
    images.length > 0 ||
    customTagInput.trim() ||
    (Number(price) || 0) > 0 ||
    swapPreference.trim()
  );

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

  // Handle switching between Sell and Swap forms
  const handleModeSwitch = (newMode: PostingFormMode) => {
    if (newMode === formMode) return;
    setFormMode(newMode);
    if (newMode === 'swap') {
      setSellType('paid');
      setPrice(0);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!title.trim() || title.trim().length < 5) {
        showToast(
          'Title Too Short',
          formMode === 'sell'
            ? 'Item title must be at least 5 characters long.'
            : 'Please specify the item you are offering to swap (min 5 characters).',
          'warning'
        );
        return false;
      }
      if (description.trim().length < 10) {
        showToast('Description Required', 'Please provide at least 10 characters describing the item condition.', 'warning');
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
      if (formMode === 'sell') {
        if (sellType === 'paid' && (price === '' || Number(price) <= 0)) {
          showToast('Price Required', 'Please set a valid selling price in PHP or select Free Student Gift.', 'warning');
          return false;
        }
      } else {
        // Swap mode
        if (!swapPreference.trim() || swapPreference.trim().length < 3) {
          showToast('Swap Item Desired', 'Please specify what items or gear you would like in exchange.', 'warning');
          return false;
        }
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
      onNavigate(formMode === 'swap' ? 'swaps' : 'marketplace');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const computedTradeMode: TradeMode =
        formMode === 'swap'
          ? 'swap'
          : sellType === 'free'
          ? 'free_donation'
          : 'buy_sell';

      const computedPrice = computedTradeMode === 'buy_sell' ? (typeof price === 'number' ? price : 0) : 0;
      const numSrp = typeof originalSrp === 'number' ? originalSrp : 0;
      const computedSrp = computedTradeMode === 'buy_sell' ? (numSrp > 0 ? numSrp : computedPrice) : 0;

      const combinedSwapPreference =
        formMode === 'swap'
          ? swapConditionNote.trim()
            ? `${swapPreference.trim()} (${swapConditionNote.trim()})`
            : swapPreference.trim()
          : undefined;

      const newListing = await addListing({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        price: computedPrice,
        originalSrp: computedSrp,
        condition,
        quantity: Math.max(1, quantity),
        tradeMode: computedTradeMode,
        swapPreference: combinedSwapPreference,
        images,
        media: images.map((url, idx) => ({
          url,
          mediaType: (url.match(/\.(mp4|webm|mov|mkv)$/i) || url.includes('/video/upload/')) ? 'video' : 'image',
          isPrimary: idx === 0
        })),
        tags: tags.length > 0 ? tags.slice(0, 10) : [category.split(' ')[0] || 'Campus', formMode === 'swap' ? 'Swap' : 'ForSale'],
        sellerId: currentUser?.id,
        sellerName: currentUser?.name,
        sellerAvatar: currentUser?.avatar,
        sellerCampus: currentUser?.campus,
        sellerCollege: currentUser?.college,
        sellerIsVerified: currentUser?.isVerified,
        sellerTrustScore: currentUser?.trustScore
      });

      const successTitle = formMode === 'swap' ? 'Swap Offer Published!' : 'Listing Published for Sale!';
      const successMsg =
        formMode === 'swap'
          ? `"${newListing.title}" is now live in the Campus Swap Hub.`
          : `"${newListing.title}" is now active in the campus catalog.`;

      showToast(successTitle, successMsg, 'success');
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

  const stepsConfig = formMode === 'sell'
    ? [
        { num: 1, label: 'Item Details', icon: <ShoppingBag size={15} /> },
        { num: 2, label: 'Photos & Media', icon: <Film size={15} /> },
        { num: 3, label: 'Pricing & Value', icon: <Tag size={15} /> },
        { num: 4, label: 'Preview & Post', icon: <Eye size={15} /> }
      ]
    : [
        { num: 1, label: 'Item for Barter', icon: <ShoppingBag size={15} /> },
        { num: 2, label: 'Photos & Media', icon: <Film size={15} /> },
        { num: 3, label: 'Barter Terms', icon: <ArrowLeftRight size={15} /> },
        { num: 4, label: 'Preview & Post', icon: <Eye size={15} /> }
      ];

  return (
    <div className="container page-enter" style={{ maxWidth: '780px', padding: '2rem 1.25rem 5rem 1.25rem' }}>
      {/* Header Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
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
          <ChevronLeft size={16} /> Back to {formMode === 'swap' ? 'Campus Swaps' : 'Catalog'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', margin: 0 }}>
              {formMode === 'sell' ? 'Post Item for Sale' : 'Post Item for Swap (Barter)'}
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #64748B)', marginTop: '0.2rem' }}>
              {formMode === 'sell'
                ? 'List textbooks, electronics, or campus gear for direct cash or e-wallet sale.'
                : 'Offer an item for direct, cashless peer-to-peer student trade across UC campuses.'}
            </p>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)' }}>
            Step {currentStep} of 4
          </span>
        </div>
      </div>

      {/* Top-Level Posting Form Selector (Sell Form vs Swap Form) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF',
          padding: '0.5rem',
          borderRadius: '14px',
          border: '1.5px solid #E2E8F0',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0, 43, 127, 0.04)'
        }}
      >
        <button
          type="button"
          onClick={() => handleModeSwitch('sell')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: formMode === 'sell' ? '2px solid var(--uc-blue)' : '1px solid transparent',
            backgroundColor: formMode === 'sell' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
            color: formMode === 'sell' ? 'var(--uc-blue)' : '#64748B',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.88rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Tag size={17} />
          <span>Sell Item Form</span>
          {formMode === 'sell' && (
            <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--uc-blue)', color: '#FFFFFF', padding: '1px 6px', borderRadius: '10px', marginLeft: '2px' }}>
              Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('swap')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: formMode === 'swap' ? '2px solid var(--uc-blue)' : '1px solid transparent',
            backgroundColor: formMode === 'swap' ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
            color: formMode === 'swap' ? 'var(--uc-blue)' : '#64748B',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.88rem',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeftRight size={17} />
          <span>Swap Item Form</span>
          {formMode === 'swap' && (
            <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--uc-blue)', color: '#FFFFFF', padding: '1px 6px', borderRadius: '10px', marginLeft: '2px' }}>
              Active
            </span>
          )}
        </button>
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
              {formMode === 'sell' ? 'Step 1: Item Details for Sale' : 'Step 1: Details of Item Offered for Barter'}
            </h3>
          </div>

          {/* Title */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formMode === 'sell' ? 'Item Title *' : 'Item Offered for Swap *'}
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
              placeholder={
                formMode === 'sell'
                  ? 'e.g. Casio FX-991CW Calculator, BSN Scrubs (Medium), Java Programming 8th Ed.'
                  : 'e.g. Drafting Table A3 with Parallel Ruler, Nursing Med-Surg Reviewer 2025'
              }
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
              Current Condition Grade *
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
                {quantity === 1 ? '1 unit (will mark as settled once swapped or sold)' : `${quantity} units available`}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formMode === 'sell' ? 'Item Description *' : 'Description of Offered Item *'}
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
              placeholder={
                formMode === 'sell'
                  ? 'Detail item condition, book edition, inclusions (charger, stylus, pouch), and reason for selling...'
                  : 'Specify exact model, condition, any wear/tear, and inclusions you are handing over in the barter...'
              }
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
              Step 2: Media & Visual Verification
            </h3>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formMode === 'sell' ? 'Item Photos & Video *' : 'Photos of Item Being Offered *'}
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
                {formMode === 'sell' ? 'Authentic Campus Media Guidelines' : 'Authentic Barter Photos'}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                {formMode === 'sell'
                  ? 'Upload actual photos of your items on campus desks or lockers. Items with realistic photos receive 3x faster buyer inquiries.'
                  : 'Show clear angles of your barter item to help student peers quickly evaluate and accept your trade proposal.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DEDICATED SELL FORM PRICING vs DEDICATED SWAP FORM BARTER TERMS */}
      {currentStep === 3 && formMode === 'sell' && (
        <div className="clean-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.75rem' }}>
            <Tag size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Step 3: Selling Price & Valuation
            </h3>
          </div>

          {/* Pricing Model Choice */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Listing Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setSellType('paid')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: sellType === 'paid' ? 'var(--uc-blue-subtle)' : '#FFFFFF',
                  border: sellType === 'paid' ? '2px solid var(--uc-blue)' : '1px solid #CBD5E1',
                  color: sellType === 'paid' ? 'var(--uc-blue)' : '#475569',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>For Sale (PHP)</div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Cash or GCash/Maya on meetup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSellType('free');
                  setPrice(0);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: sellType === 'free' ? '#ECFDF5' : '#FFFFFF',
                  border: sellType === 'free' ? '2px solid #059669' : '1px solid #CBD5E1',
                  color: sellType === 'free' ? '#065F46' : '#475569',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Gift size={15} color="#059669" />
                  <span>Free Student Gift (₱0)</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Pay-it-forward donation</span>
              </button>
            </div>
          </div>

          {/* Pricing fields if paid */}
          {sellType === 'paid' ? (
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
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="clean-input"
                    style={{ paddingLeft: '1.85rem', fontWeight: 800, fontSize: '1rem', color: 'var(--uc-blue)' }}
                    placeholder="0.00"
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
                    value={originalSrp}
                    onChange={(e) => setOriginalSrp(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="clean-input"
                    style={{ paddingLeft: '1.85rem', fontSize: '0.95rem' }}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.82rem' }}>
              <Gift size={20} style={{ flexShrink: 0 }} />
              <span>This listing is marked as a <strong>Free Student Gift (₱0)</strong>. Verified peers can claim it without any payment.</span>
            </div>
          )}

          {/* Discount badge preview */}
          {sellType === 'paid' && Number(originalSrp) > Number(price) && Number(price) > 0 && (
            <div style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>Great Student Deal: <strong>{Math.round(((Number(originalSrp) - Number(price)) / Number(originalSrp)) * 100)}% off</strong> original store price!</span>
            </div>
          )}

          {/* Search Tags */}
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
                placeholder={tags.length >= 10 ? 'Limit 10 tags reached' : 'Type keyword and press Enter'}
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

      {/* STEP 3: DEDICATED SWAP FORM BARTER TERMS */}
      {currentStep === 3 && formMode === 'swap' && (
        <div className="clean-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.75rem' }}>
            <ArrowLeftRight size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Step 3: Barter Terms & Desired Swap Items
            </h3>
          </div>

          {/* Zero-cash Notice Banner */}
          <div
            style={{
              backgroundColor: 'rgba(0, 43, 127, 0.05)',
              border: '1.5px solid rgba(0, 43, 127, 0.15)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}
          >
            <ArrowLeftRight size={18} color="var(--uc-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--uc-blue)' }}>
                Cashless Student Barter Exchange
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                No money or e-wallet transfers are needed. You are proposing a direct item-for-item exchange with fellow UC students.
              </p>
            </div>
          </div>

          {/* Desired Items in Exchange */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              What item(s) are you looking to receive in exchange? *
            </label>
            <input
              type="text"
              value={swapPreference}
              onChange={(e) => setSwapPreference(e.target.value)}
              placeholder="Desired item"
              className="clean-input"
              style={{ fontSize: '0.86rem', fontWeight: 600 }}
              required
            />

            {/* Quick Inspiration Chips */}
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Quick suggestions (click to auto-fill):
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {SWAP_INSPIRATION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSwapPreference(chip)}
                    style={{
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      backgroundColor: swapPreference === chip ? 'var(--uc-blue-subtle)' : '#FFFFFF',
                      color: swapPreference === chip ? 'var(--uc-blue)' : '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barter Condition Preference (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Preferred Condition of Incoming Item (Optional)
            </label>
            <input
              type="text"
              value={swapConditionNote}
              onChange={(e) => setSwapConditionNote(e.target.value)}
              placeholder="Condition requirements"
              className="clean-input"
              style={{ fontSize: '0.84rem' }}
            />
          </div>

          {/* Search Tags */}
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
                placeholder={tags.length >= 10 ? 'Limit 10 tags reached' : 'Type keyword and press Enter'}
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
                  Step 4: Live Marketplace Card Preview
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formMode === 'sell' ? 'How your listing looks to buyers' : 'How your swap card appears in Swap Hub'}
              </span>
            </div>

            {/* Live Preview Card */}
            <div
              style={{
                maxWidth: '300px',
                margin: '0 auto',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0, 43, 127, 0.08)'
              }}
            >
              {/* Media preview */}
              <div style={{ width: '100%', aspectRatio: '1 / 1', backgroundColor: '#0F172A', position: 'relative', overflow: 'hidden' }}>
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
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: formMode === 'swap' ? '#002B7F' : sellType === 'free' ? '#059669' : 'rgba(15, 23, 42, 0.82)',
                    color: formMode === 'swap' ? '#FFC72C' : '#FFFFFF',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    zIndex: 2
                  }}
                >
                  {formMode === 'swap' ? 'SWAP' : sellType === 'free' ? 'FREE' : 'FOR SALE'}
                </span>
                {/* Campus Pill */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    color: 'var(--uc-blue)',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    backdropFilter: 'blur(4px)',
                    zIndex: 2,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                  }}
                >
                  <MapPin size={10} /> {currentUser.campus}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{category}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                    {condition}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {title || 'Item Title Preview'}
                </h4>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <div>
                    {formMode === 'sell' ? (
                      sellType === 'paid' ? (
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
                          ₱{(typeof price === 'number' ? price : 0).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                          FREE
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                        ⇄ Swap: {swapPreference || 'Open to offers'}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Qty: {quantity}
                  </span>
                </div>

                {/* Seller snippet */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem', marginTop: '0.15rem' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <Check size={10} />
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
                  <span>Publishing {formMode === 'swap' ? 'Swap Offer...' : 'Listing...'}</span>
                </>
              ) : (
                <>
                  {formMode === 'swap' ? <ArrowLeftRight size={16} /> : <Tag size={16} />}
                  <span>{formMode === 'swap' ? 'Publish Barter Swap' : 'Publish Item for Sale'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title={`Discard ${formMode === 'swap' ? 'Swap' : 'Listing'} Draft?`}
        message="You have unsaved changes in this wizard. Leaving now will discard your entered details."
        confirmText="Discard Draft"
        cancelText="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onNavigate(formMode === 'swap' ? 'swaps' : 'marketplace');
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
};
