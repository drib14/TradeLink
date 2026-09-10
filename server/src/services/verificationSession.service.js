const crypto = require('crypto');
const env = require('../config/env');

// Set of consumed nonces to prevent replay attacks (auto-pruned)
const consumedNonces = new Map();

// Periodic prune every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of consumedNonces.entries()) {
    if (now > expiry) {
      consumedNonces.delete(nonce);
    }
  }
}, 10 * 60 * 1000);

const CHALLENGE_ACTIONS = [
  { id: 'blink_tilt', instruction: 'Blink twice & hold steady' },
  { id: 'smile_center', instruction: 'Align face in center reticle' },
  { id: 'turn_slight', instruction: 'Look straight at camera' }
];

const FLASH_COLORS = [
  '#FFC72C', // UC Gold
  '#002B7F', // UC Navy
  '#10B981', // Emerald
  '#3B82F6'  // Electric Blue
];

/**
 * Creates a single-use, 5-minute cryptographic session challenge for student verification
 * @param {string} userId
 * @returns {{ sessionToken: string, challengeAction: object, flashColor: string, expiresAt: number }}
 */
function createSession(userId) {
  const challengeAction = CHALLENGE_ACTIONS[Math.floor(Math.random() * CHALLENGE_ACTIONS.length)];
  const flashColor = FLASH_COLORS[Math.floor(Math.random() * FLASH_COLORS.length)];
  const nonce = crypto.randomBytes(12).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

  const payload = {
    userId,
    challengeId: challengeAction.id,
    flashColor,
    nonce,
    exp: expiresAt
  };

  const payloadStr = JSON.stringify(payload);
  const secret = env.jwt.accessSecret || 'tradelink-verification-session-secret';
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  const sessionToken = `${Buffer.from(payloadStr).toString('base64url')}.${signature}`;

  return {
    sessionToken,
    challengeAction,
    flashColor,
    expiresAt
  };
}

/**
 * Validates and consumes the verification session token.
 * Prevents replay attacks and ensures the submission occurred within the 5-minute window.
 * @param {string} userId
 * @param {string} sessionToken
 * @returns {{ valid: boolean, reason?: string, payload?: object }}
 */
function validateAndConsumeSession(userId, sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    return { valid: false, reason: 'Verification session token is missing.' };
  }

  const parts = sessionToken.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Malformed verification session token.' };
  }

  const [encodedPayload, signature] = parts;
  let payloadStr;
  try {
    payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  } catch {
    return { valid: false, reason: 'Invalid session token encoding.' };
  }

  const secret = env.jwt.accessSecret || 'tradelink-verification-session-secret';
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

  // Timing safe signature verification
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, reason: 'Verification signature tampered or invalid.' };
  }

  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return { valid: false, reason: 'Invalid token payload data.' };
  }

  // Verify user ownership
  if (payload.userId !== userId) {
    return { valid: false, reason: 'Session token was issued to a different account.' };
  }

  // Verify expiry
  if (Date.now() > payload.exp) {
    return { valid: false, reason: 'Verification session has expired (5 minute limit). Please retake verification.' };
  }

  // Anti-replay check
  if (consumedNonces.has(payload.nonce)) {
    return { valid: false, reason: 'This verification session token has already been consumed.' };
  }

  // Mark nonce as consumed
  consumedNonces.set(payload.nonce, payload.exp);

  return { valid: true, payload };
}

module.exports = {
  createSession,
  validateAndConsumeSession
};
