/**
 * Swap, Meetup & Review Serializers
 */

function serializeSwap(s, targetImage = '', offeredImage = '') {
  if (!s) return null;
  return {
    id: s.id,
    targetListingId: s.target_listing_id || s.targetListingId,
    targetListingTitle: s.target_listing_title || s.targetListingTitle || '',
    targetListingImage: targetImage || s.targetListingImage || '',
    targetSellerId: s.target_seller_id || s.targetSellerId,
    targetSellerName: s.target_seller_name || s.targetSellerName || '',
    offererId: s.offerer_id || s.offererId,
    offererName: s.offerer_name || s.offererName || '',
    offererAvatar: s.offerer_avatar || s.offererAvatar || null,
    offererCampus: s.offerer_campus || s.offererCampus || '',
    offeredListingId: s.offered_listing_id || s.offeredListingId || null,
    offeredListingTitle: s.offered_listing_title || s.offeredListingTitle || null,
    offeredListingImage: offeredImage || s.offeredListingImage || '',
    offeredDescription: s.offered_description || s.offeredDescription || '',
    cashTopUp: parseFloat(s.cash_top_up ?? s.cashTopUp ?? 0),
    status: s.status || 'pending',
    proposedMeetupSpot: s.proposed_meetup_spot || s.proposedMeetupSpot || '',
    proposedDateTime: s.proposed_datetime || s.proposedDateTime || '',
    createdAt: s.created_at || s.createdAt || new Date().toISOString()
  };
}

function serializeMeetup(m, listingImage = '') {
  if (!m) return null;
  return {
    id: m.id,
    listingId: m.listing_id || m.listingId,
    listingTitle: m.listing_title || m.listingTitle || '',
    listingImage: listingImage || m.listingImage || '',
    sellerId: m.seller_id || m.sellerId,
    sellerName: m.seller_name || m.sellerName || '',
    buyerId: m.buyer_id || m.buyerId,
    buyerName: m.buyer_name || m.buyerName || '',
    tradeMode: m.trade_mode || m.tradeMode || 'buy_sell',
    finalPrice: parseFloat(m.final_price ?? m.finalPrice ?? 0),
    swapSummary: m.swap_summary || m.swapSummary || null,
    campus: m.campus,
    landmarkSpot: m.landmark_spot || m.landmarkSpot,
    scheduledDateTime: m.scheduled_datetime || m.scheduledDateTime,
    status: m.status || 'scheduled',
    notes: m.notes || null,
    createdAt: m.created_at || m.createdAt || new Date().toISOString()
  };
}

function serializeReview(r, traitBadges = []) {
  if (!r) return null;
  return {
    id: r.id,
    transactionId: r.transaction_id || r.transactionId,
    reviewerId: r.reviewer_id || r.reviewerId,
    reviewerName: r.reviewer_name || r.reviewerName || '',
    reviewerAvatar: r.reviewer_avatar || r.reviewerAvatar || null,
    reviewerCampus: r.reviewer_campus || r.reviewerCampus || '',
    targetUserId: r.target_user_id || r.targetUserId,
    rating: Number(r.rating || 5),
    comment: r.comment || '',
    itemTitle: r.item_title || r.itemTitle || '',
    tradeType: r.trade_type || r.tradeType || 'buy_sell',
    wasPunctual: Boolean(r.was_punctual ?? r.wasPunctual ?? true),
    traitBadges,
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

module.exports = {
  serializeSwap,
  serializeMeetup,
  serializeReview
};
