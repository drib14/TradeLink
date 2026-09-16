const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate JWT access & refresh tokens for a user session
 * Signs with separate secrets for admins vs regular students to prevent token cross-use
 * @param {string} userId
 * @param {string} role
 * @param {string} campus
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(userId, role, campus) {
  const isAdmin = role === 'admin';
  const accessSecret = isAdmin ? env.jwt.adminAccessSecret : env.jwt.accessSecret;
  const refreshSecret = isAdmin ? env.jwt.adminRefreshSecret : env.jwt.refreshSecret;

  const accessToken = jwt.sign(
    { userId, role, campus, tokenType: isAdmin ? 'admin' : 'student' },
    accessSecret,
    { expiresIn: env.jwt.accessExpiresIn || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, tokenType: isAdmin ? 'admin' : 'student' },
    refreshSecret,
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
  const isProduction = env.isProduction || env.env === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api'
  });
}

module.exports = {
  generateTokens,
  setRefreshTokenCookie
};

