require('dotenv').config();

const envMode = process.env.NODE_ENV || 'development';

if (envMode === 'production') {
  const missing = [];
  if (!process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (missing.length > 0) {
    throw new Error(`[CRITICAL SECURITY ERROR] Missing mandatory environment variables in production: ${missing.join(', ')}`);
  }
}

const config = {
  env: envMode,
  port: parseInt(process.env.PORT, 10) || 3001,
  
  db: {
    connectionString: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tradelink_db',
    ssl: process.env.DB_SSL === 'true'
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || (envMode === 'test' ? 'test_jwt_access_secret_key_1234567890' : 'tradelink_dev_access_secret_key_2026_only'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (envMode === 'test' ? 'test_jwt_refresh_secret_key_1234567890' : 'tradelink_dev_refresh_secret_key_2026_only'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'TradeLink UC <notifications@uc.edu.ph>'
  },

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5
  }
};

module.exports = config;
