/**
 * University of Cebu - Academic Colleges & Departments
 * Official College metadata, descriptions, brand colors, and high-fidelity SVG badge logos.
 */

export interface Department {
  code: string;
  name: string;
  shortName: string;
  logo: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
}

const createBadgeSvg = (
  code: string,
  symbolPath: string,
  primaryColor: string,
  accentColor: string
): string => {
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg-${code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001D59"/>
      <stop offset="100%" stop-color="#002B7F"/>
    </linearGradient>
  </defs>
  <!-- Outer Ring with UC Blue / Gold Accents -->
  <circle cx="32" cy="32" r="30" fill="url(#bg-${code})" stroke="${accentColor}" stroke-width="2.5"/>
  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="2 2"/>
  <!-- Central Icon Symbol -->
  <g transform="translate(14, 10)">
    ${symbolPath}
  </g>
  <!-- College Code Pill -->
  <rect x="14" y="44" width="36" height="14" rx="7" fill="${primaryColor}" stroke="${accentColor}" stroke-width="1.2"/>
  <text x="32" y="54" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">${code}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
};

export const DEPARTMENTS: Department[] = [
  {
    code: 'CCS',
    name: 'College of Computer Studies',
    shortName: 'Computer Studies',
    badgeBg: '#EBF1FC',
    badgeColor: '#002B7F',
    description: 'Computer Science, Information Technology & Information Systems',
    logo: createBadgeSvg(
      'CCS',
      `<rect x="4" y="4" width="28" height="18" rx="2" fill="#00123D" stroke="#38BDF8" stroke-width="1.8"/>
       <line x1="12" y1="22" x2="24" y2="22" stroke="#38BDF8" stroke-width="2"/>
       <line x1="8" y1="26" x2="28" y2="26" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
       <path d="M11 10l-3 3 3 3m14-6l3 3-3 3m-8 1l2-8" stroke="#FFC72C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
      '#002B7F',
      '#38BDF8'
    )
  },
  {
    code: 'CCJ',
    name: 'College of Criminal Justice',
    shortName: 'Criminal Justice',
    badgeBg: '#F1F5F9',
    badgeColor: '#0F172A',
    description: 'Criminology & Law Enforcement Administration',
    logo: createBadgeSvg(
      'CCJ',
      `<path d="M18 4l12 5v9c0 8-7 14-12 16-5-2-12-8-12-16v-9l12-5z" fill="#00123D" stroke="#60A5FA" stroke-width="1.8"/>
       <polygon points="18,10 20,15 25,15.5 21,19 22,24 18,21.5 14,24 15,19 11,15.5 16,15" fill="#FFC72C"/>`,
      '#002B7F',
      '#60A5FA'
    )
  },
  {
    code: 'CTE',
    name: 'College of Teachers Education',
    shortName: 'Education',
    badgeBg: '#EBF1FC',
    badgeColor: '#0A3EA8',
    description: 'Elementary & Secondary Education, Pedagogy',
    logo: createBadgeSvg(
      'CTE',
      `<path d="M4 14l14-6 14 6-14 6-14-6z" fill="#00123D" stroke="#93C5FD" stroke-width="1.8"/>
       <path d="M9 18v8c0 4 4 6 9 6s9-2 9-6v-8" fill="none" stroke="#93C5FD" stroke-width="1.8"/>
       <line x1="32" y1="15" x2="32" y2="26" stroke="#FFC72C" stroke-width="2"/>
       <circle cx="32" cy="27" r="2" fill="#FFC72C"/>`,
      '#002B7F',
      '#93C5FD'
    )
  },
  {
    code: 'COE',
    name: 'College of Engineering',
    shortName: 'Engineering',
    badgeBg: '#EBF1FC',
    badgeColor: '#0284C7',
    description: 'Civil, Mechanical, Electrical, Electronics & Computer Engineering',
    logo: createBadgeSvg(
      'COE',
      `<circle cx="18" cy="16" r="6" fill="#00123D" stroke="#38BDF8" stroke-width="2"/>
       <circle cx="18" cy="16" r="2.5" fill="#FFC72C"/>
       <path d="M18 6v4m0 12v4m-10-10h4m12 0h4m-3.5-7.5l-3 3m-7 7l-3 3m0-13l3 3m7 7l3 3" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>`,
      '#002B7F',
      '#38BDF8'
    )
  },
  {
    code: 'CAS',
    name: 'College of Arts and Sciences',
    shortName: 'Arts & Sciences',
    badgeBg: '#F0F9FF',
    badgeColor: '#0369A1',
    description: 'Liberal Arts, Social Sciences, Natural Sciences & Psychology',
    logo: createBadgeSvg(
      'CAS',
      `<ellipse cx="18" cy="16" rx="14" ry="5.5" fill="none" stroke="#60A5FA" stroke-width="1.8" transform="rotate(30 18 16)"/>
       <ellipse cx="18" cy="16" rx="14" ry="5.5" fill="none" stroke="#60A5FA" stroke-width="1.8" transform="rotate(-30 18 16)"/>
       <circle cx="18" cy="16" r="4" fill="#FFC72C"/>`,
      '#002B7F',
      '#60A5FA'
    )
  },
  {
    code: 'CBA',
    name: 'College of Business & Accountancy',
    shortName: 'Business & Accountancy',
    badgeBg: '#FFFBEB',
    badgeColor: '#B45309',
    description: 'Accountancy, Financial Management, Marketing & Management',
    logo: createBadgeSvg(
      'CBA',
      `<path d="M4 26h28M8 26v-6m7 6v-12m7 12v-16m7 16v-8" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round"/>
       <path d="M6 18l7-6 7 4 9-8" fill="none" stroke="#FFC72C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
       <polyline points="25,8 29,8 29,12" fill="none" stroke="#FFC72C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      '#002B7F',
      '#FFC72C'
    )
  },
  {
    code: 'CHM',
    name: 'College of Hospitality Management',
    shortName: 'Hospitality Management',
    badgeBg: '#F0FDF4',
    badgeColor: '#15803D',
    description: 'Hotel & Restaurant Management, Tourism & Culinary Arts',
    logo: createBadgeSvg(
      'CHM',
      `<path d="M6 24h24c0-8-5-13-12-13S6 16 6 24z" fill="#00123D" stroke="#7DD3FC" stroke-width="1.8"/>
       <circle cx="18" cy="9" r="2.5" fill="#FFC72C"/>
       <line x1="4" y1="27" x2="32" y2="27" stroke="#FFC72C" stroke-width="2.5" stroke-linecap="round"/>`,
      '#002B7F',
      '#7DD3FC'
    )
  },
  {
    code: 'CON',
    name: 'College of Nursing',
    shortName: 'Nursing',
    badgeBg: '#ECFEFF',
    badgeColor: '#0E7490',
    description: 'Bachelor of Science in Nursing & Patient Care',
    logo: createBadgeSvg(
      'CON',
      `<path d="M14 6h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="#00123D" stroke="#22D3EE" stroke-width="1.8"/>
       <path d="M5 16h6l2-4 3 8 3-5 2 2h7" fill="none" stroke="#FFC72C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
      '#002B7F',
      '#22D3EE'
    )
  },
  {
    code: 'SOM',
    name: 'School of Medicine',
    shortName: 'Medicine',
    badgeBg: '#F8FAFC',
    badgeColor: '#0369A1',
    description: 'Doctor of Medicine, Clinical Research & Surgery',
    logo: createBadgeSvg(
      'SOM',
      `<line x1="18" y1="5" x2="18" y2="27" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
       <circle cx="18" cy="4" r="2" fill="#FFC72C"/>
       <path d="M14 8c7-2 8 4 0 6s-8 4 0 6 8 4 0 6" fill="none" stroke="#FFC72C" stroke-width="1.8" stroke-linecap="round"/>`,
      '#002B7F',
      '#38BDF8'
    )
  },
  {
    code: 'COL',
    name: 'College of Law',
    shortName: 'Law',
    badgeBg: '#EEF2FF',
    badgeColor: '#4338CA',
    description: 'Juris Doctor & Legal Studies',
    logo: createBadgeSvg(
      'COL',
      `<line x1="18" y1="6" x2="18" y2="26" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
       <line x1="7" y1="10" x2="29" y2="10" stroke="#FFC72C" stroke-width="2" stroke-linecap="round"/>
       <path d="M7 10l-4 8h8l-4-8zm22 0l-4 8h8l-4-8z" fill="#00123D" stroke="#818CF8" stroke-width="1.4"/>
       <line x1="13" y1="26" x2="23" y2="26" stroke="#FFC72C" stroke-width="2.5" stroke-linecap="round"/>`,
      '#002B7F',
      '#818CF8'
    )
  },
  {
    code: 'CCA',
    name: 'College of Customs Administration',
    shortName: 'Customs Administration',
    badgeBg: '#EBF1FC',
    badgeColor: '#002B7F',
    description: 'Tariff, International Trade & Customs Brokerage',
    logo: createBadgeSvg(
      'CCA',
      `<rect x="6" y="8" width="24" height="16" rx="2" fill="#00123D" stroke="#38BDF8" stroke-width="1.8"/>
       <line x1="6" y1="16" x2="30" y2="16" stroke="#38BDF8" stroke-width="1.6"/>
       <line x1="18" y1="8" x2="18" y2="24" stroke="#38BDF8" stroke-width="1.6"/>
       <circle cx="18" cy="16" r="3.5" fill="#FFC72C" stroke="#00123D" stroke-width="1"/>`,
      '#002B7F',
      '#38BDF8'
    )
  },
  {
    code: 'CME',
    name: 'College of Maritime Education',
    shortName: 'Maritime Education',
    badgeBg: '#EBF1FC',
    badgeColor: '#001D59',
    description: 'Marine Transportation, Marine Engineering & Nautical Studies',
    logo: createBadgeSvg(
      'CME',
      `<circle cx="18" cy="16" r="9" fill="#00123D" stroke="#60A5FA" stroke-width="2"/>
       <circle cx="18" cy="16" r="3.5" fill="#FFC72C"/>
       <line x1="18" y1="5" x2="18" y2="27" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/>
       <line x1="7" y1="16" x2="29" y2="16" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/>
       <line x1="10" y1="8" x2="26" y2="24" stroke="#60A5FA" stroke-width="1.8" stroke-linecap="round"/>
       <line x1="10" y1="24" x2="26" y2="8" stroke="#60A5FA" stroke-width="1.8" stroke-linecap="round"/>`,
      '#002B7F',
      '#60A5FA'
    )
  },
  {
    code: 'JHS',
    name: 'Junior High School',
    shortName: 'Junior High',
    badgeBg: '#F0F9FF',
    badgeColor: '#0369A1',
    description: 'Basic Education Department (Grades 7 to 10)',
    logo: createBadgeSvg(
      'JHS',
      `<rect x="6" y="8" width="24" height="18" rx="3" fill="#00123D" stroke="#38BDF8" stroke-width="1.8"/>
       <path d="M11 14h14M11 18h14M11 22h9" stroke="#38BDF8" stroke-width="1.6" stroke-linecap="round"/>
       <polygon points="26,6 28,11 33,11 29,14 30,19 26,16 22,19 23,14 19,11 24,11" fill="#FFC72C"/>`,
      '#002B7F',
      '#38BDF8'
    )
  },
  {
    code: 'SHS',
    name: 'Senior High School',
    shortName: 'Senior High',
    badgeBg: '#EBF1FC',
    badgeColor: '#002B7F',
    description: 'Senior High (STEM, ABM, HUMSS, TVL, GAS)',
    logo: createBadgeSvg(
      'SHS',
      `<path d="M4 14l14-6 14 6-14 6-14-6z" fill="#00123D" stroke="#60A5FA" stroke-width="1.8"/>
       <line x1="32" y1="14" x2="32" y2="25" stroke="#FFC72C" stroke-width="2"/>
       <circle cx="32" cy="26" r="2" fill="#FFC72C"/>
       <path d="M8 22c0 4 4.5 7 10 7s10-3 10-7" fill="none" stroke="#60A5FA" stroke-width="1.8"/>`,
      '#002B7F',
      '#60A5FA'
    )
  }
];

/**
 * Find department by code or loose text match (e.g. "CCS" or "Computer Studies")
 */
export function getDepartment(codeOrName?: string | null): Department | undefined {
  if (!codeOrName) return undefined;
  const clean = codeOrName.trim().toUpperCase();
  // Exact code match
  const exact = DEPARTMENTS.find((d) => d.code === clean);
  if (exact) return exact;

  // Name or partial match
  const lower = codeOrName.trim().toLowerCase();
  return DEPARTMENTS.find(
    (d) =>
      d.code.toLowerCase() === lower ||
      d.name.toLowerCase().includes(lower) ||
      d.shortName.toLowerCase().includes(lower)
  );
}

/**
 * Get human-readable department label
 */
export function getDepartmentName(codeOrName?: string | null): string {
  const dept = getDepartment(codeOrName);
  return dept ? dept.name : (codeOrName || 'General Student');
}

/**
 * Get department logo data URI
 */
export function getDepartmentLogo(codeOrName?: string | null): string {
  const dept = getDepartment(codeOrName);
  return dept ? dept.logo : '/uc-logo.png';
}

