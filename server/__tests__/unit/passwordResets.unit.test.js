const { generate4DigitCode, hashCode, verifyCode } = require('../../src/utils/generateCode');
const emailService = require('../../src/services/email.service');

describe('Unit Test: Admin-Approved Password Reset & Code Generation', () => {
  describe('Cryptographic Code Generation & Verification', () => {
    it('should generate a 4-digit numeric string between 1000 and 9999', () => {
      for (let i = 0; i < 20; i++) {
        const code = generate4DigitCode();
        expect(code).toMatch(/^\d{4}$/);
        const num = parseInt(code, 10);
        expect(num).toBeGreaterThanOrEqual(1000);
        expect(num).toBeLessThan(10000);
      }
    });

    it('should hash code with bcrypt and correctly verify matches', async () => {
      const code = generate4DigitCode();
      const hash = await hashCode(code);

      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(await verifyCode(code, hash)).toBe(true);
      expect(await verifyCode('0000', hash)).toBe(false);
      expect(await verifyCode('', hash)).toBe(false);
    });
  });

  describe('Email Notification Formatting & Dispatcher', () => {
    it('should format approved password reset email with verification code without errors', async () => {
      const result = await emailService.sendPasswordResetApprovedEmail(
        'test.student@uc.edu.ph',
        '8419',
        'Maria Santos'
      );
      expect(result).toHaveProperty('ok');
    });

    it('should format rejected password reset email with optional reason without errors', async () => {
      const result = await emailService.sendPasswordResetRejectedEmail(
        'test.student@uc.edu.ph',
        'Maria Santos',
        'Unverified student ID photo provided.'
      );
      expect(result).toHaveProperty('ok');
    });
  });
});
