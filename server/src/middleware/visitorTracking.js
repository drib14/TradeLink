const crypto = require('crypto');
const db = require('../config/db');

const recentlySeen = new Map();
const CAMPUS_TIME_ZONE = 'Asia/Manila';

function getCampusDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/**
 * Counts one anonymous browser/device once per campus-local calendar day.
 * The raw visitor token is never stored; only its SHA-256 digest is persisted.
 */
module.exports = function visitorTracking(req, res, next) {
  const path = String(req.path || '');
  if (
    req.method === 'OPTIONS' ||
    path.startsWith('/admin') ||
    path.startsWith('/admin-auth') ||
    path === '/health' ||
    path === '/csrf-token' ||
    path === '/csp-report'
  ) return next();

  const visitorId = String(req.get('x-visitor-id') || '');
  if (!/^[a-zA-Z0-9-]{16,128}$/.test(visitorId)) return next();

  const visitDate = getCampusDate();
  const visitorHash = crypto.createHash('sha256').update(visitorId).digest('hex');
  const cacheKey = visitorHash + ':' + visitDate;
  if (recentlySeen.has(cacheKey)) return next();

  recentlySeen.set(cacheKey, Date.now());
  if (recentlySeen.size > 10000) {
    const cutoff = Date.now() - 36 * 60 * 60 * 1000;
    for (const [key, seenAt] of recentlySeen) {
      if (seenAt < cutoff) recentlySeen.delete(key);
    }
    while (recentlySeen.size > 10000) recentlySeen.delete(recentlySeen.keys().next().value);
  }

  return db('site_visits')
    .insert({
      visitor_hash: visitorHash,
      visit_date: visitDate,
    })
    .onConflict(['visitor_hash', 'visit_date'])
    .ignore()
    .then(() => next())
    .catch((error) => {
      recentlySeen.delete(cacheKey);
      // Analytics must never make marketplace requests fail.
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[VISITOR ANALYTICS] Visit write skipped:', error.message);
      }
      return next();
    });
};
