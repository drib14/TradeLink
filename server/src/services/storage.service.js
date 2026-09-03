const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const config = require('../config/env');
const logger = require('../utils/logger');

// Local uploads directory (used as fallback or for local dev)
const uploadBase = path.resolve(__dirname, '../../uploads');
const folders = ['listings', 'avatars', 'id-photos', 'chat'];

folders.forEach((folder) => {
  const dir = path.join(uploadBase, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Determine S3 Endpoint for Cloudflare R2
function getR2Endpoint() {
  if (config.r2.customEndpoint) {
    return config.r2.customEndpoint;
  }
  if (config.r2.accountId) {
    return `https://${config.r2.accountId}.r2.cloudflarestorage.com`;
  }
  return null;
}

// Build S3 Client if Cloudflare R2 credentials/endpoint are provided
let s3Client = null;
const r2Endpoint = getR2Endpoint();

if (config.r2.enabled && (r2Endpoint || (config.r2.accessKeyId && config.r2.secretAccessKey))) {
  try {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint || undefined,
      credentials: {
        accessKeyId: config.r2.accessKeyId || config.r2.apiToken || '',
        secretAccessKey: config.r2.secretAccessKey || config.r2.apiToken || ''
      }
    });
  } catch (err) {
    logger.warn(`Failed to initialize Cloudflare R2 S3 client: ${err.message}`);
    s3Client = null;
  }
}

/**
 * Returns extension from mimeType or filename
 */
function getExtension(filename, mimeType) {
  if (filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext) return ext;
  }
  if (mimeType) {
    const map = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg'
    };
    return map[mimeType.toLowerCase()] || '.jpg';
  }
  return '.jpg';
}

/**
 * Constructs a safe public URL for an uploaded file
 * NEVER exposes any access keys, tokens, or query-string credentials.
 */
function buildPublicUrl(key) {
  if (config.r2.publicUrl) {
    const base = config.r2.publicUrl.replace(/\/+$/, '');
    return `${base}/${key}`;
  }
  if (config.r2.accountId && config.r2.bucketName) {
    return `https://${config.r2.bucketName}.${config.r2.accountId}.r2.cloudflarestorage.com/${key}`;
  }
  // If no public CDN URL configured, serve via clean relative upload path
  return `/uploads/${key}`;
}

/**
 * Save buffer to local filesystem (fallback)
 */
async function saveLocalBuffer(buffer, folder, filename) {
  const targetDir = path.join(uploadBase, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const filePath = path.join(targetDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return {
    url: `/uploads/${folder}/${filename}`,
    key: `${folder}/${filename}`,
    filename,
    size: buffer.length,
    storage: 'local'
  };
}

/**
 * Upload a binary buffer to Cloudflare R2 (or local fallback)
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} originalFilename - Original name of uploaded file
 * @param {string} mimeType - MIME type (e.g. 'image/jpeg')
 * @param {string} folder - Target folder ('listings', 'avatars', 'id-photos', 'chat')
 * @returns {Promise<{ url: string, key: string, filename: string, size: number, storage: string }>}
 */
async function uploadBuffer(buffer, originalFilename = 'file.jpg', mimeType = 'image/jpeg', folder = 'listings') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid buffer provided for upload.');
  }

  const safeFolder = folders.includes(folder) ? folder : 'listings';
  const ext = getExtension(originalFilename, mimeType);
  const uniqueId = uuidv4();
  const filename = `${uniqueId}${ext}`;
  const key = `${safeFolder}/${filename}`;

  const isR2Ready = config.r2.enabled && s3Client && config.r2.bucketName && (config.r2.accountId || config.r2.customEndpoint);

  if (isR2Ready) {
    try {
      const command = new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable'
      });

      await s3Client.send(command);

      const publicUrl = buildPublicUrl(key);
      return {
        url: publicUrl,
        key,
        filename,
        size: buffer.length,
        storage: 'r2'
      };
    } catch (err) {
      // Safe logging without credentials
      logger.warn(`Cloudflare R2 upload failed, falling back to local storage: ${err.message}`);
      return saveLocalBuffer(buffer, safeFolder, filename);
    }
  }

  // Local fallback
  return saveLocalBuffer(buffer, safeFolder, filename);
}

/**
 * Upload a Base64 string or Data URI to Cloudflare R2 (or local fallback)
 * If already a remote or local URL, returns unchanged.
 *
 * @param {string} dataUriOrBase64 - Base64 data URI or raw base64 string
 * @param {string} folder - Target subfolder
 * @returns {Promise<string>} Clean URL of the uploaded image
 */
async function uploadBase64(dataUriOrBase64, folder = 'listings') {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') {
    return dataUriOrBase64;
  }

  const trimmed = dataUriOrBase64.trim();

  // If already an HTTP(S) URL or /uploads/ path, do not re-upload
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // Match Data URI: data:image/png;base64,iVBORw0...
  const dataUriMatch = trimmed.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);

  let buffer;
  let mimeType = 'image/jpeg';

  if (dataUriMatch) {
    mimeType = dataUriMatch[1];
    buffer = Buffer.from(dataUriMatch[2], 'base64');
  } else {
    // Attempt parsing as raw base64 if longer than 50 chars and valid base64
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
      buffer = Buffer.from(trimmed, 'base64');
    } else {
      return trimmed;
    }
  }

  const ext = getExtension(null, mimeType);
  const result = await uploadBuffer(buffer, `upload${ext}`, mimeType, folder);
  return result.url;
}

/**
 * Delete file from Cloudflare R2 or local disk
 *
 * @param {string} fileUrlOrKey - File URL or storage key
 */
async function deleteFile(fileUrlOrKey) {
  if (!fileUrlOrKey || typeof fileUrlOrKey !== 'string') return;

  // Extract key from URL or path
  let key = fileUrlOrKey;
  if (fileUrlOrKey.startsWith('http://') || fileUrlOrKey.startsWith('https://')) {
    try {
      const parsed = new URL(fileUrlOrKey);
      key = parsed.pathname.replace(/^\/+/, '');
    } catch {
      key = fileUrlOrKey;
    }
  } else if (fileUrlOrKey.startsWith('/uploads/')) {
    key = fileUrlOrKey.replace(/^\/uploads\//, '');
  }

  // If R2 is enabled and S3 client is initialized
  if (config.r2.enabled && s3Client && config.r2.bucketName) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key
      });
      await s3Client.send(command);
    } catch (err) {
      logger.warn(`Failed to delete object from Cloudflare R2: ${err.message}`);
    }
  }

  // Also check and clean up local file if present
  try {
    const localPath = path.join(uploadBase, key);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
  } catch (err) {
    logger.warn(`Failed to delete local fallback file: ${err.message}`);
  }
}

/**
 * Check if Cloudflare R2 is configured and ready
 */
function isR2Configured() {
  return Boolean(
    config.r2.enabled &&
    s3Client &&
    config.r2.bucketName &&
    config.r2.accountId &&
    config.r2.accessKeyId &&
    config.r2.secretAccessKey
  );
}

/**
 * Test connectivity to Cloudflare R2 or local storage
 * Returns safe diagnostic object without exposing sensitive keys.
 */
async function testR2Connection() {
  if (!config.r2.enabled || !config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
    return {
      ok: true,
      configured: false,
      storage: 'local',
      message: 'Local Storage active (/uploads). To enable Cloudflare R2, set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.'
    };
  }

  try {
    const command = new HeadBucketCommand({
      Bucket: config.r2.bucketName
    });
    await s3Client.send(command);
    return {
      ok: true,
      configured: true,
      storage: 'r2',
      bucket: config.r2.bucketName,
      message: `Cloudflare R2 Object Storage active [Bucket: ${config.r2.bucketName}]`
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      storage: 'local',
      bucket: config.r2.bucketName,
      message: `Cloudflare R2 connection notice: ${err.message}. Using local storage fallback (/uploads).`
    };
  }
}

module.exports = {
  uploadBuffer,
  uploadBase64,
  deleteFile,
  buildPublicUrl,
  isR2Configured,
  testR2Connection,
  _setS3ClientForTesting: (mockClient) => { s3Client = mockClient; }
};
