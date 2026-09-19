import { Campus } from '../types';

export interface LandmarkSpot {
  id: string;
  name: string;
  campus: Campus | 'Outside Campus';
  locationType: 'Inside Campus' | 'Outside Campus (Nearby Mall/Hub)' | 'Transit / Cafe';
  locationDetails: string;
  securityProximity: 'High Foot Traffic Common Area' | 'High Foot Traffic Mall / Hub' | 'Staff / Student Supervised Area';
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
    operatingHours: '7:00 AM - 8:00 PM (Daily)',
    colleges: ['College of Medicine (Doctor of Medicine)', 'Nursing Clinical Interns', 'Pharmacy', 'Medical Technology'],
    outsideHubs: ['UCMC Hospital Ground Floor Cafe', 'Subangdaku Starbucks / Jollibee', 'Mandaue Reclamation Hub']
  }
};

export const CAMPUS_MEETUP_SPOTS: LandmarkSpot[] = [
  {
    id: 'spot-main-1',
    name: 'Main Lobby & Waiting Area (Sanciangko Gate)',
    campus: 'UC Main',
    locationType: 'Inside Campus',
    locationDetails: 'Ground floor main entrance lobby with open benches.',
    securityProximity: 'High Foot Traffic Common Area',
    bestHours: '7:30 AM - 6:00 PM (Monday - Saturday)',
    description: 'High visibility, central campus area with well-lit waiting benches and active student foot traffic.'
  },
  {
    id: 'spot-main-2',
    name: 'UC Main Library Reading Lounge (3rd Floor)',
    campus: 'UC Main',
    locationType: 'Inside Campus',
    locationDetails: '3rd Floor Library entrance hallway and study benches.',
    securityProximity: 'Staff / Student Supervised Area',
    bestHours: '8:00 AM - 5:30 PM (Weekdays)',
    description: 'Quiet academic zone, ideal for textbook, calculator, and study material inspections.'
  },
  {
    id: 'spot-main-outside-1',
    name: 'Elizabeth Mall (E-Mall) Food Court (Nearby Hub)',
    campus: 'UC Main',
    locationType: 'Outside Campus (Nearby Mall/Hub)',
    locationDetails: 'Directly across UC Main via pedestrian overpass, 3rd Floor Food Court.',
    securityProximity: 'High Foot Traffic Mall / Hub',
    bestHours: '10:00 AM - 8:00 PM (Daily)',
    description: 'High foot traffic, air-conditioned public mall space with abundant seating.'
  }
];

export const SAFE_MEETUP_CHECKLIST = [
  'Coordinate a mutually agreed, public meetup location (e.g. campus library, canteen, student pavilion, or nearby public cafe).',
  'Verify the other student has a Verified Student Badge on TradeLink.',
  'Always physically inspect the item thoroughly before completing the handover.',
  'Settle payment only in person after confirming item quality and satisfaction.',
  'Leave an authentic product rating and review to guide and support your fellow student peers.'
];
