const emailService = require('../../src/services/email.service');

describe('Unit Test: Email Service & Dynamic Live URL Resolution', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalAppUrl = process.env.APP_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.APP_URL = originalAppUrl;
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
      expect(url.startsWith('https://')).toBe(true);
    });

    it('should resolve admin live URL properly without localhost in production', () => {
      process.env.NODE_ENV = 'production';
      const mockReq = {
        get: () => 'http://localhost:5174'
      };
      const url = emailService.getAdminBaseUrl(mockReq);
      expect(url).not.toContain('localhost');
      expect(url.startsWith('https://')).toBe(true);
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
