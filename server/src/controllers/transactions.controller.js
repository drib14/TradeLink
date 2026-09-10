const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateUserStats } = require('../services/trustScore.service');
const { serializeTransaction } = require('../serializers');

/**
 * Generates a human-friendly unique reference code e.g. TL-2026-B8A2
 */
function generateReferenceNo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TL-2026-${rand}`;
}

/**
 * Get all transactions for current user (as buyer or seller)
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { status = 'all' } = req.query;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let query = db('transactions')
    .join('listings', 'transactions.listing_id', 'listings.id')
    .join('users as seller', 'transactions.seller_id', 'seller.id')
    .join('users as buyer', 'transactions.buyer_id', 'buyer.id');

  if (!isAdmin) {
    query = query.where((builder) => {
      builder.where('transactions.seller_id', userId).orWhere('transactions.buyer_id', userId);
    });
  }

  if (status && status !== 'all') {
    query = query.where('transactions.status', status);
  }

  const transactions = await query
    .select(
      'transactions.*',
      'listings.title as listing_title',
      'seller.name as seller_name',
      'seller.avatar_url as seller_avatar',
      'buyer.name as buyer_name',
      'buyer.avatar_url as buyer_avatar'
    )
    .orderBy('transactions.created_at', 'desc');

  // Fetch listing media
  const listingIds = [...new Set(transactions.map((t) => t.listing_id).filter(Boolean))];
  const mediaRows = listingIds.length > 0
    ? await db('listing_media').whereIn('listing_id', listingIds).orderBy('display_order', 'asc')
    : [];

  const formatted = transactions.map((t) => {
    const primaryImg = mediaRows.find((m) => m.listing_id === t.listing_id)?.media_url || '';
    return serializeTransaction(t, primaryImg);
  });

  res.status(200).json({
    status: 'success',
    data: {
      transactions: formatted,
      meetups: formatted // Compatibility alias for admin/mobile
    }
  });
});

/**
 * Get single transaction by ID
 */
const getTransactionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const t = await db('transactions')
    .join('listings', 'transactions.listing_id', 'listings.id')
    .join('users as seller', 'transactions.seller_id', 'seller.id')
    .join('users as buyer', 'transactions.buyer_id', 'buyer.id')
    .where('transactions.id', id)
    .select(
      'transactions.*',
      'listings.title as listing_title',
      'seller.name as seller_name',
      'seller.avatar_url as seller_avatar',
      'buyer.name as buyer_name',
      'buyer.avatar_url as buyer_avatar'
    )
    .first();

  if (!t) {
    return next(new AppError('Transaction not found.', 404));
  }

  if (req.user.id !== t.seller_id && req.user.id !== t.buyer_id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to view this transaction.', 403));
  }

  const media = await db('listing_media').where({ listing_id: t.listing_id }).orderBy('display_order', 'asc').first();
  const primaryImg = media?.media_url || '';

  res.status(200).json({
    status: 'success',
    data: {
      transaction: serializeTransaction(t, primaryImg)
    }
  });
});

/**
 * Create a direct student transaction (from Buy Now or accepted Barter)
 */
const createTransaction = asyncHandler(async (req, res, next) => {
  const {
    listingId,
    sellerId,
    buyerId,
    tradeMode = 'buy_sell',
    amount = 0,
    finalPrice,
    paymentMethod = 'cash',
    swapOfferId,
    notes
  } = req.body;

  const targetListingId = listingId;
  const targetSellerId = sellerId;
  const targetBuyerId = buyerId || req.user.id;
  const targetAmount = parseFloat(amount ?? finalPrice ?? 0);

  const listing = await db('listings').where({ id: targetListingId }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  if (targetBuyerId === targetSellerId) {
    return next(new AppError('You cannot create a transaction with yourself.', 400));
  }

  // Prevent duplicate active transaction on the same listing for this buyer
  const existingPending = await db('transactions')
    .where({ listing_id: targetListingId, buyer_id: targetBuyerId, status: 'pending' })
    .first();

  if (existingPending) {
    const media = await db('listing_media').where({ listing_id: targetListingId }).first();
    return res.status(200).json({
      status: 'success',
      message: 'Transaction already active.',
      data: {
        transaction: serializeTransaction(existingPending, media?.media_url || '')
      }
    });
  }

  const txId = uuidv4();
  const referenceNo = generateReferenceNo();

  const newTx = {
    id: txId,
    reference_no: referenceNo,
    listing_id: targetListingId,
    seller_id: targetSellerId,
    buyer_id: targetBuyerId,
    swap_offer_id: swapOfferId || null,
    trade_mode: tradeMode || listing.trade_mode || 'buy_sell',
    amount: targetAmount,
    payment_method: paymentMethod || 'cash',
    payment_status: paymentMethod === 'free' ? 'paid' : 'unpaid',
    status: 'pending',
    notes: notes ? notes.trim() : null
  };

  await db.transaction(async (trx) => {
    await trx('transactions').insert(newTx);
    // Mark listing as reserved
    await trx('listings').where({ id: targetListingId }).update({ status: 'reserved' });
  });

  const media = await db('listing_media').where({ listing_id: targetListingId }).first();
  const serialized = serializeTransaction(newTx, media?.media_url || '');

  res.status(201).json({
    status: 'success',
    message: `Transaction ${referenceNo} created successfully. Coordinate meeting details with the student directly in chat!`,
    data: {
      transaction: serialized,
      meetup: serialized // Compatibility alias
    }
  });
});

/**
 * Mark transaction as completed (by buyer, seller, or admin)
 */
const completeTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const tx = await db('transactions').where({ id }).first();
  if (!tx) {
    return next(new AppError('Transaction not found.', 404));
  }

  if (req.user.id !== tx.seller_id && req.user.id !== tx.buyer_id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to complete this transaction.', 403));
  }

  if (tx.status === 'completed') {
    return next(new AppError('Transaction is already completed.', 400));
  }

  await db.transaction(async (trx) => {
    await trx('transactions').where({ id }).update({
      status: 'completed',
      payment_status: 'paid',
      completed_at: new Date()
    });

    // Mark listing as sold
    await trx('listings').where({ id: tx.listing_id }).update({ status: 'sold' });
  });

  // Recalculate trust scores for both student participants
  await recalculateUserStats(tx.seller_id);
  await recalculateUserStats(tx.buyer_id);

  res.status(200).json({
    status: 'success',
    message: 'Transaction marked as completed! Thank you for trading safely on TradeLink.',
    data: {
      status: 'completed'
    }
  });
});

/**
 * Cancel a transaction
 */
const cancelTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Cancelled by user' } = req.body;

  const tx = await db('transactions').where({ id }).first();
  if (!tx) {
    return next(new AppError('Transaction not found.', 404));
  }

  if (req.user.id !== tx.seller_id && req.user.id !== tx.buyer_id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to cancel this transaction.', 403));
  }

  await db.transaction(async (trx) => {
    await trx('transactions').where({ id }).update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: reason.trim()
    });

    // Restore listing to active if it was reserved
    const listing = await trx('listings').where({ id: tx.listing_id }).first();
    if (listing && listing.status === 'reserved') {
      await trx('listings').where({ id: tx.listing_id }).update({ status: 'active' });
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'Transaction cancelled.',
    data: {
      status: 'cancelled'
    }
  });
});

/**
 * Update transaction status (for admin mediation or general status changes)
 */
const updateTransactionStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (status === 'completed') {
    return completeTransaction(req, res, next);
  }
  if (status === 'cancelled') {
    req.body.reason = reason;
    return cancelTransaction(req, res, next);
  }

  const tx = await db('transactions').where({ id }).first();
  if (!tx) {
    return next(new AppError('Transaction not found.', 404));
  }

  if (req.user.id !== tx.seller_id && req.user.id !== tx.buyer_id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized.', 403));
  }

  await db('transactions').where({ id }).update({ status });

  res.status(200).json({
    status: 'success',
    message: `Transaction status updated to ${status}.`
  });
});

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  completeTransaction,
  cancelTransaction,
  updateTransactionStatus
};
