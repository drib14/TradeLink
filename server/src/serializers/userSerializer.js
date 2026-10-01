/**
 * User Serializer
 * Returns sanitized, normalized camelCase student profile
 */
function serializeUser(user, options = {}) {
  if (!user) return null;

  // MVP: Verification disabled, all users have full verified access
  const isVerified = true;
  const verificationStatus = 'verified';

  const isSelf = Boolean(options.isSelf);
  const isAdmin = Boolean(options.isAdmin);

  const completedTrades = Number(user.completed_trades ?? user.completedTrades ?? 0);
  const totalReviews = Number(user.total_reviews ?? user.totalReviews ?? 0);
  const hasTransactions = completedTrades > 0 || totalReviews > 0;

  const base = {
    id: user.id,
    name: user.name,
    studentId: user.student_id || user.studentId,
    role: user.role || 'student',
    campus: user.campus,
    department: user.department || user.college || '',
    avatar: user.avatar_url || user.avatar || null,
    isVerified: true,
    verificationStatus: 'verified',
    idPhotoUrl: isSelf || isAdmin ? (user.id_photo_url || user.idPhotoUrl || null) : null,
    trustScore: 0,
    rating: hasTransactions ? parseFloat(user.rating ?? 0.0) : 0.0,
    totalReviews,
    completedTrades,
    punctualityRate: hasTransactions ? Number(user.punctuality_rate ?? user.punctualityRate ?? 0) : 0,
    bio: user.bio || '',
    joinedDate: user.created_at || user.joinedDate || new Date().toISOString()
  };

  // Only expose email, ban details, and warnings to the user themselves or administrators
  if (isSelf || isAdmin) {
    base.email = user.email;
    base.isBanned = Boolean(user.is_banned ?? user.isBanned);
    base.banReason = user.ban_reason || user.banReason || null;
    base.bannedAt = user.banned_at || user.bannedAt || null;
    base.warningsCount = user.warnings_count ?? user.warningsCount ?? 0;
    base.verificationRejectionReason = user.rejection_reason || user.verification_rejection_reason || user.rejectionReason || null;
  }

  return base;
}

module.exports = {
  serializeUser
};
