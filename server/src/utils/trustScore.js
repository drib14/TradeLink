/**
 * TradeLink Trust Score & Reputation Scoring Engine
 */

function calculateTrustScore({
  is_verified = false,
  isVerified = false,
  total_reviews = 0,
  totalReviews = 0,
  rating = 5.0,
  avgRating = 5.0,
  completed_trades = 0,
  completedTrades = 0,
  punctuality_rate = 100,
  punctualityRate = 100,
  warnings_count = 0,
  warningsCount = 0
}) {
  const verified = Boolean(is_verified || isVerified);
  const reviews = total_reviews || totalReviews || 0;
  const currentRating = parseFloat(rating || avgRating || 5.0);
  const trades = completed_trades || completedTrades || 0;
  const punctuality = punctuality_rate || punctualityRate || 100;
  const warnings = warnings_count || warningsCount || 0;

  let baseScore = verified ? 75 : 55;

  // Rating impact (+/- up to 15 points)
  if (reviews > 0) {
    baseScore += Math.round((currentRating - 3.0) * 7.5);
  }

  // Completed trades impact (+1 point per trade, max +15)
  baseScore += Math.min(15, trades);

  // Punctuality penalty/bonus
  if (reviews >= 3) {
    if (punctuality >= 95) baseScore += 5;
    else if (punctuality < 80) baseScore -= 10;
  }

  // Warning deductions (-15 per warning)
  baseScore -= warnings * 15;

  return Math.max(10, Math.min(100, baseScore));
}

function isEligibleForProMerchant(user) {
  const score = calculateTrustScore(user);
  const trades = user.completed_trades || user.completedTrades || 0;
  const rating = parseFloat(user.rating || user.avgRating || 0);

  return trades >= 10 && score >= 85 && rating >= 4.7;
}

module.exports = {
  calculateTrustScore,
  isEligibleForProMerchant
};
