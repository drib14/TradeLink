import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWanted } from '../context/WantedContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { CampusBadge } from '../components/common/CampusBadge';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { reviewsService } from '../services/reviews.service';
import { usersService } from '../services/users.service';
import { User, Listing, Review, WantedRequest, College } from '../types';
import {
  ShieldCheck,
  Star,
  Clock,
  Edit3,
  MessageSquare,
  Flame,
  Search,
  ShoppingBag,
  CheckCircle2,
  Eye,
  X,
  BadgeCheck,
  Award,
  Check,
  Bookmark,
  Receipt,
  Settings,
  Save,
  MapPin,
  ShieldAlert,
  AlertCircle,
  Copy,
  Camera,
  User as UserIcon
} from 'lucide-react';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { maskStudentId } from '../utils/security';

interface ProfilePageProps {
  userId?: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
  onOpenVerification?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  onNavigate,
  onOpenAuth,
  onOpenVerification
}) => {
  const { currentUser, allUsers, updateProfile } = useAuth();
  const { listings, favorites } = useMarket();
  const { requests: wantedRequests } = useWanted();
  const { openChatWithSeller, meetups } = useChat();
  const { showToast } = useToast();

  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  useEffect(() => {
    if (userId && (!currentUser || currentUser.id !== userId)) {
      usersService.getProfile(userId).then((res) => {
        if (res) setFetchedUser(res);
      }).catch(() => {});
    }
  }, [userId, currentUser]);

  const targetUser: User | null = (userId && currentUser?.id === userId ? currentUser : (fetchedUser || (userId ? allUsers.find((u: User) => u.id === userId) : null) || currentUser || null));
  const isSelf = !!currentUser && !!targetUser && currentUser.id === targetUser.id;

  const [activeTab, setActiveTab] = useState<'listings' | 'sold' | 'saved' | 'transactions' | 'reviews' | 'wanted'>('listings');
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

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPendingInfoModalOpen, setIsPendingInfoModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  const isPendingVerification = !targetUser?.isVerified && (targetUser?.verificationStatus === 'pending' || !!targetUser?.idPhotoUrl);

  React.useEffect(() => {
    if (targetUser?.id) {
      reviewsService.getReviewsForUser(targetUser.id).then((revs) => {
        if (revs && revs.length > 0) {
          setUserReviews(revs);
        }
      }).catch(() => {});
    }
  }, [targetUser?.id]);

  const userActiveListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && !l.isSold);
  const userSoldListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && l.isSold);
  const userSavedListings = listings.filter((l: Listing) => favorites.includes(l.id));
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
    if (!targetUser) return;
    updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatar: editAvatar.trim() || targetUser.avatar,
      college: editCollege,
      yearLevel: editYearLevel
    });
    setIsEditProfileModalOpen(false);
    showToast('Profile Updated', 'Your profile details have been saved.', 'success');
  };

  const handleStartChatWithUser = () => {
    if (!currentUser) {
      showToast('Sign In Required', 'Please log in to chat with students.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!targetUser) return;
    if (userActiveListings.length > 0) {
      openChatWithSeller(userActiveListings[0]);
      showToast('Chat Opened', `Opened chat with ${targetUser.name}.`, 'info');
    } else {
      showToast('Student Profile', `${targetUser.name} currently has no active listings to message about.`, 'info');
    }
  };

  if (!targetUser) {
    if (!currentUser && !userId) {
      return (
        <div className="container page-enter" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '520px' }}>
          <div className="clean-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
                Sign In to View Your Profile
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748B)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Log in with your University of Cebu account to manage your listings, view your student verification status, and monitor campus reviews.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else onNavigate('home');
                }}
                className="btn-gold"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem', fontWeight: 800 }}
              >
                Sign In to TradeLink
              </button>
              <button
                onClick={() => onNavigate('marketplace')}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
              >
                Explore Marketplace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container page-enter" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '500px' }}>
        <div className="clean-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>Student Profile Not Found</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)' }}>
            The requested student account could not be found or has not registered yet.
          </p>
          <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.55rem 1.25rem' }}>
            Explore Marketplace
          </button>
        </div>
      </div>
    );
  }

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
                <UserAvatar
                  src={targetUser.avatar}
                  name={targetUser.name}
                  size={90}
                  style={{
                    border: '4px solid var(--bg-surface, #FFFFFF)',
                    boxShadow: '0 8px 20px rgba(0, 43, 127, 0.18)'
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
                  <span style={{ color: 'var(--uc-blue, #002B7F)', fontWeight: 800 }}>ID: {maskStudentId(targetUser.studentId, isSelf)}</span>
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

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        setIsCopiedLink(true);
                        showToast('Link Copied', 'Profile link copied to clipboard.', 'success');
                        setTimeout(() => setIsCopiedLink(false), 2500);
                      }
                    }}
                    className="btn-ghost"
                    style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem' }}
                    title="Share Profile"
                  >
                    {isCopiedLink ? <Check size={16} color="var(--accent-green)" /> : <Copy size={16} />}
                  </button>
                </>
              )}

              {isSelf && !targetUser.isVerified && (
                isPendingVerification ? (
                  <button
                    onClick={() => setIsPendingInfoModalOpen(true)}
                    className="btn-secondary"
                    style={{
                      padding: '0.6rem 1.15rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      backgroundColor: 'rgba(255, 199, 44, 0.15)',
                      borderColor: 'rgba(229, 168, 0, 0.4)',
                      color: '#B45309'
                    }}
                    title="Click to view submission status"
                  >
                    <Clock size={15} /> Verification Pending Review
                  </button>
                ) : (
                  <button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="btn-gold"
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <AlertCircle size={15} /> Verify Student ID
                  </button>
                )
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
                  {targetUser.bio || 'UC student active in campus marketplace exchanges.'}
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
              <div className="stat-card-value" style={{ color: Number(targetUser.trustScore ?? (targetUser.isVerified ? 90 : 60)) >= 85 ? 'var(--accent-green)' : 'var(--uc-gold)' }}>
                {Number(targetUser.trustScore ?? (targetUser.isVerified ? 90 : 60))}%
              </div>
              <div className="progress-bar" style={{ marginTop: '0.25rem' }}>
                <div className={`progress-bar-fill ${Number(targetUser.trustScore ?? (targetUser.isVerified ? 90 : 60)) >= 85 ? 'green' : 'gold'}`} style={{ width: `${Number(targetUser.trustScore ?? (targetUser.isVerified ? 90 : 60))}%` }} />
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Peer Rating</span>
              <div className="stat-card-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                {(Number(targetUser.rating) || 5.0).toFixed(1)} <Star size={16} fill="var(--uc-gold, #FFC72C)" color="var(--uc-gold, #FFC72C)" />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{Number(targetUser.totalReviews ?? userReviews.length)} Student Reviews</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Punctuality Rate</span>
              <div className="stat-card-value" style={{ color: 'var(--uc-blue)' }}>
                {Number(targetUser.completedTrades || 0) > 0 ? `${Number(targetUser.punctualityRate || 100)}%` : '100%'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{Number(targetUser.completedTrades || 0) > 0 ? 'On-Time Meetups' : 'Standard Baseline'}</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-label">Completed Trades</span>
              <div className="stat-card-value">
                {Number(targetUser.completedTrades || 0)}
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
                Authenticated by Campus Safety Moderation Desk
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

      {/* Dynamic Verification Banner */}
      {isSelf && !targetUser.isVerified && (
        isPendingVerification ? (
          <div
            style={{
              backgroundColor: 'rgba(0, 43, 127, 0.06)',
              border: '1.5px solid rgba(0, 43, 127, 0.18)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={18} color="var(--uc-blue)" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  Verification Request In Progress
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                Your student credentials and biometric live selfie have been submitted to campus administrators. Review is underway.
              </p>
            </div>
            <button
              onClick={() => setIsPendingInfoModalOpen(true)}
              className="btn-secondary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 800 }}
            >
              View Submission Status
            </button>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'rgba(255, 199, 44, 0.12)',
              border: '1.5px solid rgba(229, 168, 0, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldAlert size={18} color="#B45309" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  Account Status: Unverified Student
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                Complete the 2-step verification (Student ID + Live Selfie) to unlock marketplace listing and barter privileges.
              </p>
            </div>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="btn-gold"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 800 }}
            >
              Start Verification
            </button>
          </div>
        )
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
                  {m.listingImage && m.listingImage.trim() !== '' ? (
                    <img src={m.listingImage} alt={m.listingTitle} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ShoppingBag size={22} />
                    </div>
                  )}
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
                    <UserAvatar
                      src={rev.reviewerAvatar}
                      name={rev.reviewerName}
                      size="sm"
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
                  {rev.wasPunctual && <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>• Punctual Meetup</span>}
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
      {/* Student Verification 2-Step Modal */}
      <StudentVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* Verification In Progress Info Modal */}
      <Modal
        isOpen={isPendingInfoModalOpen}
        onClose={() => setIsPendingInfoModalOpen(false)}
        title="Verification Request In Progress"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', alignItems: 'center', textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255, 199, 44, 0.2)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={30} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
              Under Moderator Review
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.55 }}>
              Your student credentials and live biometric selfie have been securely received. Our campus administration team is currently reviewing your submission for official University of Cebu validation.
            </p>
          </div>

          <div style={{ width: '100%', backgroundColor: 'var(--bg-subtle, #F8FAFC)', borderRadius: '10px', padding: '0.9rem', border: '1px solid var(--border-subtle, #E2E8F0)', textAlign: 'left', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>Student Name: <strong>{targetUser?.name}</strong></div>
            <div>Student ID: <strong>{maskStudentId(targetUser?.studentId, true)}</strong></div>
            <div>Campus & College: <strong>{targetUser?.campus} • {targetUser?.college}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B45309', fontWeight: 700, marginTop: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              Status: Awaiting Administrator Approval
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                setIsPendingInfoModalOpen(false);
                setIsVerificationModalOpen(true);
              }}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              Re-submit Documents
            </button>
            <button
              type="button"
              onClick={() => setIsPendingInfoModalOpen(false)}
              className="btn-primary"
              style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', fontWeight: 800 }}
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleSaveFullProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Avatar Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle, #F8FAFC)', borderRadius: '10px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
            <UserAvatar src={editAvatar} name={editName || targetUser.name} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profile Photo Preview</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {editAvatar ? 'Custom photo provided' : 'Defaulting to your name initials on UC theme'}
              </div>
              {editAvatar && (
                <button
                  type="button"
                  onClick={() => setEditAvatar('')}
                  style={{
                    marginTop: '0.35rem',
                    fontSize: '0.72rem',
                    color: 'var(--accent-red, #DC2626)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Clear Photo & Use Name Initials
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="clean-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Student Bio
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              placeholder="Tell fellow students what courses, books, or gear you trade..."
              className="clean-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Profile Photo (Media Upload)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <label
                className="btn-secondary"
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '10px'
                }}
              >
                <Camera size={15} />
                <span>{editAvatar ? 'Change Photo' : 'Upload Image File'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 8 * 1024 * 1024) {
                        showToast('File Too Large', 'Please select an image smaller than 8MB.', 'warning');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setEditAvatar(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {editAvatar && (
                <button
                  type="button"
                  onClick={() => setEditAvatar('')}
                  className="btn-ghost"
                  style={{
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.8rem',
                    color: 'var(--accent-red, #DC2626)',
                    fontWeight: 700
                  }}
                >
                  Clear Photo & Use Name Initials
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Supports PNG, JPG, or WEBP. If no photo is selected, your UC student initials will be displayed dynamically.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Department / College
              </label>
              <select
                value={editCollege}
                onChange={(e: any) => setEditCollege(e.target.value)}
                className="clean-input"
              >
                <option value="CCS">CCS (Computer Studies)</option>
                <option value="CBA">CBA (Business & Accountancy)</option>
                <option value="Engineering">Engineering</option>
                <option value="Nursing">Nursing</option>
                <option value="Maritime">Maritime</option>
                <option value="Criminology">Criminology</option>
                <option value="Arts & Sciences">Arts & Sciences</option>
                <option value="Education">Education</option>
                <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                <option value="Medicine">Medicine</option>
                <option value="Law">Law</option>
                <option value="Senior High (STEM)">Senior High (STEM)</option>
                <option value="Senior High (ABM)">Senior High (ABM)</option>
                <option value="Senior High (HUMSS)">Senior High (HUMSS)</option>
                <option value="Senior High (TVL/GAS)">Senior High (TVL/GAS)</option>
                <option value="Junior High School">Junior High School</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Year Level
              </label>
              <select
                value={editYearLevel}
                onChange={(e) => setEditYearLevel(e.target.value)}
                className="clean-input"
              >
                <option value="1st Year College">1st Year College</option>
                <option value="2nd Year College">2nd Year College</option>
                <option value="3rd Year College">3rd Year College</option>
                <option value="4th Year College">4th Year College</option>
                <option value="5th Year College">5th Year College</option>
                <option value="Grade 11 (Senior High)">Grade 11 (Senior High)</option>
                <option value="Grade 12 (Senior High)">Grade 12 (Senior High)</option>
                <option value="Junior High">Junior High</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(false)}
              className="btn-secondary"
              style={{ padding: '0.55rem 1.15rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.55rem 1.35rem' }}
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
