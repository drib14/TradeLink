const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { generate4DigitCode, hashCode } = require('../../utils/generateCode');
const {
  sendPasswordResetApprovedEmail,
  sendPasswordResetRejectedEmail
} = require('../../services/email.service');

async function logAdminAction(adminUser, action, targetType, targetId, details, req) {
  const ip = req?.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';

  try {
    await db('admin_audit_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      admin_id: adminUser.id,
      admin_name: adminUser.name || 'Administrator',
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || '',
      ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : ip,
      created_at: new Date()
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

/**
 * Get all password reset requests with filtering
 */
const getPasswordResetRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  let query = db('password_reset_requests')
    .join('users', 'password_reset_requests.user_id', 'users.id')
    .select(
      'password_reset_requests.*',
      'users.name as user_name',
      'users.email as user_email',
      'users.student_id as user_student_id',
      'users.campus as user_campus',
      'users.department as user_department',
      'users.department as user_college',
      'users.avatar_url as user_avatar_url'
    );

  if (status && status !== 'all') {
    query = query.where('password_reset_requests.status', status);
  }

  const requests = await query
    .orderBy('password_reset_requests.created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const formatted = requests.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    studentId: r.user_student_id,
    campus: r.user_campus || 'UC Main',
    department: r.user_department || r.user_college || 'General Student',
    college: r.user_department || r.user_college || 'General Student',
    avatarUrl: r.user_avatar_url || null,
    status: r.status,
    adminNote: r.admin_note || null,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at || null
  }));

  const pendingCountRow = await db('password_reset_requests')
    .where({ status: 'pending' })
    .count({ count: '*' })
    .first();

  res.status(200).json({
    status: 'success',
    data: {
      requests: formatted,
      pendingCount: parseInt(pendingCountRow?.count || 0, 10),
      page: parsedPage,
      limit: parsedLimit
    }
  });
});

/**
 * Approve password reset request: generates code, hashes it, saves it, and dispatches email
 */
const approvePasswordReset = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const resetReq = await db('password_reset_requests')
    .where({ id })
    .first();

  if (!resetReq) {
    return next(new AppError('Password reset request not found.', 404));
  }

  if (resetReq.status === 'approved') {
    return next(new AppError('This reset request is already approved.', 400));
  }

  const user = await db('users').where({ id: resetReq.user_id }).first();
  if (!user) {
    return next(new AppError('User account associated with this request not found.', 404));
  }

  // Generate 4-digit verification code
  const code = generate4DigitCode();
  const codeHash = await hashCode(code);
  const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

  // Update password reset request
  await db('password_reset_requests').where({ id }).update({
    status: 'approved',
    code_hash: codeHash,
    code_exp: expiry,
    reviewed_by: req.user.id,
    reviewed_at: new Date()
  });

  // Update user's reset code hash
  await db('users').where({ id: user.id }).update({
    reset_code_hash: codeHash,
    reset_code_exp: expiry
  });

  // Dispatch email via Gmail SMTP
  const emailResult = await sendPasswordResetApprovedEmail(user.email, code, user.name, req);

  // Log action in audit logs
  await logAdminAction(
    req.user,
    'PASSWORD_RESET_APPROVED',
    'user',
    user.id,
    `Approved password reset request for ${user.name} (${user.student_id}). Verification code emailed. Email result: ${emailResult.ok ? 'sent' : 'failed'}`,
    req
  );

  res.status(200).json({
    status: 'success',
    message: `Password reset request for ${user.name} has been approved. Verification code sent to ${user.email}.`,
    data: {
      id,
      status: 'approved',
      emailSent: emailResult.ok
    }
  });
});

/**
 * Refuse / Reject password reset request
 */
const rejectPasswordReset = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = '' } = req.body;

  const resetReq = await db('password_reset_requests').where({ id }).first();
  if (!resetReq) {
    return next(new AppError('Password reset request not found.', 404));
  }

  const user = await db('users').where({ id: resetReq.user_id }).first();
  const userName = user?.name || 'Student';
  const userEmail = user?.email || resetReq.email;

  await db('password_reset_requests').where({ id }).update({
    status: 'rejected',
    admin_note: reason.trim() || 'Request refused by administration.',
    reviewed_by: req.user.id,
    reviewed_at: new Date()
  });

  // Clear any existing reset hash on the user
  if (user) {
    await db('users').where({ id: user.id }).update({
      reset_code_hash: null,
      reset_code_exp: null
    });
  }

  // Dispatch rejection notification email
  if (userEmail) {
    await sendPasswordResetRejectedEmail(userEmail, userName, reason.trim(), req);
  }

  await logAdminAction(
    req.user,
    'PASSWORD_RESET_REJECTED',
    'user',
    resetReq.user_id,
    `Refused password reset request for ${userName}. Reason: ${reason || 'None specified'}.`,
    req
  );

  res.status(200).json({
    status: 'success',
    message: `Password reset request for ${userName} has been refused.`,
    data: {
      id,
      status: 'rejected'
    }
  });
});

module.exports = {
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset
};
