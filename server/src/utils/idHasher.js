/**
 * TradeLink Reversible ID Hasher and URL Slug Obfuscator
 * Protects database IDs and internal identifiers from sequential enumeration in URLs and public APIs.
 */

const SALT_PRIME = 0x5a;

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

/**
 * Encodes an internal ID into a URL-safe hashed slug with an entity prefix.
 * @param {string} rawId - The database or entity ID (e.g., 'user-1', 'list-2')
 * @param {string} [type='generic'] - The entity type ('user', 'listing', 'meetup', 'swap', 'verification', 'dispute')
 * @returns {string} Hashed slug (e.g., 'usr_N2Yw...', 'itm_N2Yw...')
 */
function encodeId(rawId, type = 'generic') {
  if (!rawId || typeof rawId !== 'string') return rawId;

  const prefix = PREFIXES[type] || PREFIXES.generic;

  // If already prefixed with any valid TradeLink prefix, return as-is
  if (ALL_PREFIXES.some((p) => rawId.startsWith(p))) {
    return rawId;
  }

  try {
    const buffer = Buffer.from(rawId, 'utf-8');
    const scrambled = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      scrambled[i] = buffer[i] ^ ((SALT_PRIME + i) % 256);
    }

    const base64url = scrambled
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${prefix}${base64url}`;
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

  const base64url = slug.slice(matchedPrefix.length);
  if (!base64url) return slug;

  try {
    let standardBase64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (standardBase64.length % 4 !== 0) {
      standardBase64 += '=';
    }

    const scrambled = Buffer.from(standardBase64, 'base64');
    const original = Buffer.alloc(scrambled.length);

    for (let i = 0; i < scrambled.length; i++) {
      original[i] = scrambled[i] ^ ((SALT_PRIME + i) % 256);
    }

    const decoded = original.toString('utf-8');
    // Ensure decoded output consists of valid printable characters
    if (decoded && /^[\x20-\x7E\s]+$/.test(decoded)) {
      return decoded;
    }
    return slug;
  } catch {
    return slug;
  }
}

module.exports = {
  encodeId,
  decodeId,
  PREFIXES
};
