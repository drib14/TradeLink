const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Ensure upload directories exist
const uploadBase = path.resolve(__dirname, '../../uploads');
const folders = ['listings', 'avatars', 'id-photos'];

folders.forEach((folder) => {
  const dir = path.join(uploadBase, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'listings';
    if (file.fieldname === 'avatar') {
      subfolder = 'avatars';
    } else if (file.fieldname === 'idPhoto') {
      subfolder = 'id-photos';
    }
    cb(null, path.join(uploadBase, subfolder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    return cb(null, true);
  }
  cb(new AppError('Only image files (JPEG, JPG, PNG, WEBP) are allowed.', 400));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxSizeMB * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
