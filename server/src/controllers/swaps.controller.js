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
    .join('listings as target', 'swap_offers.listing_id', 'target.id')
    .leftJoin('listings as offered', 'swap_offers.offered_listing_id', 'offered.id')
    .join('users as offerer', 'swap_offers.proposer_id', 'offerer.id')
    .join('users as seller', 'target.seller_id', 'seller.id')
    .where((builder) => {
      builder
        .where('swap_offers.proposer_id', req.user.id)
        .orWhere('target.seller_id', req.user.id);
    })
    .select(
      'swap_offers.*',
      'swap_offers.listing_id as target_listing_id',
      'target.seller_id as target_seller_id',
      'swap_offers.proposer_id as offerer_id',
      'target.title as target_listing_title',
      'seller.name as target_seller_name',
      'offerer.name as offerer_name',
      'offerer.avatar_url as offerer_avatar',
      'offerer.campus as offerer_campus',
      'offered.title as offered_listing_title',
      'swap_offers.cash_adjustment as cash_top_up'
    )
    .orderBy('swap_offers.created_at', 'desc');

  // Fetch listing media in a single batch query
  const targetIds = swaps.map((s) => s.target_listing_id).filter(Boolean);
  const offeredIds = swaps.map((s) => s.offered_listing_id).filter(Boolean);
  const allIds = [...new Set([...targetIds, ...offeredIds])];

  const mediaRows = allIds.length > 0
    ? await db('listing_media').whereIn('listing_id', allIds).orderBy('display_order', 'asc')
    : [];

  const formatted = swaps.map((s) => {
    const targetImg = mediaRows.find((i) => i.listing_id === s.target_listing_id)?.media_url || '';
    const offeredImg = mediaRows.find((i) => i.listing_id === s.offered_listing_id)?.media_url || s.offered_item_image || '';
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
    offeredItemTitle = 'Offered Student Item',
    offeredDescription,
    offeredImage,
    cashTopUp = 0
  } = req.body;

  const targetListing = await db('listings').where({ id: targetListingId }).first();
  if (!targetListing) {
    return next(new AppError('Target listing not found.', 404));
  }

  if (targetListing.seller_id === req.user.id) {
    return next(new AppError('You cannot propose a swap on your own listing.', 400));
  }

  // Check if student already has an active pending swap proposal for this item
  const existingPending = await db('swap_offers')
    .where({ listing_id: targetListingId, proposer_id: req.user.id, status: 'pending' })
    .first();

  if (existingPending) {
    return next(new AppError('You already have a pending swap proposal for this listing. Please wait for the seller to respond.', 409));
  }

  let finalOfferedTitle = offeredItemTitle;
  let finalOfferedImage = offeredImage || null;

  if (offeredListingId) {
    const offListing = await db('listings').where({ id: offeredListingId }).first();
    if (offListing) {
      finalOfferedTitle = offListing.title;
      const offImg = await db('listing_media').where({ listing_id: offeredListingId }).first();
      if (offImg) finalOfferedImage = offImg.media_url;
    }
  }

  const swapId = uuidv4();
  const newSwap = {
    id: swapId,
    listing_id: targetListingId,
    proposer_id: req.user.id,
    offered_item_title: finalOfferedTitle || 'Barter Item',
    offered_item_description: (offeredDescription || '').trim(),
    offered_item_image: finalOfferedImage,
    offered_listing_id: offeredListingId || null,
    cash_adjustment: parseFloat(cashTopUp || 0),
    adjustment_type: parseFloat(cashTopUp || 0) > 0 ? 'proposer_adds_cash' : 'none',
    status: 'pending',
    status_note: null
  };

  await db('swap_offers').insert(newSwap);

  res.status(201).json({
    status: 'success',
    message: 'Swap proposal sent to seller!',
    data: {
      swap: serializeSwap({
        ...newSwap,
        target_listing_id: targetListingId,
        target_seller_id: targetListing.seller_id,
        target_listing_title: targetListing.title,
        target_seller_name: 'Student Seller',
        offerer_id: req.user.id,
        offerer_name: req.user.name,
        offerer_avatar: req.user.avatar_url,
        offerer_campus: req.user.campus
      })
    }
  });
});

/**
 * Respond to a swap offer (accept or decline)
 */
const respondToSwap = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const swap = await db('swap_offers')
    .join('listings as target', 'swap_offers.listing_id', 'target.id')
    .where('swap_offers.id', id)
    .select('swap_offers.*', 'target.seller_id as target_seller_id')
    .first();

  if (!swap) {
    return next(new AppError('Swap offer not found.', 404));
  }

  if (swap.target_seller_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to respond to this swap proposal.', 403));
  }

  const mappedStatus = status === 'declined' ? 'rejected' : status;
  await db('swap_offers').where({ id }).update({ status: mappedStatus });

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
