const { serializeUser, sanitizeUser } = require('../../src/serializers/userSerializer');
const { serializeListing } = require('../../src/serializers/listingSerializer');

describe('Unit Test: Serializers & Data Sanitization', () => {
  it('should strip password_hash, reset_code_hash, and refresh_token_hash from user object', () => {
    const rawDbUser = {
      id: 'usr_123',
      name: 'Maria Santos',
      email: 'maria@uc.edu.ph',
      student_id: '202104982',
      password_hash: '$2a$12$secret_hash_value',
      refresh_token_hash: '$2a$12$refresh_hash',
      reset_code_hash: '$2a$12$reset_hash',
      role: 'student',
      campus: 'UC Banilad',
      college: 'Nursing',
      year_level: '4th Year',
      trust_score: 95,
      is_verified: 1
    };

    const sanitized = serializeUser(rawDbUser);

    expect(sanitized.id).toBe('usr_123');
    expect(sanitized.name).toBe('Maria Santos');
    expect(sanitized.studentId).toBe('202104982');
    expect(sanitized.isVerified).toBe(true);

    // Ensure sensitive properties are NOT present in output
    expect(sanitized.password_hash).toBeUndefined();
    expect(sanitized.passwordHash).toBeUndefined();
    expect(sanitized.refresh_token_hash).toBeUndefined();
    expect(sanitized.refreshTokenHash).toBeUndefined();
    expect(sanitized.reset_code_hash).toBeUndefined();
    expect(sanitized.resetCodeHash).toBeUndefined();
  });

  it('should normalize listing JSON and arrays into structured object', () => {
    const rawListing = {
      id: 'list_123',
      title: 'Apple iPad 9th Gen',
      description: 'Clean study tablet.',
      price: '13500.00',
      original_srp: '18990.00',
      trade_mode: 'buy_sell',
      category: 'Electronics & Gadgets',
      condition: 'Like New',
      seller_id: 'usr_beatrice',
      preferred_meetup_spots: '["Main Library 3rd Floor", "Gate 1"]',
      is_boosted: 1,
      is_sold: 0,
      views: 45
    };

    const images = ['https://img.uc.edu.ph/ipad1.jpg', 'https://img.uc.edu.ph/ipad2.jpg'];
    const tags = ['iPad', 'Apple', 'Study'];

    const serialized = serializeListing(rawListing, images, tags);

    expect(serialized.id).toBe('list_123');
    expect(serialized.price).toBe(13500);
    expect(serialized.originalSrp).toBe(18990);
    expect(serialized.isBoosted).toBe(true);
    expect(serialized.isSold).toBe(false);
    expect(Array.isArray(serialized.images)).toBe(true);
    expect(serialized.images.length).toBe(2);
    expect(serialized.preferredMeetupSpots).toEqual(['Main Library 3rd Floor', 'Gate 1']);
  });
});
