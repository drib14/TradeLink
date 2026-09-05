const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate JWT access & refresh tokens for a user session
 * @param {string} userId
 * @param {string} role
 * @param {string} campus
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(userId, role, campus) {
  const accessToken = jwt.sign(
    { userId, role, campus },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn || '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Set the refresh token as an HttpOnly cookie
 * @param {import('express').Response} res
 * @param {string} refreshToken
 */
function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api'
  });
}

module.exports = {
  generateTokens,
  setRefreshTokenCookie
};
