const winston = require('winston');

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'refreshtoken',
  'refresh_token',
  'refresh_token_hash',
  'accesstoken',
  'access_token',
  'authorization',
  'cookie',
  'secret',
  'code',
  'resetcode',
  'reset_code',
  'reset_code_hash',
  'idphotourl',
  'id_photo_url',
  'idcardimageurl',
  'id_card_image_url',
  'selfiephotourl',
  'selfie_photo_url'
]);

// Strip emojis from text
const stripEmojis = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '').replace(/\s{2,}/g, ' ').trim();
};

// Deep sanitize objects to mask sensitive data
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return typeof data === 'string' ? stripEmojis(data) : data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else if (typeof value === 'string') {
      sanitized[key] = stripEmojis(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Winston custom format to redact sensitive fields & strip emojis
const redactSensitiveFormat = winston.format((info) => {
  const sanitized = sanitizeData(info);
  return sanitized;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    redactSensitiveFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tradelink-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, service, stack }) => {
            const cleanMessage = stripEmojis(stack || message || '');
            return `[${timestamp}] [${level}] (${service}): ${cleanMessage}`;
          }
        )
      )
    })
  ]
});

module.exports = logger;
