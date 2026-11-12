const path = require('path');
const dotenv = require('dotenv');

// Check initial NODE_ENV
const initialMode = (process.env.NODE_ENV || 'development').replace(/^["']|["']$/g, '').trim();
if (initialMode === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.production') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });
}
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envMode = process.env.NODE_ENV || 'development';
const isDev = envMode === 'development';
const isProd = envMode === 'production';

// Strict DB Isolation: in development, completely purge any cloud DATABASE_URL
if (!isProd) {
  delete process.env.DATABASE_URL;
  delete process.env.PROD_DB_HOST;
}

const isPlaceholder = (val) => !val || typeof val !== 'string' || val.startsWith('your_') || val.includes('_here');

if (isProd) {
  const missing = [];
  if (!process.env.JWT_ACCESS_SECRET || isPlaceholder(process.env.JWT_ACCESS_SECRET)) missing.push('JWT_ACCESS_SECRET');
  if (!process.env.JWT_REFRESH_SECRET || isPlaceholder(process.env.JWT_REFRESH_SECRET)) missing.push('JWT_REFRESH_SECRET');
  if (!process.env.JWT_ADMIN_ACCESS_SECRET || isPlaceholder(process.env.JWT_ADMIN_ACCESS_SECRET)) missing.push('JWT_ADMIN_ACCESS_SECRET');
  if (!process.env.JWT_ADMIN_REFRESH_SECRET || isPlaceholder(process.env.JWT_ADMIN_REFRESH_SECRET)) missing.push('JWT_ADMIN_REFRESH_SECRET');
  if (missing.length > 0) {
    throw new Error(`[CRITICAL SECURITY ERROR] Missing or placeholder mandatory environment variables in production: ${missing.join(', ')}`);
  }
}

const crypto = require('crypto');

const getSecret = (key, testDefault) => {
  const val = process.env[key];
  if (val && !isPlaceholder(val)) return val;
  if (envMode === 'test') return testDefault;
  return crypto.randomBytes(48).toString('hex');
};

// Validate critical secrets in production
if (isProd) {
  if (!process.env.CLOUDINARY_API_SECRET || isPlaceholder(process.env.CLOUDINARY_API_SECRET)) {
    console.warn('[SECURITY WARNING] CLOUDINARY_API_SECRET is not set or is a placeholder in production environment.');
  }
  if (!process.env.SMTP_PASS || isPlaceholder(process.env.SMTP_PASS)) {
    console.warn('[SECURITY WARNING] SMTP_PASS is not set or is a placeholder in production environment.');
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
    // In development: NEVER use DATABASE_URL, strictly connect to local MySQL (127.0.0.1:3306)
    // In production: use cloud DATABASE_URL with TLS
    connectionString: isProd ? (process.env.DATABASE_URL || null) : null,
    host: isProd ? (process.env.PROD_DB_HOST || process.env.DB_HOST || 'localhost') : (process.env.DEV_DB_HOST || '127.0.0.1'),
    port: parseInt(isProd ? (process.env.PROD_DB_PORT || process.env.DB_PORT || 4000) : (process.env.DEV_DB_PORT || 3306), 10) || (isProd ? 4000 : 3306),
    user: isProd ? (process.env.PROD_DB_USER || process.env.DB_USER || 'root') : (process.env.DEV_DB_USER || 'root'),
    password: isProd ? (process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD || '') : (process.env.DEV_DB_PASSWORD !== undefined ? process.env.DEV_DB_PASSWORD : (process.env.DB_PASSWORD || '')),
    database: isProd ? (process.env.PROD_DB_NAME || process.env.DB_NAME || 'tradelink_db') : (process.env.DEV_DB_NAME || process.env.DB_NAME || 'tradelink_db'),
    ssl: isProd ? (process.env.DB_SSL === 'true' || true) : false
  },

  jwt: {
    accessSecret: getSecret('JWT_ACCESS_SECRET', 'test_jwt_access_secret_key_1234567890'),
    refreshSecret: getSecret('JWT_REFRESH_SECRET', 'test_jwt_refresh_secret_key_1234567890'),
    adminAccessSecret: getSecret('JWT_ADMIN_ACCESS_SECRET', 'test_jwt_admin_access_secret_key_1234567890'),
    adminRefreshSecret: getSecret('JWT_ADMIN_REFRESH_SECRET', 'test_jwt_admin_refresh_secret_key_1234567890'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  },

  cookieSecret: getSecret('COOKIE_SECRET', 'test_cookie_secret_1234567890'),
  verificationSessionSecret: getSecret('VERIFICATION_SESSION_SECRET', 'test_verif_secret_1234567890'),

  // Support both local dev server and live Vercel deployments
  clientUrl: process.env.CLIENT_URL || (isProd ? 'https://uc-tradelink.vercel.app,https://tradelink-uc.vercel.app' : 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'),
  adminUrl: process.env.ADMIN_URL || (isProd ? 'https://tradelink-admin.vercel.app' : 'http://localhost:5174,http://127.0.0.1:5174'),
  appUrl: process.env.APP_URL || (isProd ? 'https://uc-tradelink.vercel.app' : 'http://localhost:5173'),
  adminAppUrl: process.env.ADMIN_APP_URL || (isProd ? 'https://tradelink-admin.vercel.app' : 'http://localhost:5174'),
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

  aws: {
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
    // Credentials are resolved by the backend AWS SDK provider chain.
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
console.log(`[ENV] Mode: ${envMode} | DB Target: ${isProd ? 'Cloud TiDB (TLS)' : 'Local MySQL (127.0.0.1:3306)'} [${config.db.database}] | App: ${config.appUrl} | Cookie: ${config.cookieSameSite}`);

module.exports = config;
