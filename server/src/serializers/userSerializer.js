/**
 * User Serializer
 * Returns sanitized, normalized camelCase student profile
 */
function serializeUser(user, options = {}) {
  if (!user) return null;

  const isVerified = Boolean(user.is_verified ?? user.isVerified);
  let verificationStatus = isVerified ? 'verified' : 'unverified';
  if (!isVerified) {
    if (user.verification_status || user.verificationStatus) {
      verificationStatus = user.verification_status || user.verificationStatus;
    } else if (user.id_photo_url || user.idPhotoUrl) {
      verificationStatus = 'pending';
    }
  }

  const isSelf = Boolean(options.isSelf);
  const isAdmin = Boolean(options.isAdmin);

  const base = {
    id: user.id,
    name: user.name,
    studentId: user.student_id || user.studentId,
    role: user.role || 'student',
    campus: user.campus,
    college: user.college,
    yearLevel: user.year_level || user.yearLevel,
    avatar: user.avatar_url || user.avatar || null,
    isVerified,
    verificationStatus,
    idPhotoUrl: isSelf || isAdmin ? (user.id_photo_url || user.idPhotoUrl || null) : null,
    trustScore: user.trust_score ?? user.trustScore ?? 60,
    rating: parseFloat(user.rating || 5.0),
    totalReviews: user.total_reviews ?? user.totalReviews ?? 0,
    completedTrades: user.completed_trades ?? user.completedTrades ?? 0,
    punctualityRate: user.punctuality_rate ?? user.punctualityRate ?? 100,
    bio: user.bio || '',
    isProMerchant: Boolean(user.is_pro_merchant ?? user.isProMerchant),
    joinedDate: user.created_at || user.joinedDate || new Date().toISOString()
  };

  // Only expose email, ban details, and warnings to the user themselves or administrators
  if (isSelf || isAdmin) {
    base.email = user.email;
    base.isBanned = Boolean(user.is_banned ?? user.isBanned);
    base.banReason = user.ban_reason || user.banReason || null;
    base.bannedAt = user.banned_at || user.bannedAt || null;
    base.warningsCount = user.warnings_count ?? user.warningsCount ?? 0;
  }

  return base;
}

module.exports = {
  serializeUser
};
