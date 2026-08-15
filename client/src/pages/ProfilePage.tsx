import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWanted } from '../context/WantedContext';
import { useChat } from '../context/ChatContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { CampusBadge } from '../components/common/CampusBadge';
import { ListingCard } from '../components/marketplace/ListingCard';
import { useToast } from '../components/common/Toast';
import { SEED_REVIEWS } from '../data/seedData';
import { DragDropUpload } from '../components/common/DragDropUpload';
import { User, Listing, Review, WantedRequest, TradeMode } from '../types';
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
  Sparkles,
  ShoppingBag,
  Gift,
  Calendar,
  CheckCircle2,
  Eye,
  X,
  BadgeCheck,
  Award,
  Check
} from 'lucide-react';

interface ProfilePageProps {
  userId?: string;
  onNavigate: (view: string, param?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, onNavigate }) => {
  const { currentUser, allUsers, updateProfile, submitIdVerification } = useAuth();
  const { listings } = useMarket();
  const { requests: wantedRequests } = useWanted();
  const { openChatWithSeller } = useChat();
  const { showToast } = useToast();

  const targetUser = (userId ? allUsers.find((u: User) => u.id === userId) : null) || currentUser || allUsers[0];
  const isSelf = !!currentUser && currentUser.id === targetUser.id;

  const [activeTab, setActiveTab] = useState<'listings' | 'sold' | 'reviews' | 'wanted' | 'verify'>('listings');
  const [listingFilter, setListingFilter] = useState<'all' | 'buy_sell' | 'swap' | 'free_donation'>('all');
  const [bioInput, setBioInput] = useState(targetUser?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [inspectedIdImage, setInspectedIdImage] = useState<string | null>(null);

  // Unverified verification form
  const [studentIdInput, setStudentIdInput] = useState(targetUser?.studentId || '');
  const [idPhotoPreview, setIdPhotoPreview] = useState<string>(
    targetUser?.idPhotoUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  );

  const userActiveListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && !l.isSold);
  const userSoldListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && l.isSold);
  const userReviews = SEED_REVIEWS.filter((r: Review) => r.targetUserId === targetUser?.id);
  const userWanted = wantedRequests.filter((w: WantedRequest) => w.requesterId === targetUser?.id);

  const filteredActiveListings = userActiveListings.filter((l) => {
    if (listingFilter === 'all') return true;
    return l.tradeMode === listingFilter;
  });

  const handleSaveBio = () => {
    updateProfile({ bio: bioInput });
    setIsEditingBio(false);
    showToast('Bio Saved', 'Your student profile bio has been updated.', 'success');
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
    <div className="container" style={{ maxWidth: '1080px', padding: '2rem 1.5rem 6rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Card with Campus Banner */}
      <div
        className="clean-card"
        style={{
          overflow: 'hidden',
          padding: 0,
          border: '1.5px solid #E2E8F0',
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
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 8px 20px rgba(0, 43, 127, 0.18)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                {targetUser.isVerified && (
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px' }}>
                    <VerifiedBadge size="sm" variant="gold" />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
                    {targetUser.name}
                  </h1>
                  {targetUser.isVerified && (
                    <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={12} /> Official Verified
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#002B7F', fontWeight: 800 }}>ID: {targetUser.studentId}</span>
                  <span>•</span>
                  <span>{targetUser.campus}</span>
                  <span>•</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{targetUser.college}</span>
                  <span>•</span>
                  <span>{targetUser.yearLevel}</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {!isSelf && (
                <button
                  onClick={handleStartChatWithUser}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.84rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <MessageSquare size={15} /> Message Student
                </button>
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
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.9rem 1.15rem', border: '1px solid #E2E8F0' }}>
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
                  <button onClick={() => setIsEditingBio(false)} style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#475569' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                  {targetUser.bio || 'UC student active in campus textbook, uniform, and gear exchanges.'}
                </p>
                {isSelf && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    title="Edit Bio"
                    style={{ color: '#002B7F', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Campus Trust Score</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: (targetUser.trustScore || 80) >= 85 ? '#059669' : '#D97706', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {targetUser.trustScore || 85}%
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Peer Rating</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {(targetUser.rating || 5.0).toFixed(1)} ★
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{targetUser.totalReviews || userReviews.length} Student Reviews</span>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Punctuality Rate</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#002B7F', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {targetUser.punctualityRate || 98}%
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>On-Time Meetups</span>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Completed Trades</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {targetUser.completedTrades || 15}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Verified Handshakes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Verified Student ID Card Showcase (Displayed when already verified!) */}
      {targetUser.isVerified && (
        <div
          className="clean-card"
          style={{
            padding: '1.25rem 1.5rem',
            border: '1.5px solid #BCD1F7',
            backgroundColor: '#F8FAFC',
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
                  border: '1.5px solid #BCD1F7',
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
                <BadgeCheck size={18} color="#059669" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#002B7F' }}>
                  Official University of Cebu Student ID Verified
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>
                ID Number: <strong>{targetUser.studentId}</strong> • Enrolled at <strong>{targetUser.campus}</strong> ({targetUser.college})
              </p>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '0.15rem' }}>
                ✓ Authenticated by Campus Safety Moderation Desk
              </div>
            </div>
          </div>

          {targetUser.idPhotoUrl && (
            <button
              onClick={() => setInspectedIdImage(targetUser.idPhotoUrl || null)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                backgroundColor: '#FFFFFF',
                color: '#002B7F',
                border: '1px solid #BCD1F7',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
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
          backgroundColor: '#FFFFFF',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          width: '100%'
        }}
      >
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'listings' ? 800 : 600,
            backgroundColor: activeTab === 'listings' ? '#002B7F' : 'transparent',
            color: activeTab === 'listings' ? '#FFFFFF' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap'
          }}
        >
          <ShoppingBag size={14} /> Active Listings ({userActiveListings.length})
        </button>

        <button
          onClick={() => setActiveTab('sold')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'sold' ? 800 : 600,
            backgroundColor: activeTab === 'sold' ? '#002B7F' : 'transparent',
            color: activeTab === 'sold' ? '#FFFFFF' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap'
          }}
        >
          <CheckCircle2 size={14} /> Fulfilled Trades ({userSoldListings.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'reviews' ? 800 : 600,
            backgroundColor: activeTab === 'reviews' ? '#002B7F' : 'transparent',
            color: activeTab === 'reviews' ? '#FFFFFF' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Star size={14} /> Reviews & Feedback ({userReviews.length})
        </button>

        <button
          onClick={() => setActiveTab('wanted')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'wanted' ? 800 : 600,
            backgroundColor: activeTab === 'wanted' ? '#002B7F' : 'transparent',
            color: activeTab === 'wanted' ? '#FFFFFF' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={14} /> Wanted Requests ({userWanted.length})
        </button>

        {/* Only show verification submission tab if unverified user viewing their own profile! */}
        {isSelf && !targetUser.isVerified && (
          <button
            onClick={() => setActiveTab('verify')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'verify' ? 800 : 600,
              backgroundColor: activeTab === 'verify' ? '#DC2626' : '#FEF2F2',
              color: activeTab === 'verify' ? '#FFFFFF' : '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap'
            }}
          >
            <AlertCircle size={14} /> Get ID Verified
          </button>
        )}
      </div>

      {/* 4. TAB CONTENT */}

      {/* TAB 1: ACTIVE LISTINGS */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sub-filters */}
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
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: listingFilter === f.id ? 800 : 600,
                  backgroundColor: listingFilter === f.id ? '#002B7F' : '#FFFFFF',
                  color: listingFilter === f.id ? '#FFFFFF' : '#475569',
                  border: '1px solid #CBD5E1'
                }}
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
            <div className="clean-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <ShoppingBag size={32} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>No Active Listings</h4>
              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                {isSelf ? "You haven't listed any items for sale or swap yet." : `${targetUser.name} currently has no active listings in this category.`}
              </p>
              {isSelf && (
                <button
                  onClick={() => onNavigate('create-listing')}
                  className="btn-gold"
                  style={{ marginTop: '1rem', padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 800 }}
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
            <div className="clean-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>No Completed Trades Yet</h4>
              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                Items completed and handed over through campus meetups will appear in this verified trade log.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEWS & RATINGS */}
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
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{rev.reviewerName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
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

                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                  "{rev.comment}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748B', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                  <span>Item: <strong>{rev.itemTitle}</strong></span>
                  <span>•</span>
                  <span>Trade Type: <strong>{rev.tradeType}</strong></span>
                  {rev.wasPunctual && <span style={{ color: '#059669', fontWeight: 700 }}>✓ Punctual Meetup</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="clean-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <Star size={32} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>No Peer Reviews Yet</h4>
              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                Ratings and comments from other students after handshakes will be published here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WANTED REQUESTS */}
      {activeTab === 'wanted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userWanted.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {userWanted.map((w) => (
                <div key={w.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <CampusBadge campus={w.preferredCampus} size="sm" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#002B7F' }}>₱{w.targetBudget.toLocaleString()}</span>
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{w.itemTitle}</h4>
                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>{w.description}</p>
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                    <span>Category: {w.category}</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{w.offersCount} Offers Received</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="clean-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <Sparkles size={32} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>No Open Wanted Requests</h4>
              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                Post what books or gear you're searching for so other students on campus can offer them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUBMIT ID VERIFICATION (ONLY FOR UNVERIFIED SELF) */}
      {activeTab === 'verify' && isSelf && !targetUser.isVerified && (
        <div className="clean-card" style={{ padding: '1.75rem', maxWidth: '560px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EBF1FC', color: '#002B7F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F' }}>
                Submit UC Student ID Verification
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Unlock the official Verified check badge and boost student trading trust.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Student ID Number (Numbers only) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 202409182"
                className="clean-input"
                maxLength={10}
                required
              />
            </div>

            <DragDropUpload
              images={idPhotoPreview ? [idPhotoPreview] : []}
              onChange={(imgs) => setIdPhotoPreview(imgs[0] || '')}
              maxFiles={1}
              label="Student ID Card or Study Load (COR) Photo *"
              helperText="Drag & drop your UC Student ID photo here"
              isMultiple={false}
            />

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
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
              border: '2px solid #BCD1F7'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ backgroundColor: '#002B7F', color: '#FFFFFF', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 800 }}>
                <ShieldCheck size={18} color="#FFC72C" /> Official Verified Student Credential
              </div>
              <button onClick={() => setInspectedIdImage(null)} style={{ color: '#FFFFFF' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <img
                src={inspectedIdImage}
                alt="Student ID Preview"
                style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #CBD5E1' }}
              />

              <div style={{ width: '100%', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#334155' }}>
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
