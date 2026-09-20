/**
 * Listing Serializer with Multi-Media (Images & Product Sample Videos)
 */
function serializeListing(row, mediaItems = []) {
  if (!row) return null;

  // Format mediaItems into normalized array
  let resolvedMedia = [];
  if (Array.isArray(mediaItems) && mediaItems.length > 0) {
    resolvedMedia = mediaItems.map((m, idx) => {
      if (typeof m === 'string') {
        const isVid = m.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || m.includes('/video/upload/');
        return {
          id: `med-${idx}`,
          url: m,
          mediaType: isVid ? 'video' : 'image',
          isPrimary: idx === 0
        };
      }
      return {
        id: m.id || `med-${idx}`,
        url: m.media_url || m.url || m.image_url,
        mediaType: m.media_type || m.mediaType || (m.media_url?.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? 'video' : 'image'),
        thumbnailUrl: m.thumbnail_url || m.thumbnailUrl || null,
        isPrimary: Boolean(m.is_primary ?? m.isPrimary ?? (idx === 0))
      };
    });
  } else if (row.images) {
    const rawImgs = typeof row.images === 'string' ? row.images.split(',') : row.images;
    resolvedMedia = rawImgs.map((url, idx) => ({
      id: `med-${idx}`,
      url: url.trim(),
      mediaType: url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? 'video' : 'image',
      isPrimary: idx === 0
    }));
  }

  // Image URLs list for backwards compatibility
  const resolvedImages = resolvedMedia.map((m) => m.url);
  const hasVideo = resolvedMedia.some((m) => m.mediaType === 'video');

  const isSoldExplicit = row.is_sold !== undefined ? Boolean(row.is_sold) : (row.status === 'sold' || row.status === 'swapped' || row.status === 'donated');
  const isOutOfStock = row.quantity !== undefined && row.quantity !== null && Number(row.quantity) <= 0;

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
    quantity: Number(row.quantity !== undefined && row.quantity !== null ? row.quantity : 1),
    media: resolvedMedia,
    images: resolvedImages,
    hasVideo,
    sellerId: row.seller_id || row.sellerId,
    sellerName: row.seller_name || row.sellerName || '',
    sellerAvatar: row.seller_avatar || row.sellerAvatar || null,
    sellerCampus: row.seller_campus || row.sellerCampus || row.campus || '',
    sellerCollege: row.seller_college || row.sellerCollege || row.department || '',
    sellerIsVerified: true,
    sellerTrustScore: 0,
    rating: parseFloat(row.rating ?? 0.0),
    totalReviews: Number(row.total_reviews ?? row.totalReviews ?? 0),
    isSold: isSoldExplicit || isOutOfStock,
    status: row.status || (isSoldExplicit ? 'sold' : 'active'),
    preferredMeetupSpots: (() => {
      try {
        if (!row.preferred_meetup_spots) return [];
        return typeof row.preferred_meetup_spots === 'string'
          ? JSON.parse(row.preferred_meetup_spots)
          : (Array.isArray(row.preferred_meetup_spots) ? row.preferred_meetup_spots : []);
      } catch {
        return [];
      }
    })(),
    views: Number(row.views_count ?? row.views ?? 0),
    acceptedPaymentMethods: ['cash'],
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

module.exports = {
  serializeListing
};
