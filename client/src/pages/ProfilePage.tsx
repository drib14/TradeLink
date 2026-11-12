import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useFlashMarket } from '../context/FlashMarketContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { UserAvatar } from '../components/common/UserAvatar';
import { CampusBadge } from '../components/common/CampusBadge';
import { TradeLinkIcon } from '../components/common/TradeLinkIcon';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Modal } from '../components/common/Modal';
import { DepartmentDropdown } from '../components/common/DepartmentDropdown';
import { CustomSelect, SelectOption } from '../components/common/CustomSelect';
import { api } from '../services/api';
import { reviewsService } from '../services/reviews.service';
import { usersService } from '../services/users.service';
import { User, Listing, Review, FlashRequest } from '../types';
import { formatRelativeTime } from '../utils/date';
import {
  ShieldCheck,
  Star,
  Clock,
  Edit3,
  MessageSquare,
  Search,
  ShoppingBag,
  CheckCircle2,
  Eye,
  X,
  Bookmark,
  Receipt,
  Settings,
  Save,
  MapPin,
  Camera,
  User as UserIcon,
  PlusCircle,
  RotateCcw,
  CreditCard,
  PackageCheck,
  Share2,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Sparkles,
  List,
  Lock,
  EyeOff,
  Key,
  LayoutGrid,
  TrendingUp,
  BarChart3,
  PieChart,
  Award,
  DollarSign,
  Layers,
  Calendar,
  ChevronRight,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { StudentVerificationModal } from '../components/verification/StudentVerificationModal';
import { maskStudentId } from '../utils/security';
import { PaymentMethodBadge } from '../components/common/PaymentLogos';

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
    if (userId && !isLoadingUser && !targetUser) {
      onNavigate('not-found');
    }
  }, [userId, isLoadingUser, targetUser, onNavigate]);

  const isSelf = !!currentUser && !!targetUser && currentUser.id === targetUser.id;

  // Tabs state: owner defaults to 'analytics', visitor defaults to 'listings'
  const [activeTab, setActiveTab] = useState<'analytics' | 'listings' | 'sold' | 'saved' | 'transactions' | 'reviews' | 'about'>(
    isSelf ? 'analytics' : 'listings'
  );

  useEffect(() => {
    setActiveTab(isSelf ? 'analytics' : 'listings');
  }, [targetUser?.id, isSelf]);

  const [listingFilter, setListingFilter] = useState<'all' | 'buy_sell' | 'swap' | 'free_donation' | 'sold'>('all');
  const [bioInput, setBioInput] = useState(targetUser?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);

  // In-store search & sort state
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSort, setStoreSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'seller' | 'buyer'>('all');
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'table'>('grid');

  // Interactive Chart selection state (default to latest month)
  const [selectedChartPoint, setSelectedChartPoint] = useState<number>(5);

  // Edit Profile Modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(targetUser?.name || '');
  const [editBio, setEditBio] = useState(targetUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(targetUser?.avatar || '');
  const [editDepartment, setEditDepartment] = useState(targetUser?.department || '');
  const [editMeetupSpots, setEditMeetupSpots] = useState(targetUser?.preferredMeetupSpots || '');
  const [editTradingHours, setEditTradingHours] = useState(targetUser?.tradingHours || '');
  const [editPaymentMethods, setEditPaymentMethods] = useState<('cash' | 'gcash' | 'maya' | 'bank_transfer')[]>(
    parsePaymentMethods(targetUser?.paymentMethods)
  );

  // Separate Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (targetUser) {
      setBioInput(targetUser.bio || '');
      setEditName(targetUser.name || '');
      setEditBio(targetUser.bio || '');
      setEditAvatar(targetUser.avatar || '');
      setEditDepartment(targetUser.department || '');
      setEditMeetupSpots(targetUser.preferredMeetupSpots || '');
      setEditTradingHours(targetUser.tradingHours || '');
      setEditPaymentMethods(parsePaymentMethods(targetUser.paymentMethods));
    }
  }, [targetUser]);

  const [userAnalytics, setUserAnalytics] = useState<{
    completedTrades: number;
    totalTradeVolume: number;
    activeListings: number;
    activeInventoryValue: number;
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
  const userMeetups = meetups.filter((m) => m.sellerId === targetUser?.id || m.buyerId === targetUser?.id);

  // Calculate Marketplace Statistics dynamically
  const activeInventoryValue = userAnalytics?.activeInventoryValue ?? userActiveListings.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const completedTradesCount = Number(userAnalytics?.completedTrades ?? targetUser?.completedTrades ?? userSoldListings.length);
  const totalReviewsCount = Number(userAnalytics?.reviewsCount ?? targetUser?.totalReviews ?? userReviews.length);
  const rating = totalReviewsCount > 0
    ? Number(userAnalytics?.rating ?? targetUser?.rating ?? 0.0)
    : 0.0;

  // Total trade volume (₱)
  const totalTradeVolume = Number(
    userAnalytics?.totalTradeVolume ?? (
      userSoldListings.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0) +
      userMeetups.filter(m => m.status === 'completed').reduce((sum, m) => sum + (Number(m.finalPrice || m.amount) || 0), 0)
    )
  );

  // Category palette & distribution for data visualization
  const categoryPalette: Record<string, string> = {
    'Textbooks & Reviewers': '#002B7F',
    'Uniforms & Apparel': '#D97706',
    'Electronics & Gadgets': '#2563EB',
    'Calculators & Electronics': '#0284C7',
    'Fashion & Sneakers': '#4F46E5',
    'Music & Instruments': '#7C3AED',
    'Audio & Gadgets': '#0EA5E9',
    'Dorm & Living': '#EA580C',
    'Gaming & Tech': '#10B981',
    'Medical Equipment': '#059669',
    'General Supplies': '#64748B'
  };

  const getCategoryColor = (name: string) => {
    if (categoryPalette[name]) return categoryPalette[name];
    const colors = ['#002B7F', '#1E40AF', '#2563EB', '#3B82F6', '#0284C7', '#0F766E', '#059669', '#D97706', '#EA580C', '#4F46E5', '#64748B'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const categoryStats = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    const allUserListings = [...userActiveListings, ...userSoldListings];

    allUserListings.forEach((item) => {
      const cat = item.category || 'Other Campus Items';
      if (!counts[cat]) {
        counts[cat] = { count: 0, value: 0 };
      }
      counts[cat].count += 1;
      counts[cat].value += Number(item.price || 0) * (Number(item.quantity) || 1);
    });

    const totalItems = allUserListings.length || 1;
    const entries = Object.entries(counts).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      percentage: Math.max(1, Math.round((data.count / totalItems) * 100)),
      color: getCategoryColor(name)
    }));

    if (entries.length === 0) {
      return [
        { name: 'Textbooks & Reviewers', count: 0, value: 0, percentage: 0, color: '#002B7F' },
        { name: 'Uniforms & Scrubs', count: 0, value: 0, percentage: 0, color: '#D97706' },
        { name: 'Electronics & Gadgets', count: 0, value: 0, percentage: 0, color: '#2563EB' }
      ];
    }

    return entries.sort((a, b) => b.count - a.count);
  }, [userActiveListings, userSoldListings]);

  // Commerce Mode Breakdown (Sale vs Swap vs Free)
  const tradeModeStats = useMemo(() => {
    const total = userActiveListings.length || 1;
    const sale = userActiveListings.filter((l) => l.tradeMode === 'buy_sell').length;
    const swap = userActiveListings.filter((l) => l.tradeMode === 'swap').length;
    const free = userActiveListings.filter((l) => l.tradeMode === 'free_donation').length;
    return {
      sale,
      salePct: userActiveListings.length > 0 ? Math.round((sale / total) * 100) : 0,
      swap,
      swapPct: userActiveListings.length > 0 ? Math.round((swap / total) * 100) : 0,
      free,
      freePct: userActiveListings.length > 0 ? Math.round((free / total) * 100) : 0
    };
  }, [userActiveListings]);

  // Peer Trust & Star Breakdown
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    userReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
      dist[star] += 1;
    });
    const total = userReviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: dist[star as 1 | 2 | 3 | 4 | 5],
      pct: userReviews.length > 0 ? Math.round((dist[star as 1 | 2 | 3 | 4 | 5] / total) * 100) : (star === 5 && rating >= 4.5 ? 100 : 0)
    }));
  }, [userReviews, rating]);

  const positiveReviewsCount = useMemo(() => {
    return userReviews.filter((r) => Number(r.rating) >= 4).length;
  }, [userReviews]);

  const positivePct = useMemo(() => {
    if (userReviews.length === 0) return null;
    return Math.round((positiveReviewsCount / userReviews.length) * 100);
  }, [positiveReviewsCount, userReviews.length]);

  // Dynamic rolling 6-month timeline data for the SVG area chart
  const timelineData = useMemo(() => {
    const now = new Date();
    const months: { key: string; month: string; volume: number; trades: number }[] = [];

    // Rolling 6 calendar months up to the current month
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      months.push({ key, month: monthLabel, volume: 0, trades: 0 });
    }

    // Aggregate sold listings by month
    userSoldListings.forEach((item) => {
      const dStr = (item as any).soldAt || item.updatedAt || item.createdAt;
      if (dStr) {
        const itemDate = new Date(dStr);
        if (!isNaN(itemDate.getTime())) {
          const itemKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
          const target = months.find((m) => m.key === itemKey);
          if (target) {
            target.volume += (Number(item.price) || 0) * (Number(item.quantity) || 1);
            target.trades += 1;
          }
        }
      }
    });

    // Aggregate completed meetups by month
    userMeetups
      .filter((m) => m.status === 'completed')
      .forEach((m) => {
        const dStr = m.completedAt || m.scheduledDateTime || m.createdAt;
        if (dStr) {
          const mDate = new Date(dStr);
          if (!isNaN(mDate.getTime())) {
            const mKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`;
            const target = months.find((entry) => entry.key === mKey);
            if (target) {
              target.volume += Number(m.finalPrice || m.amount) || 0;
              target.trades += 1;
            }
          }
        }
      });

    return months;
  }, [userSoldListings, userMeetups]);

  // SVG Chart Calculation Helpers
  const chartW = 560;
  const chartH = 190;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 32;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;
  const maxTimelineVolume = Math.max(...timelineData.map((d) => d.volume), 1000);

  const chartCoords = timelineData.map((d, i) => {
    const x = padLeft + (i / (timelineData.length - 1)) * innerW;
    const y = padTop + innerH - (d.volume / maxTimelineVolume) * innerH;
    return { x, y, ...d };
  });

  let splinePathD = `M ${chartCoords[0].x} ${chartCoords[0].y}`;
  for (let i = 0; i < chartCoords.length - 1; i++) {
    const curr = chartCoords[i];
    const next = chartCoords[i + 1];
    const cpX = (curr.x + next.x) / 2;
    splinePathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }
  const areaPathD = `${splinePathD} L ${chartCoords[chartCoords.length - 1].x} ${padTop + innerH} L ${chartCoords[0].x} ${padTop + innerH} Z`;

  // In-store filter counts
  const saleCount = userActiveListings.filter((l) => l.tradeMode === 'buy_sell').length;
  const swapCount = userActiveListings.filter((l) => l.tradeMode === 'swap').length;
  const freeCount = userActiveListings.filter((l) => l.tradeMode === 'free_donation').length;

  // Filtered listings based on mode/status, in-store search, and sort
  const filteredActiveListings = useMemo(() => {
    const sourceList = listingFilter === 'sold' ? userSoldListings : userActiveListings;
    return sourceList
      .filter((l) => {
        if (listingFilter !== 'all' && listingFilter !== 'sold' && l.tradeMode !== listingFilter) return false;
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
  }, [userActiveListings, userSoldListings, listingFilter, storeSearch, storeSort]);

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
      department: editDepartment.trim() || undefined,
      preferredMeetupSpots: editMeetupSpots.trim(),
      tradingHours: editTradingHours.trim(),
      paymentMethods: editPaymentMethods.join(', ')
    });
    setIsEditProfileModalOpen(false);
    showToast('Profile Updated', 'Your profile details and trading preferences have been saved.', 'success');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Current Password Required', 'Please enter your current password.', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password Too Short', 'New password must be at least 8 characters long.', 'warning');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(newPassword)) {
      showToast('Weak Password', 'New password must contain uppercase, lowercase, number, and special character.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords Do Not Match', 'New password and confirmation must match.', 'warning');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('Same Password', 'New password cannot be the same as your current password.', 'warning');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      showToast('Password Changed', 'Your account password has been updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Incorrect current password. Please try again.';
      showToast('Update Failed', msg, 'error');
    } finally {
      setIsChangingPassword(false);
    }
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
            <TradeLinkIcon size={56} />
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
                Sign In to View Your Profile
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748B)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Sign in to manage your listings, view trade activity, and communicate with campus peers.
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
    <div className="container page-enter" style={{ paddingTop: 'clamp(1rem, 2.5vw, 1.75rem)', paddingBottom: '5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. SIMPLIFIED & RESPONSIVE STUDENT PROFILE HERO CARD */}
      <div className="profile-card-hero">
        {/* Campus Cover Banner */}
        <div className="profile-cover-banner">
          <CampusBadge campus={targetUser.campus} size="sm" />
        </div>

        {/* Profile Details Container */}
        <div className="profile-details-wrapper">
          {/* Avatar, Identity & Primary Actions Row */}
          <div className="profile-avatar-row">
            <div className="profile-avatar-and-info">
              {/* Avatar with optional edit badge for owner */}
              <div className="profile-avatar-container">
                <UserAvatar
                  src={targetUser.avatar}
                  name={targetUser.name}
                  size={92}
                  style={{
                    border: '4px solid var(--bg-surface, #FFFFFF)',
                    boxShadow: '0 6px 20px rgba(0, 43, 127, 0.2)'
                  }}
                />
                {isSelf && (
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    title="Change Profile Photo"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--uc-blue, #002B7F)',
                      color: '#FFFFFF',
                      border: '2px solid #FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Camera size={13} />
                  </button>
                )}
              </div>

              {/* Student Identity Column */}
              <div className="profile-identity-col">
                <div className="profile-name-row">
                  <h1 className="profile-name-title">{targetUser.name}</h1>
                  {targetUser.isVerified && (
                    <VerifiedBadge size="sm" variant="green" />
                  )}
                </div>

                <div className="profile-meta-chips">
                  <span className="profile-meta-chip" style={{ backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', fontWeight: 800, borderColor: 'rgba(0, 43, 127, 0.2)' }}>
                    ID: {maskStudentId(targetUser.studentId, isSelf)}
                  </span>
                  <span className="profile-meta-chip">{targetUser.campus}</span>
                  {targetUser.department && <span className="profile-meta-chip">{targetUser.department}</span>}
                </div>

                {/* Rating & Trust Line */}
                <div className="profile-reputation-chip">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: rating > 0 ? '#D97706' : 'var(--text-muted)', fontWeight: 800 }}>
                    <Star size={13} fill={rating > 0 ? '#D97706' : 'transparent'} color={rating > 0 ? '#D97706' : 'var(--text-muted)'} />
                    {rating > 0 ? rating.toFixed(1) : '0.0'}
                  </span>
                  <span>&bull;</span>
                  <span>{totalReviewsCount} {totalReviewsCount === 1 ? 'Review' : 'Reviews'}</span>
                  <span>&bull;</span>
                  <span style={{ color: 'var(--accent-green, #059669)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-green, #059669)' }} />
                    Active Trader
                  </span>
                  <span>&bull;</span>
                  <span>Joined {targetUser.joinedDate ? new Date(targetUser.joinedDate).getFullYear() : new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons (Fully responsive) */}
            <div className="profile-actions-group">
              {!isSelf ? (
                <>
                  <button
                    onClick={handleStartChatWithUser}
                    className="btn-primary"
                  >
                    <MessageSquare size={16} /> Message Seller
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="btn-secondary"
                  >
                    {isCopiedLink ? <Check size={15} color="var(--accent-green)" /> : <Share2 size={15} />}
                    <span>{isCopiedLink ? 'Copied' : 'Share'}</span>
                  </button>
                </>
              ) : (
                <>
                  {!targetUser.isVerified && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="btn-primary"
                      style={{
                        backgroundColor: 'var(--uc-blue, #002B7F)',
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 4px 12px rgba(0, 43, 127, 0.22)'
                      }}
                    >
                      <ShieldCheck size={16} color="#FFC72C" />
                      <span>Verify Student ID</span>
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate('create-listing')}
                    className="btn-gold"
                  >
                    <PlusCircle size={16} /> Post Item
                  </button>
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="btn-secondary"
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="btn-secondary"
                    title="Change Account Password"
                  >
                    <Key size={15} /> Change Password
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="btn-secondary"
                    title="Share Profile Link"
                  >
                    {isCopiedLink ? <Check size={15} color="var(--accent-green)" /> : <Share2 size={15} />}
                    <span>{isCopiedLink ? 'Copied' : 'Share'}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('settings')}
                    className="btn-ghost"
                    title="Account Settings"
                    style={{ minHeight: '44px', padding: '0 0.85rem' }}
                  >
                    <Settings size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Student Bio */}
          <div style={{ backgroundColor: 'var(--bg-subtle, #F8FAFC)', borderRadius: '12px', padding: '0.85rem 1.15rem', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
            {isEditingBio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={2}
                  className="clean-input"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Share what items or course gear you trade..."
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.84rem', color: targetUser.bio ? 'var(--text-secondary, #334155)' : 'var(--text-muted, #94A3B8)', lineHeight: 1.5, margin: 0 }}>
                  {targetUser.bio || (isSelf ? 'No bio added yet. Add a short bio to let classmates know what textbooks or gear you trade!' : 'No bio provided yet.')}
                </p>
                {isSelf && !targetUser.bio && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="btn-ghost"
                    style={{ fontSize: '0.76rem', color: 'var(--uc-blue)', fontWeight: 700, padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}
                  >
                    + Add Bio
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. GLANCEABLE METRICS (Owner) VS TRUST CARD (Visitor) */}
          {!isSelf ? (
            <div className="visitor-trust-strip">
              <div className="visitor-trust-badge">
                <div className="visitor-trust-badge-icon" style={{ backgroundColor: 'rgba(0, 43, 127, 0.1)', color: 'var(--uc-blue, #002B7F)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>Verified Student</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>University ID Confirmed</div>
                </div>
              </div>

              <div className="visitor-trust-badge">
                <div className="visitor-trust-badge-icon" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)', color: 'var(--accent-green, #059669)' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>Designated Meetups</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Safe On-Campus Handovers</div>
                </div>
              </div>

              <div className="visitor-trust-badge">
                <div className="visitor-trust-badge-icon" style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}>
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>In-Person Inspect</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cash on Handover</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-metrics-bar">
              <div className="profile-metric-item">
                <span className="profile-metric-label">Active Items</span>
                <span className="profile-metric-value" style={{ color: 'var(--uc-blue, #002B7F)' }}>
                  {userActiveListings.length}
                </span>
                <span className="profile-metric-sub">
                  ₱{activeInventoryValue.toLocaleString()} value
                </span>
              </div>

              <div className="profile-metric-item">
                <span className="profile-metric-label">Fulfilled Trades</span>
                <span className="profile-metric-value" style={{ color: 'var(--accent-green, #059669)' }}>
                  {completedTradesCount}
                </span>
                <span className="profile-metric-sub">
                  Campus handovers
                </span>
              </div>

              <div className="profile-metric-item">
                <span className="profile-metric-label">Peer Rating</span>
                <span className="profile-metric-value" style={{ color: rating > 0 ? '#D97706' : 'var(--text-muted)' }}>
                  {rating > 0 ? rating.toFixed(1) : '5.0'} <Star size={13} fill={rating > 0 ? '#D97706' : 'transparent'} color={rating > 0 ? '#D97706' : 'var(--text-muted)'} />
                </span>
                <span className="profile-metric-sub">
                  {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <div className="profile-metric-item">
                <span className="profile-metric-label">Trade Volume</span>
                <span className="profile-metric-value" style={{ color: 'var(--uc-blue, #002B7F)' }}>
                  ₱{totalTradeVolume.toLocaleString()}
                </span>
                <span className="profile-metric-sub">
                  Campus commerce
                </span>
              </div>
            </div>
          )}

          {/* 3. COMPACT CAMPUS MEETUP STRIP */}
          <div className="profile-meetup-strip">
            <div className="profile-meetup-item">
              <MapPin size={16} className="profile-meetup-icon" />
              <div>
                <div className="profile-meetup-title">Meetup Spot</div>
                <div className="profile-meetup-desc">
                  {targetUser.preferredMeetupSpots || 'Campus Canteen • Library Entrance • Study Lounge'}
                </div>
              </div>
            </div>

            <div className="profile-meetup-item">
              <Clock size={16} className="profile-meetup-icon" />
              <div>
                <div className="profile-meetup-title">Trading Window</div>
                <div className="profile-meetup-desc">
                  {targetUser.tradingHours || 'Mon – Fri: 11:30 AM – 5:30 PM (Between classes)'}
                </div>
              </div>
            </div>

            <div className="profile-meetup-item">
              <CreditCard size={16} className="profile-meetup-icon" />
              <div>
                <div className="profile-meetup-title">Accepted Payments</div>
                <div className="profile-meetup-desc" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                  {parsePaymentMethods(targetUser.paymentMethods).map((method) => (
                    <PaymentMethodBadge key={method} method={method} size="xs" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Notice Banner for Unverified Owner */}
      {isSelf && !targetUser.isVerified && (
        <div
          style={{
            backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)',
            border: '1px solid var(--uc-blue-border, #BCD1F7)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--uc-blue, #002B7F)',
                color: '#FFC72C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--uc-blue, #002B7F)' }}>
                Activate Your Verified Student Badge
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #334155)', marginTop: '2px' }}>
                Verify your student identity with your physical UC Student ID and Certificate of Registration (COR).
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="btn-primary"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              backgroundColor: 'var(--uc-blue, #002B7F)',
              color: '#FFFFFF',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ShieldCheck size={15} color="#FFC72C" />
            <span>Verify ID Now</span>
          </button>
        </div>
      )}

      {/* 4. PROFILE NAVIGATION TABS (Mobile-First Touch Scrolling) */}
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
        {isSelf && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`segmented-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{ fontWeight: 800 }}
          >
            <TrendingUp size={14} style={{ flexShrink: 0 }} />
            <span>Trading Analytics</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('listings')}
          className={`segmented-tab ${activeTab === 'listings' ? 'active' : ''}`}
        >
          <ShoppingBag size={14} style={{ flexShrink: 0 }} />
          <span>{isSelf ? 'My Listings' : 'Listings'} ({userActiveListings.length})</span>
        </button>

        {(isSelf || userSoldListings.length > 0) && (
          <button
            onClick={() => setActiveTab('sold')}
            className={`segmented-tab ${activeTab === 'sold' ? 'active' : ''}`}
          >
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>Sold Items ({userSoldListings.length})</span>
          </button>
        )}

        {isSelf && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`segmented-tab ${activeTab === 'saved' ? 'active' : ''}`}
          >
            <Bookmark size={14} style={{ flexShrink: 0 }} />
            <span>Saved ({userSavedListings.length})</span>
          </button>
        )}

        {isSelf && (
          <button
            onClick={() => setActiveTab('transactions')}
            className={`segmented-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          >
            <Receipt size={14} style={{ flexShrink: 0 }} />
            <span>Transactions ({userMeetups.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('reviews')}
          className={`segmented-tab ${activeTab === 'reviews' ? 'active' : ''}`}
        >
          <Star size={14} style={{ flexShrink: 0 }} />
          <span>Reviews ({userReviews.length})</span>
        </button>

        {!isSelf && (
          <button
            onClick={() => setActiveTab('about')}
            className={`segmented-tab ${activeTab === 'about' ? 'active' : ''}`}
          >
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>About Seller</span>
          </button>
        )}
      </div>

      {/* 5. TAB CONTENT AREAS */}

      {/* TAB 0: TRADING ANALYTICS DASHBOARD (Exclusively for Profile Owner) */}
      {activeTab === 'analytics' && isSelf && (
        <div className="profile-analytics-dashboard">
          {/* 1. KPI SUMMARY STATS CARDS (4 Cards) */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Total Trade Volume
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                  ₱{totalTradeVolume.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <TrendingUp size={12} /> Fulfilled campus commerce
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(0, 43, 127, 0.08)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} />
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Active Inventory
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                  ₱{activeInventoryValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {userActiveListings.length} items listed on campus
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(255, 199, 44, 0.2)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PackageCheck size={22} />
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Completed Trades
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-green, #059669)', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                  {completedTradesCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Peer handovers fulfilled
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(5, 150, 105, 0.1)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} />
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Trust &amp; Rating
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: rating > 0 ? '#D97706' : 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                  {rating > 0 ? `${rating.toFixed(1)} ★` : 'New Member'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {totalReviewsCount > 0 ? (
                    <>
                      {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'} &bull; {positivePct !== null ? `${positivePct}% positive` : 'Verified feedback'}
                    </>
                  ) : (
                    'Awaiting first peer review'
                  )}
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} />
              </div>
            </div>
          </div>

          {/* 2. MAIN VISUAL GRID: INTERACTIVE SVG AREA CHART & CATEGORY DISTRIBUTION */}
          <div className="analytics-visual-grid">
            {/* LEFT: INTERACTIVE SVG VOLUME & ACTIVITY CHART */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3 className="analytics-card-title">
                    <TrendingUp size={18} color="var(--uc-blue)" />
                    Trading Activity &amp; Handover Volume
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Monthly transaction volume and peer handovers over time
                  </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--uc-blue)' }}>
                  <Calendar size={12} /> Last 6 Months
                </div>
              </div>

              {/* Selected Point Summary Card */}
              {timelineData[selectedChartPoint] && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', borderRadius: '12px', border: '1px solid rgba(0, 43, 127, 0.15)' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--uc-blue)' }}>
                      Selected Month: {timelineData[selectedChartPoint].month}
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      ₱{timelineData[selectedChartPoint].volume.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--uc-blue)' }}>
                      {timelineData[selectedChartPoint].trades} Campus {timelineData[selectedChartPoint].trades === 1 ? 'Trade' : 'Trades'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Avg. ₱{Math.round(timelineData[selectedChartPoint].volume / (timelineData[selectedChartPoint].trades || 1)).toLocaleString()} / exchange
                    </div>
                  </div>
                </div>
              )}

              {/* SVG Area Spline Chart Container */}
              <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  <defs>
                    <linearGradient id="chartGradientArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002B7F" stopOpacity="0.28" />
                      <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#002B7F" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* Horizontal Guideline lines */}
                  {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const lineY = padTop + innerH - ratio * innerH;
                    const val = Math.round((ratio * maxTimelineVolume) / 500) * 500;
                    return (
                      <g key={idx}>
                        <line
                          x1={padLeft}
                          y1={lineY}
                          x2={chartW - padRight}
                          y2={lineY}
                          stroke="#E2E8F0"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={padLeft - 8}
                          y={lineY + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94A3B8"
                          fontWeight="600"
                        >
                          ₱{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline */}
                  <line
                    x1={padLeft}
                    y1={padTop + innerH}
                    x2={chartW - padRight}
                    y2={padTop + innerH}
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />

                  {/* Gradient Area Fill */}
                  <path d={areaPathD} fill="url(#chartGradientArea)" />

                  {/* Smooth Spline Curve Line */}
                  <path
                    d={splinePathD}
                    fill="none"
                    stroke="#002B7F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Nodes and Month Labels */}
                  {chartCoords.map((point, index) => {
                    const isSelected = selectedChartPoint === index;
                    return (
                      <g
                        key={index}
                        onClick={() => setSelectedChartPoint(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Month Axis Label */}
                        <text
                          x={point.x}
                          y={chartH - 8}
                          textAnchor="middle"
                          fontSize="11"
                          fill={isSelected ? '#002B7F' : '#64748B'}
                          fontWeight={isSelected ? '800' : '600'}
                        >
                          {point.month}
                        </text>

                        {/* Interactive Click Area */}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="16"
                          fill="transparent"
                        />

                        {/* Outer Glow Ring on Selected */}
                        {isSelected && (
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="9"
                            fill="rgba(0, 43, 127, 0.2)"
                            stroke="#002B7F"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Data Node Circle */}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isSelected ? '5.5' : '4'}
                          fill={isSelected ? '#FFC72C' : '#FFFFFF'}
                          stroke="#002B7F"
                          strokeWidth={isSelected ? '3' : '2.5'}
                          filter="url(#nodeShadow)"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Footer Highlights */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>💡 Tap any month node to view breakdown</span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Peak Activity: Midterm &amp; Finals Season
                </span>
              </div>
            </div>

            {/* RIGHT: CATEGORY DISTRIBUTION BREAKDOWN */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3 className="analytics-card-title">
                    <PieChart size={18} color="var(--uc-blue)" />
                    Inventory by Category
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Distribution of your active &amp; completed listings
                  </p>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  {categoryStats.length} Categories
                </span>
              </div>

              {/* Multi-segment Color Track */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="category-progress-track">
                  {categoryStats.map((cat, i) => (
                    <div
                      key={i}
                      className="category-progress-fill"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                      title={`${cat.name}: ${cat.count} items (${cat.percentage}%)`}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>0%</span>
                  <span>Campus Inventory Share</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Category Legend List */}
              <div className="category-legend-grid">
                {categoryStats.map((cat, i) => (
                  <div key={i} className="category-legend-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <span className="category-dot" style={{ backgroundColor: cat.color }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, fontWeight: 800 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{cat.count}</span>
                      <span style={{ color: cat.color, fontSize: '0.76rem' }}>{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '12px', fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={15} color="var(--uc-blue)" style={{ flexShrink: 0 }} />
                <span>Textbooks &amp; uniforms represent your most requested student items on campus.</span>
              </div>
            </div>
          </div>

          {/* 3. SECONDARY ROW: COMMERCE MODE SPLIT & TRUST / RATING SCORECARD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
            {/* COMMERCE MODE SPLIT (Sale vs Swap vs Free) */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3 className="analytics-card-title">
                    <Layers size={18} color="var(--uc-blue)" />
                    Commerce &amp; Barter Mode Split
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    How you share &amp; trade items across the student body
                  </p>
                </div>
              </div>

              {/* Progress bars for 3 modes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B45309' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                      Buy &amp; Sell (Cash)
                    </span>
                    <span>{tradeModeStats.sale} items ({tradeModeStats.salePct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tradeModeStats.salePct}%`, backgroundColor: '#D97706', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--uc-blue)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--uc-blue)' }} />
                      Campus Swaps &amp; Barter
                    </span>
                    <span>{tradeModeStats.swap} items ({tradeModeStats.swapPct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tradeModeStats.swapPct}%`, backgroundColor: 'var(--uc-blue)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-green)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)' }} />
                      Free Gift / Reviewers
                    </span>
                    <span>{tradeModeStats.free} items ({tradeModeStats.freePct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tradeModeStats.freePct}%`, backgroundColor: 'var(--accent-green)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ padding: '0.45rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#B45309' }}>{saleCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>For Sale</div>
                </div>
                <div style={{ padding: '0.45rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--uc-blue)' }}>{swapCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Swaps</div>
                </div>
                <div style={{ padding: '0.45rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--accent-green)' }}>{freeCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Free</div>
                </div>
              </div>
            </div>

            {/* PEER TRUST & RATINGS SCORECARD */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3 className="analytics-card-title">
                    <ShieldCheck size={18} color="var(--accent-green)" />
                    Peer Trust &amp; Reliability Scorecard
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Student reputation &amp; punctuality metrics
                  </p>
                </div>
              </div>

              {/* Overall Score Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                    {rating > 0 ? rating.toFixed(1) : '5.0'}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: '#F59E0B', justifyContent: 'center', marginTop: '0.35rem' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {totalReviewsCount} {totalReviewsCount === 1 ? 'Rating' : 'Ratings'}
                  </div>
                </div>

                {/* 5-Star distribution horizontal progress bars */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {ratingDistribution.map((item) => (
                    <div key={item.star} className="rating-row-bar">
                      <span style={{ width: '24px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        {item.star}<Star size={10} fill="#F59E0B" color="#F59E0B" />
                      </span>
                      <div className="rating-bar-track">
                        <div className="rating-bar-fill" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span style={{ width: '28px', textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Trust Metrics Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--accent-green)' }}>99%</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Meetup Punctuality</div>
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--uc-blue)' }}>&lt; 15 min</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Avg. Response</div>
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--accent-green)' }}>Clean</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Honor Code</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT AREAS */}

      {/* TAB 1: ACTIVE LISTINGS */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Store Toolbar: Search & Filter Pills */}
          <div className="profile-store-toolbar">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Active (${userActiveListings.length})` },
                { id: 'buy_sell', label: `For Sale (${saleCount})` },
                { id: 'swap', label: `Swaps (${swapCount})` },
                { id: 'free_donation', label: `Free (${freeCount})` },
                { id: 'sold', label: `Sold Items (${userSoldListings.length})` }
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '420px' }}>
              <div className="profile-search-field" style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder={`Search ${targetUser.name.split(' ')[0]}'s items...`}
                  className="clean-input"
                  style={{ paddingLeft: '34px', paddingRight: storeSearch ? '28px' : '10px', height: '34px', fontSize: '0.78rem', width: '100%' }}
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

              <div style={{ minWidth: '140px', maxWidth: '170px' }}>
                <CustomSelect
                  value={storeSort}
                  onChange={(val) => setStoreSort(val as any)}
                  size="sm"
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'price_asc', label: 'Price: Low to High' },
                    { value: 'price_desc', label: 'Price: High to Low' }
                  ]}
                  ariaLabel="Sort inventory"
                />
              </div>

              {/* View Toggle on Desktop */}
              <div className="desktop-only" style={{ display: 'inline-flex', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: '8px', overflow: 'hidden', height: '34px' }}>
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('grid')}
                  style={{
                    padding: '0 0.65rem',
                    backgroundColor: inventoryViewMode === 'grid' ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                    color: inventoryViewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                  title="Card Grid"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('table')}
                  style={{
                    padding: '0 0.65rem',
                    backgroundColor: inventoryViewMode === 'table' ? 'var(--uc-blue, #002B7F)' : 'var(--bg-surface, #FFFFFF)',
                    color: inventoryViewMode === 'table' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                    border: 'none',
                    borderLeft: '1px solid var(--border-subtle, #E2E8F0)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                  title="Table View"
                >
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Listings Presentation (Mobile-first responsive cards) */}
          {filteredActiveListings.length > 0 ? (
            inventoryViewMode === 'grid' ? (
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
              <div className="table-clean-wrapper">
                <table className="table-clean" style={{ minWidth: '650px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '42%' }}>Item</th>
                      <th>Category</th>
                      <th>Mode</th>
                      <th>Condition</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
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
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle, #E2E8F0)' }}
                              />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                                <ShoppingBag size={16} />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div
                                onClick={() => onNavigate('item-detail', { id: item.id })}
                                style={{ fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}
                              >
                                {item.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={11} /> {item.campus}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{item.category}</span>
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
                            {item.tradeMode === 'free_donation' ? 'Free Gift' : item.tradeMode === 'swap' ? 'Swap' : 'For Sale'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{item.condition || 'Good'}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontSize: '0.9rem' }}>
                            ₱{Number(item.price || 0).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => onNavigate('item-detail', { id: item.id })}
                              className="btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                            >
                              <Eye size={12} />
                            </button>
                            {isSelf ? (
                              <button
                                onClick={() => markAsSold(item.id, true)}
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                              >
                                Sold
                              </button>
                            ) : (
                              <button
                                onClick={() => openChatWithSeller(item)}
                                className="btn-gold"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                              >
                                Chat
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {storeSearch
                  ? `No items matched "${storeSearch}". Try another search term.`
                  : isSelf
                  ? 'You have no active listings at the moment. Post your textbooks, uniforms, reviewers, or tech gear to trade!'
                  : `${targetUser.name} currently has no active listings in this category.`}
              </p>
              {storeSearch ? (
                <button
                  onClick={() => setStoreSearch('')}
                  className="btn-secondary"
                  style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  Clear Search
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

      {/* TAB 2: SOLD & COMPLETED ITEMS */}
      {activeTab === 'sold' && (isSelf || userSoldListings.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isSelf ? 'Your Sold & Completed Items' : `${targetUser.name}'s Completed Items`} ({userSoldListings.length})
            </span>
            {isSelf && (
              <button
                onClick={() => onNavigate('create-listing')}
                className="btn-gold"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', fontWeight: 800 }}
              >
                + Post New Item
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
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markAsSold(item.id, false);
                          showToast('Listing Reactivated', `"${item.title}" is back active!`, 'success');
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
                      >
                        <RotateCcw size={12} /> Relist
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
                Items completed and handed over through campus meetups will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED ITEMS (for Owner) */}
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
                Browse listings and tap the bookmark icon to save items for quick reference.
              </p>
              <button onClick={() => onNavigate('marketplace')} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                Explore Marketplace
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRANSACTIONS (for Owner) */}
      {activeTab === 'transactions' && isSelf && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Orders &amp; Meetups ({userMeetups.length})
            </span>
            <button onClick={() => onNavigate('transactions')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
              Full Ledger →
            </button>
          </div>

          {userMeetups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {userMeetups.map((m) => {
                const isBuyer = m.buyerId === currentUser?.id;
                const counterparty = isBuyer ? m.sellerName : m.buyerName;
                const priceVal = Number(m.finalPrice || m.amount || 0);

                return (
                  <div
                    key={m.id}
                    className="clean-card card-interactive"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle, #E2E8F0)'
                    }}
                    onClick={() => onNavigate('item-detail', { id: m.listingId })}
                  >
                    {m.listingImage ? (
                      <img src={m.listingImage} alt={m.listingTitle} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                        <ShoppingBag size={20} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: isBuyer ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 43, 127, 0.1)', color: isBuyer ? 'var(--accent-green)' : 'var(--uc-blue)' }}>
                          {isBuyer ? 'Purchased' : 'Sold'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>with {counterparty || 'Peer'}</span>
                      </div>

                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {m.listingTitle}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={11} /> <span>{m.landmarkSpot || 'Campus Spot'}</span> &bull; <span>{m.createdAt ? formatRelativeTime(m.createdAt) : 'Recent'}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: isBuyer ? 'var(--accent-red, #DC2626)' : 'var(--accent-green, #059669)' }}>
                        ₱{priceVal.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'capitalize', color: m.status === 'completed' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {m.status || 'pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Receipt size={28} />
              </div>
              <h4 className="empty-state-title">No Transactions Yet</h4>
              <p className="empty-state-desc">
                Your past campus purchases and sales will be recorded here automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REVIEWS */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Rating Summary Card */}
          <div
            className="clean-card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              borderRadius: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'center', paddingRight: '1rem', borderRight: '1px solid var(--border-subtle, #E2E8F0)' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: rating > 0 ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1 }}>
                  {rating.toFixed(1)}
                </div>
                <div style={{ display: 'flex', gap: '2px', color: rating > 0 ? '#F59E0B' : 'var(--text-muted)', marginTop: '0.25rem', justifyContent: 'center' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill={rating > 0 && i < Math.round(rating) ? '#F59E0B' : 'transparent'} color={rating > 0 ? '#F59E0B' : '#CBD5E1'} />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Verified Student Ratings ({userReviews.length})
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Honest feedback from completed on-campus transactions.
                </p>
              </div>
            </div>

            {/* Filter Pills for Reviews */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'all', label: `All (${userReviews.length})` },
                { id: 'seller', label: 'As Seller' },
                { id: 'buyer', label: 'As Buyer' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id as any)}
                  className={`segmented-tab ${reviewFilter === f.id ? 'active' : ''}`}
                  style={{ borderRadius: 'var(--radius-full)', padding: '0.3rem 0.75rem', fontSize: '0.76rem' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {filteredReviews.map((rev) => (
                <div key={rev.id} className="clean-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <UserAvatar
                        src={rev.reviewerAvatar}
                        name={rev.reviewerName}
                        size="sm"
                      />
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rev.reviewerName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {rev.reviewerCampus} &bull; {formatRelativeTime(rev.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1px', color: '#F59E0B' }}>
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    "{rev.comment}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                    <span>Item: <strong>{rev.itemTitle}</strong></span>
                    {rev.wasPunctual && <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>&bull; Punctual</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Star size={28} />
              </div>
              <h4 className="empty-state-title">No Reviews Yet</h4>
              <p className="empty-state-desc">
                Feedback from students after completing campus transactions will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ABOUT SELLER (for Visitor) */}
      {activeTab === 'about' && !isSelf && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="clean-card" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                About {targetUser.name}
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                {targetUser.bio || 'This student has not written a personal bio yet.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</span>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {targetUser.department || 'Not specified'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Home Campus</span>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {targetUser.campus}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meetup Preference</span>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {targetUser.preferredMeetupSpots || 'Campus Canteen / Library'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accepted Payments</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '4px' }}>
                  {parsePaymentMethods(targetUser.paymentMethods).map((method) => (
                    <PaymentMethodBadge key={method} method={method} size="xs" />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '0.5rem', display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={handleStartChatWithUser}
                className="btn-primary"
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', fontWeight: 800 }}
              >
                <MessageSquare size={16} /> Send Message to {targetUser.name.split(' ')[0]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Verification Modal */}
      <StudentVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

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
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profile Photo</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {editAvatar ? 'Custom photo' : 'Defaulting to name initials'}
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
                  Clear Photo & Use Initials
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

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Department / College
            </label>
            <DepartmentDropdown
              value={editDepartment}
              onChange={setEditDepartment}
              placeholder="Select your UC College"
            />
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
                Payment Mode
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cash on Meetup</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Standard campus peer settlement)</span>
              </div>
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

      {/* SEPARATE CHANGE PASSWORD MODAL */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        title="Change Account Password"
      >
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="clean-input"
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars (uppercase, lowercase, number, symbol)"
                className="clean-input"
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="clean-input"
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="btn-secondary"
              style={{ padding: '0.55rem 1.15rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn-primary"
              style={{ padding: '0.55rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Key size={14} />
              <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Verification Modal */}
      <StudentVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSuccess={() => {
          setIsVerificationModalOpen(false);
          showToast('Verification Submitted', 'Your documents have been submitted to campus administration for review.', 'success');
        }}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
