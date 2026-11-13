const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeTransaction } = require('../serializers');
const emailService = require('../services/email.service');
const { generate4DigitCode, hashCode, verifyCode } = require('../utils/generateCode');
const { encryptMessageContent } = require('../services/message.service');

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
        last_message: isSystem ? content : encryptMessageContent(content),
        last_message_at: new Date()
      };
      await db('conversations').insert(conv);
    } else {
      await db('conversations').where({ id: conv.id }).update({
        last_message: isSystem ? content : encryptMessageContent(content),
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
      const listing = listingId ? await db('listings').where({ id: listingId }).first() : null;
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
          listingId: tx.listing_id,
          listingTitle: listing?.title || '',
          amount: parseFloat(tx.amount || 0),
          paymentMethod: tx.payment_method,
          selectedVariation: tx.selected_variation,
          status: tx.status
        } : null,
        timestamp: newMsg.created_at.toISOString()
      });

      io.to(`conv:${conv.id}`).emit('chat:deal_updated', {
        transactionId,
        referenceNo,
        listingTitle: listing?.title || '',
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
      transactions: formatted
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
    notes,
    selectedVariation,
    variationId
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

  // Generate cryptographically secure 4-digit handshake code for buyer verification
  const handshakeCode = generate4DigitCode().slice(0, 4);
  const handshakeCodeHash = await hashCode(handshakeCode);

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
    verification_code_hash: handshakeCodeHash,
    failed_handshake_attempts: 0,
    selected_variation: selectedVariation ? String(selectedVariation).trim() : null,
    variation_id: variationId || null,
    notes: notes ? notes.trim() : null
  };

  const hasVariationCol = await db.schema.hasColumn('transactions', 'selected_variation').catch(() => false);
  const txInsertData = { ...newTx };
  if (!hasVariationCol) {
    delete txInsertData.selected_variation;
  }

  await db.transaction(async (trx) => {
    await trx('transactions').insert(txInsertData);
    // Mark listing as reserved
    await trx('listings').where({ id: targetListingId }).update({ status: 'reserved' });
  });

  // Sync to chat conversation
  const io = req.app.get('io');
  const variationText = selectedVariation ? `\n• Option: ${selectedVariation}` : '';
  const itemTitle = listing.title || 'Item';
  const dealMessageContent = `[ORDER CONFIRMED]\n• Item: "${itemTitle}"${variationText}\n• Amount: ₱${Number(targetAmount).toLocaleString()} (${paymentMethod.toUpperCase()})\n• Order Reference: #${referenceNo}\n\nLet's coordinate our campus meetup location and time right here!`;
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

  // Dispatch transaction confirmation emails (awaited for serverless resilience)
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

  const media = await db('listing_media').where({ listing_id: targetListingId }).first();
  const serialized = serializeTransaction(newTx, media?.media_url || '');

  const isBuyer = req.user.id === targetBuyerId;

  res.status(201).json({
    status: 'success',
    message: `Transaction ${referenceNo} created successfully. Coordinate meeting details with the student directly in chat!`,
    data: {
      transaction: serialized,
      handshakeCode: isBuyer ? handshakeCode : undefined
    }
  });
});

/**
 * Mark transaction as completed (by buyer, seller, or admin)
 */
/**
 * Record one participant's independent confirmation of the physical exchange.
 * The seller must validate the buyer's one-time handshake code. The buyer
 * independently confirms receipt. Completion is atomic and requires both.
 */
const confirmHandshake = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { handshakeCode } = req.body || {};
  const now = new Date();

  const result = await db.transaction(async (trx) => {
    const tx = await trx('transactions').where({ id }).forUpdate().first();
    if (!tx) throw new AppError('Transaction not found.', 404);

    const isBuyer = req.user.id === tx.buyer_id;
    const isSeller = req.user.id === tx.seller_id;
    const isAdmin = req.user.role === 'admin';
    if (!isBuyer && !isSeller && !isAdmin) {
      throw new AppError('Only the buyer and seller can confirm this handshake.', 403);
    }
    if (tx.status !== 'pending') {
      throw new AppError(`This transaction cannot be confirmed because it is ${tx.status}.`, 400);
    }

    // Admins retain the existing dispute-resolution override. This is explicitly
    // recorded separately and does not impersonate either student's confirmation.
    if (req.user.role === 'admin') {
      if (tx.status !== 'pending') {
        throw new AppError(`This transaction cannot be overridden because it is ${tx.status}.`, 400);
      }
      const completedAt = new Date();
      await trx('transactions').where({ id }).update({
        status: 'completed',
        completed_at: completedAt,
        handshake_completed_at: completedAt,
        completion_override_by: req.user.id
      });
      await trx('listings').where({ id: tx.listing_id }).update({ status: 'sold' });
      return {
        completed: true,
        adminOverride: true,
        buyerConfirmedAt: tx.buyer_confirmed_at || null,
        sellerConfirmedAt: tx.seller_confirmed_at || null,
        status: 'completed',
        transaction: tx
      };
    }

    const patch = {};
    if (isSeller && !tx.seller_confirmed_at) {
      if (tx.handshake_locked_until && new Date() < new Date(tx.handshake_locked_until)) {
        const remainingMins = Math.ceil((new Date(tx.handshake_locked_until).getTime() - Date.now()) / 60000);
        throw new AppError(`Handshake verification is locked. Try again in ${remainingMins} minute(s).`, 429);
      }
      if (tx.verification_code_hash) {
        if (!/^\\d{4}$/.test(String(handshakeCode || '').trim())) {
          throw new AppError('Enter the buyer’s 4-digit handshake code to verify the in-person exchange.', 400);
        }
        const matches = await verifyCode(String(handshakeCode).trim(), tx.verification_code_hash);
        if (!matches) {
          const attempts = Number(tx.failed_handshake_attempts || 0) + 1;
          const lockPatch = attempts >= 3
            ? { failed_handshake_attempts: attempts, handshake_locked_until: new Date(Date.now() + 15 * 60 * 1000) }
            : { failed_handshake_attempts: attempts };
          await trx('transactions').where({ id }).update(lockPatch);
          return {
            error: attempts >= 3
              ? 'Incorrect code. Verification is locked for 15 minutes after 3 failed attempts.'
              : `Incorrect code. ${3 - attempts} attempt(s) remaining.`,
            errorStatus: attempts >= 3 ? 429 : 400
          };
        }
      }
      patch.seller_confirmed_at = now;
      patch.failed_handshake_attempts = 0;
      patch.handshake_locked_until = null;
    }

    if (isBuyer && !tx.buyer_confirmed_at) {
      if (!tx.seller_confirmed_at) {
        throw new AppError('The seller must first verify your one-time code at the meetup.', 409);
      }
      patch.buyer_confirmed_at = now;
    }

    const buyerConfirmedAt = tx.buyer_confirmed_at || patch.buyer_confirmed_at || null;
    const sellerConfirmedAt = tx.seller_confirmed_at || patch.seller_confirmed_at || null;
    const completed = Boolean(buyerConfirmedAt && sellerConfirmedAt);

    if (completed) {
      patch.status = 'completed';
      patch.completed_at = now;
      patch.handshake_completed_at = now;
    }

    if (Object.keys(patch).length) {
      await trx('transactions').where({ id }).update(patch);
    }
    if (completed) {
      await trx('listings').where({ id: tx.listing_id }).update({ status: 'sold' });
    }

    return {
      completed,
      buyerConfirmedAt,
      sellerConfirmedAt,
      status: completed ? 'completed' : 'pending',
      transaction: tx
    };
  });

  if (result.error) {
    return next(new AppError(result.error, result.errorStatus));
  }

  if (result.completed) {
    const tx = result.transaction;
    const io = req.app.get('io');
    const listing = await db('listings').where({ id: tx.listing_id }).first();
    await syncTransactionToChat({
      listingId: tx.listing_id,
      buyerId: tx.buyer_id,
      sellerId: tx.seller_id,
      transactionId: tx.id,
      referenceNo: tx.reference_no,
      content: result.adminOverride
        ? `[Admin Resolution] An administrator completed order #${tx.reference_no} (${listing?.title || 'Campus item'}) after review. This is an administrative resolution, not a record of either student's personal confirmation.`
        : `[Handshake Completed] Both students confirmed the physical exchange for order #${tx.reference_no} (${listing?.title || 'Campus item'}). The transaction is now complete. Thank you for trading safely on campus!`,
      isSystem: true,
      io
    });

    try {
      const [buyerUser, sellerUser] = await Promise.all([
        db('users').where({ id: tx.buyer_id }).first(),
        db('users').where({ id: tx.seller_id }).first()
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
  } else {
    const tx = result.transaction;
    const io = req.app.get('io');
    const listing = await db('listings').where({ id: tx.listing_id }).first();
    await syncTransactionToChat({
      listingId: tx.listing_id,
      buyerId: tx.buyer_id,
      sellerId: tx.seller_id,
      transactionId: tx.id,
      referenceNo: tx.reference_no,
      content: req.user.id === tx.seller_id
        ? `[Handshake Update] Seller verification completed for order #${tx.reference_no}. Waiting for the buyer’s independent confirmation.`
        : `[Handshake Update] Buyer confirmation recorded for order #${tx.reference_no}. Waiting for seller verification.`,
      isSystem: true,
      io
    });
  }

  res.status(200).json({
    status: 'success',
    message: result.completed
      ? 'Both parties confirmed. The transaction is complete!'
      : 'Your confirmation has been recorded. The transaction will complete after the other party confirms.',
    data: {
      status: result.status,
      completed: result.completed,
      buyerConfirmedAt: result.buyerConfirmedAt,
      sellerConfirmedAt: result.sellerConfirmedAt,
      adminOverride: Boolean(result.adminOverride),
      completionOverrideBy: result.adminOverride ? req.user.id : null
    }
  });
});

// Backward-compatible endpoint: completion now follows the same two-party handshake.
const completeTransaction = confirmHandshake;

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

  if (tx.status !== 'pending') {
    return next(new AppError('Only pending transactions can be cancelled.', 409));
  }

  if (req.user.role !== 'admin' && (tx.seller_confirmed_at || tx.buyer_confirmed_at)) {
    return next(new AppError('This exchange has entered the handover stage and can no longer be cancelled. Contact TradeLink Help & Safety for assistance.', 409));
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
  const cancelledListing = await db('listings').where({ id: tx.listing_id }).first();
  const cancelledTitle = cancelledListing?.title || 'Item';
  await syncTransactionToChat({
    listingId: tx.listing_id,
    buyerId: tx.buyer_id,
    sellerId: tx.seller_id,
    transactionId: tx.id,
    referenceNo: tx.reference_no,
    content: `[Deal Cancelled] Order #${tx.reference_no} for "${cancelledTitle}" was CANCELLED (${reason.trim()}). The item has been re-listed on the campus catalog.`,
    isSystem: true,
    io
  });

  // Dispatch cancellation emails (awaited for serverless resilience)
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

  const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'disputed'];
  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new AppError(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`, 400));
  }

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
  confirmHandshake,
  cancelTransaction,
  updateTransactionStatus
};
