/**
 * Swap, Transaction & Review Serializers
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
    selectedVariation: s.selected_variation || s.selectedVariation || null,
    status: (s.status === 'rejected' ? 'declined' : s.status) || 'pending',
    statusNote: s.status_note || s.statusNote || null,
    createdAt: s.created_at || s.createdAt || new Date().toISOString()
  };
}

function serializeTransaction(t, listingImage = '') {
  if (!t) return null;
  return {
    id: t.id,
    referenceNo: t.reference_no || t.referenceNo || `TL-2026-${(t.id || '').substring(0, 4).toUpperCase()}`,
    listingId: t.listing_id || t.listingId,
    listingTitle: t.listing_title || t.listingTitle || '',
    listingImage: listingImage || t.listingImage || '',
    sellerId: t.seller_id || t.sellerId,
    sellerName: t.seller_name || t.sellerName || '',
    sellerAvatar: t.seller_avatar || t.sellerAvatar || null,
    buyerId: t.buyer_id || t.buyerId,
    buyerName: t.buyer_name || t.buyerName || '',
    buyerAvatar: t.buyer_avatar || t.buyerAvatar || null,
    tradeMode: t.trade_mode || t.tradeMode || 'buy_sell',
    amount: parseFloat(t.amount ?? t.final_price ?? t.finalPrice ?? 0),
    finalPrice: parseFloat(t.amount ?? t.final_price ?? t.finalPrice ?? 0),
    selectedVariation: t.selected_variation || t.selectedVariation || null,
    paymentMethod: t.payment_method || t.paymentMethod || 'cash',
    paymentStatus: t.payment_status || t.paymentStatus || 'unpaid',
    swapOfferId: t.swap_offer_id || t.swapOfferId || null,
    status: t.status || 'pending',
    notes: t.notes || null,
    buyerConfirmedAt: t.buyer_confirmed_at || t.buyerConfirmedAt || null,\n    sellerConfirmedAt: t.seller_confirmed_at || t.sellerConfirmedAt || null,\n    handshakeCompletedAt: t.handshake_completed_at || t.handshakeCompletedAt || null,\n    completedAt: t.completed_at || t.completedAt || null,
    cancelledAt: t.cancelled_at || t.cancelledAt || null,
    cancellationReason: t.cancellation_reason || t.cancellationReason || null,
    createdAt: t.created_at || t.createdAt || new Date().toISOString()
  };
}

function serializeReview(r, traitBadges = []) {
  if (!r) return null;
  return {
    id: r.id,
    listingId: r.listing_id || r.listingId,
    transactionId: r.transaction_id || r.transactionId,
    reviewerId: r.reviewer_id || r.reviewerId,
    reviewerName: r.reviewer_name || r.reviewerName || '',
    reviewerAvatar: r.reviewer_avatar || r.reviewerAvatar || null,
    reviewerCampus: r.reviewer_campus || r.reviewerCampus || '',
    reviewerDepartment: r.reviewer_department || r.reviewerDepartment || r.reviewer_college || r.reviewerCollege || '',
    targetUserId: r.target_user_id || r.targetUserId,
    rating: Number(r.rating || 5),
    comment: r.comment || '',
    wasPunctual: Boolean(r.was_punctual ?? r.wasPunctual ?? true),
    traitBadges,
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

module.exports = {
  serializeSwap,
  serializeTransaction,
  serializeReview
};
