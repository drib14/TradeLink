const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../serializers/userSerializer');
const { generate4DigitCode, hashCode, verifyCode } = require('../utils/generateCode');
const { generateTokens, setRefreshTokenCookie } = require('../utils/authHelpers');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

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
    return next(new AppError('Email is already registered.', 409));
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
  // MVP: All registered students have open verified access
  const isVerified = true;
  const trustScore = 0;

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
    rating: 0.0,
    total_reviews: 0,
    completed_trades: 0,
    punctuality_rate: 0,
    bio: '',
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

// Precomputed bcrypt hash for constant-time comparison against timing attacks
const DUMMY_HASH = '$2a$12$e8uq5e/jD/qE50Gv3hD.1e.W0a5vCjNfZg.HhC3aAfe7ZpM3s.zma';

/**
 * Login student user (blocks administrator accounts from student portal)
 */
const login = asyncHandler(async (req, res, next) => {
  const { studentId, idNumber, emailOrStudentId, identifier, email, password } = req.body;
  const rawQuery = (studentId || idNumber || emailOrStudentId || identifier || email || '').trim();
  const cleanDigits = rawQuery.replace(/\D/g, '');

  let user = await db('users')
    .where({ student_id: rawQuery })
    .orWhereRaw('LOWER(email) = ?', [rawQuery.toLowerCase()])
    .first();

  if (!user && cleanDigits.length >= 6) {
    user = await db('users')
      .where({ student_id: cleanDigits })
      .orWhereRaw("REPLACE(REPLACE(student_id, '-', ''), ' ', '') = ?", [cleanDigits])
      .first();
  }

  // Timing attack mitigation: Run dummy comparison if user is not found
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return next(new AppError('Invalid credentials.', 401));
  }

  // Account lockout protection: Check if locked due to 5+ failed attempts
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMin = Math.max(1, Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000)));
    return next(
      new AppError(
        `Account temporarily locked due to consecutive failed login attempts. Please try again in ${remainingMin} minute(s).`,
        423
      )
    );
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
    const attempts = (user.failed_login_attempts || 0) + 1;
    if (attempts >= 5) {
      const lockExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      await db('users').where({ id: user.id }).update({
        failed_login_attempts: attempts,
        locked_until: lockExpiry
      });
      return next(
        new AppError(
          'Account temporarily locked for 15 minutes due to 5 failed login attempts.',
          423
        )
      );
    }
    await db('users').where({ id: user.id }).update({ failed_login_attempts: attempts });
    return next(new AppError('Invalid credentials.', 401));
  }

  const tokenVersion = user.token_version || 1;
  const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.campus, tokenVersion);
  const refreshTokenHash = await hashCode(refreshToken);
  await db('users').where({ id: user.id }).update({
    refresh_token_hash: refreshTokenHash,
    failed_login_attempts: 0,
    locked_until: null
  });

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
  const token = req.cookies?.refreshToken || req.headers['x-refresh-token'];

  if (!token) {
    return next(new AppError('Refresh token missing. Please log in.', 401));
  }

  let decoded;
  const verifyOptions = { issuer: 'tradelink-api' };
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret, verifyOptions);
  } catch (err) {
    if (env.jwt.adminRefreshSecret) {
      try {
        decoded = jwt.verify(token, env.jwt.adminRefreshSecret, verifyOptions);
      } catch (adminErr) {
        return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
      }
    } else {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }
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
  const tokenVersion = user.token_version || 1;
  const newTokens = generateTokens(user.id, user.role, user.campus, tokenVersion);
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
    const nextVersion = (req.user.token_version || 1) + 1;
    await db('users').where({ id: req.user.id }).update({
      refresh_token_hash: null,
      token_version: nextVersion
    });
  }

  res.clearCookie('refreshToken', { path: '/api' });
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.'
  });
});

/**
 * Request password reset (Direct email flow: no admin permission required)
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email is required.', 400));
  }

  const cleanEmail = email.toLowerCase().trim();

  // Always return success to prevent account enumeration
  const successResponse = () => {
    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a 6-digit verification code has been dispatched. Please check your inbox or spam folder.'
    });
  };

  const user = await db('users').whereRaw('LOWER(email) = ?', [cleanEmail]).first();

  if (!user) {
    return successResponse();
  }

  // Guard: Administrator accounts must use the admin portal forgot password flow
  if (user.role === 'admin') {
    return successResponse();
  }

  // Generate 6-digit verification code directly
  const code = generate4DigitCode();
  const codeHash = await hashCode(code);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  // Save code hash directly to student account and reset failed attempts counter
  await db('users').where({ id: user.id }).update({
    reset_code_hash: codeHash,
    reset_code_exp: expiry,
    failed_reset_attempts: 0
  });

  // Record in password_reset_requests for compliance & logging
  const requestId = uuidv4();
  await db('password_reset_requests').insert({
    id: requestId,
    user_id: user.id,
    email: user.email,
    status: 'sent',
    code_hash: codeHash,
    code_exp: expiry,
    reviewed_at: new Date(),
    admin_note: 'Direct email dispatch (no admin approval required)'
  }).catch(() => {});

  // Send verification code directly to student's email
  try {
    const mailResult = await emailService.sendPasswordResetEmail(user.email, code, user.name, req);
    if (!mailResult || mailResult.error) {
      console.warn(`[AUTH] Notice: Mail delivery returned status:`, mailResult?.error || 'unconfirmed');
    }
  } catch (err) {
    console.error('[AUTH] Failed to send password reset email:', err.message);
  }

  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV AUTH] 🔑 PASSWORD RESET CODE FOR ${user.email}: [ ${code} ]`);
  }

  // Security: Never expose verification code in HTTP response payload
  const resPayload = {
    status: 'success',
    message: 'If an account with that email exists, a 6-digit verification code has been dispatched. Please check your inbox or spam folder.'
  };

  return res.status(200).json(resPayload);
});

/**
 * Verify 6-digit reset code before opening reset password modal
 */
const verifyResetCode = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(new AppError('Email and 6-digit verification code are required.', 400));
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await db('users').whereRaw('LOWER(email) = ?', [cleanEmail]).first();
  if (!user) {
    return next(new AppError('Invalid email or verification code.', 400));
  }

  if (!user.reset_code_hash || !user.reset_code_exp || new Date() > new Date(user.reset_code_exp)) {
    return next(new AppError('Verification code has expired or is invalid. Please request a new code.', 400));
  }

  const isMatch = await verifyCode(code.trim(), user.reset_code_hash);
  if (!isMatch) {
    const attempts = (user.failed_reset_attempts || 0) + 1;
    if (attempts >= 3) {
      await db('users').where({ id: user.id }).update({
        reset_code_hash: null,
        reset_code_exp: null,
        failed_reset_attempts: 0
      });
      return next(
        new AppError(
          'Invalid verification code. Maximum attempts exceeded (3/3). This code has been invalidated. Please request a new code.',
          400
        )
      );
    }
    await db('users').where({ id: user.id }).update({ failed_reset_attempts: attempts });
    return next(
      new AppError(
        `Invalid verification code. You have ${3 - attempts} attempt(s) remaining.`,
        400
      )
    );
  }

  return res.status(200).json({
    status: 'success',
    message: 'Verification code confirmed. You may now set your new password.'
  });
});

/**
 * Reset password with verification code
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return next(new AppError('Email, verification code, and new password are required.', 400));
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await db('users').whereRaw('LOWER(email) = ?', [cleanEmail]).first();
  if (!user) {
    return next(new AppError('Invalid email or verification code.', 400));
  }

  if (!user.reset_code_hash || !user.reset_code_exp || new Date() > new Date(user.reset_code_exp)) {
    return next(new AppError('Verification code has expired or is invalid. Please request a new one.', 400));
  }

  const isMatch = await verifyCode(code.trim(), user.reset_code_hash);
  if (!isMatch) {
    const attempts = (user.failed_reset_attempts || 0) + 1;
    if (attempts >= 3) {
      // Invalidate code after 3 wrong attempts
      await db('users').where({ id: user.id }).update({
        reset_code_hash: null,
        reset_code_exp: null,
        failed_reset_attempts: 0
      });
      return next(
        new AppError(
          'Invalid verification code. Maximum attempts exceeded (3/3). For security, this verification code has been invalidated. Please request a new code.',
          400
        )
      );
    }
    await db('users').where({ id: user.id }).update({ failed_reset_attempts: attempts });
    return next(
      new AppError(
        `Invalid verification code. You have ${3 - attempts} attempt(s) remaining.`,
        400
      )
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const nextTokenVersion = (user.token_version || 1) + 1;

  await db('users').where({ id: user.id }).update({
    password_hash: passwordHash,
    reset_code_hash: null,
    reset_code_exp: null,
    failed_reset_attempts: 0,
    failed_login_attempts: 0,
    locked_until: null,
    token_version: nextTokenVersion,
    password_changed_at: new Date(),
    refresh_token_hash: null // Invalidate existing refresh token sessions
  });

  // Mark latest reset requests as completed
  await db('password_reset_requests')
    .where({ user_id: user.id })
    .update({ status: 'completed' })
    .catch(() => {});

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
  verifyResetCode,
  resetPassword,
  getMe
};
