/**
 * Security and Privacy Utilities for TradeLink
 * Provides URL-safe reversible hashing/obfuscation for sensitive identifiers
 * and privacy masking for sensitive student details.
 */

// URL-safe prefixes for TradeLink entity obfuscation
export const HASH_PREFIXES = {
  user: 'usr_',
  listing: 'itm_',
  meetup: 'mtp_',
  swap: 'swp_',
  verification: 'vfy_',
  dispute: 'dsp_',
  generic: 'tl_'
} as const;

export type EntityIdType = keyof typeof HASH_PREFIXES;

const ALL_HASH_PREFIXES = Object.values(HASH_PREFIXES);
const SALT_PRIME = 0x5a;

/**
 * Encodes an internal ID into a URL-safe hashed slug with an entity prefix.
 * Example: encodeHashedId('list-1', 'listing') -> 'itm_N2YwNmQ...'
 */
export function encodeHashedId(rawId: string | null | undefined, type: EntityIdType = 'user'): string {
  if (!rawId) return '';

  const prefix = HASH_PREFIXES[type] || HASH_PREFIXES.generic;

  // If already encoded with any valid TradeLink prefix, return as is
  if (ALL_HASH_PREFIXES.some((p) => rawId.startsWith(p))) {
    return rawId;
  }

  try {
    // Convert string to bytes, apply XOR salt, then base64url encode
    const utf8Bytes = new TextEncoder().encode(rawId);
    const scrambled = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      scrambled[i] = utf8Bytes[i] ^ ((SALT_PRIME + i) % 256);
    }

    // Base64URL encoding (RFC 4648 §5)
    let binary = '';
    for (let i = 0; i < scrambled.length; i++) {
      binary += String.fromCharCode(scrambled[i]);
    }
    const base64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${prefix}${base64}`;
  } catch {
    return `${prefix}${encodeURIComponent(rawId)}`;
  }
}

/**
 * Decodes a hashed slug back into the original ID.
 * Safely handles hashed slugs across any prefix ('usr_...', 'itm_...', 'mtp_...') and raw legacy IDs.
 */
export function decodeHashedId(token: string | null | undefined): string {
  if (!token) return '';

  const matchedPrefix = ALL_HASH_PREFIXES.find((p) => token.startsWith(p));
  if (!matchedPrefix) {
    return token; // Legacy raw ID
  }

  const base64 = token.slice(matchedPrefix.length);
  if (!base64) return token;

  try {
    // Base64URL decode
    let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (standardBase64.length % 4 !== 0) {
      standardBase64 += '=';
    }

    const binary = atob(standardBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i) ^ ((SALT_PRIME + i) % 256);
    }

    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // Check if result is a valid printable ASCII / UTF-8 string
    if (decoded && !/[\uFFFD]/.test(decoded) && /^[\x20-\x7E\s]+$/.test(decoded)) {
      return decoded;
    }
    return token;
  } catch {
    try {
      return decodeURIComponent(base64);
    } catch {
      return token;
    }
  }
}

/**
 * Masks student ID number for public profile viewing.
 * Example: '19283746' -> '•••• 3746', or '••••••••'
 */
export function maskStudentId(studentId?: string | null, isSelfOrAdmin: boolean = false): string {
  if (!studentId) return '••••••••';
  if (isSelfOrAdmin) return studentId;

  const clean = studentId.replace(/\s+/g, '');
  if (clean.length <= 4) {
    return '••••••••';
  }
  const lastFour = clean.slice(-4);
  return `•••• ${lastFour}`;
}

/**
 * Masks an email address for privacy.
 * Example: 'jhondoe@uc.edu.ph' -> 'j•••e@uc.edu.ph'
 */
export function maskEmail(email?: string | null, isSelfOrAdmin: boolean = false): string {
  if (!email) return '';
  if (isSelfOrAdmin) return email;

  const parts = email.split('@');
  if (parts.length !== 2) return '••••••••';

  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0]}•••@${domain}`;
  }
  return `${username[0]}•••${username[username.length - 1]}@${domain}`;
}
