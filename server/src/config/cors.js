const env = require('./env');
const AppError = require('../utils/AppError');

// Default development origins
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

// Helper to normalize origins (removes trailing slashes and trims whitespace)
const normalizeOrigin = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

/**
 * Builds the set of allowed origins from environment variables and defaults.
 * Supports comma-separated origins in CLIENT_URL or ALLOWED_ORIGINS.
 */
function getAllowedOrigins() {
  const origins = new Set(defaultOrigins.map(normalizeOrigin));

  // Parse CLIENT_URL (e.g. "https://tradelink-uc.vercel.app" or comma-separated)
  if (env.clientUrl && env.clientUrl !== '*') {
    env.clientUrl.split(',').forEach((url) => {
      const normalized = normalizeOrigin(url);
      if (normalized) origins.add(normalized);
    });
  }

  // Parse ALLOWED_ORIGINS if provided
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((url) => {
      const normalized = normalizeOrigin(url);
      if (normalized) origins.add(normalized);
    });
  }

  return origins;
}

/**
 * Validates whether an incoming origin is permitted.
 * Requests without an Origin header (curl, mobile apps, server-to-server) are permitted.
 * Whitelisted origins or matching Vercel preview URLs (if enabled) are permitted.
 */
function isOriginAllowed(origin) {
  // Allow requests without Origin header (mobile apps, curl, server-to-server)
  if (!origin) {
    if (env.isProduction) {
      const logger = require('../utils/logger');
      logger.warn('[CORS] Request received without Origin header in production.');
    }
    return true;
  }

  const normalized = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.has(normalized)) {
    return true;
  }

  // Optional: Allow Vercel preview deployments if explicitly configured or in non-production
  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+.*\.vercel\.app$/i.test(normalized)) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(
        new AppError(
          `CORS policy violation: Access from origin '${origin}' is not allowed.`,
          403
        )
      );
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-XSRF-TOKEN',
    'x-xsrf-token',
    'X-CSRF-Token',
    'x-csrf-token',
    'X-Idempotency-Key',
    'x-idempotency-key',
    'X-Request-ID',
    'x-request-id',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'Set-Cookie',
    'X-Request-ID',
    'X-Upload-Quota-Limit',
    'X-Upload-Quota-Used',
    'X-Upload-Quota-Remaining',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-XSRF-TOKEN',
    'x-xsrf-token'
  ]
};

corsOptions.isOriginAllowed = isOriginAllowed;
corsOptions.getAllowedOrigins = getAllowedOrigins;

module.exports = corsOptions;
