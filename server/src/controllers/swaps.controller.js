const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeSwap, serializeTransaction } = require('../serializers');

/**
 * Generates reference code for auto-created swap transactions
 */
function generateReferenceNo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TL-SWAP-${rand}`;
}

/**
 * Post swap proposal or status update into chat thread
 */
async function syncSwapToChat({
  listingId,
  proposerId,
  sellerId,
  swapOfferId,
  content,
  isSystem = false,
  io = null
}) {
  try {
    const userA = proposerId < sellerId ? proposerId : sellerId;
    const userB = proposerId < sellerId ? sellerId : proposerId;

    let conv = await db('conversations')
      .where({ user_one_id: userA, user_two_id: userB, listing_id: listingId })
      .first();

    if (!conv) {
      const convId = uuidv4();
      conv = {
        id: convId,
        listing_id: listingId,
        user_one_id: userA,
        user_two_id: userB,
        last_message: content,
        last_message_at: new Date()
      };
      await db('conversations').insert(conv);
    } else {
      await db('conversations').where({ id: conv.id }).update({
        last_message: content,
        last_message_at: new Date()
      });
    }

    const msgId = uuidv4();
    const newMsg = {
      id: msgId,
      conversation_id: conv.id,
      sender_id: proposerId,
      receiver_id: sellerId,
      content,
      is_read: false,
      is_system_message: Boolean(isSystem),
      swap_offer_id: swapOfferId,
      created_at: new Date()
    };
    await db('messages').insert(newMsg);

    if (io) {
      const swap = await db('swap_offers').where({ id: swapOfferId }).first();
      io.to(`conv:${conv.id}`).emit('chat:message', {
        id: msgId,
        conversationId: conv.id,
        senderId: newMsg.sender_id,
        receiverId: newMsg.receiver_id,
        content,
        isRead: false,
        isSystemMessage: newMsg.is_system_message,
        swapOfferId,
        swapOffer: swap ? {
          id: swap.id,
          targetListingId: swap.listing_id,
          proposerId: swap.proposer_id,
          offeredItemTitle: swap.offered_item_title,
          offeredItemDescription: swap.offered_item_description,
          offeredItemImage: swap.offered_item_image,
          cashAdjustment: parseFloat(swap.cash_adjustment || 0),
          status: swap.status
        } : null,
        timestamp: newMsg.created_at.toISOString()
      });

      io.to(`conv:${conv.id}`).emit('chat:deal_updated', {
        swapOfferId,
        status: swap ? swap.status : 'updated'
      });
    }
  } catch (err) {
    console.error('Failed to sync swap to chat:', err);
  }
}

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

  // Sync to chat conversation thread
  const io = req.app.get('io');
  const chatContent = `[Barter Proposal] Offered "${finalOfferedTitle}" ${newSwap.cash_adjustment > 0 ? `with +₱${newSwap.cash_adjustment} cash adjustment` : ''} in exchange for "${targetListing.title}". Review and accept or decline below!`;

  await syncSwapToChat({
    listingId: targetListingId,
    proposerId: req.user.id,
    sellerId: targetListing.seller_id,
    swapOfferId: swapId,
    content: chatContent,
    isSystem: false,
    io
  });

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
    .select('swap_offers.*', 'target.seller_id as target_seller_id', 'target.title as target_title')
    .first();

  if (!swap) {
    return next(new AppError('Swap offer not found.', 404));
  }

  if (swap.target_seller_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to respond to this swap proposal.', 403));
  }

  const mappedStatus = status === 'declined' ? 'rejected' : status;
  const io = req.app.get('io');

  if (mappedStatus === 'accepted') {
    await db.transaction(async (trx) => {
      // 1. Update swap status
      await trx('swap_offers').where({ id }).update({ status: 'accepted' });

      // 2. Mark listing as reserved
      await trx('listings').where({ id: swap.listing_id }).update({ status: 'reserved' });

      // 3. Auto-generate transaction for this barter deal
      const txId = uuidv4();
      const refNo = generateReferenceNo();
      await trx('transactions').insert({
        id: txId,
        reference_no: refNo,
        listing_id: swap.listing_id,
        seller_id: swap.target_seller_id,
        buyer_id: swap.proposer_id,
        swap_offer_id: swap.id,
        trade_mode: 'swap',
        amount: parseFloat(swap.cash_adjustment || 0),
        payment_method: 'barter',
        payment_status: 'paid',
        status: 'pending',
        notes: `Barter trade: ${swap.offered_item_title} for ${swap.target_title}`
      });
    });

    await syncSwapToChat({
      listingId: swap.listing_id,
      proposerId: swap.target_seller_id, // sender of message is seller
      sellerId: swap.proposer_id,
      swapOfferId: swap.id,
      content: `[Swap Accepted] Swap Offer ACCEPTED! Order deal created. Let's arrange a convenient campus meetup spot to swap items!`,
      isSystem: true,
      io
    });
  } else {
    await db('swap_offers').where({ id }).update({ status: mappedStatus });

    await syncSwapToChat({
      listingId: swap.listing_id,
      proposerId: swap.target_seller_id,
      sellerId: swap.proposer_id,
      swapOfferId: swap.id,
      content: `[Swap Declined] Swap proposal was declined. You may inquire again or propose an alternative item.`,
      isSystem: true,
      io
    });
  }

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
