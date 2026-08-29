const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeSwap } = require('../serializers');

/**
 * Get all swap offers involving current user (as offerer or target seller)
 */
const getSwaps = asyncHandler(async (req, res) => {
  const swaps = await db('swap_offers')
    .where('offerer_id', req.user.id)
    .orWhere('target_seller_id', req.user.id)
    .join('listings as target', 'swap_offers.target_listing_id', 'target.id')
    .leftJoin('listings as offered', 'swap_offers.offered_listing_id', 'offered.id')
    .join('users as offerer', 'swap_offers.offerer_id', 'offerer.id')
    .join('users as seller', 'swap_offers.target_seller_id', 'seller.id')
    .select(
      'swap_offers.*',
      'target.title as target_listing_title',
      'seller.name as target_seller_name',
      'offerer.name as offerer_name',
      'offerer.avatar_url as offerer_avatar',
      'offerer.campus as offerer_campus',
      'offered.title as offered_listing_title'
    )
    .orderBy('swap_offers.created_at', 'desc');

  // Fetch listing images in a single batch query
  const targetIds = swaps.map((s) => s.target_listing_id);
  const offeredIds = swaps.map((s) => s.offered_listing_id).filter(Boolean);
  const allIds = [...new Set([...targetIds, ...offeredIds])];

  const images = allIds.length > 0
    ? await db('listing_images').whereIn('listing_id', allIds).where('sort_order', 0)
    : [];

  const formatted = swaps.map((s) => {
    const targetImg = images.find((i) => i.listing_id === s.target_listing_id)?.image_url || '';
    const offeredImg = images.find((i) => i.listing_id === s.offered_listing_id)?.image_url || '';
    return serializeSwap(s, targetImg, offeredImg);
  });

  res.status(200).json({
    status: 'success',
    data: {
      swaps: formatted
    }
  });
});

/**
 * Propose a swap offer
 */
const proposeSwap = asyncHandler(async (req, res, next) => {
  const {
    targetListingId,
    offeredListingId,
    offeredDescription,
    cashTopUp = 0,
    proposedMeetupSpot,
    proposedDateTime
  } = req.body;

  const targetListing = await db('listings').where({ id: targetListingId }).first();
  if (!targetListing) {
    return next(new AppError('Target listing not found.', 404));
  }

  if (targetListing.seller_id === req.user.id) {
    return next(new AppError('You cannot propose a swap on your own listing.', 400));
  }

  const swapId = `swap_${uuidv4()}`;
  const newSwap = {
    id: swapId,
    target_listing_id: targetListingId,
    target_seller_id: targetListing.seller_id,
    offerer_id: req.user.id,
    offered_listing_id: offeredListingId || null,
    offered_description: offeredDescription.trim(),
    cash_top_up: cashTopUp,
    status: 'pending',
    proposed_meetup_spot: proposedMeetupSpot.trim(),
    proposed_datetime: proposedDateTime.trim()
  };

  await db('swap_offers').insert(newSwap);

  // Send system notification to seller
  await db('notifications').insert({
    id: `notif_${uuidv4()}`,
    user_id: targetListing.seller_id,
    title: 'New Swap Proposal',
    message: `${req.user.name} sent a swap proposal for your "${targetListing.title}".`,
    type: 'swap',
    link_view: 'swaps',
    link_params: JSON.stringify({ swapId })
  });

  res.status(201).json({
    status: 'success',
    message: 'Swap proposal sent to seller!',
    data: {
      swap: serializeSwap(newSwap)
    }
  });
});

/**
 * Respond to a swap offer (accept or decline)
 */
const respondToSwap = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const swap = await db('swap_offers').where({ id }).first();
  if (!swap) {
    return next(new AppError('Swap offer not found.', 404));
  }

  if (swap.target_seller_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to respond to this swap proposal.', 403));
  }

  await db('swap_offers').where({ id }).update({ status });

  // Send notification to offerer
  await db('notifications').insert({
    id: `notif_${uuidv4()}`,
    user_id: swap.offerer_id,
    title: status === 'accepted' ? 'Swap Proposal Accepted!' : 'Swap Offer Declined',
    message: status === 'accepted'
      ? `${req.user.name} accepted your swap proposal! Coordinate your campus meetup now.`
      : `${req.user.name} declined your swap proposal.`,
    type: 'swap',
    link_view: 'swaps',
    link_params: JSON.stringify({ swapId: id })
  });

  res.status(200).json({
    status: 'success',
    message: `Swap offer ${status}.`
  });
});

module.exports = {
  getSwaps,
  proposeSwap,
  respondToSwap
};
