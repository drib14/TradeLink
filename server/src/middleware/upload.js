const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Use memory storage for direct streaming to Cloudinary / storage service
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpeg|jpg|png|webp|gif|mp4|webm|mov|m4v|quicktime)$/i;
  const allowedImageMimes = /^image\/(jpeg|jpg|png|webp|gif)$/i;
  const allowedVideoMimes = /^video\/(mp4|webm|quicktime|x-m4v|ogg)$/i;

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedExts.test(ext) && (allowedImageMimes.test(mime) || allowedVideoMimes.test(mime) || mime === 'video/mp4' || mime === 'video/quicktime')) {
    return cb(null, true);
  }
  cb(new AppError('Only image files (JPEG, JPG, PNG, WEBP, GIF) and video files (MP4, WEBM, MOV) are allowed.', 400));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit to support product demonstration videos
  }
});

module.exports = upload;
