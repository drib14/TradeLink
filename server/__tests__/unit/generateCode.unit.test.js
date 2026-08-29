const { generate4DigitCode, hashCode, verifyCode } = require('../../src/utils/generateCode');

describe('Unit Test: Code Generation & Cryptographic Verification', () => {
  it('should generate a 4-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const code = generate4DigitCode();
      expect(typeof code).toBe('string');
      expect(code).toMatch(/^\d{4}$/);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });

  it('should hash code using bcrypt and verify correctly', async () => {
    const code = '4829';
    const hash = await hashCode(code);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(code);
    expect(hash.startsWith('$2')).toBe(true);

    const isValid = await verifyCode(code, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyCode('9999', hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject null or undefined codes safely without throwing', async () => {
    expect(await verifyCode(null, 'somehash')).toBe(false);
    expect(await verifyCode('1234', null)).toBe(false);
    expect(await verifyCode('', '')).toBe(false);
  });
});
