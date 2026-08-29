/**
 * Listing Serializer
 */
function serializeListing(row, images = [], tags = []) {
  if (!row) return null;

  const resolvedImages = images.length > 0
    ? images
    : (row.images
        ? (typeof row.images === 'string' ? row.images.split(',') : row.images)
        : []);

  const resolvedTags = tags.length > 0
    ? tags
    : (row.tags
        ? (typeof row.tags === 'string' ? row.tags.split(',') : row.tags)
        : []);

  let preferredSpots = [];
  if (row.preferred_meetup_spots) {
    preferredSpots = typeof row.preferred_meetup_spots === 'string'
      ? JSON.parse(row.preferred_meetup_spots)
      : row.preferred_meetup_spots;
  } else if (row.preferredMeetupSpots) {
    preferredSpots = row.preferredMeetupSpots;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: parseFloat(row.price || 0),
    originalSrp: parseFloat(row.original_srp ?? row.originalSrp ?? 0),
    tradeMode: row.trade_mode || row.tradeMode || 'buy_sell',
    swapPreference: row.swap_preference || row.swapPreference || null,
    category: row.category,
    condition: row.condition,
    tags: resolvedTags,
    images: resolvedImages,
    sellerId: row.seller_id || row.sellerId,
    sellerName: row.seller_name || row.sellerName || '',
    sellerAvatar: row.seller_avatar || row.sellerAvatar || null,
    sellerCampus: row.seller_campus || row.sellerCampus || '',
    sellerCollege: row.seller_college || row.sellerCollege || '',
    sellerIsVerified: Boolean(row.seller_is_verified ?? row.sellerIsVerified ?? false),
    sellerTrustScore: row.seller_trust_score ?? row.sellerTrustScore ?? 60,
    preferredMeetupSpots: preferredSpots,
    customMeetupSpot: row.custom_meetup_spot || row.customMeetupSpot || null,
    isBoosted: Boolean(row.is_boosted ?? row.isBoosted),
    isSold: Boolean(row.is_sold ?? row.isSold),
    courseCode: row.course_code || row.courseCode || null,
    views: Number(row.views || 0),
    favoritesCount: Number(row.favorites_count ?? row.favoritesCount ?? 0),
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

module.exports = {
  serializeListing
};
