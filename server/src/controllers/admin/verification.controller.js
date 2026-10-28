const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');

async function logAdminAction(adminUser, action, targetType, targetId, details, req) {
  const ip = req?.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';

  try {
    const logData = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      admin_id: adminUser.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || '',
      ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : ip,
      created_at: new Date()
    };
    const hasAdminName = await db.schema.hasColumn('admin_audit_logs', 'admin_name').catch(() => false);
    if (hasAdminName) {
      logData.admin_name = adminUser.name || 'Administrator';
    }
    await db('admin_audit_logs').insert(logData);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

/**
 * Get verification requests (with pagination)
 */
const getVerifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  let query = db('verification_requests')
    .join('users', 'verification_requests.user_id', 'users.id')
    .select(
      'verification_requests.*',
      'users.name as user_name',
      'users.email as user_email',
      'users.campus as user_campus',
      'users.department as user_department',
      'users.department as user_college'
    );

  if (status === 'suspicious') {
    query = query.where('verification_requests.is_suspicious', true);
  } else if (status) {
    query = query.where('verification_requests.status', status);
  }

  const requests = await query
    .orderBy('verification_requests.created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const formatted = requests.map((r) => {
    let suspiciousReasons = [];
    let credentialDiagnostics = null;
    try {
      if (r.suspicious_reasons) {
        suspiciousReasons = typeof r.suspicious_reasons === 'string' ? JSON.parse(r.suspicious_reasons) : r.suspicious_reasons;
      }
    } catch {}
    try {
      if (r.credential_diagnostics) {
        credentialDiagnostics = typeof r.credential_diagnostics === 'string' ? JSON.parse(r.credential_diagnostics) : r.credential_diagnostics;
      }
    } catch {}

    return {
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      studentIdNumber: r.student_id_number,
      campus: r.user_campus || 'UC Main',
      department: r.user_department || r.user_college || 'General Student',
      college: r.user_department || r.user_college || 'General Student',
      idCardImageUrl: r.id_photo_url || r.id_card_image_url || '',
      selfiePhotoUrl: r.selfie_photo_url || null,
      status: r.status,
      confidenceScore: r.confidence_score ?? (r.status === 'approved' ? 95 : 70),
      isSuspicious: Boolean(r.is_suspicious),
      suspiciousReasons,
      credentialDiagnostics,
      verificationMethod: r.verification_method || 'automated',
      rejectionReason: r.rejection_reason || null,
      reviewedBy: r.reviewed_by || null,
      submittedAt: r.created_at || r.submitted_at,
      reviewedAt: r.reviewed_at
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      verifications: formatted,
      page: parsedPage,
      limit: parsedLimit
    }
  });
});

/**
 * Approve student ID verification
 */
const approveVerification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const verif = await db('verification_requests').where({ id }).first();

  if (!verif) {
    return next(new AppError('Verification request not found.', 404));
  }

  await db.transaction(async (trx) => {
    await trx('verification_requests').where({ id }).update({
      status: 'approved',
      reviewed_at: new Date(),
      reviewed_by: req.user.id
    });

    await trx('users').where({ id: verif.user_id }).update({
      is_verified: true,
      trust_score: db.raw('LEAST(100, trust_score + 25)')
    });
  });

  await logAdminAction(req.user, 'Approved Student Verification', 'verification', id, `Verified user ${verif.user_id}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Student ID verification approved. Trust Score bonus awarded.'
  });
});

/**
 * Reject student ID verification
 */
const rejectVerification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Incomplete or unreadable ID photo' } = req.body;

  const verif = await db('verification_requests').where({ id }).first();
  if (!verif) {
    return next(new AppError('Verification request not found.', 404));
  }

  await db.transaction(async (trx) => {
    await trx('verification_requests').where({ id }).update({
      status: 'rejected',
      reviewed_at: new Date(),
      reviewed_by: req.user.id,
      rejection_reason: reason
    });

    await trx('users').where({ id: verif.user_id }).update({
      is_verified: false
    });
  });

  await logAdminAction(req.user, 'Rejected Verification', 'verification', id, `Rejected: ${reason}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Verification request rejected.'
  });
});

module.exports = {
  getVerifications,
  approveVerification,
  rejectVerification,
  logAdminAction
};
