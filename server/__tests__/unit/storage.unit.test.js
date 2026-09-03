const fs = require('fs');
const path = require('path');
const storageService = require('../../src/services/storage.service');

describe('Unit Test: Cloudflare R2 Object Storage & Fallback Security', () => {
  const samplePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const sampleBuffer = Buffer.from('fake-image-bytes-tradelink-testing');

  afterEach(() => {
    // Reset mock client
    storageService._setS3ClientForTesting(null);
  });

  describe('Credential Leak Prevention & Zero Secret Exposure', () => {
    it('should never expose tokens, secret keys, or query credentials in generated URLs', () => {
      const url = storageService.buildPublicUrl('listings/sample-uuid.jpg');
      expect(url).not.toContain('cfk_');
      expect(url).not.toContain('token');
      expect(url).not.toContain('secret');
      expect(url).not.toContain('key=');
      expect(url).toMatch(/(\/uploads\/listings\/sample-uuid\.jpg|https:\/\/.*\/listings\/sample-uuid\.jpg)/);
    });

    it('should return safe diagnostic object from testR2Connection without leaking secrets', async () => {
      const diag = await storageService.testR2Connection();
      const stringified = JSON.stringify(diag);
      expect(stringified).not.toContain('cfk_');
      expect(stringified).not.toContain('token');
      expect(stringified).not.toContain('secret');
      expect(diag).toHaveProperty('storage');
      expect(diag).toHaveProperty('message');
    });
  });

  describe('Local Storage Fallback Mechanism', () => {
    it('should safely fall back to local disk storage when R2 is unavailable', async () => {
      const result = await storageService.uploadBuffer(sampleBuffer, 'item.png', 'image/png', 'listings');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('filename');
      expect(result.storage).toBe('local');
      expect(result.url).toMatch(/^\/uploads\/listings\/.*\.png$/);
      expect(result.url).not.toContain('cfk_');

      // Verify file was written to disk
      const localFilePath = path.resolve(__dirname, '../../uploads', result.key);
      expect(fs.existsSync(localFilePath)).toBe(true);

      // Clean up
      await storageService.deleteFile(result.url);
      expect(fs.existsSync(localFilePath)).toBe(false);
    });

    it('should handle Base64 Data URI strings and convert to persistent storage', async () => {
      const uploadedUrl = await storageService.uploadBase64(samplePngBase64, 'avatars');

      expect(typeof uploadedUrl).toBe('string');
      expect(uploadedUrl.startsWith('data:')).toBe(false);
      expect(uploadedUrl).not.toContain('cfk_');
      expect(uploadedUrl).toMatch(/(\/uploads\/avatars\/.*\.png|https:\/\/.*\/avatars\/.*\.png)/);

      // Clean up
      await storageService.deleteFile(uploadedUrl);
    });

    it('should leave existing HTTP and local /uploads/ URLs unchanged without re-uploading', async () => {
      const remoteUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30';
      const localUrl = '/uploads/listings/existing-image-123.jpg';

      expect(await storageService.uploadBase64(remoteUrl)).toBe(remoteUrl);
      expect(await storageService.uploadBase64(localUrl)).toBe(localUrl);
    });
  });

  describe('Cloudflare R2 S3 Client Integration (Mocked)', () => {
    it('should upload to Cloudflare R2 bucket when S3 client is configured', async () => {
      let sentCommand = null;
      const mockS3Client = {
        send: jest.fn().mockImplementation(async (command) => {
          sentCommand = command;
          return { $metadata: { httpStatusCode: 200 } };
        })
      };

      storageService._setS3ClientForTesting(mockS3Client);

      // Mock isR2Configured requirement
      const originalEnv = process.env.R2_ACCOUNT_ID;
      process.env.R2_ACCOUNT_ID = 'test-account-id-12345';

      try {
        const result = await storageService.uploadBuffer(sampleBuffer, 'product.jpg', 'image/jpeg', 'listings');

        expect(result).toHaveProperty('url');
        expect(result.key).toMatch(/^listings\/.*\.jpg$/);
        expect(result.url).not.toContain('cfk_');
      } finally {
        process.env.R2_ACCOUNT_ID = originalEnv;
      }
    });

    it('should gracefully fall back to local disk if Cloudflare R2 S3 call fails', async () => {
      const mockFailingS3Client = {
        send: jest.fn().mockRejectedValue(new Error('Cloudflare R2 Network Timeout'))
      };

      storageService._setS3ClientForTesting(mockFailingS3Client);

      const result = await storageService.uploadBuffer(sampleBuffer, 'fallback-test.webp', 'image/webp', 'listings');

      expect(result.storage).toBe('local');
      expect(result.url).toMatch(/^\/uploads\/listings\/.*\.webp$/);
      expect(result.url).not.toContain('cfk_');

      // Clean up local file
      await storageService.deleteFile(result.url);
    });
  });
});
