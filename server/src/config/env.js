require('dotenv').config();

const envMode = process.env.NODE_ENV || 'development';

if (envMode === 'production') {
  const missing = [];
  if (!process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!process.env.JWT_ADMIN_ACCESS_SECRET) missing.push('JWT_ADMIN_ACCESS_SECRET');
  if (!process.env.JWT_ADMIN_REFRESH_SECRET) missing.push('JWT_ADMIN_REFRESH_SECRET');
  if (missing.length > 0) {
    throw new Error(`[CRITICAL SECURITY ERROR] Missing mandatory environment variables in production: ${missing.join(', ')}`);
  }
}

const crypto = require('crypto');

// Validate critical secrets in production
if (envMode === 'production') {
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn('[SECURITY WARNING] CLOUDINARY_API_SECRET is not set in production environment.');
  }
  if (!process.env.SMTP_PASS) {
    console.warn('[SECURITY WARNING] SMTP_PASS is not set in production environment.');
  }
}

const config = {
  env: envMode,
  isProduction: envMode === 'production',
  port: parseInt(process.env.PORT, 10) || 3001,
  host: process.env.HOST || '0.0.0.0',
  
  db: {
    connectionString: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tradelink_db_test',
    ssl: process.env.DB_SSL === 'true'
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || (envMode === 'test' ? 'test_jwt_access_secret_key_1234567890' : crypto.randomBytes(48).toString('hex')),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (envMode === 'test' ? 'test_jwt_refresh_secret_key_1234567890' : crypto.randomBytes(48).toString('hex')),
    adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || (envMode === 'test' ? 'test_jwt_admin_access_secret_key_1234567890' : crypto.randomBytes(48).toString('hex')),
    adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || (envMode === 'test' ? 'test_jwt_admin_refresh_secret_key_1234567890' : crypto.randomBytes(48).toString('hex')),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  },

  cookieSecret: process.env.COOKIE_SECRET || (envMode === 'test' ? 'test_cookie_secret_1234567890' : crypto.randomBytes(48).toString('hex')),

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'TradeLink UC <noreply@tradelink.app>'
  },

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
    dailyQuotaMB: parseInt(process.env.DAILY_UPLOAD_QUOTA_MB, 10) || 50
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
};

module.exports = config;

