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
 * Determines media type: 'image' or 'video'
 */
function getMediaType(filename = '', mimeType = '') {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerExt = path.extname(filename || '').toLowerCase();

  if (lowerMime.startsWith('video/') || ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv'].includes(lowerExt)) {
    return 'video';
  }
  return 'image';
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
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'video/x-m4v': '.m4v'
    };
    return map[mimeType.toLowerCase()] || (mimeType.startsWith('video/') ? '.mp4' : '.jpg');
  }
  return '.jpg';
}

/**
 * Validates file buffer magic bytes against claimed MIME type.
 * Prevents attackers from uploading malicious files with renamed extensions.
 */
function validateMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  const signatures = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/jpg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': null, // RIFF-based, check below
    'video/mp4': null,  // ftyp-based, check below
    'video/quicktime': null,
    'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
    'video/x-m4v': null
  };

  const lowerMime = (mimeType || '').toLowerCase();

  // WebP check: RIFF....WEBP
  if (lowerMime === 'image/webp') {
    return buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  }

  // MP4/MOV/M4V check: look for 'ftyp' at offset 4
  if (['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(lowerMime)) {
    if (buffer.length >= 8) {
      const ftyp = buffer.slice(4, 8).toString('ascii');
      return ftyp === 'ftyp';
    }
    return false;
  }

  const sigs = signatures[lowerMime];
  if (!sigs) return true; // Unknown MIME — allow (Cloudinary will validate further)

  return sigs.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  );
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
async function saveLocalBuffer(buffer, folder, filename, mediaType = 'image') {
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
    mediaType,
    size: buffer.length,
    storage: 'local'
  };
}

/**
 * Upload a binary buffer to Cloudinary (or local fallback)
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} originalFilename - Original name of uploaded file
 * @param {string} mimeType - MIME type (e.g. 'image/jpeg', 'video/mp4')
 * @param {string} folder - Target folder ('listings', 'avatars', 'id-photos', 'chat')
 * @returns {Promise<{ url: string, key: string, filename: string, mediaType: string, size: number, storage: string }>}
 */
async function uploadBuffer(buffer, originalFilename = 'file.jpg', mimeType = 'image/jpeg', folder = 'listings') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid buffer provided for upload.');
  }

  const safeFolder = folders.includes(folder) ? folder : 'listings';
  const ext = getExtension(originalFilename, mimeType);
  const mediaType = getMediaType(originalFilename, mimeType);
  const uniqueId = uuidv4();
  const filename = `${uniqueId}${ext}`;

  // Validate magic bytes match claimed MIME type
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new Error('File content does not match the declared file type. Upload rejected for security.');
  }

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
        mediaType: result.resource_type === 'video' ? 'video' : mediaType,
        size: result.bytes || buffer.length,
        storage: 'cloudinary'
      };
    } catch (err) {
      logger.warn(`Cloudinary upload failed, falling back to local storage: ${err.message}`);
      return saveLocalBuffer(buffer, safeFolder, filename, mediaType);
    }
  }

  // Local fallback
  return saveLocalBuffer(buffer, safeFolder, filename, mediaType);
}

/**
 * Upload a Base64 string or Data URI to Cloudinary (or local fallback)
 *
 * @param {string} dataUriOrBase64 - Base64 data URI or raw base64 string
 * @param {string} folder - Target subfolder
 * @returns {Promise<string>} Clean URL of the uploaded image or video
 */
async function uploadBase64(dataUriOrBase64, folder = 'listings') {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') {
    return dataUriOrBase64;
  }

  const trimmed = dataUriOrBase64.trim();

  // Prevent memory exhaustion from oversized base64 payloads
  if (trimmed.length > 15 * 1024 * 1024) {
    throw new Error('Base64 payload exceeds maximum allowed size (15MB).');
  }

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
      const isVideo = Boolean(
        fileUrlOrKey.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
        fileUrlOrKey.includes('/video/upload/')
      );
      await cloudinary.uploader.destroy(publicId, { resource_type: isVideo ? 'video' : 'image' });
    } catch (err) {
      logger.warn(`Failed to delete object from Cloudinary: ${err.message}`);
    }
    return;
  }

  // Delete local file if it exists
  const localMatch = fileUrlOrKey.replace(/^\/uploads\//, '');
  const localPath = path.join(uploadBase, localMatch);
  try {
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
  } catch (err) {
    logger.warn(`Failed to delete local file: ${err.message}`);
  }
}

/**
 * Diagnostic test for Cloudinary connection
 */
async function testCloudinaryConnection() {
  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      storage: 'local',
      connected: false,
      message: 'Cloudinary credentials not configured; local storage active.'
    };
  }
  try {
    const ping = await cloudinary.api.ping();
    const isOk = ping.status === 'ok';
    return {
      ok: isOk,
      storage: isOk ? 'cloudinary' : 'local',
      connected: isOk,
      cloudName: config.cloudinary.cloudName,
      message: isOk ? 'Cloudinary storage connected and active.' : 'Cloudinary ping returned non-ok status.'
    };
  } catch (err) {
    return {
      ok: false,
      storage: 'local',
      connected: false,
      message: `Cloudinary ping failed (${err.message}); local storage fallback active.`
    };
  }
}

module.exports = {
  uploadBuffer,
  uploadBase64,
  deleteFile,
  buildPublicUrl,
  isCloudinaryConfigured,
  getMediaType,
  testCloudinaryConnection
};
