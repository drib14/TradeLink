export type Campus = 
  | 'UC Main' 
  | 'UC Banilad' 
  | 'UC LM' 
  | 'UC METC' 
  | 'UC Pardo-Talisay' 
  | 'UC South Campus' 
  | 'UC Medical Center'
  | 'UC PRI';

export type College = 
  | 'Junior High School'
  | 'Junior High (Grade 7-10)'
  | 'Senior High (STEM)'
  | 'Senior High (ABM)'
  | 'Senior High (HUMSS)'
  | 'Senior High (TVL/GAS)'
  | 'Senior High School'
  | 'CCS' 
  | 'Nursing' 
  | 'Engineering' 
  | 'CBA' 
  | 'Maritime' 
  | 'Criminology' 
  | 'Arts & Sciences' 
  | 'Education' 
  | 'Hospitality & Tourism'
  | 'Medicine'
  | 'Law'
  | 'General Student';

export type TradeMode = 'buy_sell' | 'swap' | 'free_donation';

export type ItemCategory = string;

export type ConditionGrade = 
  | 'Brand New' 
  | 'Like New' 
  | 'Gently Used' 
  | 'Lightly Used'
  | 'Well Used'
  | 'Heavily Used'
  | 'Fair / Academic Usable';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: 'student' | 'admin';
  campus: Campus;
  college: College;
  yearLevel: string;
  avatar: string;
  isVerified: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  idPhotoUrl?: string;
  trustScore: number; // 0 - 100
  rating: number; // 1.0 - 5.0
  totalReviews: number;
  completedTrades: number;
  punctualityRate: number; // 0 - 100%
  bio: string;
  joinedDate: string;
  isProMerchant?: boolean;
  password?: string;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  warningsCount?: number;
  preferredMeetupSpots?: string;
  tradingHours?: string;
  paymentMethods?: string;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  message: string;
  campus: Campus | 'All';
  type: 'info' | 'alert' | 'event';
  authorName: string;
  createdAt: string;
  isActive: boolean;
}

export interface TradeDispute {
  id: string;
  transactionId?: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  sellerId: string;
  buyerId: string;
  campus: Campus;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  filedAt: string;
  verdictNote?: string;
  verdictAction?: 'refund' | 'warning' | 'dismissed' | 'ban';
}

export interface FlaggedListingItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  sellerName: string;
  reporterName?: string;
  campus?: Campus;
  reason: string;
  flaggedBy?: string;
  reportedAt?: string;
  flaggedAt?: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'removed';
}

export interface RegisterData {
  name: string;
  studentId: string;
  email: string;
  password?: string;
  campus: Campus;
  college: College;
  yearLevel: string;
  avatar?: string;
  idPhotoUrl?: string;
}

export interface AdminAuditLog {
  id: string;
  adminName: string;
  action: string;
  targetType: 'user' | 'listing' | 'verification' | 'wanted' | 'meetup' | 'announcement' | 'dispute' | 'system';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface ListingMediaItem {
  id?: string;
  url: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string | null;
  isPrimary?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalSrp?: number;
  tradeMode: TradeMode;
  swapPreference?: string;
  category: string;
  condition: ConditionGrade;
  media?: ListingMediaItem[];
  images: string[];
  hasVideo?: boolean;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerCampus: Campus;
  sellerCollege: College;
  sellerIsVerified: boolean;
  sellerTrustScore: number;
  sellerStudentId?: string;
  sellerEmail?: string;
  isBoosted?: boolean;
  isSold: boolean;
  quantity: number;
  status?: string;
  createdAt: string;
  views: number;
  tags?: string[];
  favoritesCount?: number;
  preferredMeetupSpots?: string[];
  customMeetupSpot?: string;
}

export interface SwapOffer {
  id: string;
  targetListingId: string;
  targetListingTitle: string;
  targetListingImage: string;
  targetSellerId: string;
  targetSellerName: string;
  offererId: string;
  offererName: string;
  offererAvatar: string;
  offererCampus: Campus;
  offeredListingId?: string;
  offeredListingTitle?: string;
  offeredListingImage?: string;
  offeredDescription: string;
  cashTopUp: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
}

export interface Transaction {
  id: string;
  referenceNo: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  tradeMode: TradeMode;
  amount: number;
  paymentMethod: 'cash' | 'gcash' | 'maya' | 'barter' | 'free';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  notes?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  finalPrice?: number;
  verificationCode?: string;
  landmarkSpot?: string;
  scheduledDateTime?: string;
  campus?: Campus;
}

export type MeetupTransaction = Transaction;

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead?: boolean;
  isSystemMessage?: boolean;
  swapOfferId?: string;
  transactionId?: string;
  flashRequestId?: string;
  wantedRequestId?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  swapOffer?: any;
  transaction?: any;
  flashRequest?: any;
  wantedRequest?: any;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  otherParticipant: {
    id: string;
    name: string;
    avatar: string;
    campus: Campus;
    college?: College;
    isVerified: boolean;
    trustScore?: number;
    rating?: number;
  };
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice?: number | null;
  listingTradeMode?: TradeMode | 'wanted' | 'flash';
  listingStatus?: string;
  listingSellerId?: string;
  flashRequestId?: string | null;
  wantedId?: string | null;
  flashRequest?: any;
  wantedRequest?: any;
  activeTransaction?: {
    id: string;
    referenceNo: string;
    amount: number;
    status: string;
  } | null;
  activeSwap?: {
    id: string;
    offeredTitle: string;
    status: string;
  } | null;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentIdNumber: string;
  campus: Campus;
  college: College;
  idCardImageUrl: string;
  selfiePhotoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId: string;
  campus: Campus;
  college: College;
  avatarUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface Review {
  id: string;
  transactionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerCampus: Campus;
  targetUserId: string;
  rating: number;
  comment: string;
  itemTitle: string;
  tradeType: string;
  wasPunctual: boolean;
  traitBadges?: string[];
  createdAt: string;
}

export interface FlashRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  requesterCampus: Campus;
  requesterCollege: string;
  itemTitle: string;
  itemName?: string;
  category: string;
  targetBudget: number;
  urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible' | 'immediate' | 'this_week' | 'flexible';
  description: string;
  notes?: string;
  preferredCampus: Campus;
  targetCampus?: Campus;
  status: 'open' | 'fulfilled' | 'cancelled' | 'expired';
  offersCount: number;
  durationHours?: number;
  expiresAt?: string;
  isExpired?: boolean;
  createdAt: string;
}

export type WantedRequest = FlashRequest;

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'swap' | 'meetup' | 'price_drop' | 'flash_response' | 'wanted_response' | 'system';
  isRead: boolean;
  linkView?: string;
  linkParams?: any;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}


export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface SystemConfig {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  allowNewRegistrations?: boolean;
  requireStrictStudentEmail?: boolean;
  globalCommissionRate?: number;
  maxListingPrice?: number;
  maxImagesPerListing?: number;
  swapModeEnabled?: boolean;
  wantedBoardEnabled?: boolean;
  freeDonationEnabled?: boolean;
  maxListingsPerUser?: number;
  maxDailyListingsPerUser?: number;
  autoVerifyTrustScoreThreshold?: number;
  featureFlags?: FeatureFlag[];
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export type SuperAdminConfig = SystemConfig;

