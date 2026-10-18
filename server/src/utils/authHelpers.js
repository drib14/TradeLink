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
function generateTokens(userId, role, campus, tokenVersion = 1) {
  const isAdmin = role === 'admin';
  const accessSecret = isAdmin ? env.jwt.adminAccessSecret : env.jwt.accessSecret;
  const refreshSecret = isAdmin ? env.jwt.adminRefreshSecret : env.jwt.refreshSecret;
  const audience = isAdmin ? 'tradelink-admin' : 'tradelink-client';

  const accessToken = jwt.sign(
    { userId, role, campus, tokenVersion: tokenVersion || 1, tokenType: isAdmin ? 'admin' : 'student' },
    accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn || '15m',
      issuer: 'tradelink-api',
      audience
    }
  );

  const refreshToken = jwt.sign(
    { userId, role, tokenVersion: tokenVersion || 1, tokenType: isAdmin ? 'admin' : 'student' },
    refreshSecret,
    {
      expiresIn: env.jwt.refreshExpiresIn || '7d',
      issuer: 'tradelink-api',
      audience
    }
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
  const sameSiteSetting = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  const secureSetting = isProduction || sameSiteSetting === 'none';

  const cookieOptions = {
    httpOnly: true,
    secure: secureSetting,
    sameSite: sameSiteSetting,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api'
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('refreshToken', refreshToken, cookieOptions);
}

module.exports = {
  generateTokens,
  setRefreshTokenCookie
};

