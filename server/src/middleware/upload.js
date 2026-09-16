const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Memory storage for direct pipeline processing through Sharp and Cloudinary
const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov']);
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']);

const fileFilter = (req, file, cb) => {
  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Explicitly reject SVG (risk of stored XSS via XML/SVG scripting)
  if (ext === '.svg' || mime.includes('svg') || mime.includes('xml') || mime.includes('html')) {
    return cb(new AppError('SVG, XML, and HTML uploads are strictly prohibited for security.', 400));
  }

  // Prevent double extension attacks (e.g., shell.php.jpg or exploit.exe.png)
  const segments = originalName.split('.');
  if (segments.length > 2) {
    const dangerousExts = ['php', 'phtml', 'phar', 'js', 'sh', 'bash', 'exe', 'bat', 'cmd', 'ps1', 'cgi', 'pl', 'py', 'jar', 'svg', 'html', 'htm'];
    for (let i = 1; i < segments.length - 1; i++) {
      if (dangerousExts.includes(segments[i].toLowerCase())) {
        return cb(new AppError('Suspicious filename detected with multiple extensions. Upload rejected.', 400));
      }
    }
  }

  // Verify extension is in whitelist
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new AppError(`Invalid file extension "${ext}". Allowed: JPEG, JPG, PNG, WEBP, GIF, MP4, WEBM, MOV.`, 400));
  }

  // Verify MIME is in whitelist
  const isAllowedImage = ALLOWED_IMAGE_MIMES.has(mime);
  const isAllowedVideo = ALLOWED_VIDEO_MIMES.has(mime);

  if (!isAllowedImage && !isAllowedVideo) {
    return cb(new AppError(`Invalid file MIME type "${mime}".`, 400));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB hard cap per file (supports short high-res video or compressed photo)
    files: 5 // Maximum 5 files per single upload request
  }
});

module.exports = upload;

