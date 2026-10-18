/**
 * TradeLink Cryptographic ID Hasher and URL Slug Obfuscator
 * Protects database IDs and internal identifiers from sequential enumeration in URLs and public APIs.
 * Uses AES-256-CBC with deterministic HMAC-derived IV and server secret key.
 */

const crypto = require('crypto');
const env = require('../config/env');

const PREFIXES = {
  user: 'usr_',
  listing: 'itm_',
  transaction: 'tx_',
  meetup: 'mtp_',
  swap: 'swp_',
  verification: 'vfy_',
  dispute: 'dsp_',
  generic: 'tl_'
};

const ALL_PREFIXES = Object.values(PREFIXES);

// Key derived from server secret (cookieSecret or dedicated fallback)
const SECRET_SEED = env.cookieSecret || 'tradelink-campus-id-secret-salt-2026';
const CIPHER_KEY = crypto.createHash('sha256').update(SECRET_SEED).digest();
const LEGACY_SALT_PRIME = 0x5a;

/**
 * Encodes an internal ID into a URL-safe hashed slug with an entity prefix.
 * @param {string} rawId - The database or entity ID (e.g., 'user-1', 'list-2')
 * @param {string} [type='generic'] - The entity type ('user', 'listing', 'meetup', 'swap', 'verification', 'dispute')
 * @returns {string} Hashed slug (e.g., 'usr_...', 'itm_...')
 */
function encodeId(rawId, type = 'generic') {
  if (!rawId || typeof rawId !== 'string') return rawId;

  const prefix = PREFIXES[type] || PREFIXES.generic;

  // If already prefixed with any valid TradeLink prefix, return as-is
  if (ALL_PREFIXES.some((p) => rawId.startsWith(p))) {
    return rawId;
  }

  try {
    const iv = crypto.createHmac('sha256', CIPHER_KEY).update(rawId).digest().subarray(0, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', CIPHER_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(rawId, 'utf8'), cipher.final()]);
    const payload = Buffer.concat([iv, encrypted]).toString('base64url');

    return `${prefix}${payload}`;
  } catch {
    return `${prefix}${encodeURIComponent(rawId)}`;
  }
}

/**
 * Decodes a hashed URL slug back into the original database ID.
 * Safely returns unhashed legacy IDs unchanged.
 * @param {string} slug - The hashed slug or raw ID
 * @returns {string} The original internal ID
 */
function decodeId(slug) {
  if (!slug || typeof slug !== 'string') return slug;

  const matchedPrefix = ALL_PREFIXES.find((p) => slug.startsWith(p));
  if (!matchedPrefix) {
    return slug; // Unhashed raw ID (backward compatibility)
  }

  const encodedPart = slug.slice(matchedPrefix.length);
  if (!encodedPart) return slug;

  // 1. Try modern AES-256-CBC decoding
  try {
    const buf = Buffer.from(encodedPart, 'base64url');
    if (buf.length > 16) {
      const iv = buf.subarray(0, 16);
      const encrypted = buf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', CIPHER_KEY, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

      if (decrypted && /^[\x20-\x7E\s]+$/.test(decrypted)) {
        return decrypted;
      }
    }
  } catch {
    // Continue to legacy fallback
  }

  // 2. Legacy XOR fallback for backwards compatibility with any existing URLs
  try {
    let standardBase64 = encodedPart.replace(/-/g, '+').replace(/_/g, '/');
    while (standardBase64.length % 4 !== 0) {
      standardBase64 += '=';
    }

    const scrambled = Buffer.from(standardBase64, 'base64');
    const original = Buffer.alloc(scrambled.length);

    for (let i = 0; i < scrambled.length; i++) {
      original[i] = scrambled[i] ^ ((LEGACY_SALT_PRIME + i) % 256);
    }

    const legacyDecoded = original.toString('utf-8');
    if (legacyDecoded && /^[\x20-\x7E\s]+$/.test(legacyDecoded)) {
      return legacyDecoded;
    }
  } catch {
    // Fall through
  }

  return slug;
}

module.exports = {
  encodeId,
  decodeId,
  PREFIXES
};
