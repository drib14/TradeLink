/**
 * Input sanitization middleware
 * Uses the 'xss' library to properly sanitize strings against all XSS vectors,
 * including <img onerror>, <svg onload>, encoded entities, and javascript: URIs.
 * Also prevents prototype pollution on nested objects.
 */
const xss = require('xss');

// Configure xss options — strip all HTML tags, no whitelisted tags for user input
const xssOptions = {
  whiteList: {},          // No HTML tags allowed
  stripIgnoreTag: true,   // Strip tags not in whitelist
  stripIgnoreTagBody: ['script', 'style', 'noscript'], // Completely strip these tag contents
  stripBlankChar: false   // Preserve whitespace characters
};

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // 1. Strip null bytes and dangerous control characters
  let clean = str.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // 2. Unicode normalization (NFKC) to resolve spoofing homoglyphs and hidden zero-width chars
  clean = clean.normalize('NFKC');
  // 3. Strip javascript: and data:text/html pseudo-protocols
  clean = clean.replace(/javascript\s*:/gi, '').replace(/data\s*:\s*text\/html/gi, '');
  // 4. Run through strict XSS sanitizer
  return xss(clean, xssOptions).trim();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

// Export sanitizeString for use in socket handlers and other non-Express contexts
sanitizeInput.sanitizeString = sanitizeString;

module.exports = sanitizeInput;
