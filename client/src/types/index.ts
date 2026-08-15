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
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalSrp: number;
  tradeMode: TradeMode;
  swapPreference?: string;
  category: string; // User-defined or selected category
  tags?: string[];
  condition: ConditionGrade;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerCampus: Campus;
  sellerCollege: College;
  sellerIsVerified: boolean;
  sellerTrustScore: number;
  preferredMeetupSpots: string[];
  customMeetupSpot?: string;
  isBoosted: boolean;
  isSold: boolean;
  courseCode?: string;
  createdAt: string;
  views: number;
  favoritesCount: number;
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
  proposedMeetupSpot: string;
  proposedDateTime: string;
  createdAt: string;
}

export interface MeetupTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  tradeMode: TradeMode;
  finalPrice: number;
  swapSummary?: string;
  campus: Campus;
  landmarkSpot: string; // Can be predefined or student custom input
  scheduledDateTime: string;
  verificationCode: string; // 4-digit code e.g. "8421"
  status: 'scheduled' | 'on_the_way' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isSystemMessage?: boolean;
  swapOfferId?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  otherParticipant: {
    id: string;
    name: string;
    avatar: string;
    campus: Campus;
    isVerified: boolean;
  };
  listingId: string;
  listingTitle: string;
  listingImage: string;
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
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
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

export interface WantedRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  requesterCampus: Campus;
  requesterCollege: string;
  itemTitle: string;
  category: string;
  targetBudget: number;
  urgency: 'Immediate / Urgent' | 'This Week' | 'Flexible';
  description: string;
  preferredCampus: Campus;
  status: 'open' | 'fulfilled';
  offersCount: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'swap' | 'meetup' | 'price_drop' | 'wanted_response' | 'system';
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

export interface PriceEstimationResult {
  recommendedMin: number;
  recommendedMax: number;
  recommendedAverage: number;
  dealRating: 'Super Bargain' | 'Fair Campus Price' | 'Slightly High' | 'Overpriced';
  estimatedSavingsPct: number;
  reasoning: string;
}
