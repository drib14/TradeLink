const AppError = require('../utils/AppError');
const config = require('../config/env');
const logger = require('../utils/logger');

// 50MB default daily quota in bytes
const DEFAULT_DAILY_QUOTA_BYTES = (config.upload && config.upload.dailyQuotaMB ? config.upload.dailyQuotaMB : 50) * 1024 * 1024;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Store upload usage: Map<key, Array<{ timestamp: number, bytes: number }>>
const uploadLedger = new Map();

// Periodic cleanup of entries older than 24h
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entries] of uploadLedger.entries()) {
    const valid = entries.filter(e => now - e.timestamp < WINDOW_MS);
    if (valid.length === 0) {
      uploadLedger.delete(key);
    } else {
      uploadLedger.set(key, valid);
    }
  }
}, 10 * 60 * 1000);

// Prevent cleanup interval from holding the Node process open
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Calculates current bytes used within the 24h window
 */
function getUsage(key) {
  const now = Date.now();
  const entries = uploadLedger.get(key) || [];
  const valid = entries.filter(e => now - e.timestamp < WINDOW_MS);
  uploadLedger.set(key, valid);
  return valid.reduce((sum, e) => sum + e.bytes, 0);
}

/**
 * Record bytes used by an entity
 */
function recordUpload(key, bytes) {
  if (!key || !bytes || bytes <= 0) return;
  const entries = uploadLedger.get(key) || [];
  entries.push({ timestamp: Date.now(), bytes });
  uploadLedger.set(key, entries);
}

/**
 * Middleware to check and enforce daily upload quota
 */
function checkUploadQuota(req, res, next) {
  const key = req.user ? `user:${req.user.id}` : `ip:${req.ip || req.connection.remoteAddress}`;
  const used = getUsage(key);
  const quotaLimit = DEFAULT_DAILY_QUOTA_BYTES;
  const remaining = Math.max(0, quotaLimit - used);

  res.setHeader('X-Upload-Quota-Limit-Bytes', quotaLimit);
  res.setHeader('X-Upload-Quota-Remaining-Bytes', remaining);

  if (used >= quotaLimit) {
    logger.warn(`[UPLOAD_QUOTA] Exceeded for ${key}: used ${Math.round(used / (1024 * 1024))}MB of ${Math.round(quotaLimit / (1024 * 1024))}MB`);
    return next(new AppError('Daily upload quota of 50MB exceeded. Please wait 24 hours before uploading additional media.', 429));
  }

  // Check incoming Content-Length if available
  const contentLength = parseInt(req.headers['content-length'], 10);
  if (!isNaN(contentLength) && contentLength > remaining) {
    return next(new AppError('Upload exceeds your remaining daily quota of 50MB.', 429));
  }

  // Hook into response finish to track actual uploaded bytes from req.files / req.file
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let uploadedBytes = 0;
      if (req.file && req.file.size) {
        uploadedBytes += req.file.size;
      }
      if (Array.isArray(req.files)) {
        req.files.forEach(f => {
          uploadedBytes += (f.size || 0);
        });
      } else if (req.files && typeof req.files === 'object') {
        Object.values(req.files).forEach(fileArr => {
          if (Array.isArray(fileArr)) {
            fileArr.forEach(f => { uploadedBytes += (f.size || 0); });
          }
        });
      }
      if (uploadedBytes > 0) {
        recordUpload(key, uploadedBytes);
      }
    }
  });

  next();
}

module.exports = {
  checkUploadQuota,
  recordUpload,
  getUsage
};
