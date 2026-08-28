const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom token to sanitize query params
morgan.token('clean-url', (req) => {
  const [pathname, search] = (req.originalUrl || req.url || '').split('?');
  if (!search) return pathname;

  try {
    const params = new URLSearchParams(search);
    const SENSITIVE_QUERY_KEYS = ['token', 'password', 'code', 'secret', 'key', 'auth'];
    for (const key of Array.from(params.keys())) {
      if (SENSITIVE_QUERY_KEYS.some((s) => key.toLowerCase().includes(s))) {
        params.set(key, '[REDACTED]');
      }
    }
    return `${pathname}?${params.toString()}`;
  } catch {
    return pathname;
  }
});

const stream = {
  write: (message) => logger.info(message.trim())
};

const requestLogger = morgan(
  ':method :clean-url :status :res[content-length] - :response-time ms',
  { stream }
);

module.exports = requestLogger;
