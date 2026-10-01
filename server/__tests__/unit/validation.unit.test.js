const { registerSchema, loginSchema, forgotPasswordSchema } = require('../../src/validations/auth.validation');
const { createListingSchema } = require('../../src/validations/listing.validation');

describe('Unit Test: Joi Input Validation Schemas', () => {
  describe('Auth Registration Validation', () => {
    it('should validate a valid student registration payload', () => {
      const validData = {
        name: 'Juan Dela Cruz',
        studentId: '2024123456',
        email: 'juan.delacruz@uc.edu.ph',
        password: 'SecurePassword123!',
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '3rd Year'
      };

      const { error, value } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.name).toBe('Juan Dela Cruz');
    });

    it('should validate registration with a personal email domain (e.g. gmail.com)', () => {
      const personalEmailData = {
        name: 'Maria Santos',
        studentId: '2024987654',
        email: 'maria.santos@gmail.com',
        password: 'SecurePassword123!',
        campus: 'UC Banilad',
        college: 'Nursing',
        yearLevel: '2nd Year'
      };

      const { error, value } = registerSchema.validate(personalEmailData);
      expect(error).toBeUndefined();
      expect(value.email).toBe('maria.santos@gmail.com');
    });

    it('should validate registration with department string without yearLevel', () => {
      const deptData = {
        name: 'Carlos Yulo',
        studentId: '2024112233',
        email: 'carlos.yulo@uc.edu.ph',
        password: 'SecurePassword123!',
        campus: 'UC Main',
        department: 'College of Computer Studies'
      };

      const { error, value } = registerSchema.validate(deptData);
      expect(error).toBeUndefined();
      expect(value.department).toBe('College of Computer Studies');
    });

    it('should validate login with studentId', () => {
      const validLogin = {
        studentId: '2024123456',
        password: 'Password123'
      };

      const { error } = loginSchema.validate(validLogin);
      expect(error).toBeUndefined();
    });

    it('should reject invalid studentId containing letters or special characters', () => {
      const invalidData = {
        name: 'Juan Dela Cruz',
        studentId: 'ID-2024-ABC',
        email: 'juan@uc.edu.ph',
        password: 'Password123',
        campus: 'UC Main',
        college: 'CCS',
        yearLevel: '1st Year'
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Student ID');
    });

    it('should reject non-UC or invalid campus names', () => {
      const invalidCampus = {
        name: 'Juan Dela Cruz',
        studentId: '2024123456',
        email: 'juan@uc.edu.ph',
        password: 'Password123',
        campus: 'Unknown University',
        college: 'CCS',
        yearLevel: '1st Year'
      };

      const { error } = registerSchema.validate(invalidCampus);
      expect(error).toBeDefined();
    });
  });

  describe('Listing Creation Validation', () => {
    it('should reject listing with title shorter than 5 characters', () => {
      const invalidListing = {
        title: 'Book',
        description: 'Calculus textbook in good condition.',
        price: 350,
        tradeMode: 'buy_sell',
        category: 'Textbooks & Reviewers',
        condition: 'Gently Used',
        images: ['https://example.com/book.jpg']
      };

      const { error } = createListingSchema.validate(invalidListing);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 5 characters');
    });

    it('should reject listing without images', () => {
      const noImageListing = {
        title: 'Calculus 7 Leithold',
        description: 'Calculus textbook in good condition.',
        price: 350,
        tradeMode: 'buy_sell',
        category: 'Textbooks & Reviewers',
        condition: 'Gently Used',
        images: []
      };

      const { error } = createListingSchema.validate(noImageListing);
      expect(error).toBeDefined();
    });
  });
});
