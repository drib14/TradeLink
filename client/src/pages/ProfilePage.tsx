import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { CampusBadge } from '../components/common/CampusBadge';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { reviewsService } from '../services/reviews.service';
import { usersService } from '../services/users.service';
import { User, Listing, Review, FlashRequest, College } from '../types';
import { formatRelativeTime } from '../utils/date';
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
  User as UserIcon,
  PlusCircle,
  TrendingUp,
  Zap,
  RotateCcw,
  DollarSign,
  ArrowUpDown,
  Building2,
  CreditCard,
  PackageCheck,
  Share2,
  List,
  LayoutGrid,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink
} from 'lucide-react';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { maskStudentId } from '../utils/security';
import { PaymentMethodBadge, CashLogo, GCashLogo, MayaLogo, BankTransferLogo, PaymentMethodCheckboxGroup } from '../components/common/PaymentLogos';

const parsePaymentMethods = (str?: string): ('cash' | 'gcash' | 'maya' | 'bank_transfer')[] => {
  if (!str) return ['cash', 'gcash', 'maya', 'bank_transfer'];
  const methods: ('cash' | 'gcash' | 'maya' | 'bank_transfer')[] = [];
  const lower = str.toLowerCase();
  if (lower.includes('cash')) methods.push('cash');
  if (lower.includes('gcash')) methods.push('gcash');
  if (lower.includes('maya')) methods.push('maya');
  if (lower.includes('bank') || lower.includes('transfer')) methods.push('bank_transfer');
  return methods.length > 0 ? methods : ['cash', 'gcash', 'maya', 'bank_transfer'];
};

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
  onOpenVerification: _onOpenVerification
}) => {
  const { currentUser, allUsers, updateProfile } = useAuth();
  const { listings, favorites, markAsSold } = useMarket();
  const { requests: flashRequests } = useFlashMarket();
  const { openChatWithSeller, openChatWithUser, meetups } = useChat();
  const { showToast } = useToast();

  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(Boolean(userId && (!currentUser || currentUser.id !== userId)));
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (userId && (!currentUser || currentUser.id !== userId)) {
      setIsLoadingUser(true);
      usersService.getProfile(userId)
        .then((res) => {
          if (isMounted) {
            if (res) setFetchedUser(res);
            setIsLoadingUser(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoadingUser(false);
          }
        });
    } else {
      setIsLoadingUser(false);
    }
    return () => {
      isMounted = false;
    };
  }, [userId, currentUser]);

  const targetUser: User | null = userId
    ? (currentUser?.id === userId ? currentUser : (fetchedUser || allUsers.find((u: User) => u.id === userId) || null))
    : (currentUser || null);

  useEffect(() => {
    // Only redirect to not-found when user fetch has fully finished and no user exists
    if (userId && !isLoadingUser && !targetUser) {
      onNavigate('not-found');
    }
  }, [userId, isLoadingUser, targetUser, onNavigate]);

  const isSelf = !!currentUser && !!targetUser && currentUser.id === targetUser.id;

  const [activeTab, setActiveTab] = useState<'listings' | 'sold' | 'saved' | 'transactions' | 'reviews' | 'flash' | 'wanted'>('listings');
  const [listingFilter, setListingFilter] = useState<'all' | 'buy_sell' | 'swap' | 'free_donation'>('all');
  const [bioInput, setBioInput] = useState(targetUser?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [inspectedIdImage, setInspectedIdImage] = useState<string | null>(null);

  // In-store search & sort state
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSort, setStoreSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'seller' | 'buyer'>('all');
  const [inventoryViewMode, setInventoryViewMode] = useState<'table' | 'grid'>('table');
  const [transactionViewMode, setTransactionViewMode] = useState<'table' | 'cards'>('table');

  // Edit Profile Modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(targetUser?.name || '');
  const [editBio, setEditBio] = useState(targetUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(targetUser?.avatar || '');
  const [editCollege, setEditCollege] = useState<College>(targetUser?.college || 'CCS');
  const [editYearLevel, setEditYearLevel] = useState(targetUser?.yearLevel || '2nd Year College');
  const [editMeetupSpots, setEditMeetupSpots] = useState(targetUser?.preferredMeetupSpots || '');
  const [editTradingHours, setEditTradingHours] = useState(targetUser?.tradingHours || '');
  const [editPaymentMethods, setEditPaymentMethods] = useState<('cash' | 'gcash' | 'maya' | 'bank_transfer')[]>(
    parsePaymentMethods(targetUser?.paymentMethods)
  );

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPendingInfoModalOpen, setIsPendingInfoModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  // Synchronize edit modal fields when targetUser changes or modal opens
  useEffect(() => {
    if (targetUser) {
      setBioInput(targetUser.bio || '');
      setEditName(targetUser.name || '');
      setEditBio(targetUser.bio || '');
      setEditAvatar(targetUser.avatar || '');
      setEditCollege(targetUser.college || 'CCS');
      setEditYearLevel(targetUser.yearLevel || '2nd Year College');
      setEditMeetupSpots(targetUser.preferredMeetupSpots || '');
      setEditTradingHours(targetUser.tradingHours || '');
      setEditPaymentMethods(parsePaymentMethods(targetUser.paymentMethods));
    }
  }, [targetUser]);

  const isRejectedVerification = !targetUser?.isVerified && (targetUser?.verificationStatus === 'rejected' || !!(targetUser as any)?.verificationRejectionReason);
  const isPendingVerification = !targetUser?.isVerified && !isRejectedVerification && (targetUser?.verificationStatus === 'pending' || !!targetUser?.idPhotoUrl);

  const [userAnalytics, setUserAnalytics] = useState<{
    completedTrades: number;
    totalTradeVolume: number;
    activeListings: number;
    activeInventoryValue: number;
    monthlyTimeline: Array<{
      label: string;
      year: number;
      volume: number;
      trades: number;
    }>;
    reviewsCount: number;
    rating: number;
  } | null>(null);

  useEffect(() => {
    if (targetUser?.id) {
      reviewsService.getReviewsForUser(targetUser.id).then((revs) => {
        if (revs && revs.length > 0) {
          setUserReviews(revs);
        }
      }).catch(() => {});

      usersService.getUserAnalytics(targetUser.id)
        .then((analytics) => {
          if (analytics) {
            setUserAnalytics(analytics);
          }
        })
        .catch((err) => {
          console.warn('Could not load user analytics, using local data:', err);
        });
    }
  }, [targetUser?.id]);

  const userActiveListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && !l.isSold);
  const userSoldListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && l.isSold);
  const userSavedListings = listings.filter((l: Listing) => favorites.includes(l.id));
  const userFlash = flashRequests.filter((w: FlashRequest) => w.requesterId === targetUser?.id);
  const userWanted = userFlash;
  const userMeetups = meetups.filter((m) => m.sellerId === targetUser?.id || m.buyerId === targetUser?.id);

  // Calculate Marketplace Statistics dynamically
  const activeInventoryValue = userAnalytics?.activeInventoryValue ?? userActiveListings.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const completedTradesCount = Number(userAnalytics?.completedTrades ?? (targetUser?.completedTrades ?? userSoldListings.length));
  const totalReviewsCount = Number(userAnalytics?.reviewsCount ?? (targetUser?.totalReviews ?? userReviews.length));
  const hasTransactions = completedTradesCount > 0 || totalReviewsCount > 0;

  const rating = userAnalytics?.rating ?? (hasTransactions ? (Number(targetUser?.rating) || 0) : 0.0);

  // Monthly performance dataset for owner analytics graph - strictly dynamic without fake math
  const monthlyData = useMemo(() => {
    if (userAnalytics?.monthlyTimeline && userAnalytics.monthlyTimeline.length > 0) {
      return userAnalytics.monthlyTimeline;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        trades: 0,
        volume: 0,
      });
    }

    userSoldListings.forEach((l) => {
      const d = new Date(l.updatedAt || l.createdAt || Date.now());
      const mMatch = months.find((m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
      if (mMatch) {
        mMatch.trades += 1;
        mMatch.volume += Number(l.price) || 0;
      }
    });

    return months.map((m) => ({
      label: m.label,
      year: m.year,
      trades: m.trades,
      volume: m.volume,
    }));
  }, [userAnalytics, userSoldListings]);

  // In-store filter counts
  const saleCount = userActiveListings.filter((l) => l.tradeMode === 'buy_sell').length;
  const swapCount = userActiveListings.filter((l) => l.tradeMode === 'swap').length;
  const freeCount = userActiveListings.filter((l) => l.tradeMode === 'free_donation').length;

  // Filtered active listings based on mode, in-store search, and sort
  const filteredActiveListings = useMemo(() => {
    return userActiveListings
      .filter((l) => {
        if (listingFilter !== 'all' && l.tradeMode !== listingFilter) return false;
        if (storeSearch.trim()) {
          const q = storeSearch.toLowerCase();
          const matchesTitle = l.title.toLowerCase().includes(q);
          const matchesCat = (l.category || '').toLowerCase().includes(q);
          const matchesDesc = (l.description || '').toLowerCase().includes(q);
          if (!matchesTitle && !matchesCat && !matchesDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (storeSort === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (storeSort === 'price_desc') return (b.price || 0) - (a.price || 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [userActiveListings, listingFilter, storeSearch, storeSort]);

  const filteredValue = filteredActiveListings.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  // Reviews filtering
  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'seller') {
      return userReviews.filter((r) => r.tradeType?.toLowerCase().includes('sell') || r.tradeType?.toLowerCase().includes('sale'));
    }
    if (reviewFilter === 'buyer') {
      return userReviews.filter((r) => r.tradeType?.toLowerCase().includes('buy'));
    }
    return userReviews;
  }, [userReviews, reviewFilter]);

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
      yearLevel: editYearLevel,
      preferredMeetupSpots: editMeetupSpots.trim(),
      tradingHours: editTradingHours.trim(),
      paymentMethods: editPaymentMethods.join(', ')
    });
    setIsEditProfileModalOpen(false);
    showToast('Profile Updated', 'Your profile details and trading preferences have been saved.', 'success');
  };

  const handleStartChatWithUser = async () => {
    if (!currentUser) {
      showToast('Sign In Required', 'Please log in to chat with students.', 'warning');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!targetUser) return;
    if (userActiveListings.length > 0) {
      await openChatWithSeller(userActiveListings[0]);
    } else {
      await openChatWithUser(targetUser);
    }
    showToast('Chat Opened', `Connected with ${targetUser.name} on Campus Chat.`, 'info');
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedLink(true);
      showToast('Profile Link Copied', 'Direct link to this student profile copied to clipboard.', 'success');
      setTimeout(() => setIsCopiedLink(false), 2500);
    }
  };

  if (isLoadingUser && !targetUser) {
    return (
      <div className="container page-enter" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '520px' }}>
        <div className="clean-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle, #E2E8F0)', borderTopColor: 'var(--uc-blue, #002B7F)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Loading Student Profile...</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Retrieving verified campus profile and active listings...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                Log in with your University of Cebu account to manage your listings, view inventory value, track student verification status, and monitor campus reviews.
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
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 6rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. STUDENT PROFILE HERO CARD */}
      <div
        className="clean-card"
        style={{
          overflow: 'hidden',
          padding: 0,
          border: '1.5px solid var(--border-subtle, #E2E8F0)',
          position: 'relative',
          borderRadius: '18px'
        }}
      >
        {/* Campus Cover Banner */}
        <div
          style={{
            height: '145px',
            backgroundColor: '#002B7F',
            borderBottom: '1px solid #001D59',
            position: 'relative',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC72C', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <ShieldCheck size={15} /> Verified Student Peer
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CampusBadge campus={targetUser.campus} size="sm" />
            <button
              onClick={handleShareProfile}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Share Profile"
            >
              {isCopiedLink ? <Check size={14} color="#86EFAC" /> : <Share2 size={14} />}
              <span>{isCopiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Profile Details Container */}
        <div style={{ padding: '0 1.75rem 1.75rem 1.75rem', marginTop: '-48px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar, Identity & Primary Actions Row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <UserAvatar
                  src={targetUser.avatar}
                  name={targetUser.name}
                  size={96}
                  style={{
                    border: '4px solid var(--bg-surface, #FFFFFF)',
                    boxShadow: '0 8px 24px rgba(0, 43, 127, 0.22)'
                  }}
                />
                {targetUser.isVerified && (
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px' }}>
                    <VerifiedBadge size="sm" variant="green" />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary, #0F172A)', fontFamily: 'var(--font-display)' }}>
                    {targetUser.name}
                  </h1>
                  {targetUser.isVerified ? (
                    <span style={{ backgroundColor: 'var(--accent-green-subtle, #ECFDF5)', color: 'var(--accent-green, #059669)', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={12} /> Official Verified Peer
                    </span>
                  ) : (
                    <span style={{ backgroundColor: 'rgba(255, 199, 44, 0.15)', color: '#B45309', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> Unverified Student
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #64748B)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--uc-blue, #002B7F)', fontWeight: 800 }}>ID: {maskStudentId(targetUser.studentId, isSelf)}</span>
                  <span>•</span>
                  <span>{targetUser.campus}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-primary, #0F172A)', fontWeight: 600 }}>{targetUser.college}</span>
                  <span>•</span>
                  <span>{targetUser.yearLevel}</span>
                </div>

                {/* Marketplace Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary, #475569)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-green, #059669)', fontWeight: 700 }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-green, #059669)', display: 'inline-block' }} />
                    Active Trader
                  </span>
                  <span>•</span>
                  <span>Fast Response</span>
                  <span>•</span>
                  <span>Member since {targetUser.joinedDate ? new Date(targetUser.joinedDate).getFullYear() : '2024'}</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {!isSelf ? (
                <>
                  <button
                    onClick={handleStartChatWithUser}
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.35rem', fontSize: '0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <MessageSquare size={16} /> Message Seller
                  </button>

                  <button
                    onClick={handleShareProfile}
                    className="btn-secondary"
                    style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {isCopiedLink ? <Check size={15} color="var(--accent-green)" /> : <Copy size={15} />}
                    <span>{isCopiedLink ? 'Copied' : 'Share Store'}</span>
                  </button>
                </>
              ) : (
                <>
                  {/* SELLER PRIMARY CTA: POST NEW LISTING */}
                  <button
                    onClick={() => onNavigate('create-listing')}
                    className="btn-gold"
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 14px rgba(255, 199, 44, 0.35)'
                    }}
                  >
                    <PlusCircle size={16} /> + Post New Item
                  </button>

                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="btn-secondary"
                    style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>

                  <button
                    onClick={() => onNavigate('settings')}
                    className="btn-ghost"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
                    title="Account Settings"
                  >
                    <Settings size={17} />
                  </button>

                  <button
                    onClick={handleShareProfile}
                    className="btn-ghost"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
                    title="Share Profile Link"
                  >
                    {isCopiedLink ? <Check size={17} color="var(--accent-green)" /> : <Copy size={17} />}
                  </button>
                </>
              )}

              {isSelf && !targetUser.isVerified && (
                isPendingVerification ? (
                  <button
                    onClick={() => setIsPendingInfoModalOpen(true)}
                    className="btn-secondary"
                    style={{
                      padding: '0.65rem 1.15rem',
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
                    style={{ padding: '0.65rem 1.2rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <AlertCircle size={15} /> Verify Student ID
                  </button>
                )
              )}
            </div>
          </div>

          {/* Student Bio */}
          <div style={{ backgroundColor: 'var(--bg-subtle, #F8FAFC)', borderRadius: '12px', padding: '0.9rem 1.15rem', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
            {isEditingBio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={2}
                  className="clean-input"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Share a short bio about what items you trade, textbooks, or course gear..."
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #334155)', lineHeight: 1.5, margin: 0 }}>
                  {targetUser.bio || 'Verified student active in campus marketplace exchanges, course gear, and textbook swaps.'}
                </p>
                {isSelf && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    title="Edit Bio"
                    style={{ color: 'var(--uc-blue, #002B7F)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '0.5rem' }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. PERFORMANCE & REPUTATION DASHBOARD */}
          {isSelf ? (
            <div
              className="clean-card"
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                backgroundColor: 'var(--bg-surface, #FFFFFF)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Header with summary stats */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--uc-blue)" />
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
                      Sales &amp; Trade Volume Activity
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                      Recent 6-month transaction and inventory trends
                    </p>
                  </div>
                </div>

                {/* Inline Stats Summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      Active Inventory
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)' }}>
                      ₱{activeInventoryValue.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                      ({userActiveListings.length} items)
                    </span>
                  </div>

                  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle, #E2E8F0)' }} />

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      Completed Trades
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-green, #059669)' }}>
                      {completedTradesCount}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                      fulfilled
                    </span>
                  </div>

                  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle, #E2E8F0)' }} />

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      Product Reviews
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D97706' }}>
                      {rating > 0 ? rating.toFixed(1) : '5.0'} ★
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                      ({totalReviewsCount} ratings)
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                  viewBox="0 0 700 170"
                  style={{ width: '100%', minWidth: '460px', height: 'auto', display: 'block' }}
                  aria-label="Monthly trade activity chart"
                >
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="680" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="60" x2="680" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="680" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="140" x2="680" y2="140" stroke="#E2E8F0" strokeWidth="1.5" />

                  {/* Area fill and stroke line */}
                  {(() => {
                    const totalVol = monthlyData.reduce((s, m) => s + m.volume, 0);
                    const totalTrades = monthlyData.reduce((s, m) => s + m.trades, 0);
                    const maxVol = Math.max(...monthlyData.map((m) => m.volume), 500);
                    const coords = monthlyData.map((m, idx) => {
                      const x = 70 + idx * 115;
                      const y = totalVol > 0 ? 140 - (m.volume / maxVol) * 105 : 140;
                      return { x, y, ...m };
                    });

                    const pathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                    const areaD = `${pathD} L ${coords[coords.length - 1].x} 140 L ${coords[0].x} 140 Z`;

                    return (
                      <>
                        {totalVol > 0 && <path d={areaD} fill="#EBF1FC" opacity="0.85" />}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={totalVol > 0 ? '#002B7F' : '#CBD5E1'}
                          strokeWidth={totalVol > 0 ? '2.5' : '1.5'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={totalVol === 0 ? '4 4' : undefined}
                        />

                        {/* Bars for trades completed */}
                        {coords.map((pt) => {
                          const barH = pt.trades > 0 ? Math.min(pt.trades * 16, 95) : 0;
                          return (
                            <g key={pt.label}>
                              {barH > 0 && (
                                <rect
                                  x={pt.x - 14}
                                  y={140 - barH}
                                  width="28"
                                  height={barH}
                                  rx="4"
                                  fill="#FFC72C"
                                  opacity="0.9"
                                />
                              )}
                              {/* Volume point dot */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={pt.volume > 0 ? 4.5 : 3}
                                fill={pt.volume > 0 ? '#FFFFFF' : '#F1F5F9'}
                                stroke={pt.volume > 0 ? '#002B7F' : '#94A3B8'}
                                strokeWidth={pt.volume > 0 ? 2.5 : 1.5}
                              />
                              {/* Value label */}
                              <text
                                x={pt.x}
                                y={pt.y - 8}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="700"
                                fill={pt.volume > 0 ? '#002B7F' : '#94A3B8'}
                              >
                                ₱{pt.volume.toLocaleString()}
                              </text>
                              {/* Month label on X-axis */}
                              <text x={pt.x} y="156" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748B">
                                {pt.label}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Informative note when no transactions have occurred yet */}
              {monthlyData.every((m) => m.trades === 0 && m.volume === 0) && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.76rem',
                    color: '#64748B',
                    fontWeight: 600
                  }}
                >
                  No campus trades recorded yet for this 6-month period. Real sales and completed swaps will automatically plot here!
                </div>
              )}

              {/* Chart Legend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '12px', height: '3px', backgroundColor: '#002B7F', borderRadius: '2px', display: 'inline-block' }} />
                  Volume (₱)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#FFC72C', borderRadius: '3px', display: 'inline-block' }} />
                  Completed Trades
                </span>
              </div>
            </div>
          ) : (
            /* Other user's preview: clean product review & seller credibility highlight */
            <div
              className="clean-card"
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: '1.5px solid var(--border-subtle, #E2E8F0)',
                backgroundColor: 'var(--bg-surface, #FFFFFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}
            >
              {/* Product Review Rating Highlight */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'center', paddingRight: '1.25rem', borderRight: '1px solid var(--border-subtle, #E2E8F0)' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary, #0F172A)', lineHeight: 1 }}>
                    {rating > 0 ? rating.toFixed(1) : '5.0'}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: '#F59E0B', marginTop: '0.25rem', justifyContent: 'center' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < Math.round(rating || 5) ? '#F59E0B' : 'transparent'} color="#F59E0B" />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Seller Rating
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
                    Verified Product Reviews ({totalReviewsCount})
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', margin: '0.25rem 0 0 0' }}>
                    Student ratings from completed marketplace item sales and exchanges.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>{userActiveListings.length} items live</span>
                    <span>•</span>
                    <span>{completedTradesCount} completed campus trades</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setActiveTab('reviews')}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
              >
                Read Product Reviews ({userReviews.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. CAMPUS TRADE HQ & SAFE MEETUP POLICY */}
      <div
        className="clean-card"
        style={{
          padding: '1.25rem 1.5rem',
          border: '1.5px solid var(--uc-blue-border, #BCD1F7)',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
                Campus Trade HQ & Safe Meetup Policy
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748B)', margin: 0 }}>
                Verified exchange guidelines established for peer-to-peer campus transactions
              </p>
            </div>
          </div>

          {isSelf && (
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', color: 'var(--uc-blue)', fontWeight: 700, padding: '0.35rem 0.75rem', gap: '0.35rem' }}
            >
              <Edit3 size={13} /> Customize Policy
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Base Campus */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <div style={{ color: 'var(--uc-blue)', marginTop: '2px' }}><MapPin size={16} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Home Campus</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{targetUser.campus}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{targetUser.college} • {targetUser.yearLevel}</div>
            </div>
          </div>

          {/* Preferred Meetup Spots */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <div style={{ color: 'var(--accent-green, #059669)', marginTop: '2px' }}><ShieldCheck size={16} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Preferred Meetup Spots</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4 }}>
                {targetUser.preferredMeetupSpots || 'Campus Canteen • Library Entrance • Student Study Lounge • Flexible peer location'}
              </div>
            </div>
          </div>

          {/* Trading Window */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <div style={{ color: '#D97706', marginTop: '2px' }}><Clock size={16} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trading Window</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {targetUser.tradingHours || 'Mon – Fri: 11:30 AM – 5:30 PM (Between classes)'}
              </div>
            </div>
          </div>

          {/* Payment Preferences */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <div style={{ color: 'var(--uc-blue)', marginTop: '2px' }}>
              <CreditCard size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Preferences</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '4px' }}>
                {parsePaymentMethods(targetUser.paymentMethods).map((method) => (
                  <PaymentMethodBadge key={method} method={method} size="xs" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Official Verified Student ID Card Showcase */}
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
            gap: '1.25rem',
            borderRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {(isSelf || currentUser?.role === 'admin') && targetUser.idPhotoUrl && (
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
                  Campus Student ID Verified
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', marginTop: '0.15rem', margin: 0 }}>
                ID Number: <strong>{maskStudentId(targetUser.studentId, isSelf || currentUser?.role === 'admin')}</strong> • Enrolled at <strong>{targetUser.campus}</strong> ({targetUser.college})
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-green, #059669)', fontWeight: 700, marginTop: '0.15rem' }}>
                Authenticated by Campus Safety Moderation Desk
              </div>
            </div>
          </div>

          {(isSelf || currentUser?.role === 'admin') && targetUser.idPhotoUrl && (
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
        isRejectedVerification ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
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
                <ShieldAlert size={18} color="#DC2626" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#DC2626' }}>
                  Verification Resubmission Needed
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                Moderator Note: <strong>{(targetUser as any)?.verificationRejectionReason || 'Uploaded ID document or selfie was unreadable.'}</strong>
              </p>
            </div>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="btn-primary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 800, backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              Fix & Resubmit ID
            </button>
          </div>
        ) : isPendingVerification ? (
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
                Your student credentials and live biometric selfie have been submitted for campus moderation. Please allow <strong>1–3 business days</strong> for campus safety administrators to complete verification.
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

      {/* 5. PROFILE NAVIGATION TABS */}
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
          onClick={() => setActiveTab('flash')}
          className={`segmented-tab ${activeTab === 'flash' || activeTab === 'wanted' ? 'active' : ''}`}
        >
          <Zap size={14} style={{ flexShrink: 0, color: 'var(--uc-gold)' }} /> <span>Flash Requests ({userFlash.length})</span>
        </button>
      </div>

      {/* 6. TAB CONTENTS */}

      {/* TAB 1: ACTIVE LISTINGS */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* In-store Search & Filtering Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.5rem 0'
            }}
          >
            {/* Mode filter pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Items (${userActiveListings.length})` },
                { id: 'buy_sell', label: `For Sale (${saleCount})` },
                { id: 'swap', label: `Swap Only (${swapCount})` },
                { id: 'free_donation', label: `Free (${freeCount})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setListingFilter(f.id as any)}
                  className={`segmented-tab ${listingFilter === f.id ? 'active' : ''}`}
                  style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* In-store Search Input & Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder={`Search ${targetUser.name.split(' ')[0]}'s items...`}
                  className="clean-input"
                  style={{ paddingLeft: '34px', paddingRight: storeSearch ? '28px' : '10px', height: '34px', fontSize: '0.78rem' }}
                />
                {storeSearch && (
                  <button
                    onClick={() => setStoreSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <select
                value={storeSort}
                onChange={(e: any) => setStoreSort(e.target.value)}
                className="clean-input"
                style={{ height: '34px', fontSize: '0.78rem', padding: '0 0.5rem', width: '135px' }}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* High-density view toggle */}
              <div style={{ display: 'inline-flex', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: '8px', overflow: 'hidden', height: '34px' }}>
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('table')}
                  style={{
                    padding: '0 0.65rem',
                    backgroundColor: inventoryViewMode === 'table' ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                    color: inventoryViewMode === 'table' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                  title="Show Dense Data Table"
                >
                  <List size={13} /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('grid')}
                  style={{
                    padding: '0 0.65rem',
                    backgroundColor: inventoryViewMode === 'grid' ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                    color: inventoryViewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                    border: 'none',
                    borderLeft: '1px solid var(--border-subtle, #E2E8F0)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                  title="Show Card Grid"
                >
                  <LayoutGrid size={13} /> Cards
                </button>
              </div>
            </div>
          </div>

          {/* Active Inventory Count & Value Summary */}
          {userActiveListings.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', paddingBottom: '0.25rem' }}>
              <span>
                Showing <strong>{filteredActiveListings.length}</strong> of <strong>{userActiveListings.length}</strong> items listed
              </span>
              <span>
                Filtered Value: <strong style={{ color: 'var(--uc-blue)' }}>₱{filteredValue.toLocaleString()}</strong>
              </span>
            </div>
          )}

          {/* Listings Presentation (Dense Table or Card Grid) */}
          {filteredActiveListings.length > 0 ? (
            inventoryViewMode === 'table' ? (
              <div className="table-clean-wrapper">
                <table className="table-clean" style={{ minWidth: '780px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '38%' }}>Marketplace Item</th>
                      <th>Category</th>
                      <th>Trade Mode</th>
                      <th>Condition</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th>Date Listed</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActiveListings.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.images && item.images.length > 0 ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle, #E2E8F0)' }}
                              />
                            ) : (
                              <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle, #F8FAFC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                                <ShoppingBag size={18} />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div
                                onClick={() => onNavigate('item-detail', { id: item.id })}
                                style={{ fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}
                                title={item.title}
                              >
                                {item.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <MapPin size={11} /> {item.campus}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              backgroundColor: item.tradeMode === 'free_donation' ? 'rgba(5, 150, 105, 0.12)' : item.tradeMode === 'swap' ? 'rgba(0, 43, 127, 0.1)' : 'rgba(255, 199, 44, 0.2)',
                              color: item.tradeMode === 'free_donation' ? '#059669' : item.tradeMode === 'swap' ? '#002B7F' : '#B45309'
                            }}
                          >
                            {item.tradeMode === 'free_donation' ? 'Free Gift' : item.tradeMode === 'swap' ? 'Swap Trade' : 'For Sale'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {item.condition || 'Good'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontSize: '0.9rem' }}>
                            ₱{Number(item.price || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            {item.createdAt ? formatRelativeTime(item.createdAt) : 'Recently'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green, #059669)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-green, #059669)' }} />
                            Live
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => onNavigate('item-detail', { id: item.id })}
                              className="btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                              title="View item detail"
                            >
                              <Eye size={12} />
                            </button>
                            {isSelf ? (
                              <button
                                onClick={() => markAsSold(item.id, true)}
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                                title="Mark item as completed trade"
                              >
                                <Check size={12} /> Sold
                              </button>
                            ) : (
                              <button
                                onClick={() => openChatWithSeller(item)}
                                className="btn-gold"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                              >
                                <MessageSquare size={12} /> Chat
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid-responsive-listings">
                {filteredActiveListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onClick={() => onNavigate('item-detail', { id: item.id })}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ShoppingBag size={28} />
              </div>
              <h4 className="empty-state-title">
                {storeSearch ? 'No Matching Items Found' : 'No Active Listings'}
              </h4>
              <p className="empty-state-desc">
                {storeSearch ? (
                  `No items matched "${storeSearch}". Try searching for another term or clear the search filter.`
                ) : isSelf ? (
                  "You have no active listings at the moment. Post your textbooks, uniforms, reviewers, or tech gear to start trading with UC classmates!"
                ) : (
                  `${targetUser.name} currently has no active listings in this category.`
                )}
              </p>
              {storeSearch ? (
                <button
                  onClick={() => setStoreSearch('')}
                  className="btn-secondary"
                  style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  Clear Search Filter
                </button>
              ) : isSelf && (
                <button
                  onClick={() => onNavigate('create-listing')}
                  className="btn-gold"
                  style={{ marginTop: '0.5rem', padding: '0.6rem 1.35rem', fontWeight: 800 }}
                >
                  + Post First Listing
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULFILLED TRADES */}
      {activeTab === 'sold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sold Stats Header Banner */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle, #F8FAFC)',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              borderRadius: '14px',
              padding: '1.1rem 1.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-green-subtle, #ECFDF5)', color: 'var(--accent-green, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PackageCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {userSoldListings.length} Campus Trades Successfully Fulfilled
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  All items below have been handed over and completed in verified campus exchanges.
                </div>
              </div>
            </div>
            {isSelf && (
              <button
                onClick={() => onNavigate('create-listing')}
                className="btn-gold"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 800 }}
              >
                + Post Another Item
              </button>
            )}
          </div>

          {userSoldListings.length > 0 ? (
            <div className="grid-responsive-listings">
              {userSoldListings.map((item) => (
                <div key={item.id} style={{ position: 'relative' }}>
                  <ListingCard
                    listing={item}
                    onClick={() => onNavigate('item-detail', { id: item.id })}
                  />
                  {isSelf && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 10
                      }}
                    >
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markAsSold(item.id, false);
                          showToast('Listing Reactivated', `"${item.title}" is now back active in your listings!`, 'success');
                        }}
                        className="btn-primary"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          borderRadius: '9999px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        title="Reactivate this item in your active listings"
                      >
                        <RotateCcw size={12} /> Relist Item
                      </button>
                    </div>
                  )}
                </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: '8px', overflow: 'hidden', height: '34px' }}>
              <button
                type="button"
                onClick={() => setTransactionViewMode('table')}
                style={{
                  padding: '0 0.75rem',
                  backgroundColor: transactionViewMode === 'table' ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                  color: transactionViewMode === 'table' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                <List size={13} /> Ledger Table
              </button>
              <button
                type="button"
                onClick={() => setTransactionViewMode('cards')}
                style={{
                  padding: '0 0.75rem',
                  backgroundColor: transactionViewMode === 'cards' ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                  color: transactionViewMode === 'cards' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                  border: 'none',
                  borderLeft: '1px solid var(--border-subtle, #E2E8F0)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                <LayoutGrid size={13} /> Cards
              </button>
            </div>

            <button onClick={() => onNavigate('transactions')} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
              View Full Transaction History →
            </button>
          </div>

          {userMeetups.length > 0 ? (
            transactionViewMode === 'table' ? (
              <div className="table-clean-wrapper">
                <table className="table-clean" style={{ minWidth: '780px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Listing &amp; Reference</th>
                      <th>Role</th>
                      <th>Counterparty</th>
                      <th>Meetup Location</th>
                      <th style={{ textAlign: 'right' }}>Agreed Amount</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userMeetups.map((m) => {
                      const isBuyer = m.buyerId === currentUser?.id;
                      const counterpartyName = isBuyer ? m.sellerName : m.buyerName;
                      const priceVal = Number(m.finalPrice || m.amount || 0);

                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {m.listingImage && m.listingImage.trim() !== '' ? (
                                <img
                                  src={m.listingImage}
                                  alt={m.listingTitle}
                                  style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle, #E2E8F0)' }}
                                />
                              ) : (
                                <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle, #F8FAFC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                                  <ShoppingBag size={18} />
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <div
                                  onClick={() => onNavigate('item-detail', { id: m.listingId })}
                                  style={{ fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}
                                  title={m.listingTitle}
                                >
                                  {m.listingTitle}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                                  {m.referenceNo || `REF-${m.id.substring(0, 8).toUpperCase()}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: isBuyer ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 43, 127, 0.1)',
                                color: isBuyer ? 'var(--accent-green, #059669)' : 'var(--uc-blue, #002B7F)'
                              }}
                            >
                              {isBuyer ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                              {isBuyer ? 'Buyer' : 'Seller'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {counterpartyName || 'UC Peer'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {m.campus || targetUser.campus}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={12} color="var(--uc-blue)" /> {m.landmarkSpot || 'Campus Spot'}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {m.createdAt ? formatRelativeTime(m.createdAt) : 'Recent trade'}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: isBuyer ? 'var(--accent-red, #DC2626)' : 'var(--accent-green, #059669)' }}>
                              ₱{priceVal.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                              {m.paymentMethod || 'cash'}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'capitalize',
                                backgroundColor: m.status === 'completed' ? 'rgba(5, 150, 105, 0.12)' : m.status === 'cancelled' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(255, 199, 44, 0.2)',
                                color: m.status === 'completed' ? 'var(--accent-green, #059669)' : m.status === 'cancelled' ? 'var(--accent-red, #DC2626)' : '#B45309'
                              }}
                            >
                              {m.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => onNavigate('item-detail', { id: m.listingId })}
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                                title="View listing detail"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => onNavigate('transactions')}
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                                title="Open transaction ledger"
                              >
                                <Receipt size={12} /> Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid-responsive-transactions">
                {userMeetups.map((m) => (
                  <div
                    key={m.id}
                    className="clean-card card-interactive"
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'center',
                      padding: '0.9rem 1rem',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle, #E2E8F0)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                    onClick={() => onNavigate('item-detail', { id: m.listingId })}
                  >
                    {m.listingImage && m.listingImage.trim() !== '' ? (
                      <img src={m.listingImage} alt={m.listingTitle} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                        <ShoppingBag size={22} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.listingTitle}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} /> <span>{m.landmarkSpot}</span> • <span style={{ textTransform: 'capitalize' }}>{m.status}</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '3px', color: m.buyerId === currentUser?.id ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        ₱{Number(m.finalPrice || m.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
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

      {/* TAB 5: REVIEWS & REPUTATION */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Seller Reputation Summary Scorecard */}
          <div
            className="clean-card"
            style={{
              padding: '1.5rem',
              border: '1.5px solid var(--border-subtle, #E2E8F0)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center',
              borderRadius: '16px'
            }}
          >
            {/* Overall Rating Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0.5rem', borderRight: '1px solid var(--border-subtle, #E2E8F0)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary, #0F172A)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {rating.toFixed(1)}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', color: '#F59E0B' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(rating) ? '#F59E0B' : 'transparent'}
                    color="#F59E0B"
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                Based on {userReviews.length} Verified Student Ratings
              </div>
            </div>

            {/* Peer Endorsement Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Seller Highlights
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                  Fast Responder
                </span>
                <span style={{ backgroundColor: 'var(--accent-green-subtle, #ECFDF5)', color: 'var(--accent-green, #059669)', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                  Punctual Meetups
                </span>
                <span style={{ backgroundColor: 'rgba(255, 199, 44, 0.15)', color: '#B45309', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                  Accurately Described
                </span>
                <span style={{ backgroundColor: 'var(--bg-subtle, #F8FAFC)', color: 'var(--text-secondary, #334155)', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                  Verified Peer
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills for Reviews */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'all', label: `All Reviews (${userReviews.length})` },
              { id: 'seller', label: 'As Seller' },
              { id: 'buyer', label: 'As Buyer' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setReviewFilter(f.id as any)}
                className={`segmented-tab ${reviewFilter === f.id ? 'active' : ''}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredReviews.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filteredReviews.map((rev) => (
                <div key={rev.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', borderRadius: '14px' }}>
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
                          {rev.reviewerCampus} • {formatRelativeTime(rev.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#F59E0B' }}>
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    "{rev.comment}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                    <span>Item: <strong>{rev.itemTitle}</strong></span>
                    <span>•</span>
                    <span>Trade Type: <strong>{rev.tradeType}</strong></span>
                    {rev.wasPunctual && <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>• Punctual Meetup</span>}
                    {rev.traitBadges?.map((badge, idx) => (
                      <span key={idx} style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Star size={28} />
              </div>
              <h4 className="empty-state-title">No Peer Reviews Yet</h4>
              <p className="empty-state-desc">
                Ratings and comments from other students after completing transactions will be published here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: FLASH REQUESTS */}
      {(activeTab === 'flash' || activeTab === 'wanted') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userFlash.length > 0 ? (
            <div className="grid-responsive-wanted">
              {userFlash.map((w) => (
                <div key={w.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '14px', borderLeft: '4px solid var(--uc-gold)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <CampusBadge campus={w.preferredCampus} size="sm" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
                      {w.targetBudget <= 0 && w.targetBudget !== 0 ? (
                        <span style={{ color: 'var(--accent-green, #059669)' }}>FREE / Donation</span>
                      ) : w.targetBudget === 0 ? (
                        <span style={{ color: '#D97706' }}>Open to Offers</span>
                      ) : (
                        `₱${w.targetBudget.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} color="var(--uc-gold)" />
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{w.itemTitle}</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{w.description}</p>
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
                <Zap size={28} color="var(--uc-gold)" />
              </div>
              <h4 className="empty-state-title">No Open Flash Requests</h4>
              <p className="empty-state-desc">
                Post urgent needs for books, tools, or uniform parts so other students on campus can offer them quickly.
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

      {/* EDIT STUDENT PROFILE MODAL */}
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
              rows={2}
              placeholder="Tell fellow students what courses, books, or gear you trade..."
              className="clean-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Profile Photo (Upload File)
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
                  Clear Photo
                </button>
              )}
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

          {/* TRADING PREFERENCES */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Marketplace Trade Preferences
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Preferred Campus Meetup Spots
              </label>
              <input
                type="text"
                value={editMeetupSpots}
                onChange={(e) => setEditMeetupSpots(e.target.value)}
                placeholder="Preferred meetup locations"
                className="clean-input"
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Where you feel most comfortable meeting classmates for exchanges.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Available Trading Hours
              </label>
              <input
                type="text"
                value={editTradingHours}
                onChange={(e) => setEditTradingHours(e.target.value)}
                placeholder="e.g. Mon – Fri: 11:30 AM – 5:30 PM (Between classes)"
                className="clean-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Payment Preferences (Cash, e-Wallets & Bank Transfer)
              </label>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.55rem' }}>
                Select the payment methods you accept for trades. Card payments are excluded as transactions are settled directly peer-to-peer.
              </div>
              <PaymentMethodCheckboxGroup
                selectedMethods={editPaymentMethods}
                onChange={setEditPaymentMethods}
              />
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
