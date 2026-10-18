const logger = require('./logger');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Centrally log and persist security-sensitive events
 * (e.g. failed logins, lockouts, token revocations, CSRF blocks, permission failures)
 */
async function logSecurityEvent({ event, severity = 'info', userId, ip, details, req }) {
  try {
    const clientIp =
      ip ||
      req?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      'unknown';

    const logEntry = {
      id: uuidv4(),
      event_type: event,
      severity, // 'info', 'warning', 'critical'
      user_id: userId || req?.user?.id || null,
      ip_address: clientIp,
      user_agent: req?.headers ? req.headers['user-agent']?.substring(0, 256) || null : null,
      details: typeof details === 'string' ? details : JSON.stringify(details || {}),
      created_at: new Date()
    };

    const logMessage = `[SECURITY] ${event} | User: ${logEntry.user_id || 'anonymous'} | IP: ${clientIp} | ${logEntry.details}`;

    if (severity === 'critical') {
      logger.error(logMessage);
    } else if (severity === 'warning') {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }

    // Persist to DB for security audits if table exists
    const hasTable = await db.schema.hasTable('security_events').catch(() => false);
    if (hasTable) {
      await db('security_events').insert(logEntry).catch(() => {});
    }
  } catch (err) {
    // Non-blocking for application flow
  }
}

module.exports = {
  logSecurityEvent
};
