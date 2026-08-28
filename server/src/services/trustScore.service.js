const db = require('../config/db');

/**
 * Recalculates and persists a user's trust score and rating metrics
 * @param {string} userId
 */
async function recalculateUserStats(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) return;

  // 1. Calculate average rating and total reviews
  const reviewStats = await db('reviews')
    .where({ target_user_id: userId })
    .select(
      db.raw('COUNT(*) as total_reviews'),
      db.raw('AVG(rating) as avg_rating'),
      db.raw('SUM(CASE WHEN was_punctual = 1 THEN 1 ELSE 0 END) as punctual_count')
    )
    .first();

  const totalReviews = Number(reviewStats.total_reviews) || 0;
  const avgRating = totalReviews > 0 ? parseFloat(reviewStats.avg_rating).toFixed(1) : 5.0;
  const punctualCount = Number(reviewStats.punctual_count) || 0;
  const punctualityRate = totalReviews > 0 ? Math.round((punctualCount / totalReviews) * 100) : 100;

  // 2. Completed trades
  const tradeStats = await db('meetup_transactions')
    .where((builder) => {
      builder.where('seller_id', userId).orWhere('buyer_id', userId);
    })
    .where({ status: 'completed' })
    .count('id as completed_count')
    .first();

  const completedTrades = Number(tradeStats.completed_count) || 0;

  // 3. Dynamic Trust Score Algorithm (0 - 100)
  let baseScore = user.is_verified ? 75 : 55;

  // Rating impact (+/- up to 15 points)
  if (totalReviews > 0) {
    baseScore += Math.round((parseFloat(avgRating) - 3.0) * 7.5);
  }

  // Completed trades impact (+1 point per trade, max +15)
  baseScore += Math.min(15, completedTrades);

  // Punctuality penalty/bonus
  if (totalReviews >= 3) {
    if (punctualityRate >= 95) baseScore += 5;
    else if (punctualityRate < 80) baseScore -= 10;
  }

  // Warning deductions (-15 per warning)
  baseScore -= (user.warnings_count || 0) * 15;

  const trustScore = Math.max(10, Math.min(100, baseScore));
  const isProMerchant = completedTrades >= 15 && trustScore >= 90 && parseFloat(avgRating) >= 4.8;

  await db('users').where({ id: userId }).update({
    total_reviews: totalReviews,
    rating: avgRating,
    punctuality_rate: punctualityRate,
    completed_trades: completedTrades,
    trust_score: trustScore,
    is_pro_merchant: isProMerchant
  });

  return { trustScore, avgRating, totalReviews, completedTrades, punctualityRate, isProMerchant };
}

module.exports = {
  recalculateUserStats
};
