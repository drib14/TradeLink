const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
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

// Configure Cloudinary SDK
if (config.cloudinary && config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

/**
 * Check if Cloudinary is configured and ready
 */
function isCloudinaryConfigured() {
  return Boolean(
    config.cloudinary &&
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  );
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
 */
function buildPublicUrl(key) {
  if (key && (key.startsWith('http://') || key.startsWith('https://'))) {
    return key;
  }
  if (isCloudinaryConfigured()) {
    return cloudinary.url(key, { secure: true });
  }
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
 * Upload a binary buffer to Cloudinary (or local fallback)
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

  if (isCloudinaryConfigured()) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `tradelink/${safeFolder}`,
            public_id: uniqueId,
            resource_type: 'auto'
          },
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          }
        );
        uploadStream.end(buffer);
      });

      return {
        url: result.secure_url,
        key: result.public_id,
        filename,
        size: result.bytes || buffer.length,
        storage: 'cloudinary'
      };
    } catch (err) {
      logger.warn(`Cloudinary upload failed, falling back to local storage: ${err.message}`);
      return saveLocalBuffer(buffer, safeFolder, filename);
    }
  }

  // Local fallback
  return saveLocalBuffer(buffer, safeFolder, filename);
}

/**
 * Upload a Base64 string or Data URI to Cloudinary (or local fallback)
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

  const safeFolder = folders.includes(folder) ? folder : 'listings';

  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(trimmed, {
        folder: `tradelink/${safeFolder}`,
        resource_type: 'auto'
      });
      return result.secure_url;
    } catch (err) {
      logger.warn(`Cloudinary base64 upload failed, using buffer fallback: ${err.message}`);
    }
  }

  // Parse buffer fallback
  const dataUriMatch = trimmed.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
  let buffer;
  let mimeType = 'image/jpeg';

  if (dataUriMatch) {
    mimeType = dataUriMatch[1];
    buffer = Buffer.from(dataUriMatch[2], 'base64');
  } else if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    buffer = Buffer.from(trimmed, 'base64');
  } else {
    return trimmed;
  }

  const ext = getExtension(null, mimeType);
  const result = await uploadBuffer(buffer, `upload${ext}`, mimeType, safeFolder);
  return result.url;
}

/**
 * Delete file from Cloudinary or local disk
 *
 * @param {string} fileUrlOrKey - File URL or storage key
 */
async function deleteFile(fileUrlOrKey) {
  if (!fileUrlOrKey || typeof fileUrlOrKey !== 'string') return;

  if (isCloudinaryConfigured() && (fileUrlOrKey.includes('cloudinary') || fileUrlOrKey.startsWith('tradelink/'))) {
    try {
      let publicId = fileUrlOrKey;
      if (fileUrlOrKey.startsWith('http://') || fileUrlOrKey.startsWith('https://')) {
        const parts = fileUrlOrKey.split('/upload/');
        if (parts.length > 1) {
          const afterUpload = parts[1].replace(/^v\d+\//, '');
          publicId = afterUpload.substring(0, afterUpload.lastIndexOf('.')) || afterUpload;
        }
      }
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.warn(`Failed to delete object from Cloudinary: ${err.message}`);
    }
  }

  // Clean local file if present
  try {
    let key = fileUrlOrKey;
    if (fileUrlOrKey.startsWith('/uploads/')) {
      key = fileUrlOrKey.replace(/^\/uploads\//, '');
    }
    const localPath = path.join(uploadBase, key);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
  } catch (err) {
    logger.warn(`Failed to delete local fallback file: ${err.message}`);
  }
}

/**
 * Test connectivity to Cloudinary or local storage
 */
async function testCloudinaryConnection() {
  if (!isCloudinaryConfigured()) {
    return {
      ok: true,
      configured: false,
      storage: 'local',
      message: 'Local Storage active (/uploads). Cloudinary credentials not configured.'
    };
  }

  try {
    const res = await cloudinary.api.ping();
    return {
      ok: true,
      configured: true,
      storage: 'cloudinary',
      cloudName: config.cloudinary.cloudName,
      message: `Cloudinary Object Storage active [Cloud: ${config.cloudinary.cloudName}, status: ${res.status || 'ok'}]`
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      storage: 'local',
      cloudName: config.cloudinary.cloudName,
      message: `Cloudinary ping warning: ${err.message}. Using local storage fallback (/uploads).`
    };
  }
}

module.exports = {
  uploadBuffer,
  uploadBase64,
  deleteFile,
  buildPublicUrl,
  isCloudinaryConfigured,
  testCloudinaryConnection,
  testR2Connection: testCloudinaryConnection, // Backward compatibility alias
  isR2Configured: isCloudinaryConfigured // Backward compatibility alias
};
