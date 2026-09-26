require('dotenv').config();

const envMode = process.env.NODE_ENV || 'development';
const isDev = envMode === 'development';
const isProd = envMode === 'production';

if (isProd) {
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
if (isProd) {
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn('[SECURITY WARNING] CLOUDINARY_API_SECRET is not set in production environment.');
  }
  if (!process.env.SMTP_PASS) {
    console.warn('[SECURITY WARNING] SMTP_PASS is not set in production environment.');
  }
}

// ============================================================================
// Development vs Production logic — all controlled by NODE_ENV in .env
// ============================================================================
// Development: localhost DB (no DATABASE_URL), localhost URLs, lax cookies
// Production:  DATABASE_URL (cloud), live Vercel URLs, none cookies
// ============================================================================

const config = {
  env: envMode,
  isProduction: isProd,
  port: parseInt(process.env.PORT, 10) || 3001,
  host: process.env.HOST || '0.0.0.0',
  
  db: {
    // In development: ignore DATABASE_URL even if present in .env, use local host/port
    // In production: use DATABASE_URL for cloud DB
    connectionString: isProd ? (process.env.DATABASE_URL || null) : null,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tradelink_db_test',
    ssl: isProd ? (process.env.DB_SSL === 'true') : false
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
  verificationSessionSecret: process.env.VERIFICATION_SESSION_SECRET || process.env.JWT_ACCESS_SECRET || (envMode === 'test' ? 'test_verif_secret_1234567890' : crypto.randomBytes(48).toString('hex')),

  // Support both local dev server and live Vercel deployments
  clientUrl: process.env.CLIENT_URL || 'https://uc-tradelink.vercel.app,https://tradelink-uc.vercel.app,http://localhost:5173,http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'https://tradelink-admin.vercel.app,http://localhost:5174',
  appUrl: process.env.APP_URL || 'https://uc-tradelink.vercel.app',
  adminAppUrl: process.env.ADMIN_APP_URL || 'https://tradelink-admin.vercel.app',
  cookieSameSite: process.env.COOKIE_SAME_SITE || (isDev ? 'lax' : 'none'),
  allowVercelPreviews: process.env.ALLOW_VERCEL_PREVIEWS ? process.env.ALLOW_VERCEL_PREVIEWS === 'true' : true,

  email: {
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/^["']|["']$/g, '').trim(),
    port: parseInt((process.env.SMTP_PORT || '465').replace(/^["']|["']$/g, '').trim(), 10) || 465,
    user: (process.env.SMTP_USER || '').replace(/^["']|["']$/g, '').trim(),
    pass: (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '').replace(/\s+/g, ''),
    from: (process.env.SMTP_FROM || 'TradeLink Marketplace <uc.tradelink@gmail.com>').replace(/^["']|["']$/g, '').trim(),
    resendApiKey: (process.env.RESEND_API_KEY || '').replace(/^["']|["']$/g, '').trim(),
    bypassMode: process.env.EMAIL_BYPASS_MODE ? process.env.EMAIL_BYPASS_MODE === 'true' : !isProd
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
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  }
};

// Startup log so you can verify what's active
console.log(`[ENV] Mode: ${envMode} | DB: ${config.db.connectionString ? 'DATABASE_URL (cloud)' : `${config.db.host}:${config.db.port}/${config.db.database} (local)`} | App: ${config.appUrl} | Cookie: ${config.cookieSameSite}`);

module.exports = config;
