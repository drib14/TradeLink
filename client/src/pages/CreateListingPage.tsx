import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useToast } from '../components/common/Toast';
import { DragDropUpload } from '../components/common/DragDropUpload';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { TradeMode, ConditionGrade } from '../types';
import { CAMPUS_MEETUP_SPOTS } from '../data/campusLocations';
import {
  Plus,
  Upload,
  ChevronLeft,
  X,
  MapPin,
  Tag,
  ShoppingBag,
  ArrowLeftRight,
  Gift,
  ShieldAlert,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface CreateListingPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const CreateListingPage: React.FC<CreateListingPageProps> = ({ onNavigate }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { addListing } = useMarket();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics & Gadgets');
  const [customTagInput, setCustomTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tradeMode, setTradeMode] = useState<TradeMode>('buy_sell');
  const [price, setPrice] = useState<number>(0);
  const [originalSrp, setOriginalSrp] = useState<number>(0);
  const [condition, setCondition] = useState<ConditionGrade>('Gently Used');
  const [quantity, setQuantity] = useState<number>(1);
  const [swapPreference, setSwapPreference] = useState('');
  const [isBoosted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [spotSelection, setSpotSelection] = useState<string>('');
  const [customLocationText, setCustomLocationText] = useState('');

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '560px' }}>
        <div className="clean-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={30} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Sign In Required to Post Items
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            To keep our University of Cebu marketplace safe and verified, students must log in before listing items for sale or barter.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="btn-gold"
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 800, marginTop: '0.5rem' }}
          >
            Explore Catalog or Log In
          </button>
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
                Verification Request In Progress
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.55 }}>
                Your student ID and live selfie are currently under review by campus administrators. Once verified, you will be able to post listings immediately across all UC campuses.
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
                Browse Marketplace
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
              To maintain a safe, scam-free environment across all University of Cebu campuses, creating listings requires an official student verification (Student ID + live selfie).
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
              Browse Marketplace
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

  const categorySuggestions = [
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

  const campusSpots = CAMPUS_MEETUP_SPOTS.filter(s => s.campus === currentUser.campus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Title Required', 'Please enter a title for your item.', 'warning');
      return;
    }

    if (tradeMode === 'buy_sell' && price <= 0) {
      showToast('Price Required', 'Please set a valid price or choose Free Donation.', 'warning');
      return;
    }

    const finalMeetupSpot = (spotSelection === 'custom' && customLocationText.trim())
      ? customLocationText.trim()
      : (spotSelection || campusSpots[0]?.name || `${currentUser.campus} Main Guard Station`);

    try {
      const newListing = await addListing({
        title: title.trim(),
        category: category.trim(),
        description: description.trim() || `Clean and well-kept ${title} available for campus pickup at ${currentUser.campus}.`,
        price: tradeMode === 'free_donation' ? 0 : price,
        originalSrp: tradeMode === 'free_donation' ? 0 : price,
        condition,
        quantity: Math.max(1, quantity),
        tradeMode,
        swapPreference: tradeMode === 'swap' ? swapPreference.trim() : undefined,
        images,
        tags: [category.split(' ')[0] || 'Campus'],
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerAvatar: currentUser.avatar,
        sellerCampus: currentUser.campus,
        sellerCollege: currentUser.college,
        sellerIsVerified: currentUser.isVerified,
        sellerTrustScore: currentUser.trustScore,
        preferredMeetupSpots: [finalMeetupSpot],
        customMeetupSpot: finalMeetupSpot,
        isBoosted: false
      });

      showToast('Item Posted!', `"${newListing.title}" is now active in the campus marketplace!`, 'success');
      onNavigate('item-detail', { id: newListing.id });
    } catch (err: any) {
      const msg = err?.message || 'Failed to post item listing.';
      if (msg.toLowerCase().includes('verif')) {
        showToast('Verification Required', 'Please complete your student ID verification before posting.', 'warning');
        setIsVerificationModalOpen(true);
      } else {
        showToast('Posting Failed', msg, 'error');
      }
    }
  };

  return (
    <div className="container page-enter" style={{ maxWidth: '720px', padding: '2rem 1.25rem 5rem 1.25rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => onNavigate('marketplace')}
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
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
          Create a Listing
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #64748B)', marginTop: '0.15rem' }}>
          Post textbooks, gear, uniforms, or tech to your verified campus community in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Section 1: Item Information */}
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid var(--border-subtle, #F1F5F9)', paddingBottom: '0.75rem' }}>
            <ShoppingBag size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Item Details</h3>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Item Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio FX-991EX Calculator, BSN Nursing Scrub (M), Accounting 101 Book"
              className="clean-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="clean-input"
              >
                {categorySuggestions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Condition Grade *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
                {(['Brand New', 'Like New', 'Gently Used', 'Fair / Academic Usable'] as ConditionGrade[]).map((cond) => {
                  const isSelected = condition === cond;
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCondition(cond)}
                      style={{
                        padding: '0.45rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: isSelected ? 800 : 600,
                        backgroundColor: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--bg-subtle, #F1F5F9)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #334155)',
                        border: isSelected ? '1px solid var(--uc-blue)' : '1px solid var(--border-subtle, #E2E8F0)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {cond.split('/')[0].trim()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quantity / Units Available */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Quantity Available *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle, #CBD5E1)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-surface, #FFFFFF)' }}>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  style={{
                    width: '36px',
                    height: '38px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary, #0F172A)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    width: '54px',
                    height: '38px',
                    border: 'none',
                    borderLeft: '1px solid var(--border-subtle, #E2E8F0)',
                    borderRight: '1px solid var(--border-subtle, #E2E8F0)',
                    textAlign: 'center',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: 'var(--uc-blue, #002B7F)',
                    backgroundColor: 'transparent'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  style={{
                    width: '36px',
                    height: '38px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary, #0F172A)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)' }}>
                {quantity === 1 ? '1 unit listed (will mark Sold Out when traded)' : `${quantity} units available`}
              </span>
            </div>
          </div>

          {/* Trade Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Listing Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'buy_sell', label: 'For Sale', icon: <ShoppingBag size={14} /> },
                { id: 'swap', label: 'Swap Only', icon: <ArrowLeftRight size={14} /> },
                { id: 'free_donation', label: 'Free Gift', icon: <Gift size={14} /> }
              ].map((mode) => {
                const isSelected = tradeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTradeMode(mode.id as TradeMode)}
                    style={{
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 800 : 600,
                      backgroundColor: isSelected ? 'var(--uc-blue-subtle, #EBF1FC)' : 'var(--bg-surface, #FFFFFF)',
                      color: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                      border: isSelected ? '1.5px solid var(--uc-blue, #002B7F)' : '1px solid var(--border-subtle, #CBD5E1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    {mode.icon}
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing or Swap Preferences */}
          {tradeMode === 'buy_sell' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Price (PHP) *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '160px' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="clean-input"
                    style={{ paddingLeft: '1.75rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--uc-blue)' }}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {[50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPrice(preset)}
                      className="btn-ghost"
                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                    >
                      ₱{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tradeMode === 'swap' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                What would you like in exchange? *
              </label>
              <input
                type="text"
                value={swapPreference}
                onChange={(e) => setSwapPreference(e.target.value)}
                placeholder="e.g. Scientific Calculator, Mechanical Keyboard, or Open to any offer"
                className="clean-input"
                required
              />
            </div>
          )}

          {tradeMode === 'free_donation' && (
            <div style={{ backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.8rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Gift size={16} /> Giving this item away for free (₱0) to support a fellow UC student.
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inclusions, edition, or notes about the item..."
              className="clean-input"
              style={{ fontSize: '0.84rem' }}
            />
          </div>
        </div>

        {/* Section 2: Photos & Meetup Hub */}
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid var(--border-subtle, #F1F5F9)', paddingBottom: '0.75rem' }}>
            <MapPin size={18} color="var(--uc-blue)" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Photos & Campus Meetup</h3>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Item Photos (Up to 4)
            </label>
            <DragDropUpload
              images={images}
              onChange={setImages}
              maxFiles={4}
              label=""
              helperText="Click or drop photos here (PNG, JPG, WEBP)"
              isMultiple={true}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Campus Meeting Place *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select
                value={spotSelection || (campusSpots[0]?.name || '')}
                onChange={(e) => setSpotSelection(e.target.value)}
                className="clean-input"
              >
                <optgroup label={`Designated Meeting Spots (${currentUser.campus})`}>
                  {campusSpots.map((spot) => (
                    <option key={spot.id} value={spot.name}>
                      {spot.name}
                    </option>
                  ))}
                </optgroup>
                <option value="custom">+ Enter My Own Custom Meeting Location</option>
              </select>

              {spotSelection === 'custom' && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <input
                    type="text"
                    value={customLocationText}
                    onChange={(e) => setCustomLocationText(e.target.value)}
                    placeholder="e.g. 2nd Floor Canteen Table 4, Main Library Study Area, Engineering Hallway"
                    className="clean-input"
                    style={{ fontSize: '0.84rem' }}
                    required
                  />
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Specify any landmark or spot where you prefer to meet your buyer or barter partner.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={() => onNavigate('marketplace')}
            className="btn-secondary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.84rem', fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-gold"
            style={{ padding: '0.65rem 1.75rem', fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Tag size={16} />
            <span>Publish Listing Now</span>
          </button>
        </div>
      </form>
    </div>
  );
};
