const fs = require('fs');
const path = require('path');
const storageService = require('../../src/services/storage.service');

describe('Unit Test: Cloudinary Object Storage & Local Fallback Security', () => {
  jest.setTimeout(30000);
  const samplePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const sampleBuffer = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.from('image-bytes-tradelink-testing')]);

  describe('Credential Leak Prevention & Zero Secret Exposure', () => {
    it('should never expose tokens, secret keys, or query credentials in generated URLs', () => {
      const url = storageService.buildPublicUrl('tradelink/listings/sample-uuid.jpg');
      expect(url).not.toContain('8bzdy9kQjlWHTx6DhOsxOGHqSEo');
      expect(url).not.toContain('secret');
      expect(url).not.toContain('api_secret');
      expect(url).toMatch(/(tradelink\/listings\/sample-uuid\.jpg|\/uploads\/)/);
    });

    it('should return safe diagnostic object from testCloudinaryConnection without leaking secrets', async () => {
      const diag = await storageService.testCloudinaryConnection();
      const stringified = JSON.stringify(diag);
      expect(stringified).not.toContain('8bzdy9kQjlWHTx6DhOsxOGHqSEo');
      expect(stringified).not.toContain('api_secret');
      expect(diag).toHaveProperty('storage');
      expect(diag).toHaveProperty('message');
    });
  });

  describe('Local Storage Fallback Mechanism', () => {
    it('should safely fall back to local disk storage when needed', async () => {
      const result = await storageService.uploadBuffer(sampleBuffer, 'item.png', 'image/png', 'listings');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('filename');
      expect(result.url).not.toContain('8bzdy9kQjlWHTx6DhOsxOGHqSEo');

      // If local storage, verify file was written to disk
      if (result.storage === 'local') {
        const localFilePath = path.resolve(__dirname, '../../uploads', result.key);
        expect(fs.existsSync(localFilePath)).toBe(true);

        // Clean up
        await storageService.deleteFile(result.url);
        expect(fs.existsSync(localFilePath)).toBe(false);
      }
    });

    it('should handle Base64 Data URI strings and convert to persistent storage', async () => {
      const uploadedUrl = await storageService.uploadBase64(samplePngBase64, 'avatars');

      expect(typeof uploadedUrl).toBe('string');
      expect(uploadedUrl.startsWith('data:')).toBe(false);
      expect(uploadedUrl).not.toContain('8bzdy9kQjlWHTx6DhOsxOGHqSEo');

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
});
