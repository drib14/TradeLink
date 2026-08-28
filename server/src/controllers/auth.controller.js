const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('../utils/sanitize');
const { generate4DigitCode, hashCode, verifyCode } = require('../utils/generateCode');
const { sendPasswordResetEmail } = require('../services/email.service');

// Helper to generate access & refresh tokens
function generateTokens(userId, role, campus) {
  const accessToken = jwt.sign(
    { userId, role, campus },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, role, campus },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

// Set refresh token in HttpOnly secure cookie
function setRefreshTokenCookie(res, refreshToken) {
  const isProd = env.env === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth'
  });
}

/**
 * Register a new student account
 */
const register = asyncHandler(async (req, res, next) => {
  const {
    name,
    studentId,
    email,
    password,
    campus,
    college,
    yearLevel,
    avatar,
    idPhotoUrl
  } = req.body;

  // Check duplicate email
  const existingEmail = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase()]).first();
  if (existingEmail) {
    return next(new AppError('A student account with this email is already registered.', 409));
  }

  // Check duplicate student ID
  const existingStudentId = await db('users').where({ student_id: studentId }).first();
  if (existingStudentId) {
    return next(new AppError('A student account with this Student ID is already registered.', 409));
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = `user-${Date.now()}`;
  const isVerified = false;
  const trustScore = 60;

  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    student_id: studentId.trim(),
    password_hash: passwordHash,
    role: 'student',
    campus,
    college: college.trim(),
    year_level: yearLevel.trim(),
    avatar_url: avatar || null,
    is_verified: false,
    id_photo_url: idPhotoUrl || null,
    trust_score: trustScore,
    rating: 5.0,
    total_reviews: 0,
    completed_trades: 0,
    punctuality_rate: 100,
    bio: `Student at ${campus} - ${college}.`,
    is_pro_merchant: false,
    is_banned: false
  };

  await db('users').insert(newUser);

  // If ID was uploaded, create pending verification request
  if (idPhotoUrl) {
    await db('verification_requests').insert({
      id: `verif-${Date.now()}`,
      user_id: userId,
      student_id_number: studentId,
      campus,
      college,
      id_card_image_url: idPhotoUrl,
      status: 'approved', // Auto-approved in mock initial register
      reviewed_at: new Date()
    });
  }

  const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.role, newUser.campus);
  
  // Store hashed refresh token in DB for rotation & revocation
  const refreshTokenHash = await hashCode(refreshToken);
  await db('users').where({ id: userId }).update({ refresh_token_hash: refreshTokenHash });

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    status: 'success',
    message: `Account created for ${newUser.name}! Welcome to TradeLink.`,
    data: {
      user: sanitizeUser(newUser),
      accessToken
    }
  });
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res, next) => {
  const { emailOrStudentId, password } = req.body;
  const cleanQuery = emailOrStudentId.toLowerCase().trim();

  const user = await db('users')
    .whereRaw('LOWER(email) = ? OR student_id = ?', [cleanQuery, cleanQuery])
    .first();

  if (!user) {
    return next(new AppError('No account found with this Student ID or email address.', 401));
  }

  if (user.is_banned) {
    return next(
      new AppError(
        `Account suspended by campus administration. Reason: ${user.ban_reason || 'Violation of safety guidelines'}`,
        403
      )
    );
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Incorrect password entered. Please check your credentials.', 401));
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.campus);
  const refreshTokenHash = await hashCode(refreshToken);
  await db('users').where({ id: user.id }).update({ refresh_token_hash: refreshTokenHash });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    status: 'success',
    message: `Welcome back, ${user.name}!`,
    data: {
      user: sanitizeUser(user),
      accessToken
    }
  });
});

/**
 * Refresh access token using HttpOnly refresh token cookie
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return next(new AppError('Refresh token missing. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  const user = await db('users').where({ id: decoded.userId }).first();
  if (!user || user.is_banned) {
    return next(new AppError('User account invalid or suspended.', 401));
  }

  // Verify refresh token hash in DB
  const isValidHash = await verifyCode(token, user.refresh_token_hash);
  if (!isValidHash) {
    return next(new AppError('Revoked session. Please log in again.', 401));
  }

  // Rotate tokens
  const newTokens = generateTokens(user.id, user.role, user.campus);
  const newHash = await hashCode(newTokens.refreshToken);
  await db('users').where({ id: user.id }).update({ refresh_token_hash: newHash });

  setRefreshTokenCookie(res, newTokens.refreshToken);

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: newTokens.accessToken,
      user: sanitizeUser(user)
    }
  });
});

/**
 * Logout and clear session
 */
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await db('users').where({ id: req.user.id }).update({ refresh_token_hash: null });
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.'
  });
});

/**
 * Request password reset code
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase().trim()]).first();

  if (!user) {
    return next(new AppError('No registered UC account found with that email address.', 404));
  }

  const code = generate4DigitCode();
  const codeHash = await hashCode(code);
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db('users').where({ id: user.id }).update({
    reset_code_hash: codeHash,
    reset_code_exp: expiry
  });

  await sendPasswordResetEmail(user.email, code, user.name);

  res.status(200).json({
    status: 'success',
    message: `Verification code sent to ${user.email}. (Dev Code: ${code})`,
    resetCode: env.env === 'development' ? code : undefined
  });
});

/**
 * Reset password with 4-digit verification code
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  const user = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase().trim()]).first();
  if (!user) {
    return next(new AppError('Account not found.', 404));
  }

  if (!user.reset_code_hash || !user.reset_code_exp || new Date() > new Date(user.reset_code_exp)) {
    return next(new AppError('Verification code has expired. Please request a new one.', 400));
  }

  const isMatch = await verifyCode(code, user.reset_code_hash);
  if (!isMatch) {
    return next(new AppError('Invalid 4-digit verification code.', 400));
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: user.id }).update({
    password_hash: passwordHash,
    reset_code_hash: null,
    reset_code_exp: null
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. You may now login.'
  });
});

/**
 * Get current authenticated user session
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: sanitizeUser(req.user)
    }
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe
};
