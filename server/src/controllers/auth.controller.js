const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../serializers/userSerializer');
const { hashCode, verifyCode } = require('../utils/generateCode');
const { generateTokens, setRefreshTokenCookie } = require('../utils/authHelpers');

/**
 * Register a new student account
 */
const register = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    studentId,
    password,
    campus,
    college,
    yearLevel,
    avatar,
    idPhotoUrl
  } = req.body;

  // Check if email already registered
  const existingEmail = await db('users')
    .whereRaw('LOWER(email) = ?', [email.toLowerCase().trim()])
    .first();
  if (existingEmail) {
    return next(new AppError('Email address is already in use.', 409));
  }

  // Check if student ID already registered
  const existingStudentId = await db('users')
    .where({ student_id: studentId.trim() })
    .first();
  if (existingStudentId) {
    return next(new AppError('Student ID is already registered.', 409));
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
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
    is_verified: isVerified,
    id_photo_url: idPhotoUrl || null,
    trust_score: trustScore,
    rating: 5.0,
    total_reviews: 0,
    completed_trades: 0,
    punctuality_rate: 100,
    bio: `Student at ${campus} - ${college.trim()}.`,
    is_pro_merchant: false,
    is_banned: false
  };

  await db('users').insert(newUser);

  // If ID was uploaded during registration, create pending verification request
  if (idPhotoUrl) {
    await db('verification_requests').insert({
      id: uuidv4(),
      user_id: userId,
      student_id_number: studentId.trim(),
      id_photo_url: idPhotoUrl,
      status: 'pending'
    });
  }

  const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.role, newUser.campus);
  const refreshTokenHash = await hashCode(refreshToken);
  await db('users').where({ id: userId }).update({ refresh_token_hash: refreshTokenHash });

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully. Welcome to TradeLink.',
    data: {
      user: serializeUser(newUser, { isSelf: true }),
      accessToken
    }
  });
});

/**
 * Login student user (blocks administrator accounts from student portal)
 */
const login = asyncHandler(async (req, res, next) => {
  const { studentId, idNumber, emailOrStudentId, identifier, email, password } = req.body;
  const cleanQuery = (studentId || idNumber || emailOrStudentId || identifier || email || '').trim();

  const user = await db('users')
    .where({ student_id: cleanQuery })
    .orWhereRaw('LOWER(email) = ?', [cleanQuery.toLowerCase()])
    .first();

  if (!user) {
    return next(new AppError('Invalid credentials.', 401));
  }

  // Guard: Administrator accounts must use the dedicated Admin Portal
  if (user.role === 'admin') {
    return next(
      new AppError(
        'Administrator accounts must log in via the dedicated TradeLink Administration Portal.',
        403
      )
    );
  }

  if (user.is_banned) {
    return next(
      new AppError(
        'This account has been suspended. Contact campus administration for details.',
        403
      )
    );
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Invalid credentials.', 401));
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.campus);
  const refreshTokenHash = await hashCode(refreshToken);
  await db('users').where({ id: user.id }).update({ refresh_token_hash: refreshTokenHash });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    status: 'success',
    message: 'Login successful.',
    data: {
      user: serializeUser(user, { isSelf: true, isAdmin: false }),
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
      user: serializeUser(user, { isSelf: true, isAdmin: user.role === 'admin' })
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

  res.clearCookie('refreshToken', { path: '/api' });
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.'
  });
});

/**
 * Request password reset (Student flow: registered for campus administrator review)
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email is required.', 400));
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await db('users').whereRaw('LOWER(email) = ?', [cleanEmail]).first();

  if (!user) {
    return next(new AppError('No registered account found with that email address. Please check your email or register.', 404));
  }

  // Guard: Administrator accounts must use the admin portal forgot password flow
  if (user.role === 'admin') {
    return next(
      new AppError(
        'Administrator accounts must request password reset via the TradeLink Administration Portal.',
        403
      )
    );
  }

  // Check if a reset request is already pending admin review
  const existingPending = await db('password_reset_requests')
    .where({ user_id: user.id, status: 'pending' })
    .first();

  if (existingPending) {
    return res.status(200).json({
      status: 'success',
      message: 'A password reset request for this account is already pending administrator confirmation. Please wait for an administrator to review it.',
      data: {
        requestId: existingPending.id,
        status: 'pending'
      }
    });
  }

  const requestId = uuidv4();
  await db('password_reset_requests').insert({
    id: requestId,
    user_id: user.id,
    email: user.email,
    status: 'pending'
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset request submitted successfully. It has been sent to campus administration for approval. Once approved, your verification code will be sent to your registered email.',
    data: {
      requestId,
      status: 'pending'
    }
  });
});

/**
 * Reset password with admin-approved verification code
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  const user = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase().trim()]).first();
  if (!user) {
    return next(new AppError('Account not found.', 404));
  }

  if (!user.reset_code_hash || !user.reset_code_exp || new Date() > new Date(user.reset_code_exp)) {
    return next(new AppError('Verification code has expired or has not been approved by administration. Please request a new one.', 400));
  }

  const isMatch = await verifyCode(code, user.reset_code_hash);
  if (!isMatch) {
    return next(new AppError('Invalid verification code.', 400));
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: user.id }).update({
    password_hash: passwordHash,
    reset_code_hash: null,
    reset_code_exp: null,
    refresh_token_hash: null // Invalidate existing sessions for security
  });

  // Mark latest approved request as completed
  await db('password_reset_requests')
    .where({ user_id: user.id, status: 'approved' })
    .update({ status: 'completed' });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. You may now login with your new password.'
  });
});

/**
 * Get current authenticated user session
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: serializeUser(req.user, { isSelf: true, isAdmin: req.user.role === 'admin' })
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
