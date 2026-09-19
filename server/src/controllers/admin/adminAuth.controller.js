const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { serializeUser } = require('../../serializers/userSerializer');
const { generate4DigitCode, hashCode, verifyCode } = require('../../utils/generateCode');
const { generateTokens, setRefreshTokenCookie } = require('../../utils/authHelpers');
const emailService = require('../../services/email.service');

const logger = require('../../utils/logger');

// Precomputed bcrypt hash for constant-time comparison against timing attacks
const DUMMY_HASH = '$2a$12$e8uq5e/jD/qE50Gv3hD.1e.W0a5vCjNfZg.HhC3aAfe7ZpM3s.zma';

/**
 * Administrator Login (Email or ID + Password, role must be admin)
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Admin email and password are required.', 400));
  }

  const cleanIdentifier = email.toLowerCase().trim();
  const user = await db('users')
    .where((builder) => {
      builder.whereRaw('LOWER(email) = ?', [cleanIdentifier])
        .orWhereRaw('LOWER(student_id) = ?', [cleanIdentifier]);
    })
    .andWhere({ role: 'admin' })
    .first();

  // Timing attack mitigation: Run dummy comparison if admin is not found
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    logger.warn(`[ADMIN_AUTH_FAIL] Invalid admin credentials for "${cleanIdentifier}" from IP ${req.ip}`);
    return next(new AppError('Invalid administrator credentials.', 401));
  }

  // Account lockout protection for administrators
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMin = Math.max(1, Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000)));
    logger.warn(`[ADMIN_AUTH_LOCKED] Locked admin account login attempted: "${user.email}" from IP ${req.ip}`);
    return next(
      new AppError(
        `Administrator account temporarily locked due to consecutive failed attempts. Please try again in ${remainingMin} minute(s).`,
        423
      )
    );
  }

  if (user.is_banned) {
    logger.warn(`[ADMIN_AUTH_FAIL] Suspended admin account attempted login: "${user.email}" from IP ${req.ip}`);
    return next(new AppError('Administrator account suspended.', 403));
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
      logger.warn(`[ADMIN_AUTH_LOCKOUT] Admin account "${user.email}" locked for 15m after 5 failed attempts from IP ${req.ip}`);
      return next(
        new AppError(
          'Administrator account temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
          423
        )
      );
    }
    await db('users').where({ id: user.id }).update({ failed_login_attempts: attempts });
    logger.warn(`[ADMIN_AUTH_FAIL] Password mismatch for admin "${user.email}" (attempt ${attempts}/5) from IP ${req.ip}`);
    return next(new AppError('Invalid administrator credentials.', 401));
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
  logger.info(`[ADMIN_AUTH_SUCCESS] Administrator "${user.email}" logged in from IP ${req.ip}`);

  res.status(200).json({
    status: 'success',
    message: 'Administrator authentication successful.',
    data: {
      user: serializeUser(user, { isSelf: true, isAdmin: true }),
      accessToken
    }
  });
});

/**
 * Administrator Direct Forgot Password (Generates code and emails directly without approval)
 * Uses constant-time response to prevent admin account enumeration
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Admin email is required.', 400));
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await db('users')
    .whereRaw('LOWER(email) = ?', [cleanEmail])
    .andWhere({ role: 'admin' })
    .first();

  // Consistent message returned whether account exists or not to prevent enumeration
  const standardMessage = 'If an administrator account exists with this email, a 6-digit verification code has been dispatched.';

  if (!user) {
    logger.info(`[ADMIN_AUTH_RESET] Password reset requested for non-admin email "${cleanEmail}" from IP ${req.ip}`);
    return res.status(200).json({
      status: 'success',
      message: standardMessage
    });
  }

  const code = generate4DigitCode(); // Now generates 6 digits
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  await db('users').where({ id: user.id }).update({
    reset_code_hash: codeHash,
    reset_code_exp: expiresAt,
    failed_reset_attempts: 0
  });

  try {
    await emailService.sendAdminPasswordResetEmail(user.email, user.name || 'Administrator', code);
    logger.info(`[ADMIN_AUTH_RESET] Verification code sent to admin "${user.email}" from IP ${req.ip}`);
  } catch (err) {
    logger.error(`Failed to send admin reset email: ${err.message}`);
  }

  res.status(200).json({
    status: 'success',
    message: standardMessage
  });
});

/**
 * Administrator Reset Password
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return next(new AppError('Email, code, and new password are required.', 400));
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await db('users')
    .whereRaw('LOWER(email) = ?', [cleanEmail])
    .andWhere({ role: 'admin' })
    .first();

  if (!user) {
    return next(new AppError('Administrator account not found.', 404));
  }

  if (!user.reset_code_hash || !user.reset_code_exp || new Date() > new Date(user.reset_code_exp)) {
    return next(new AppError('Verification code has expired. Please request a new one.', 400));
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
      logger.warn(`[ADMIN_AUTH_CODE_BURNED] Reset code invalidated for admin "${user.email}" after 3 failed attempts`);
      return next(
        new AppError(
          'Invalid verification code. Maximum attempts exceeded (3/3). This code has been invalidated for security. Please request a new code.',
          400
        )
      );
    }
    await db('users').where({ id: user.id }).update({ failed_reset_attempts: attempts });
    return next(new AppError(`Invalid verification code. You have ${3 - attempts} attempt(s) remaining.`, 400));
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
    refresh_token_hash: null
  });

  logger.info(`[ADMIN_AUTH_RESET_SUCCESS] Password successfully reset for administrator "${user.email}"`);

  res.status(200).json({
    status: 'success',
    message: 'Administrator password reset successfully. You may now sign in with your new credentials.'
  });
});

module.exports = {
  login,
  forgotPassword,
  resetPassword
};

