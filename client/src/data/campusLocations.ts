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

export interface CampusContactInfo {
  name: string;
  shortName: string;
  address: string;
  landmark: string;
  color: string;
  badgeClass: string;
  studentCountEst: string;
  phone: string;
  altPhone?: string;
  email: string;
  securityDesk: string;
  operatingHours: string;
  colleges: string[];
  outsideHubs: string[];
}

export const CAMPUS_DETAILS: Record<Campus, CampusContactInfo> = {
  'UC Main': {
    name: 'University of Cebu - Main Campus',
    shortName: 'UC Main',
    address: 'J. Alcantara & Sanciangko St., Cebu City',
    landmark: 'Across Elizabeth Mall (E-Mall) & Colonade Mall',
    color: '#002B7F',
    badgeClass: 'uc-main',
    studentCountEst: '25,000+ Students',
    phone: '(032) 255-7100',
    altPhone: '(032) 255-7101',
    email: 'main@uc.edu.ph',
    securityDesk: 'Sanciangko Gate Main Security Post & Turnstiles',
    operatingHours: '6:30 AM - 9:00 PM (Mon - Sat)',
    colleges: ['CCS (Computer Studies)', 'CBA (Business)', 'College of Law', 'Criminology', 'Arts & Sciences', 'Senior High School'],
    outsideHubs: ['Elizabeth Mall (E-Mall) Food Court', 'Colonade Mall Ground Floor', 'J. Alcantara 7-Eleven']
  },
  'UC Banilad': {
    name: 'University of Cebu - Banilad Campus',
    shortName: 'UC Banilad',
    address: 'Gov. M. Cuenco Ave., Banilad, Cebu City',
    landmark: 'Beside Gaisano Country Mall & near Cebu IT Park',
    color: '#002B7F',
    badgeClass: 'uc-banilad',
    studentCountEst: '18,000+ Students',
    phone: '(032) 231-8623',
    altPhone: '(032) 231-8624',
    email: 'banilad@uc.edu.ph',
    securityDesk: 'Gov. Cuenco Gate Guard Station & Building A Lobby',
    operatingHours: '6:30 AM - 8:30 PM (Mon - Sat)',
    colleges: ['College of Nursing', 'Allied Health Sciences', 'CBA (Business)', 'College of Medicine', 'Senior High School'],
    outsideHubs: ['Gaisano Country Mall Jollibee / Atrium', 'Cebu IT Park Ayala Central Bloc', 'Banilad Town Center (BTC)']
  },
  'UC LM': {
    name: 'University of Cebu - Lapu-Lapu & Mandaue (LM)',
    shortName: 'UC LM',
    address: 'A.C. Cortes Ave., Looc, Mandaue City',
    landmark: 'Near 1st Mactan-Mandaue Bridge intersection & Parkmall',
    color: '#002B7F',
    badgeClass: 'uc-lm',
    studentCountEst: '19,000+ Students',
    phone: '(032) 345-6540',
    altPhone: '(032) 345-6541',
    email: 'uclm@uc.edu.ph',
    securityDesk: 'A.C. Cortes Main Gate Guard House & Innovation Lobby',
    operatingHours: '7:00 AM - 8:30 PM (Mon - Sat)',
    colleges: ['College of Engineering', 'CCS (Computer Studies)', 'Hospitality & Tourism', 'CBA (Business)', 'Senior High School'],
    outsideHubs: ['Parkmall Mandaue Food Street & Lobby', 'City Times Square Mandaue', 'Pacific Mall Mandaue']
  },
  'UC METC': {
    name: 'University of Cebu - Maritime Education & Training Center',
    shortName: 'UC METC',
    address: 'Alumnos St., Mambaling, Cebu City',
    landmark: 'Near Cebu South Coastal Road, SM Seaside & IL Corso',
    color: '#002B7F',
    badgeClass: 'uc-metc',
    studentCountEst: '12,000+ Cadets',
    phone: '(032) 261-3781',
    altPhone: '(032) 261-3782',
    email: 'ucmetc@uc.edu.ph',
    securityDesk: 'Alumnos Gate Cadet Muster Station & Guard Booth',
    operatingHours: '6:30 AM - 7:30 PM (Mon - Sat)',
    colleges: ['BS Marine Transportation (BSMT)', 'BS Marine Engineering (BSMarE)', 'Naval Architecture', 'Senior High (TVL)'],
    outsideHubs: ['IL Corso Waterfront Central Piazza', 'SM Seaside City Cebu Mountain Wing', 'Mambaling Highway Hub']
  },
  'UC PRI': {
    name: 'University of Cebu - PRI (Junior & Senior High)',
    shortName: 'UC PRI',
    address: 'J. Alcantara & Sanciangko St. Academic Corridor, Cebu City',
    landmark: 'UC PRI Senior High Building & Junior High Quadrangle',
    color: '#002B7F',
    badgeClass: 'uc-pri',
    studentCountEst: '12,000+ High School Students',
    phone: '(032) 255-7100 loc. 112',
    altPhone: '(032) 255-7100 loc. 115',
    email: 'shs@uc.edu.ph',
    securityDesk: 'J. Alcantara High School Gate Guard Post',
    operatingHours: '7:00 AM - 6:00 PM (Mon - Fri)',
    colleges: ['Junior High School (Grades 7–10)', 'Senior High STEM Strand', 'Senior High ABM Strand', 'Senior High HUMSS Strand', 'Senior High TVL/GAS'],
    outsideHubs: ['Elizabeth Mall (E-Mall) Food Court', 'Colonade Mall', 'South Bus Terminal Benches']
  },
  'UC Pardo-Talisay': {
    name: 'University of Cebu - Pardo-Talisay (PT)',
    shortName: 'UC PT',
    address: 'National Highway, Bulacao / Poblacion, Talisay City & Pardo, Cebu',
    landmark: 'Along South National Highway near Gaisano Grand Talisay',
    color: '#002B7F',
    badgeClass: 'uc-pt',
    studentCountEst: '8,000+ Students',
    phone: '(032) 273-0498',
    altPhone: '(032) 273-0499',
    email: 'ucpt@uc.edu.ph',
    securityDesk: 'National Highway Main Gate Security Post',
    operatingHours: '7:00 AM - 7:00 PM (Mon - Sat)',
    colleges: ['College of Criminology', 'College of Education', 'CBA (Business)', 'Senior High School (STEM, ABM, HUMSS)'],
    outsideHubs: ['Gaisano Grand Mall Talisay / Food Court', 'Pardo Church Plaza', 'South Coast Commercial Center']
  },
  'UC South Campus': {
    name: 'University of Cebu - South Campus',
    shortName: 'UC South',
    address: 'Sanciangko St. & B. Aranas St., Cebu City',
    landmark: 'Basic Education & Senior High Academic Hub',
    color: '#002B7F',
    badgeClass: 'uc-south',
    studentCountEst: '7,000+ Students',
    phone: '(032) 253-1861',
    altPhone: '(032) 253-1862',
    email: 'ucsouth@uc.edu.ph',
    securityDesk: 'South Campus Main Entrance Lobby Security Desk',
    operatingHours: '7:00 AM - 6:00 PM (Mon - Fri)',
    colleges: ['Senior High School (All Strands)', 'Junior High School', 'Basic Education & Tech-Voc'],
    outsideHubs: ['Emall Ground Floor Benches', 'Sanciangko Street Cafes', 'GV Tower Lobby']
  },
  'UC Medical Center': {
    name: 'University of Cebu Medical Center (UCMC)',
    shortName: 'UCMC',
    address: 'Ouano Ave., Subangdaku, North Reclamation Area, Mandaue City',
    landmark: 'UCMC Tertiary Training Hospital & Health Sciences Quadrangle',
    color: '#002B7F',
    badgeClass: 'uc-ucmc',
    studentCountEst: '4,000+ Health Interns & Med Students',
    phone: '(032) 517-0888',
    altPhone: '(032) 517-0889',
    email: 'ucmc@uc.edu.ph',
    securityDesk: 'UCMC Hospital Main Atrium Security & Information Reception',
    operatingHours: '7:00 AM - 8:00 PM (Daily)',
    colleges: ['College of Medicine (Doctor of Medicine)', 'Nursing Clinical Interns', 'Pharmacy', 'Medical Technology'],
    outsideHubs: ['UCMC Hospital Ground Floor Cafe', 'Subangdaku Starbucks / Jollibee', 'Mandaue Reclamation Hub']
  }
};

export const CAMPUS_MEETUP_SPOTS: LandmarkSpot[] = [
  // 1. UC Main
  {
    id: 'spot-main-1',
    name: 'Main Lobby Security Desk (Sanciangko Gate)',
    campus: 'UC Main',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor main entrance lobby directly opposite turnstiles and guard post.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:30 AM - 6:00 PM (Monday - Saturday)',
    description: 'High visibility, campus guard presence with well-lit waiting benches and CCTV coverage.'
  },
  {
    id: 'spot-main-2',
    name: 'UC Main Library Turnstiles (3rd Floor)',
    campus: 'UC Main',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: '3rd Floor Library entrance hallway beside digital card tap-in station.',
    securityProximity: 'Staff Supervised',
    bestHours: '8:00 AM - 5:30 PM (Weekdays)',
    description: 'Quiet academic zone, ideal for textbook, calculator, and study material inspections.'
  },
  {
    id: 'spot-main-outside-1',
    name: 'Elizabeth Mall (E-Mall) Food Court (Outside)',
    campus: 'UC Main',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Directly across UC Main via pedestrian overpass, 3rd Floor Food Court.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 8:00 PM (Daily)',
    description: 'High foot traffic, air-conditioned public mall space with abundant seating.'
  },

  // 2. UC Banilad
  {
    id: 'spot-ban-1',
    name: 'Banilad Main Guard Station (Gov. Cuenco Gate)',
    campus: 'UC Banilad',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Front gate visitor reception desk next to vehicle barrier.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:00 AM - 7:00 PM (Daily)',
    description: 'Guarded entrance with covered waiting shelter and 24/7 security staff.'
  },
  {
    id: 'spot-ban-2',
    name: 'Banilad Canteen Atrium & Open Benches',
    campus: 'UC Banilad',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor student dining atrium adjacent to Building A.',
    securityProximity: 'Staff Supervised',
    bestHours: '8:00 AM - 5:00 PM (School Days)',
    description: 'Spacious common area perfect for inspecting clinical scrubs, stethoscope kits, and textbooks.'
  },
  {
    id: 'spot-ban-outside-1',
    name: 'Gaisano Country Mall Atrium / Jollibee (Outside)',
    campus: 'UC Banilad',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Directly adjacent to UC Banilad, ground floor atrium or Jollibee counter.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '9:00 AM - 8:00 PM (Daily)',
    description: 'Convenient adjacent mall with mall security, dining, and ample parking.'
  },

  // 3. UC LM
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
    description: 'Vibrant lifestyle mall with roving guards and open outdoor benches.'
  },

  // 4. UC METC
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
    name: 'SM Seaside City Cebu / IL Corso (Outside)',
    campus: 'UC METC',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'South Road Properties (5-10 mins from METC), Mountain Wing entrance or IL Corso piazza.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 9:00 PM (Daily)',
    description: 'Spacious coastal mall environment with full security checks and food courts.'
  },

  // 5. UC PRI
  {
    id: 'spot-pri-1',
    name: 'UC PRI Main Gate & Security Post',
    campus: 'UC PRI',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Ground floor main student gate and security checkpoint on J. Alcantara.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '7:00 AM - 5:30 PM (Monday - Friday)',
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

  // 6. UC Pardo-Talisay
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
    name: 'Gaisano Grand Mall Talisay (Outside)',
    campus: 'UC Pardo-Talisay',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Ground floor main entrance lobby or food court area.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '9:30 AM - 7:30 PM (Daily)',
    description: 'Central commercial mall in Talisay for south student meetups.'
  },

  // 7. UC South Campus
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
  {
    id: 'spot-south-2',
    name: 'South Campus Quadrangle Benches',
    campus: 'UC South Campus',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Central shaded courtyard benches near the basic education office.',
    securityProximity: 'Staff Supervised',
    bestHours: '8:00 AM - 5:00 PM (Weekdays)',
    description: 'Quiet outdoor open-air zone on campus grounds.'
  },

  // 8. UC Medical Center
  {
    id: 'spot-ucmc-1',
    name: 'UCMC Main Hospital Atrium Information Desk',
    campus: 'UC Medical Center',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: 'Main entrance information desk near patient reception.',
    securityProximity: 'Directly Beside Guard/Security',
    bestHours: '8:00 AM - 6:00 PM (Daily)',
    description: 'Guarded clinical hub for nursing and medical students.'
  },
  {
    id: 'spot-ucmc-2',
    name: 'UCMC College of Medicine Student Lounge',
    campus: 'UC Medical Center',
    locationType: 'Inside Campus (Guarded)',
    locationDetails: '2nd Floor academic building student lounge and study area.',
    securityProximity: 'Staff Supervised',
    bestHours: '8:00 AM - 7:00 PM (Daily)',
    description: 'Safe study area for exchanging diagnostic kits, scrubs, and medical textbooks.'
  }
];

export const SAFE_MEETUP_CHECKLIST = [
  'Meet at designated inside campus security desks OR verified high-traffic public spots (malls, cafes, food courts).',
  'Verify the other student wears their UC ID or has the Gold Verified Student Badge.',
  'Always inspect the physical item condition thoroughly before completing the transaction.',
  'Confirm item satisfaction in person before the seller marks the transaction as complete, then submit an authentic product review.',
  'Never agree to meet in unmonitored private alleys or remote off-grid zones.'
];
