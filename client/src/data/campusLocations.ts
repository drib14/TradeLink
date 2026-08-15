import { Campus } from '../types';

export interface LandmarkSpot {
  id: string;
  name: string;
  campus: Campus | 'Outside Campus';
  locationType: 'Inside Campus (Guarded)' | 'Outside Campus (Nearby Mall/Hub)' | 'Transit / Cafe';
  locationDetails: string;
  securityProximity: 'Directly Beside Guard/Security' | 'High Foot Traffic Mall / Hub' | 'Staff Supervised';
  bestHours: string;
  description: string;
}

export const CAMPUS_DETAILS: Record<Campus, {
  name: string;
  shortName: string;
  address: string;
  landmark: string;
  color: string;
  badgeClass: string;
  studentCountEst: string;
  colleges: string[];
  outsideHubs: string[];
}> = {
  'UC Main': {
    name: 'University of Cebu - Main Campus',
    shortName: 'UC Main',
    address: 'J. Alcantara / Sanciangko St., Cebu City',
    landmark: 'Across Elizabeth Mall & Colonade Mall',
    color: '#002B7F',
    badgeClass: 'uc-main',
    studentCountEst: '25,000+ Students',
    colleges: ['CCS', 'CBA', 'Criminology', 'Arts & Sciences', 'Senior High', 'Law'],
    outsideHubs: ['Elizabeth Mall (E-Mall) Food Court', 'Colonade Mall Entrance', 'J. Alcantara 7-Eleven']
  },
  'UC Banilad': {
    name: 'University of Cebu - Banilad Campus',
    shortName: 'UC Banilad',
    address: 'Gov. M. Cuenco Ave., Banilad, Cebu City',
    landmark: 'Beside Gaisano Country Mall & near IT Park',
    color: '#002B7F',
    badgeClass: 'uc-banilad',
    studentCountEst: '18,000+ Students',
    colleges: ['Nursing', 'CBA', 'Arts & Sciences', 'Senior High', 'Medicine'],
    outsideHubs: ['Gaisano Country Mall Jollibee / Atrium', 'Cebu IT Park Ayala Central Bloc', 'Banilad Town Center (BTC)']
  },
  'UC LM': {
    name: 'University of Cebu - Lapu-Lapu & Mandaue',
    shortName: 'UC LM',
    address: 'A.C. Cortes Ave., Looc, Mandaue City',
    landmark: 'Near 1st Mactan-Mandaue Bridge intersection',
    color: '#002B7F',
    badgeClass: 'uc-lm',
    studentCountEst: '19,000+ Students',
    colleges: ['Engineering', 'CCS', 'CBA', 'Hospitality & Tourism', 'Senior High'],
    outsideHubs: ['Parkmall Mandaue Lobby / Food Street', 'City Times Square Mandaue', 'Pacific Mall Mandaue']
  },
  'UC METC': {
    name: 'University of Cebu - Maritime Education & Training Center',
    shortName: 'UC METC',
    address: 'Alumnos St., Mambaling, Cebu City',
    landmark: 'Near Cebu South Coastal Road & IL Corso',
    color: '#002B7F',
    badgeClass: 'uc-metc',
    studentCountEst: '12,000+ Cadets',
    colleges: ['Maritime (BSMT / BSMarE)', 'Engineering', 'Senior High (TVL)'],
    outsideHubs: ['IL Corso Waterfront Central Piazza', 'SM Seaside City Cebu Food Hall', 'Mambaling Highway Jollibee']
  },
  'UC Pardo-Talisay': {
    name: 'University of Cebu - Pardo-Talisay (PT)',
    shortName: 'UC PT',
    address: 'Poblacion, Talisay City / Pardo, Cebu',
    landmark: 'Along South National Highway',
    color: '#002B7F',
    badgeClass: 'uc-pt',
    studentCountEst: '8,000+ Students',
    colleges: ['Criminology', 'CBA', 'Education', 'Senior High'],
    outsideHubs: ['Gaisano Grand Mall Minglanilla / Talisay', 'Pardo Church Plaza', 'South Coast Center']
  },
  'UC South Campus': {
    name: 'University of Cebu - South Campus',
    shortName: 'UC South',
    address: 'Sanciangko St., Cebu City',
    landmark: 'Basic Education & Senior High Campus',
    color: '#002B7F',
    badgeClass: 'uc-south',
    studentCountEst: '7,000+ Students',
    colleges: ['Senior High (STEM, ABM, HUMSS, TVL, GAS)', 'Basic Education'],
    outsideHubs: ['Emall Ground Floor Benches', 'Sanciangko Street Cafe', 'GV Tower Lobby']
  },
  'UC Medical Center': {
    name: 'University of Cebu Medical Center (UCMC)',
    shortName: 'UCMC',
    address: 'Subangdaku, Mandaue City',
    landmark: 'UCMC Tertiary Training Hospital & Health Quadrangle',
    color: '#002B7F',
    badgeClass: 'uc-ucmc',
    studentCountEst: '4,000+ Health Interns',
    colleges: ['Medicine', 'Nursing', 'Pharmacy', 'Medical Technology'],
    outsideHubs: ['UCMC Hospital Coffee Shop', 'Subangdaku Starbucks / Jollibee', 'Mandaue Reclamation Hub']
  },
  'UC PRI': {
    name: 'University of Cebu - PRI (Junior & Senior High)',
    shortName: 'UC PRI',
    address: 'J. Alcantara / Sanciangko St. Academic Hub, Cebu City',
    landmark: 'UC PRI Senior High Building & Junior High Quadrangle',
    color: '#002B7F',
    badgeClass: 'uc-pri',
    studentCountEst: '12,000+ Junior & Senior High Students',
    colleges: [
      'Junior High School (Grade 7 - 10)',
      'Senior High School (STEM, ABM, HUMSS, TVL, GAS)',
      'Basic Education & Tech-Voc'
    ],
    outsideHubs: ['Elizabeth Mall (E-Mall) Food Court', 'Colonade Mall', 'South Bus Terminal Benches']
  }
};

export const CAMPUS_MEETUP_SPOTS: LandmarkSpot[] = [
  // 0. UC PRI (Senior High & Junior High)
  {
    id: 'spot-pri-1',
    name: 'UC PRI Main Gate & Security Post',
    campus: 'UC PRI',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor main student gate and security checkpoint on J. Alcantara.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:00 AM - 5:30 PM (Monday - Saturday)',
    description: 'Guarded entrance area with active student guard presence, well-lit, and CCTV monitored.'
  },
  {
    id: 'spot-pri-2',
    name: 'UC PRI Covered Court & Canteen Bleachers',
    campus: 'UC PRI',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Covered gymnasium court bleachers beside the student cafeteria.',
    securityProximity: 'Staff Supervised',
    bestHours: '8:00 AM - 5:00 PM (School Days)',
    description: 'Spacious open student lounge area perfect for checking calculators, PE uniforms, and SHS modules.'
  },
  {
    id: 'spot-main-1',
    name: 'Main Lobby Security Desk (Sanciangko Gate)',
    campus: 'UC Main',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor main entrance lobby directly opposite the turnstiles and guard post.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:30 AM - 6:00 PM (Monday - Saturday)',
    description: 'High visibility, campus guard presence with well-lit waiting benches and CCTV coverage.'
  },
  {
    id: 'spot-main-outside-1',
    name: 'Elizabeth Mall (E-Mall) Food Court / Entrance (Outside)',
    campus: 'UC Main',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Directly across UC Main via the pedestrian overpass, 3rd Floor Food Court or Ground Floor entrance.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 8:00 PM (Daily)',
    description: 'High foot traffic, air-conditioned public mall space with abundant seating and security guards.'
  },
  {
    id: 'spot-main-2',
    name: 'UC Main Library Turnstiles (3rd Floor)',
    campus: 'UC Main',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: '3rd Floor Library entrance hallway beside the digital card tap-in station.',
    securityProximity: 'Staff Supervised',
    bestHours: '8:00 AM - 5:30 PM (Weekdays)',
    description: 'Quiet academic zone, ideal for textbook, calculator, and study material inspections.'
  },

  // 2. UC Banilad - Inside & Outside
  {
    id: 'spot-ban-1',
    name: 'Banilad Main Guard Station (Gov. Cuenco Gate)',
    campus: 'UC Banilad',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Front gate visitor reception desk next to the vehicle barrier.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:00 AM - 7:00 PM (Daily)',
    description: 'Guarded entrance with covered waiting shelter and 24/7 security staff.'
  },
  {
    id: 'spot-ban-outside-1',
    name: 'Gaisano Country Mall Atrium / Jollibee (Outside)',
    campus: 'UC Banilad',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Directly adjacent to UC Banilad, ground floor atrium or Jollibee fastfood counter.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '9:00 AM - 8:00 PM (Daily)',
    description: 'Convenient adjacent mall with mall security, casual dining, and ample parking.'
  },
  {
    id: 'spot-ban-outside-2',
    name: 'Cebu IT Park Ayala Central Bloc (Outside)',
    campus: 'UC Banilad',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: '5-minute commute from Banilad, Ground floor garden atrium or mall entrance.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 9:00 PM (Daily)',
    description: 'Major public tech & dining hub with 24/7 security, cafe tables, and high foot traffic.'
  },

  // 3. UC LM - Inside & Outside
  {
    id: 'spot-lm-1',
    name: 'Innovation & Tech Center Lobby (LM Main)',
    campus: 'UC LM',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor engineering building lobby directly facing A.C. Cortes gate.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '8:00 AM - 6:00 PM (Monday - Saturday)',
    description: 'Modern engineering lobby with security guards, power outlets, and testing counters.'
  },
  {
    id: 'spot-lm-outside-1',
    name: 'Parkmall Mandaue Lobby / Food Street (Outside)',
    campus: 'UC LM',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Ouano Ave., Mandaue City (10 mins from UC LM), main entrance lobby.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 8:00 PM (Daily)',
    description: 'Vibrant outdoor/indoor lifestyle mall with roving guards and open benches.'
  },

  // 4. UC METC - Inside & Outside
  {
    id: 'spot-metc-1',
    name: 'Maritime Academy Muster Area Guard Station',
    campus: 'UC METC',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Main gate guard desk at Alumnos St. entrance.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:30 AM - 5:30 PM (Daily)',
    description: 'Official cadet checkpoint with continuous security supervision and ID logging.'
  },
  {
    id: 'spot-metc-outside-1',
    name: 'SM Seaside City Cebu / IL Corso Waterfront (Outside)',
    campus: 'UC METC',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'South Road Properties (5-10 mins from METC), Mountain Wing entrance or IL Corso piazza.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 9:00 PM (Daily)',
    description: 'Spacious coastal mall environment with full security checks and open food courts.'
  },

  // 5. UC Pardo-Talisay - Inside & Outside
  {
    id: 'spot-pt-1',
    name: 'UC Pardo-Talisay Main Entrance Guard Desk',
    campus: 'UC Pardo-Talisay',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Front gate security booth along National Highway entrance.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '8:00 AM - 5:00 PM (Weekdays)',
    description: 'Guarded entrance checkpoint for south Cebu students.'
  },
  {
    id: 'spot-pt-outside-1',
    name: 'Gaisano Grand Mall Talisay / Fastfood (Outside)',
    campus: 'UC Pardo-Talisay',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Ground floor main entrance lobby or dining area.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '9:30 AM - 7:30 PM (Daily)',
    description: 'Central commercial mall in Talisay for south student meetups.'
  },

  // 6. UC South Campus
  {
    id: 'spot-south-1',
    name: 'Senior High School Building Lobby',
    campus: 'UC South Campus',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor entrance lobby beside the SHS administrative office.',
    securityProximity: 'Staff Supervised',
    bestHours: '7:30 AM - 4:30 PM (Weekdays)',
    description: 'Dedicated Senior High hub with teacher and guard supervision.'
  },

  // 7. UC Medical Center
  {
    id: 'spot-ucmc-1',
    name: 'UCMC Main Hospital Atrium Information Desk',
    campus: 'UC Medical Center',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Main entrance information desk near patient reception.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '8:00 AM - 6:00 PM (Daily)',
    description: 'Guarded clinical hub for nursing and medical students.'
  }
];

export const SAFE_MEETUP_CHECKLIST = [
  'Meet at designated inside campus security desks OR verified high-traffic public spots (malls, cafes, food courts).',
  'Verify the other student wears their UC ID or has the Gold Verified Student Badge.',
  'Always inspect the physical item condition thoroughly before completing the transaction.',
  'Exchange 4-digit handshake codes or scan the Handshake QR Code to finalize the trade and earn reputation score.',
  'Never agree to meet in unmonitored private alleys or remote off-grid zones.'
];
