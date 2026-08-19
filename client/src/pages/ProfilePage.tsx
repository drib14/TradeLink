import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWanted } from '../context/WantedContext';
import { useChat } from '../context/ChatContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { CampusBadge } from '../components/common/CampusBadge';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { SEED_REVIEWS } from '../data/seedData';
import { DragDropUpload } from '../components/common/DragDropUpload';
import { User, Listing, Review, WantedRequest, TradeMode, College } from '../types';
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowLeftRight,
  Upload,
  AlertCircle,
  FileCheck,
  Edit3,
  MessageSquare,
  Flame,
  Search,
  ShoppingBag,
  Gift,
  Calendar,
  CheckCircle2,
  Eye,
  X,
  BadgeCheck,
  Award,
  Check,
  Bookmark,
  Receipt,
  Settings,
  UserCheck,
  Save,
  MapPin
} from 'lucide-react';

interface ProfilePageProps {
  userId?: string;
  onNavigate: (view: string, param?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, onNavigate }) => {
  const { currentUser, allUsers, updateProfile, submitIdVerification } = useAuth();
  const { listings, favorites } = useMarket();
  const { requests: wantedRequests } = useWanted();
  const { openChatWithSeller, meetups } = useChat();
  const { showToast } = useToast();

  const targetUser = (userId ? allUsers.find((u: User) => u.id === userId) : null) || currentUser || allUsers[0];
  const isSelf = !!currentUser && currentUser.id === targetUser.id;

  const [activeTab, setActiveTab] = useState<'listings' | 'sold' | 'saved' | 'transactions' | 'reviews' | 'wanted' | 'verify'>('listings');
  const [listingFilter, setListingFilter] = useState<'all' | 'buy_sell' | 'swap' | 'free_donation'>('all');
  const [bioInput, setBioInput] = useState(targetUser?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [inspectedIdImage, setInspectedIdImage] = useState<string | null>(null);

  // Edit Profile Modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(targetUser?.name || '');
  const [editBio, setEditBio] = useState(targetUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(targetUser?.avatar || '');
  const [editCollege, setEditCollege] = useState<College>(targetUser?.college || 'CCS');
  const [editYearLevel, setEditYearLevel] = useState(targetUser?.yearLevel || '2nd Year');

  // Unverified verification form
  const [studentIdInput, setStudentIdInput] = useState(targetUser?.studentId || '');
  const [idPhotoPreview, setIdPhotoPreview] = useState<string>(
    targetUser?.idPhotoUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  );

  const userActiveListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && !l.isSold);
  const userSoldListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && l.isSold);
  const userSavedListings = listings.filter((l: Listing) => favorites.includes(l.id));
  const userReviews = SEED_REVIEWS.filter((r: Review) => r.targetUserId === targetUser?.id);
  const userWanted = wantedRequests.filter((w: WantedRequest) => w.requesterId === targetUser?.id);
  const userMeetups = meetups.filter((m) => m.sellerId === targetUser?.id || m.buyerId === targetUser?.id);

  const filteredActiveListings = userActiveListings.filter((l) => {
    if (listingFilter === 'all') return true;
    return l.tradeMode === listingFilter;
  });

  const handleSaveBio = () => {
    updateProfile({ bio: bioInput });
    setIsEditingBio(false);
    showToast('Bio Saved', 'Your student profile bio has been updated.', 'success');
  };

  const handleSaveFullProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatar: editAvatar.trim() || targetUser.avatar,
      college: editCollege,
      yearLevel: editYearLevel
    });
    setIsEditProfileModalOpen(false);
    showToast('Profile Updated! 🎉', 'Your profile details have been saved.', 'success');
  };

  const handleStartChatWithUser = () => {
    if (!currentUser) {
      showToast('Sign In Required', 'Please log in to chat with students.', 'warning');
      return;
    }
    if (userActiveListings.length > 0) {
      openChatWithSeller(userActiveListings[0]);
      showToast('Chat Opened', `Opened chat with ${targetUser.name}.`, 'info');
    } else {
      showToast('Student Profile', `${targetUser.name} currently has no active listings to message about.`, 'info');
    }
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = studentIdInput.replace(/\D/g, '');
    if (cleanDigits.length < 6) {
      showToast('Invalid ID', 'Student ID must be at least 6 digits without hyphens or letters.', 'warning');
      return;
    }
    submitIdVerification(studentIdInput, idPhotoPreview);
    showToast('ID Verification Submitted', 'Your student credentials have been sent to campus moderation for review.', 'success');
    setActiveTab('listings');
  };

  return (
    <div className="container page-enter" style={{ maxWidth: '1080px', padding: '2rem 1.5rem 6rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Card with Campus Banner */}
      <div
        className="clean-card"
        style={{
          overflow: 'hidden',
          padding: 0,
          border: '1.5px solid var(--border-subtle, #E2E8F0)',
          position: 'relative'
        }}
      >
        {/* Campus Cover Banner */}
        <div
          style={{
            height: '140px',
            background: 'linear-gradient(135deg, #001D59 0%, #002B7F 50%, #0A43A8 100%)',
            position: 'relative',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFC72C', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Award size={15} /> University of Cebu Verified Student Profile
          </div>
          <CampusBadge campus={targetUser.campus} size="sm" />
        </div>

        {/* Profile Details Container */}
        <div style={{ padding: '0 1.75rem 1.75rem 1.75rem', marginTop: '-45px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar & Main Info Row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={targetUser.avatar}
                  alt={targetUser.name}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid var(--bg-surface, #FFFFFF)',
                    boxShadow: '0 8px 20px rgba(0, 43, 127, 0.18)',
                    backgroundColor: 'var(--bg-surface, #FFFFFF)'
                  }}
                />
                {targetUser.isVerified && (
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px' }}>
                    <VerifiedBadge size="sm" variant="green" />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary, #0F172A)', fontFamily: 'var(--font-display)' }}>
                    {targetUser.name}
                  </h1>
                  {targetUser.isVerified && (
                    <span style={{ backgroundColor: 'var(--accent-green-subtle, #ECFDF5)', color: 'var(--accent-green, #059669)', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={12} /> Official Verified
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748B)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--uc-blue, #002B7F)', fontWeight: 800 }}>ID: {targetUser.studentId}</span>
                  <span>•</span>
                  <span>{targetUser.campus}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-primary, #0F172A)', fontWeight: 600 }}>{targetUser.college}</span>
                  <span>•</span>
                  <span>{targetUser.yearLevel}</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {!isSelf && (
                <button
                  onClick={handleStartChatWithUser}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.84rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <MessageSquare size={15} /> Message Student
                </button>
              )}

              {isSelf && (
                <>
                  <button
                    onClick={() => {
                      setEditName(targetUser.name);
                      setEditBio(targetUser.bio || '');
                      setEditAvatar(targetUser.avatar);
                      setEditCollege(targetUser.college);
                      setEditYearLevel(targetUser.yearLevel);
                      setIsEditProfileModalOpen(true);
                    }}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>

                  <button
                    onClick={() => onNavigate('settings')}
                    className="btn-ghost"
                    style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem' }}
                    title="Account Settings"
                  >
                    <Settings size={16} />
                  </button>
                </>
              )}

              {isSelf && !targetUser.isVerified && (
                <button
                  onClick={() => setActiveTab('verify')}
                  className="btn-gold"
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <AlertCircle size={15} /> Verify Student ID
                </button>
              )}
            </div>
          </div>

          {/* Student Bio */}
          <div style={{ backgroundColor: 'var(--bg-subtle, #F8FAFC)', borderRadius: '10px', padding: '0.9rem 1.15rem', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
            {isEditingBio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={2}
                  className="clean-input"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Share a short bio about what you study or trade..."
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={handleSaveBio} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
                    Save Bio
                  </button>
                  <button onClick={() => setIsEditingBio(false)} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #334155)', lineHeight: 1.5 }}>
                  {targetUser.bio || 'UC student active in campus textbook, uniform, and gear exchanges.'}
                </p>
                {isSelf && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    title="Edit Bio"
                    style={{ color: 'var(--uc-blue, #002B7F)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div className="stat-card">
              <span className="stat-card-label">Campus Trust Score</span>
              <div className="stat-card-value" style={{ color: (targetUser.trustScore || 80) >= 85 ? 'var(--accent-green)' : 'var(--uc-gold)' }}>
                {targetUser.trustScore || 85}%
              </div>
              <div className="progress-bar" style={{ marginTop: '0.25rem' }}>
                <div className={`progress-bar-fill ${(targetUser.trustScore || 80) >= 85 ? 'green' : 'gold'}`} style={{ width: `${targetUser.trustScore || 85}%` }} />
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Peer Rating</span>
              <div className="stat-card-value">
                {(targetUser.rating || 5.0).toFixed(1)} ★
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{targetUser.totalReviews || userReviews.length} Student Reviews</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Punctuality Rate</span>
              <div className="stat-card-value" style={{ color: 'var(--uc-blue)' }}>
                {targetUser.punctualityRate || 98}%
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>On-Time Meetups</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Completed Trades</span>
              <div className="stat-card-value">
                {targetUser.completedTrades || 15}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Verified Handshakes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Verified Student ID Card Showcase */}
      {targetUser.isVerified && (
        <div
          className="clean-card"
          style={{
            padding: '1.25rem 1.5rem',
            border: '1.5px solid var(--uc-blue-border, #BCD1F7)',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {targetUser.idPhotoUrl && (
              <div
                onClick={() => setInspectedIdImage(targetUser.idPhotoUrl || null)}
                style={{
                  width: '90px',
                  height: '65px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  border: '1.5px solid var(--uc-blue-border, #BCD1F7)',
                  boxShadow: '0 4px 10px rgba(0, 43, 127, 0.15)',
                  backgroundColor: '#0F172A',
                  flexShrink: 0
                }}
                title="Click to view full verified ID"
              >
                <img
                  src={targetUser.idPhotoUrl}
                  alt="Verified Student ID"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 43, 127, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Eye size={16} />
                </div>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BadgeCheck size={18} color="var(--accent-green, #059669)" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                  Official University of Cebu Student ID Verified
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', marginTop: '0.15rem' }}>
                ID Number: <strong>{targetUser.studentId}</strong> • Enrolled at <strong>{targetUser.campus}</strong> ({targetUser.college})
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-green, #059669)', fontWeight: 700, marginTop: '0.15rem' }}>
                ✓ Authenticated by Campus Safety Moderation Desk
              </div>
            </div>
          </div>

          {targetUser.idPhotoUrl && (
            <button
              onClick={() => setInspectedIdImage(targetUser.idPhotoUrl || null)}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <Eye size={13} /> View Verified ID Document
            </button>
          )}
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div
        className="touch-scroll-row"
        style={{
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          width: '100%',
          display: 'flex',
          gap: '0.35rem'
        }}
      >
        <button
          onClick={() => setActiveTab('listings')}
          className={`segmented-tab ${activeTab === 'listings' ? 'active' : ''}`}
        >
          <ShoppingBag size={14} style={{ flexShrink: 0 }} /> <span>Active Listings ({userActiveListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sold')}
          className={`segmented-tab ${activeTab === 'sold' ? 'active' : ''}`}
        >
          <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> <span>Fulfilled Trades ({userSoldListings.length})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`segmented-tab ${activeTab === 'saved' ? 'active' : ''}`}
          >
            <Bookmark size={14} style={{ flexShrink: 0 }} /> <span>Saved Items ({userSavedListings.length})</span>
          </button>
        )}

        {isSelf && (
          <button
            onClick={() => setActiveTab('transactions')}
            className={`segmented-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          >
            <Receipt size={14} style={{ flexShrink: 0 }} /> <span>Transactions ({userMeetups.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('reviews')}
          className={`segmented-tab ${activeTab === 'reviews' ? 'active' : ''}`}
        >
          <Star size={14} style={{ flexShrink: 0 }} /> <span>Reviews ({userReviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wanted')}
          className={`segmented-tab ${activeTab === 'wanted' ? 'active' : ''}`}
        >
          <Flame size={14} style={{ flexShrink: 0 }} /> <span>Wanted ({userWanted.length})</span>
        </button>

        {isSelf && !targetUser.isVerified && (
          <button
            onClick={() => setActiveTab('verify')}
            className={`segmented-tab ${activeTab === 'verify' ? 'active' : ''}`}
            style={{ color: activeTab === 'verify' ? '#FFFFFF' : 'var(--accent-red)' }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> <span>Get ID Verified</span>
          </button>
        )}
      </div>

      {/* 4. TAB CONTENT */}

      {/* TAB 1: ACTIVE LISTINGS */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'buy_sell', label: 'For Sale' },
              { id: 'swap', label: 'Swap Only' },
              { id: 'free_donation', label: 'Free Donation' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setListingFilter(f.id as any)}
                className={`segmented-tab ${listingFilter === f.id ? 'active' : ''}`}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredActiveListings.length > 0 ? (
            <div className="grid-responsive-listings">
              {filteredActiveListings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('item-detail', { id: item.id })}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ShoppingBag size={28} />
              </div>
              <h4 className="empty-state-title">No Active Listings</h4>
              <p className="empty-state-desc">
                {isSelf ? "You haven't listed any items for sale or swap yet." : `${targetUser.name} currently has no active listings in this category.`}
              </p>
              {isSelf && (
                <button
                  onClick={() => onNavigate('create-listing')}
                  className="btn-gold"
                  style={{ marginTop: '0.5rem' }}
                >
                  + Post New Listing
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULFILLED TRADES */}
      {activeTab === 'sold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userSoldListings.length > 0 ? (
            <div className="grid-responsive-listings">
              {userSoldListings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('item-detail', { id: item.id })}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="empty-state-title">No Completed Trades Yet</h4>
              <p className="empty-state-desc">
                Items completed and handed over through campus meetups will appear in this verified trade log.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED ITEMS (when isSelf) */}
      {activeTab === 'saved' && isSelf && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userSavedListings.length > 0 ? (
            <div className="grid-responsive-listings">
              {userSavedListings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('item-detail', { id: item.id })}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Bookmark size={28} />
              </div>
              <h4 className="empty-state-title">No Saved Items</h4>
              <p className="empty-state-desc">
                Browse listings and tap the bookmark icon to save items here for quick reference.
              </p>
              <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                Explore Marketplace
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRANSACTIONS (when isSelf) */}
      {activeTab === 'transactions' && isSelf && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => onNavigate('transactions')} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
              View Full Transaction History →
            </button>
          </div>
          {userMeetups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {userMeetups.map((m) => (
                <div
                  key={m.id}
                  className="card-interactive"
                  style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}
                  onClick={() => onNavigate('item-detail', { id: m.listingId })}
                >
                  <img src={m.listingImage} alt={m.listingTitle} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.listingTitle}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {m.landmarkSpot} • {m.status}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: m.buyerId === currentUser?.id ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    ₱{m.finalPrice.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Receipt size={28} />
              </div>
              <h4 className="empty-state-title">No Transactions Yet</h4>
              <p className="empty-state-desc">
                Your past purchases and sales will be recorded here automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REVIEWS & RATINGS */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userReviews.length > 0 ? (
            userReviews.map((rev) => (
              <div key={rev.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img
                      src={rev.reviewerAvatar}
                      alt={rev.reviewerName}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rev.reviewerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {rev.reviewerCampus} • {new Date(rev.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#F59E0B' }}>
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  "{rev.comment}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <span>Item: <strong>{rev.itemTitle}</strong></span>
                  <span>•</span>
                  <span>Trade Type: <strong>{rev.tradeType}</strong></span>
                  {rev.wasPunctual && <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✓ Punctual Meetup</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Star size={28} />
              </div>
              <h4 className="empty-state-title">No Peer Reviews Yet</h4>
              <p className="empty-state-desc">
                Ratings and comments from other students after handshakes will be published here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: WANTED REQUESTS */}
      {activeTab === 'wanted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userWanted.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {userWanted.map((w) => (
                <div key={w.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <CampusBadge campus={w.preferredCampus} size="sm" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--uc-blue)' }}>₱{w.targetBudget.toLocaleString()}</span>
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>{w.itemTitle}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{w.description}</p>
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Category: {w.category}</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{w.offersCount} Offers Received</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={28} />
              </div>
              <h4 className="empty-state-title">No Open Wanted Requests</h4>
              <p className="empty-state-desc">
                Post what books or gear you're searching for so other students on campus can offer them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: GET ID VERIFIED */}
      {activeTab === 'verify' && isSelf && !targetUser.isVerified && (
        <div className="clean-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Submit Student ID for Verification</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get the official green badge, increase trust score to 100%, and unlock priority listings.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Official UC Student ID Number</label>
              <input
                type="text"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 2023048912"
                className="clean-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.84rem', fontWeight: 800, marginTop: '0.5rem', alignSelf: 'flex-start' }}
            >
              Submit for Verification
            </button>
          </form>
        </div>
      )}

      {/* FULL-SCREEN VERIFIED ID PHOTO VIEWER MODAL */}
      {inspectedIdImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 29, 89, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setInspectedIdImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '560px',
              width: '100%',
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '2px solid var(--border-subtle, #BCD1F7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ backgroundColor: 'var(--uc-blue, #002B7F)', color: '#FFFFFF', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 800 }}>
                <ShieldCheck size={18} color="var(--uc-gold, #FFC72C)" /> Official Verified Student Credential
              </div>
              <button onClick={() => setInspectedIdImage(null)} style={{ color: '#FFFFFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <img
                src={inspectedIdImage}
                alt="Student ID Preview"
                style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
              />

              <div style={{ width: '100%', backgroundColor: 'var(--bg-subtle, #F8FAFC)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                <div>Student: <strong>{targetUser.name}</strong></div>
                <div>ID Number: <strong>{targetUser.studentId}</strong></div>
                <div>Campus: <strong>{targetUser.campus}</strong> ({targetUser.college} • {targetUser.yearLevel})</div>
              </div>

              <button
                onClick={() => setInspectedIdImage(null)}
                className="btn-primary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.84rem', fontWeight: 800, justifyContent: 'center' }}
              >
                Close Credential Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
