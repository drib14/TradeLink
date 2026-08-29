const { encodeId, decodeId, PREFIXES } = require('../../src/utils/idHasher');

describe('Unit Test: URL Identifier Hashing & Obfuscation', () => {
  it('should encode and decode a user ID correctly with usr_ prefix', () => {
    const rawUserId = 'user-alex-12345';
    const hashed = encodeId(rawUserId, 'user');

    expect(hashed).toMatch(/^usr_[A-Za-z0-9_-]+$/);
    expect(decodeId(hashed)).toBe(rawUserId);
  });

  it('should encode and decode a listing ID correctly with itm_ prefix', () => {
    const rawListingId = 'list-98765-casio';
    const hashed = encodeId(rawListingId, 'listing');

    expect(hashed).toMatch(/^itm_[A-Za-z0-9_-]+$/);
    expect(decodeId(hashed)).toBe(rawListingId);
  });

  it('should encode and decode meetup, swap, verification, and dispute IDs with respective prefixes', () => {
    const testCases = [
      { id: 'mtp-001', type: 'meetup', prefix: 'mtp_' },
      { id: 'swap-456', type: 'swap', prefix: 'swp_' },
      { id: 'verif-789', type: 'verification', prefix: 'vfy_' },
      { id: 'disp-321', type: 'dispute', prefix: 'dsp_' }
    ];

    testCases.forEach(({ id, type, prefix }) => {
      const hashed = encodeId(id, type);
      expect(hashed.startsWith(prefix)).toBe(true);
      expect(decodeId(hashed)).toBe(id);
    });
  });

  it('should handle standard UUID strings reversibly', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const hashed = encodeId(uuid, 'listing');

    expect(decodeId(hashed)).toBe(uuid);
  });

  it('should be idempotent if an already hashed ID is passed to encodeId', () => {
    const rawId = 'user-alex-123';
    const hashedOnce = encodeId(rawId, 'user');
    const hashedTwice = encodeId(hashedOnce, 'user');

    expect(hashedTwice).toBe(hashedOnce);
    expect(decodeId(hashedTwice)).toBe(rawId);
  });

  it('should safely return legacy unhashed IDs unchanged when decoded', () => {
    expect(decodeId('user-legacy-1')).toBe('user-legacy-1');
    expect(decodeId('list-legacy-99')).toBe('list-legacy-99');
    expect(decodeId(null)).toBe(null);
    expect(decodeId(undefined)).toBe(undefined);
    expect(decodeId('')).toBe('');
  });

  it('should safely return malformed hashed tokens without throwing exceptions', () => {
    const malformed = 'usr_!!!invalid_base64$$$';
    expect(() => decodeId(malformed)).not.toThrow();
  });
});
