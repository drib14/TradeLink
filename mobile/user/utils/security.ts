/**
 * Security and ID Hashing Utilities for TradeLink Mobile
 */

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

export function encodeHashedId(rawId: string | null | undefined, type: EntityIdType = 'user'): string {
  if (!rawId) return '';

  const prefix = HASH_PREFIXES[type] || HASH_PREFIXES.generic;

  if (ALL_HASH_PREFIXES.some((p) => rawId.startsWith(p))) {
    return rawId;
  }

  try {
    const utf8Bytes: number[] = [];
    for (let i = 0; i < rawId.length; i++) {
      utf8Bytes.push(rawId.charCodeAt(i));
    }
    const scrambled: number[] = [];
    for (let i = 0; i < utf8Bytes.length; i++) {
      scrambled.push(utf8Bytes[i] ^ ((SALT_PRIME + i) % 256));
    }

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

export function decodeHashedId(token: string | null | undefined): string {
  if (!token) return '';

  const matchedPrefix = ALL_HASH_PREFIXES.find((p) => token.startsWith(p));
  if (!matchedPrefix) {
    return token;
  }

  const base64 = token.slice(matchedPrefix.length);
  if (!base64) return token;

  try {
    let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (standardBase64.length % 4 !== 0) {
      standardBase64 += '=';
    }

    const binary = atob(standardBase64);
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i++) {
      bytes.push(binary.charCodeAt(i) ^ ((SALT_PRIME + i) % 256));
    }

    let decoded = '';
    for (let i = 0; i < bytes.length; i++) {
      decoded += String.fromCharCode(bytes[i]);
    }

    if (decoded && /^[\x20-\x7E\s]+$/.test(decoded)) {
      return decoded;
    }
    return token;
  } catch {
    return token;
  }
}

export function maskStudentId(studentId?: string | number | null): string {
  if (studentId === null || studentId === undefined || studentId === '') return '••••••••';
  const str = String(studentId).trim();
  if (!str) return '••••••••';
  const clean = str.replace(/\s+/g, '');
  if (clean.length <= 4) return '••••••••';
  return `•••• ${clean.slice(-4)}`;
}
