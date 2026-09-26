const {
  validateStudentIdSyntax,
  inspectImagePayload,
  computeImageHash,
  evaluateVerification
} = require('../../src/services/studentVerificationEngine');
const verificationSessionService = require('../../src/services/verificationSession.service');

// Helper to generate fake base64 image data of given size with varied bytes (high entropy)
function generateMockImage(targetBytes = 20 * 1024) {
  const buf = Buffer.alloc(targetBytes);
  for (let i = 0; i < targetBytes; i++) {
    buf[i] = (i * 37 + 13) % 256;
  }
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

describe('Unit Test: Student Verification Engine', () => {
  describe('Student ID Syntax Validation', () => {
    it('should pass standard 8-digit UC student ID format with 100% score', () => {
      const result = validateStudentIdSyntax('20240001');
      expect(result.valid).toBe(true);
      expect(result.formatScore).toBe(100);
      expect(result.cleanId).toBe('20240001');
    });

    it('should pass hyphenated academic year format (e.g. 2024-00123)', () => {
      const result = validateStudentIdSyntax('2024-00123');
      expect(result.valid).toBe(true);
      expect(result.formatScore).toBe(100);
      expect(result.cleanId).toBe('2024-00123');
    });

    it('should reject invalid student ID shorter than 6 digits', () => {
      const result = validateStudentIdSyntax('1234');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('UC student IDs require between 6 and 14 digits');
    });
  });

  describe('Image Forensics & Quality Inspection', () => {
    it('should pass realistic high-entropy image payload', () => {
      const mockImg = generateMockImage(25 * 1024);
      const result = inspectImagePayload(mockImg);
      expect(result.valid).toBe(true);
      expect(result.byteLength).toBe(25 * 1024);
      expect(result.entropyScore).toBeGreaterThanOrEqual(70);
    });

    it('should reject undersized placeholder image (<12KB)', () => {
      const smallImg = generateMockImage(4 * 1024);
      const result = inspectImagePayload(smallImg);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('<12KB');
    });

    it('should compute consistent SHA-256 fingerprint hash for duplicate detection', () => {
      const img1 = generateMockImage(15 * 1024);
      const hash1 = computeImageHash(img1);
      const hash2 = computeImageHash(img1);
      expect(hash1).toBeDefined();
      expect(hash1.length).toBe(64);
      expect(hash1).toBe(hash2);
    });
  });

  describe('Automated Approval & Suspicion Routing', () => {
    it('should automatically approve (>90% accuracy) when all credentials and challenge pass', async () => {
      const mockUser = {
        id: `test-user-${Date.now()}`,
        name: 'Carlo Mendoza',
        email: 'carlo.mendoza@uc.edu.ph',
        campus: 'UC Main',
        college: 'CCS'
      };

      // Create a valid session token
      const session = verificationSessionService.createSession(mockUser.id);
      const validIdPhoto = generateMockImage(30 * 1024);
      const validSelfie = generateMockImage(35 * 1024);

      // Advance mock time past 1500ms to simulate natural capture time
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 2500);

      const evaluation = await evaluateVerification({
        user: mockUser,
        studentId: '20240099',
        idPhotoUrl: validIdPhoto,
        selfiePhotoUrl: validSelfie,
        sessionToken: session.sessionToken
      });

      jest.restoreAllMocks();

      expect(evaluation.confidenceScore).toBeGreaterThanOrEqual(90);
      expect(evaluation.isApproved).toBe(true);
      expect(evaluation.isSuspicious).toBe(false);
      expect(evaluation.status).toBe('approved');
      expect(evaluation.suspiciousReasons).toHaveLength(0);
    }, 20000);

    it('should hold for admin review if session token is missing or bypassed', async () => {
      const mockUser = {
        id: `test-user-${Date.now()}`,
        name: 'Maria Santos',
        email: 'maria@gmail.com',
        campus: 'UC Banilad',
        college: 'CBA'
      };

      const evaluation = await evaluateVerification({
        user: mockUser,
        studentId: '20240002',
        idPhotoUrl: generateMockImage(25 * 1024),
        selfiePhotoUrl: generateMockImage(25 * 1024),
        sessionToken: '' // Missing token
      });

      expect(evaluation.isApproved).toBe(false);
      expect(evaluation.isSuspicious).toBe(true);
      expect(evaluation.status).toBe('pending');
      expect(evaluation.suspiciousReasons.some((r) => r.includes('session token missing'))).toBe(true);
    });
  });
});
