/**
 * Strips sensitive fields like password_hash, reset_code_hash, refresh_token_hash from user object
 * @param {Object} user
 * @returns {Object} sanitized user
 */
function sanitizeUser(user, pendingVerif = null) {
  if (!user) return null;
  const {
    password_hash,
    refresh_token_hash,
    reset_code_hash,
    reset_code_exp,
    ...safeUser
  } = user;

  const isVerified = Boolean(safeUser.is_verified);
  let verificationStatus = isVerified ? 'verified' : 'unverified';
  if (!isVerified) {
    if (safeUser.verification_status) {
      verificationStatus = safeUser.verification_status;
    } else if (pendingVerif || safeUser.has_pending_verification) {
      verificationStatus = 'pending';
    } else if (safeUser.id_photo_url) {
      verificationStatus = 'pending';
    }
  }

  return {
    ...safeUser,
    isVerified,
    verificationStatus,
    isProMerchant: Boolean(safeUser.is_pro_merchant),
    isBanned: Boolean(safeUser.is_banned),
    studentId: safeUser.student_id,
    yearLevel: safeUser.year_level,
    avatar: safeUser.avatar_url,
    idPhotoUrl: safeUser.id_photo_url,
    trustScore: safeUser.trust_score,
    totalReviews: safeUser.total_reviews,
    completedTrades: safeUser.completed_trades,
    punctualityRate: safeUser.punctuality_rate,
    joinedDate: safeUser.created_at,
    banReason: safeUser.ban_reason,
    bannedAt: safeUser.banned_at,
    warningsCount: safeUser.warnings_count
  };
}

module.exports = {
  sanitizeUser
};
