import { User, Listing, SwapOffer, MeetupTransaction, Conversation, VerificationRequest, Review } from '../types';

export const SEED_USERS: User[] = [
  {
    id: 'user-superadmin',
    name: 'UC Super Administrator',
    email: 'superadmin@uc.edu.ph',
    studentId: 'UC-SA-2024',
    role: 'superadmin',
    campus: 'UC Main',
    college: 'CCS',
    yearLevel: 'System Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 100,
    rating: 5.0,
    totalReviews: 0,
    completedTrades: 0,
    punctualityRate: 100,
    bio: 'TradeLink Platform Super Administrator. Full system access across all UC campuses.',
    joinedDate: 'Jan 2024',
    password: 'superadmin123'
  },
  {
    id: 'user-admin',
    name: 'UC Admin Moderator',
    email: 'admin@uc.edu.ph',
    studentId: 'UC-ADM-2024',
    role: 'admin',
    campus: 'UC Main',
    college: 'CCS',
    yearLevel: 'Faculty / Staff',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 100,
    rating: 5.0,
    totalReviews: 88,
    completedTrades: 120,
    punctualityRate: 100,
    bio: 'Official TradeLink Campus Moderation & Safety Desk. Verified student marketplace.',
    joinedDate: 'Jan 2024',
    password: 'admin123'
  },
  {
    id: 'user-maria',
    name: 'Maria Santos',
    email: 'maria.nursing@uc.edu.ph',
    studentId: '202104982',
    role: 'student',
    campus: 'UC Banilad',
    college: 'Nursing',
    yearLevel: '4th Year (Senior)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 98,
    rating: 4.9,
    totalReviews: 24,
    completedTrades: 32,
    punctualityRate: 96,
    bio: 'Senior BSN student at Banilad. Selling gadgets, textbooks, scrubs, and study gear.',
    joinedDate: 'Aug 2023',
    isProMerchant: true
  },
  {
    id: 'user-ken',
    name: 'Kenzo Lim',
    email: 'ken.engg@uc.edu.ph',
    studentId: '202211045',
    role: 'student',
    campus: 'UC LM',
    college: 'Engineering',
    yearLevel: '3rd Year',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 94,
    rating: 4.8,
    totalReviews: 18,
    completedTrades: 21,
    punctualityRate: 95,
    bio: 'Engineering student at UC LM. Selling tech gadgets, guitars, calculators, and footwear.',
    joinedDate: 'Nov 2023'
  },
  {
    id: 'user-dave',
    name: 'Dave Alcantara',
    email: 'dave.maritime@uc.edu.ph',
    studentId: '202308731',
    role: 'student',
    campus: 'UC METC',
    college: 'Maritime',
    yearLevel: '2nd Year Cadet',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 96,
    rating: 5.0,
    totalReviews: 12,
    completedTrades: 15,
    punctualityRate: 100,
    bio: 'Cadet at UC METC Mambaling. Trading navigation gear, tech accessories, and gaming items.',
    joinedDate: 'Feb 2024'
  },
  {
    id: 'user-beatrice',
    name: 'Beatrice Tan',
    email: 'beatrice.cba@uc.edu.ph',
    studentId: '202103219',
    role: 'student',
    campus: 'UC Main',
    college: 'CBA',
    yearLevel: '4th Year BSA',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 99,
    rating: 5.0,
    totalReviews: 30,
    completedTrades: 42,
    punctualityRate: 98,
    bio: 'Accountancy major at UC Main. Selling tablets, reviewers, and campus essentials.',
    joinedDate: 'Sep 2023',
    isProMerchant: true
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex.freshman@uc.edu.ph',
    studentId: '202501824',
    role: 'student',
    campus: 'UC Main',
    college: 'CCS',
    yearLevel: '1st Year Freshman',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    isVerified: false,
    trustScore: 65,
    rating: 4.5,
    totalReviews: 2,
    completedTrades: 3,
    punctualityRate: 90,
    bio: 'Freshman BSIT at UC Main. Looking for mechanical keyboards, monitors, and coding books.',
    joinedDate: 'Aug 2024'
  },
  {
    id: 'user-chloe',
    name: 'Chloe Yap',
    email: 'chloe.jhs@uc.edu.ph',
    studentId: '202409182',
    role: 'student',
    campus: 'UC PRI',
    college: 'Junior High School',
    yearLevel: 'Grade 10',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 97,
    rating: 5.0,
    totalReviews: 16,
    completedTrades: 19,
    punctualityRate: 98,
    bio: 'Grade 10 Junior High School student at UC PRI. Selling JHS reviewers, PE uniforms, and stationery.',
    joinedDate: 'Jun 2024'
  },
  {
    id: 'user-miguel',
    name: 'Miguel Mendoza',
    email: 'miguel.shs@uc.edu.ph',
    studentId: '202311843',
    role: 'student',
    campus: 'UC PRI',
    college: 'Senior High (STEM)',
    yearLevel: 'Grade 12 (SHS)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    idPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    trustScore: 95,
    rating: 4.8,
    totalReviews: 14,
    completedTrades: 18,
    punctualityRate: 95,
    bio: 'Grade 12 STEM Senior High scholar at UC PRI. Selling scientific calculators, STEM modules, and drafting gear.',
    joinedDate: 'Jul 2023'
  }
];

export const SEED_LISTINGS: Listing[] = [
  // 1. Apple iPad
  {
    id: 'list-1',
    title: 'Apple iPad 9th Gen (64GB Space Gray WiFi) + Magnetic Folio',
    description: 'Perfect for taking digital notes in lectures. Battery health 96%, with tempered glass screen protector installed. Comes with original charger and free magnetic pen.',
    price: 13500,
    originalSrp: 18990,
    tradeMode: 'buy_sell',
    category: 'Electronics & Gadgets',
    tags: ['iPad', 'Apple', 'Tablet', 'Study Gear'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-beatrice',
    sellerName: 'Beatrice Tan',
    sellerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC Main',
    sellerCollege: 'CBA',
    sellerIsVerified: true,
    sellerTrustScore: 99,
    preferredMeetupSpots: ['spot-main-1', 'spot-main-2'],
    customMeetupSpot: 'Main Library 3rd Floor entrance',
    isBoosted: true,
    isSold: false,
    createdAt: '2026-08-14T09:30:00Z',
    views: 310,
    favoritesCount: 42
  },

  // 2. Nike Air Force 1
  {
    id: 'list-2',
    title: 'Nike Air Force 1 ’07 Triple White (Size 9 US Mens)',
    description: 'Authentic pair purchased from Nike Ayala. Worn less than 5 times, soles are clean with minimal creasing. Original box and shoe trees included.',
    price: 2800,
    originalSrp: 5495,
    tradeMode: 'buy_sell',
    category: 'Fashion & Sneakers',
    tags: ['Sneakers', 'Nike', 'Footwear', 'Size 9'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-ken',
    sellerName: 'Kenzo Lim',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC LM',
    sellerCollege: 'Engineering',
    sellerIsVerified: true,
    sellerTrustScore: 94,
    preferredMeetupSpots: ['spot-lm-1', 'spot-lm-2'],
    customMeetupSpot: 'UC LM Engineering Lobby',
    isBoosted: true,
    isSold: false,
    createdAt: '2026-08-13T14:15:00Z',
    views: 245,
    favoritesCount: 29
  },

  // 3. Swap: Fender Squier Acoustic Guitar
  {
    id: 'list-3',
    title: 'Fender Squier SA-150 Dreadnought Acoustic Guitar + Padded Gig Bag',
    description: 'Crisp, resonant tone with low action strings. Open to swap for an ergonomic chair, mechanical keyboard, or Casio fx-991EX calculator + cash adjustment.',
    price: 3200,
    originalSrp: 6500,
    tradeMode: 'swap',
    swapPreference: 'Keychron Mechanical Keyboard or PRC Scientific Calculator + ₱1,500',
    category: 'Music & Instruments',
    tags: ['Guitar', 'Fender', 'Music', 'Instrument'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-ken',
    sellerName: 'Kenzo Lim',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC LM',
    sellerCollege: 'Engineering',
    sellerIsVerified: true,
    sellerTrustScore: 94,
    preferredMeetupSpots: ['spot-lm-1', 'spot-main-1'],
    customMeetupSpot: 'UC LM Student Pavilion',
    isBoosted: false,
    isSold: false,
    createdAt: '2026-08-12T11:00:00Z',
    views: 198,
    favoritesCount: 31
  },

  // 4. Casio PRC Scientific Calculator
  {
    id: 'list-4',
    title: 'Casio fx-991ES Plus 2nd Edition (PRC Board Exam Approved)',
    description: '100% genuine with holographic security seal. Smooth buttons, clear LCD, sliding protective cover. Used for 2 semesters in Engineering Calculus.',
    price: 680,
    originalSrp: 1250,
    tradeMode: 'buy_sell',
    category: 'Calculators & Electronics',
    tags: ['Calculator', 'Casio', 'PRC Approved', 'Engineering'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-ken',
    sellerName: 'Kenzo Lim',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC LM',
    sellerCollege: 'Engineering',
    sellerIsVerified: true,
    sellerTrustScore: 94,
    preferredMeetupSpots: ['spot-lm-1', 'spot-lm-2'],
    customMeetupSpot: 'UC LM Innovation Hall',
    isBoosted: false,
    isSold: false,
    courseCode: 'MATH 201',
    createdAt: '2026-08-14T10:00:00Z',
    views: 142,
    favoritesCount: 19
  },

  // 5. Nursing Scrubs Set
  {
    id: 'list-5',
    title: 'UC Banilad Clinical Duty Scrubs Set (Medium, Dark Green & White)',
    description: 'High-quality cotton blend scrubs tailored for UC Banilad College of Nursing. Clean, no stains, with embroidered patch on pocket. Includes 2 tops and 2 cargo pants.',
    price: 650,
    originalSrp: 1400,
    tradeMode: 'buy_sell',
    category: 'Uniforms & Apparel',
    tags: ['Scrubs', 'Nursing', 'Uniform', 'Banilad'],
    condition: 'Gently Used',
    images: [
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-maria',
    sellerName: 'Maria Santos',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC Banilad',
    sellerCollege: 'Nursing',
    sellerIsVerified: true,
    sellerTrustScore: 98,
    preferredMeetupSpots: ['spot-banilad-1', 'spot-banilad-3'],
    customMeetupSpot: 'Banilad 4th Floor Simulation Lab',
    isBoosted: true,
    isSold: false,
    courseCode: 'NCM 112',
    createdAt: '2026-08-13T16:00:00Z',
    views: 180,
    favoritesCount: 25
  },

  // 6. Sony Noise Canceling Headphones
  {
    id: 'list-6',
    title: 'Sony WH-1000XM4 Wireless Noise Canceling Headphones (Black)',
    description: 'Industry-leading noise cancelation for studying in loud coffee shops or library pods. 30-hour battery life, 3.5mm cable, and hard carrying case included.',
    price: 8900,
    originalSrp: 14999,
    tradeMode: 'buy_sell',
    category: 'Audio & Gadgets',
    tags: ['Sony', 'Headphones', 'ANC', 'Audio'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-dave',
    sellerName: 'Dave Alcantara',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC METC',
    sellerCollege: 'Maritime',
    sellerIsVerified: true,
    sellerTrustScore: 96,
    preferredMeetupSpots: ['spot-metc-1', 'spot-metc-2'],
    customMeetupSpot: 'METC Muster Flagpole',
    isBoosted: false,
    isSold: false,
    createdAt: '2026-08-11T12:00:00Z',
    views: 220,
    favoritesCount: 38
  },

  // 7. Mini Fridge / Dorm Living
  {
    id: 'list-7',
    title: 'Kelvinator 1.7 cu.ft Compact Mini Refrigerator (Direct Cool)',
    description: 'Great for boarding house and dormitory rooms near UC Main / Banilad. Keeps drinks ice cold, small freezer compartment. Very energy efficient and clean.',
    price: 3500,
    originalSrp: 6800,
    tradeMode: 'buy_sell',
    category: 'Dorm & Living',
    tags: ['Mini Ref', 'Appliance', 'Dorm', 'Boarding House'],
    condition: 'Gently Used',
    images: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-maria',
    sellerName: 'Maria Santos',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC Banilad',
    sellerCollege: 'Nursing',
    sellerIsVerified: true,
    sellerTrustScore: 98,
    preferredMeetupSpots: ['spot-banilad-2'],
    customMeetupSpot: 'Banilad Gate 1 Parking / Guard Post',
    isBoosted: false,
    isSold: false,
    createdAt: '2026-08-10T15:30:00Z',
    views: 175,
    favoritesCount: 22
  },

  // 8. Keychron Mechanical Keyboard
  {
    id: 'list-8',
    title: 'Keychron K2 Wireless Mechanical Keyboard (Gateron Brown Switches)',
    description: '75% compact layout with Bluetooth & USB-C wired mode. Compatible with Mac and Windows. RGB backlight and extra Mac keycaps included.',
    price: 2400,
    originalSrp: 4500,
    tradeMode: 'buy_sell',
    category: 'Gaming & Tech',
    tags: ['Keychron', 'Keyboard', 'Gaming', 'Tech'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-beatrice',
    sellerName: 'Beatrice Tan',
    sellerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC Main',
    sellerCollege: 'CBA',
    sellerIsVerified: true,
    sellerTrustScore: 99,
    preferredMeetupSpots: ['spot-main-1', 'spot-main-3'],
    customMeetupSpot: 'Main Gym Mezzanine',
    isBoosted: false,
    isSold: false,
    createdAt: '2026-08-09T18:00:00Z',
    views: 290,
    favoritesCount: 45
  },

  // 9. Free Donation: Calculus Textbook
  {
    id: 'list-9',
    title: 'The Calculus 7 by Louis Leithold (7th Edition Hardbound)',
    description: 'Free donation for any struggling freshman engineering or math major at UC! Still very legible, contains full solutions and practice exercises.',
    price: 0,
    originalSrp: 1400,
    tradeMode: 'free_donation',
    category: 'Textbooks & Reviewers',
    tags: ['Calculus', 'Leithold', 'Math', 'Free Donation'],
    condition: 'Fair / Academic Usable',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-ken',
    sellerName: 'Kenzo Lim',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC LM',
    sellerCollege: 'Engineering',
    sellerIsVerified: true,
    sellerTrustScore: 94,
    preferredMeetupSpots: ['spot-lm-1', 'spot-main-1'],
    customMeetupSpot: 'UC LM Library Turnstiles',
    isBoosted: true,
    isSold: false,
    courseCode: 'MATH 101',
    createdAt: '2026-08-14T08:00:00Z',
    views: 340,
    favoritesCount: 58
  },
  // 15. Junior High School Reviewer & Study Bundle (UC PRI)
  {
    id: 'list-15',
    title: 'Grade 10 Junior High Science & Math Comprehensive Reviewer Bundle',
    description: 'Complete compiled reviewers for Grade 10 completers preparing for Senior High entrance and NCAE exams. Clean notes with highlighted formula sheets and sample problem sets.',
    price: 320,
    originalSrp: 750,
    tradeMode: 'buy_sell',
    category: 'Junior High School Books & Reviewers',
    tags: ['Junior High', 'Grade 10', 'Science', 'Math Reviewer', 'UC PRI'],
    condition: 'Like New',
    images: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-chloe',
    sellerName: 'Chloe Yap',
    sellerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC PRI',
    sellerCollege: 'Junior High School',
    sellerIsVerified: true,
    sellerTrustScore: 97,
    preferredMeetupSpots: ['spot-pri-1', 'spot-pri-2'],
    customMeetupSpot: 'UC PRI Main Gate Security Checkpoint',
    isBoosted: true,
    isSold: false,
    createdAt: '2026-08-15T08:30:00Z',
    views: 185,
    favoritesCount: 22
  },
  // 16. Senior High STEM Kit (UC PRI)
  {
    id: 'list-16',
    title: 'Senior High STEM Chemistry & Pre-Calculus Kit + Drafting T-Square',
    description: 'Grade 11 & 12 STEM strand essentials including transparent 24-inch drafting T-square, scientific periodic table binder, and pre-calculus formula handbook.',
    price: 450,
    originalSrp: 980,
    tradeMode: 'buy_sell',
    category: 'Senior High School Modules & Kits',
    tags: ['Senior High', 'STEM', 'Chemistry', 'Drafting', 'UC PRI'],
    condition: 'Gently Used',
    images: [
      'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80'
    ],
    sellerId: 'user-miguel',
    sellerName: 'Miguel Mendoza',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    sellerCampus: 'UC PRI',
    sellerCollege: 'Senior High (STEM)',
    sellerIsVerified: true,
    sellerTrustScore: 95,
    preferredMeetupSpots: ['spot-pri-1', 'spot-pri-2'],
    customMeetupSpot: 'UC PRI Covered Court Bleachers',
    isBoosted: true,
    isSold: false,
    createdAt: '2026-08-15T09:00:00Z',
    views: 220,
    favoritesCount: 31
  }
];

export const SEED_SWAPS: SwapOffer[] = [
  {
    id: 'swap-1',
    targetListingId: 'list-3',
    targetListingTitle: 'Fender Squier SA-150 Dreadnought Acoustic Guitar',
    targetListingImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    targetSellerId: 'user-ken',
    targetSellerName: 'Kenzo Lim',
    offererId: 'user-beatrice',
    offererName: 'Beatrice Tan',
    offererAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    offererCampus: 'UC Main',
    offeredListingId: 'list-8',
    offeredListingTitle: 'Keychron K2 Wireless Mechanical Keyboard',
    offeredListingImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    offeredDescription: 'Keychron K2 RGB Wireless Keyboard + ₱800 cash top-up',
    cashTopUp: 800,
    status: 'pending',
    proposedMeetupSpot: 'UC Main Campus Library Benches',
    proposedDateTime: 'Monday 2:00 PM',
    createdAt: '2026-08-14T11:20:00Z'
  }
];

export const SEED_MEETUPS: MeetupTransaction[] = [
  {
    id: 'meetup-1',
    listingId: 'list-4',
    listingTitle: 'Casio fx-991ES Plus 2nd Edition',
    listingImage: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
    sellerId: 'user-ken',
    sellerName: 'Kenzo Lim',
    buyerId: 'user-alex',
    buyerName: 'Alex Rivera',
    tradeMode: 'buy_sell',
    finalPrice: 680,
    campus: 'UC Main',
    landmarkSpot: 'UC Main Sanciangko Lobby Information Desk',
    scheduledDateTime: 'Tomorrow at 1:30 PM',
    verificationCode: '7492',
    status: 'scheduled',
    notes: 'Meeting right in front of the main guard station turnstile.',
    createdAt: '2026-08-14T12:00:00Z'
  }
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participantIds: ['user-maria', 'user-alex'],
    otherParticipant: {
      id: 'user-alex',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      campus: 'UC Main',
      isVerified: false
    },
    listingId: 'list-5',
    listingTitle: 'UC Banilad Clinical Duty Scrubs Set',
    listingImage: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=80',
    lastMessage: 'Hi Ate Maria! Is this still available for inspection at Banilad canteen?',
    lastMessageTimestamp: '10:45 AM',
    unreadCount: 1
  }
];

export const SEED_VERIFICATIONS: VerificationRequest[] = [
  {
    id: 'verif-1',
    userId: 'user-alex',
    userName: 'Alex Rivera',
    userEmail: 'alex.freshman@uc.edu.ph',
    studentIdNumber: '2025-01824',
    campus: 'UC Main',
    college: 'CCS',
    idCardImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    submittedAt: '2026-08-14T08:15:00Z'
  }
];

export const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    transactionId: 'tx-101',
    reviewerId: 'user-beatrice',
    reviewerName: 'Beatrice Tan',
    reviewerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    reviewerCampus: 'UC Main',
    targetUserId: 'user-maria',
    rating: 5,
    comment: 'Super smooth transaction! Item was exactly as described, arrived 5 minutes early at Banilad lobby.',
    itemTitle: 'Clinical Duty Scrubs Set',
    tradeType: 'Direct Buy',
    wasPunctual: true,
    createdAt: '2026-08-10T14:30:00Z'
  }
];

export const SEED_VERIFICATION_REQUESTS = SEED_VERIFICATIONS;

