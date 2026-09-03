const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Use memory storage for direct streaming to Cloudflare R2 / storage service
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpeg|jpg|png|webp|gif)$/i;
  const allowedMimes = /^image\/(jpeg|jpg|png|webp|gif)$/i;

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedExts.test(ext) && allowedMimes.test(mime)) {
    return cb(null, true);
  }
  cb(new AppError('Only image files (JPEG, JPG, PNG, WEBP, GIF) are allowed.', 400));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxSizeMB * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;

