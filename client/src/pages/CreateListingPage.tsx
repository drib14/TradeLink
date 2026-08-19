import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useToast } from '../components/common/Toast';
import { SmartPriceWidget } from '../components/marketplace/SmartPriceWidget';
import { DragDropUpload } from '../components/common/DragDropUpload';
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
  Gift
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
  const [tags, setTags] = useState<string[]>(['Campus Item']);
  const [tradeMode, setTradeMode] = useState<TradeMode>('buy_sell');
  const [price, setPrice] = useState<number>(500);
  const [originalSrp, setOriginalSrp] = useState<number>(1200);
  const [condition, setCondition] = useState<ConditionGrade>('Like New');
  const [swapPreference, setSwapPreference] = useState('');
  const [isBoosted] = useState(false);
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  ]);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([
    CAMPUS_MEETUP_SPOTS.find((s) => s.campus === (currentUser?.campus || 'UC Main'))?.id || 'spot-main-1'
  ]);
  const [customMeetupSpot, setCustomMeetupSpot] = useState('');

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

  const categorySuggestions = [
    'Electronics & Gadgets',
    'Fashion & Sneakers',
    'Junior High School Books & Reviewers',
    'Senior High School Modules & Kits',
    'College Textbooks & Notes',
    'Uniforms, PE Attire & Scrubs',
    'Drafting, Art & Lab Supplies',
    'Scientific Calculators & Tools',
    'Music & Instruments',
    'Gaming & PC Gear',
    'Dorm & Appliances',
    'Hobbies & Collectibles',
    'Other / General Item'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [reader.result as string, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (customTagInput.trim() && !tags.includes(customTagInput.trim())) {
      setTags((prev) => [...prev, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSpotToggle = (spotId: string) => {
    setSelectedSpots((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Title Required', 'Please enter a title for your item.', 'warning');
      return;
    }

    if (tradeMode !== 'free_donation' && price <= 0) {
      showToast('Price Required', 'Please set a valid price or choose Free Donation.', 'warning');
      return;
    }

    const newListing = addListing({
      title: title.trim(),
      category: category.trim(),
      description: description.trim() || `Clean and well-kept ${title} available for pickup at ${currentUser.campus}.`,
      price: tradeMode === 'free_donation' ? 0 : price,
      originalSrp,
      condition,
      tradeMode,
      swapPreference: tradeMode === 'swap' ? swapPreference.trim() : undefined,
      images,
      tags: tags.length > 0 ? tags : ['Campus Item'],
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerAvatar: currentUser.avatar,
      sellerCampus: currentUser.campus,
      sellerCollege: currentUser.college,
      sellerIsVerified: currentUser.isVerified,
      sellerTrustScore: currentUser.trustScore,
      preferredMeetupSpots: selectedSpots,
      customMeetupSpot: customMeetupSpot.trim() || undefined,
      isBoosted
    });

    showToast('Item Posted', `"${newListing.title}" is now live for all UC students!`, 'success');
    onNavigate('item-detail', { id: newListing.id });
  };

  return (
    <div className="container page-enter" style={{ maxWidth: '820px', padding: '2rem 1.5rem 5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => onNavigate('marketplace')}
          className="btn-ghost"
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.82rem',
            marginBottom: '0.5rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Catalog
        </button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
          Sell or Swap Any Item
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', marginTop: '0.15rem' }}>
          List anything with fellow University of Cebu students — gadgets, sneakers, instruments, reviewers, or appliances.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Card 1: Details */}
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>What are you listing?</h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Item Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item name"
              className="clean-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Category
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Tags
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag"
                  className="clean-input"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Rendered Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: '#EBF1FC',
                    color: '#002B7F',
                    border: '1px solid #BCD1F7',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{ color: '#002B7F', display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Condition Grade *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {(['Brand New', 'Like New', 'Gently Used', 'Fair / Academic Usable'] as ConditionGrade[]).map((cond) => {
                const isSelected = condition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    style={{
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 800 : 600,
                      backgroundColor: isSelected ? '#002B7F' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? '1px solid #002B7F' : '1px solid #CBD5E1',
                      textAlign: 'center'
                    }}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              Description & Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, inclusions, and notes..."
              className="clean-input"
            />
          </div>
        </div>

        {/* Card 2: Price & Mode */}
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pricing & Mode</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            {[
              { id: 'buy_sell', label: 'For Sale', icon: <ShoppingBag size={15} style={{ flexShrink: 0 }} /> },
              { id: 'swap', label: 'Swap', icon: <ArrowLeftRight size={15} style={{ flexShrink: 0 }} /> },
              { id: 'free_donation', label: 'Free Donation', icon: <Gift size={15} style={{ flexShrink: 0 }} /> }
            ].map((mode) => {
              const isSelected = tradeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTradeMode(mode.id as TradeMode)}
                  className={`segmented-tab ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer'
                  }}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {tradeMode !== 'free_donation' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Selling Price (PHP) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="clean-input"
                    style={{ paddingLeft: '1.95rem', fontWeight: 800, fontSize: '1rem', color: 'var(--uc-blue)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Original Retail (SRP)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    value={originalSrp}
                    onChange={(e) => setOriginalSrp(Number(e.target.value))}
                    className="clean-input"
                    style={{ paddingLeft: '1.95rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {tradeMode === 'swap' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Preferred Swap Item *
              </label>
              <input
                type="text"
                value={swapPreference}
                onChange={(e) => setSwapPreference(e.target.value)}
                placeholder="Preferred item to swap for"
                className="clean-input"
                required
              />
            </div>
          )}

          <SmartPriceWidget
            initialSrp={originalSrp}
            initialCondition={condition}
            initialCategory={category}
            initialCurrentPrice={price}
            isCompact={true}
            onApplyPrice={(rec) => setPrice(rec)}
          />
        </div>

        {/* Card 3: Photos (Drag & Drop) */}
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Photos</h3>
          <DragDropUpload
            images={images}
            onChange={setImages}
            maxFiles={6}
            label=""
            helperText="Drag & drop item photos here, or click to browse"
            isMultiple={true}
          />
        </div>

        {/* Card 4: Inside & Outside Campus Meetup Spot */}
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <MapPin size={18} color="var(--uc-blue)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Meetup Locations (Inside Campus & Nearby Outside Hubs)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Pick official campus checkpoints, nearby student hubs (E-Mall, Country Mall, IT Park, Parkmall), or enter your own custom location
              </p>
            </div>
          </div>

          {/* Predefined spots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
            {CAMPUS_MEETUP_SPOTS.map((spot) => {
              const isSelected = selectedSpots.includes(spot.id);
              return (
                <label
                  key={spot.id}
                  onClick={() => handleSpotToggle(spot.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #002B7F' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#EBF1FC' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ marginTop: '2px' }}
                  />
                  <div style={{ fontSize: '0.78rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: '#002B7F' }}>[{spot.campus}]</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: spot.locationType.includes('Inside') ? '#047857' : '#B45309' }}>
                        {spot.locationType.includes('Inside') ? 'Campus Gate' : 'Outside Spot'}
                      </span>
                    </div>
                    <div style={{ color: '#1E293B', marginTop: '1px' }}>{spot.name}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Custom Student Meetup Spot Input */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              Custom Location (Optional)
            </label>
            <input
              type="text"
              value={customMeetupSpot}
              onChange={(e) => setCustomMeetupSpot(e.target.value)}
              placeholder="e.g. E-Mall, Banilad canteen, etc."
              className="clean-input"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onNavigate('marketplace')}
            className="btn-secondary"
            style={{ padding: '0.65rem 1.35rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-gold"
            style={{ padding: '0.65rem 1.6rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Tag size={16} style={{ flexShrink: 0 }} />
            <span>Publish Listing to TradeLink</span>
          </button>
        </div>
      </form>
    </div>
  );
};
