const emailService = require('../../src/services/email.service');

describe('Unit Test: Email Service & Dynamic Live URL Resolution', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalAppUrl = process.env.APP_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalAppUrl === undefined) { delete process.env.APP_URL; } else { process.env.APP_URL = originalAppUrl; }
  });

  describe('Dynamic Live URL Resolution (getAppBaseUrl & getAdminBaseUrl)', () => {
    it('should extract host URL from request Origin header', () => {
      const mockReq = {
        get: (header) => (header.toLowerCase() === 'origin' ? 'https://tradelink-preview.vercel.app' : null)
      };
      const url = emailService.getAppBaseUrl(mockReq);
      expect(url).toBe('https://tradelink-preview.vercel.app');
    });

    it('should extract host URL from request Referer header when Origin is missing', () => {
      const mockReq = {
        get: (header) => (header.toLowerCase() === 'referer' ? 'https://custom-domain.uc.edu.ph/explore' : null)
      };
      const url = emailService.getAppBaseUrl(mockReq);
      expect(url).toBe('https://custom-domain.uc.edu.ph');
    });

    it('should strictly reject localhost in production mode and fallback to live domain', () => {
      process.env.NODE_ENV = 'production';
      const mockReq = {
        get: () => 'http://localhost:5173'
      };
      const url = emailService.getAppBaseUrl(mockReq);
      expect(url).not.toContain('localhost');
      expect(url).not.toContain('127.0.0.1');
      expect(url.startsWith("https://")).toBe(true);
    });

    it('should resolve admin live URL properly without localhost in production', () => {
      process.env.NODE_ENV = 'production';
      const mockReq = {
        get: () => 'http://localhost:5174'
      };
      const url = emailService.getAdminBaseUrl(mockReq);
      expect(url).not.toContain('localhost');
      expect(url.startsWith("https://")).toBe(true);
    });
  });

  describe('Payment Method Formatting', () => {
    it('should format gcash, maya, cash, and free correctly', () => {
      expect(emailService.formatPaymentMethodLabel('gcash')).toContain('GCash');
      expect(emailService.formatPaymentMethodLabel('maya')).toContain('Maya');
      expect(emailService.formatPaymentMethodLabel('cash')).toContain('Cash on Meetup');
      expect(emailService.formatPaymentMethodLabel('free')).toContain('Free');
    });
  });

  describe('Marketplace Event Notification Email Dispatchers', () => {
    const student = { name: 'Juan Dela Cruz', email: 'juan@uc.edu.ph', campus: 'UC Main' };
    const admin = { name: 'Campus Admin', email: 'admin@uc.edu.ph' };
    const verification = { status: 'pending', method: 'studyload_manual_kyc' };

    it('should send a private new-message notification without message content', async () => {
      const result = await emailService.sendChatMessageNotificationEmail(student, { name: 'Maria Santos' }, 'conversation-test');
      expect(result.ok).toBe(true);
    });

    it('should notify the student when verification is submitted', async () => {
      const result = await emailService.sendVerificationSubmittedEmail(student, verification);
      expect(result.ok).toBe(true);
    });

    it('should notify administrators about pending verification review', async () => {
      const result = await emailService.sendAdminVerificationSubmittedEmail(admin, student, verification);
      expect(result.ok).toBe(true);
    });

    it('should notify students of verification decisions', async () => {
      const approved = await emailService.sendVerificationDecisionEmail(student, 'approved');
      const rejected = await emailService.sendVerificationDecisionEmail(student, 'rejected', 'Please upload a clearer document.');
      expect(approved.ok).toBe(true);
      expect(rejected.ok).toBe(true);
    });

    it('should send welcome, swap, and Flash Market event notifications', async () => {
      const welcome = await emailService.sendWelcomeEmail(student);
      const swap = await emailService.sendSwapProposalEmail(student, admin, { target_title: 'Calculator', offered_item_title: 'Textbook' });
      const swapResponse = await emailService.sendSwapResponseEmail(student, admin, { target_title: 'Calculator' }, 'accepted');
      const flash = await emailService.sendFlashOfferEmail(student, admin, { item_name: 'Calculator', target_campus: 'UC Main' });
      const passwordChanged = await emailService.sendPasswordChangedEmail(student);
      const review = await emailService.sendReviewReceivedEmail(student, admin, { id: 'listing-test', title: 'Calculator' }, 5);
      expect(passwordChanged.ok).toBe(true);
      expect(review.ok).toBe(true);
      expect(welcome.ok).toBe(true);
      expect(swap.ok).toBe(true);
      expect(swapResponse.ok).toBe(true);
      expect(flash.ok).toBe(true);
    });
  });

  describe('Transaction Notification Email Dispatchers', () => {
    const mockBuyer = { name: 'Juan Dela Cruz', email: 'juan@uc.edu.ph' };
    const mockSeller = { name: 'Maria Santos', email: 'maria@uc.edu.ph' };
    const mockListing = { title: 'Casio Scientific Calculator', campus: 'UC Main' };
    const mockTx = {
      id: 'tx-test-1',
      reference_no: 'TL-2026-TEST',
      amount: 850,
      payment_method: 'gcash',
      trade_mode: 'buy_sell'
    };

    it('should dispatch buyer order confirmation email successfully', async () => {
      const res = await emailService.sendOrderPlacedBuyerEmail(mockBuyer, mockSeller, mockTx, mockListing);
      expect(res.ok).toBe(true);
    });

    it('should dispatch seller order notification email successfully', async () => {
      const res = await emailService.sendNewOrderSellerEmail(mockSeller, mockBuyer, mockTx, mockListing);
      expect(res.ok).toBe(true);
    });

    it('should dispatch order status update email successfully', async () => {
      const res = await emailService.sendOrderStatusUpdateEmail(mockBuyer, mockSeller, mockTx, mockListing, 'completed');
      expect(res.ok).toBe(true);
    });
  });
});
