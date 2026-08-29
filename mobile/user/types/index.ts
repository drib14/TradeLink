export type Campus =
  | 'All'
  | 'ALL'
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
  | 'Junior High School (JHS)'
  | 'Senior High (STEM)'
  | 'Senior High (ABM)'
  | 'Senior High (HUMSS)'
  | 'Senior High (TVL/GAS)'
  | 'Senior High School'
  | 'Senior High School (SHS)'
  | 'CCS'
  | 'College of Computer Studies'
  | 'Nursing'
  | 'College of Nursing & Allied Health'
  | 'Engineering'
  | 'College of Engineering'
  | 'CBA'
  | 'College of Business & Accountancy'
  | 'Maritime'
  | 'Maritime Education & Training Center'
  | 'Criminology'
  | 'College of Criminology'
  | 'Arts & Sciences'
  | 'College of Arts & Sciences'
  | 'Education'
  | 'College of Education'
  | 'Hospitality & Tourism'
  | 'College of Hospitality Management'
  | 'College of Customs Administration'
  | 'Medicine'
  | 'Law'
  | 'College of Law'
  | 'General Student';

export type TradeMode =
  | 'buy_sell'
  | 'swap'
  | 'free_donation'
  | 'BUY'
  | 'SWAP'
  | 'FREE'
  | 'All'
  | 'ALL';

export type ItemCategory = string;

export type ConditionGrade =
  | 'Brand New'
  | 'Like New'
  | 'Gently Used'
  | 'Fair / Academic Usable'
  | 'All'
  | 'ALL';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role?: 'student' | 'admin' | 'superadmin';
  campus: Campus;
  college: College;
  yearLevel?: string;
  avatar: string;
  isVerified: boolean;
  idPhotoUrl?: string;
  trustScore?: number;
  trustRating?: number;
  rating?: number;
  totalReviews?: number;
  reviewCount?: number;
  completedTrades?: number;
  successfulTrades?: number;
  punctualityRate?: number;
  bio?: string;
  joinedDate?: string;
  isProMerchant?: boolean;
  password?: string;
  verifiedAt?: string;
}

export interface ListingSeller {
  id: string;
  name: string;
  avatar: string;
  campus?: Campus;
  college?: College;
  isVerified: boolean;
  trustScore?: number;
  trustRating?: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalSrp?: number;
  originalPrice?: number;
  tradeMode: TradeMode;
  swapPreference?: string;
  category: string;
  tags?: string[];
  condition: ConditionGrade;
  images: string[];
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerCampus?: Campus;
  sellerCollege?: College;
  sellerIsVerified?: boolean;
  sellerTrustScore?: number;
  seller?: ListingSeller;
  campus?: Campus;
  preferredMeetupSpots?: string[];
  customMeetupSpot?: string;
  isBoosted?: boolean;
  isSold?: boolean;
  quantity?: number;
  courseCode?: string;
  createdAt: string;
  views: number;
  favoritesCount?: number;
}

export interface WantedRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  requesterCampus: Campus;
  requesterCollege: string;
  title?: string;
  itemTitle?: string;
  description: string;
  category: string;
  budgetMin?: number;
  budgetMax?: number;
  targetBudget?: number;
  tradeMode?: TradeMode;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'Immediate / Urgent' | 'This Week' | 'Flexible';
  createdAt: string;
  offersCount: number;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED' | 'open' | 'fulfilled' | 'cancelled';
  preferredCampus?: Campus;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar: string;
  campus: Campus;
  isVerified?: boolean;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice?: number;
  listingImage: string;
  participantId?: string;
  participantIds?: string[];
  participantName?: string;
  participantAvatar?: string;
  participantCampus?: Campus;
  otherParticipant?: ConversationParticipant;
  lastMessage: string;
  lastMessageAt?: string;
  lastMessageTimestamp?: string;
  unreadCount?: number;
  messages?: Message[];
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
  createdAt: string;
}
