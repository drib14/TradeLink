const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeTransaction } = require('../serializers');
const emailService = require('../services/email.service');

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
 * Post a transaction update or card into the conversation thread
 */
async function syncTransactionToChat({
  listingId,
  buyerId,
  sellerId,
  transactionId,
  referenceNo,
  content,
  isSystem = false,
  io = null
}) {
  try {
    const userA = buyerId < sellerId ? buyerId : sellerId;
    const userB = buyerId < sellerId ? sellerId : buyerId;

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
      sender_id: buyerId,
      receiver_id: sellerId,
      content,
      is_read: false,
      is_system_message: Boolean(isSystem),
      transaction_id: transactionId,
      created_at: new Date()
    };
    await db('messages').insert(newMsg);

    if (io) {
      const tx = await db('transactions').where({ id: transactionId }).first();
      io.to(`conv:${conv.id}`).emit('chat:message', {
        id: msgId,
        conversationId: conv.id,
        senderId: newMsg.sender_id,
        receiverId: newMsg.receiver_id,
        content,
        isRead: false,
        isSystemMessage: newMsg.is_system_message,
        transactionId,
        transaction: tx ? {
          id: tx.id,
          referenceNo: tx.reference_no,
          amount: parseFloat(tx.amount || 0),
          paymentMethod: tx.payment_method,
          status: tx.status
        } : null,
        timestamp: newMsg.created_at.toISOString()
      });

      io.to(`conv:${conv.id}`).emit('chat:deal_updated', {
        transactionId,
        referenceNo,
        status: tx ? tx.status : 'updated'
      });
    }
  } catch (err) {
    console.error('Failed to sync transaction to chat:', err);
  }
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
  // SECURITY: Always use the authenticated user as buyer — never trust client-supplied buyerId
  const targetBuyerId = req.user.id;
  const targetAmount = parseFloat(amount ?? finalPrice ?? 0);

  const listing = await db('listings').where({ id: targetListingId }).first();
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // SECURITY: Validate sellerId matches the listing's actual owner
  const actualSellerId = listing.seller_id;
  if (sellerId && sellerId !== actualSellerId) {
    return next(new AppError('Seller ID does not match the listing owner.', 400));
  }

  if (targetBuyerId === actualSellerId) {
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
    seller_id: actualSellerId,
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

  // Sync to chat conversation
  const io = req.app.get('io');
  const dealMessageContent = `[Confirmed Deal] Reference ${referenceNo} for ₱${targetAmount.toLocaleString()} (${paymentMethod.toUpperCase()}). Let's coordinate meetup location and time right here!`;
  await syncTransactionToChat({
    listingId: targetListingId,
    buyerId: targetBuyerId,
    sellerId: actualSellerId,
    transactionId: txId,
    referenceNo,
    content: dealMessageContent,
    isSystem: false,
    io
  });

  // Asynchronously dispatch transaction confirmation emails (non-blocking)
  (async () => {
    try {
      const [buyerUser, sellerUser] = await Promise.all([
        db('users').where({ id: targetBuyerId }).first(),
        db('users').where({ id: actualSellerId }).first()
      ]);
      if (buyerUser && sellerUser) {
        await Promise.allSettled([
          emailService.sendOrderPlacedBuyerEmail(buyerUser, sellerUser, newTx, listing, req),
          emailService.sendNewOrderSellerEmail(sellerUser, buyerUser, newTx, listing, req)
        ]);
      }
    } catch (emailErr) {
      console.error('[TRANSACTION EMAIL] Error dispatching order confirmation emails:', emailErr.message);
    }
  })();

  const media = await db('listing_media').where({ listing_id: targetListingId }).first();
  const serialized = serializeTransaction(newTx, media?.media_url || '');

  res.status(201).json({
    status: 'success',
    message: `Transaction ${referenceNo} created successfully. Coordinate meeting details with the student directly in chat!`,
    data: {
      transaction: serialized,
      meetup: serialized
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

  // Only the seller or an administrator can mark the transaction as completed
  if (req.user.id !== tx.seller_id && req.user.role !== 'admin') {
    return next(new AppError('Only the seller can mark this transaction as completed.', 403));
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

  // Sync completion system event to chat
  const io = req.app.get('io');
  await syncTransactionToChat({
    listingId: tx.listing_id,
    buyerId: tx.buyer_id,
    sellerId: tx.seller_id,
    transactionId: tx.id,
    referenceNo: tx.reference_no,
    content: `[Deal Completed] Reference ${tx.reference_no} is officially COMPLETED! Thank you for trading safely on campus. The buyer can now submit a product review for this item.`,
    isSystem: true,
    io
  });

  // Asynchronously dispatch completion emails
  (async () => {
    try {
      const [buyerUser, sellerUser, listing] = await Promise.all([
        db('users').where({ id: tx.buyer_id }).first(),
        db('users').where({ id: tx.seller_id }).first(),
        db('listings').where({ id: tx.listing_id }).first()
      ]);
      if (buyerUser && sellerUser && listing) {
        await Promise.allSettled([
          emailService.sendOrderStatusUpdateEmail(buyerUser, sellerUser, tx, listing, 'completed', '', req),
          emailService.sendOrderStatusUpdateEmail(sellerUser, buyerUser, tx, listing, 'completed', '', req)
        ]);
      }
    } catch (emailErr) {
      console.error('[TRANSACTION EMAIL] Error dispatching completion emails:', emailErr.message);
    }
  })();

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
  const { reason = 'Cancelled by mutual agreement' } = req.body;

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

  // Sync cancellation system event to chat
  const io = req.app.get('io');
  await syncTransactionToChat({
    listingId: tx.listing_id,
    buyerId: tx.buyer_id,
    sellerId: tx.seller_id,
    transactionId: tx.id,
    referenceNo: tx.reference_no,
    content: `[Deal Cancelled] Order ${tx.reference_no} was CANCELLED (${reason.trim()}). The item has been re-listed on the campus catalog.`,
    isSystem: true,
    io
  });

  // Asynchronously dispatch cancellation emails
  (async () => {
    try {
      const [buyerUser, sellerUser, listing] = await Promise.all([
        db('users').where({ id: tx.buyer_id }).first(),
        db('users').where({ id: tx.seller_id }).first(),
        db('listings').where({ id: tx.listing_id }).first()
      ]);
      if (buyerUser && sellerUser && listing) {
        await Promise.allSettled([
          emailService.sendOrderStatusUpdateEmail(buyerUser, sellerUser, tx, listing, 'cancelled', reason.trim(), req),
          emailService.sendOrderStatusUpdateEmail(sellerUser, buyerUser, tx, listing, 'cancelled', reason.trim(), req)
        ]);
      }
    } catch (emailErr) {
      console.error('[TRANSACTION EMAIL] Error dispatching cancellation emails:', emailErr.message);
    }
  })();

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
