/**
 * AI Controller for TradeLink University of Cebu
 * Proxy endpoints for Groq-powered campus marketplace intelligence.
 */

const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/ai.service');

/**
 * Scan and moderate a proposed listing
 * POST /api/ai/moderate
 */
const moderateListing = asyncHandler(async (req, res, next) => {
  const { title, description, category, price } = req.body;

  if (!title && !description) {
    return next(new AppError('Title or description is required for moderation review.', 400));
  }

  const moderation = await aiService.moderateListing({
    title: String(title || '').slice(0, 300),
    description: String(description || '').slice(0, 2000),
    category: String(category || '').slice(0, 100),
    price: typeof price === 'number' ? price : undefined,
  });

  res.status(200).json({
    status: 'success',
    data: { moderation },
  });
});

/**
 * Estimate fairness of a barter / swap proposal
 * POST /api/ai/estimate-barter
 */
const estimateBarter = asyncHandler(async (req, res, next) => {
  let { offeredItem, requestedItem, offeredListingId, requestedListingId } = req.body;

  // Resolve from DB if IDs provided
  if (offeredListingId && !offeredItem) {
    const row = await db('listings').where({ id: offeredListingId }).first();
    if (row) {
      offeredItem = {
        title: row.title,
        condition: row.condition,
        price: row.price,
        description: row.description,
      };
    }
  }

  if (requestedListingId && !requestedItem) {
    const row = await db('listings').where({ id: requestedListingId }).first();
    if (row) {
      requestedItem = {
        title: row.title,
        condition: row.condition,
        price: row.price,
        description: row.description,
      };
    }
  }

  if (!offeredItem || !requestedItem) {
    return next(new AppError('Both offeredItem and requestedItem are required for appraisal.', 400));
  }

  const appraisal = await aiService.estimateBarterFairness({
    offeredItem,
    requestedItem,
  });

  res.status(200).json({
    status: 'success',
    data: { appraisal },
  });
});

/**
 * Autofill listing draft from brief student query
 * POST /api/ai/autofill
 */
const autofillListing = asyncHandler(async (req, res, next) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return next(new AppError('Search query or item description is required.', 400));
  }

  const draft = await aiService.autofillListing({
    query: query.trim().slice(0, 200),
    campus: req.user?.campus || 'University of Cebu',
  });

  res.status(200).json({
    status: 'success',
    data: { draft },
  });
});

/**
 * Suggest safe physical exchange locations on campus
 * POST /api/ai/safe-meetup
 */
const suggestSafeMeetup = asyncHandler(async (req, res, next) => {
  const { buyerCampus, sellerCampus, proposedTime } = req.body;

  const suggestion = await aiService.suggestSafeMeetup({
    buyerCampus: buyerCampus || req.user?.campus || 'UC Main',
    sellerCampus: sellerCampus || 'UC Main',
    proposedTime: proposedTime || 'Daytime (Class Hours)',
  });

  res.status(200).json({
    status: 'success',
    data: { suggestion },
  });
});

/**
 * Summarize dispute dossier for administrators or participants
 * POST /api/ai/dispute-summary
 */
const summarizeDispute = asyncHandler(async (req, res, next) => {
  const { transactionId, disputeReason } = req.body;

  if (!transactionId) {
    return next(new AppError('Transaction ID is required.', 400));
  }

  const transaction = await db('transactions')
    .leftJoin('listings', 'transactions.listing_id', 'listings.id')
    .where('transactions.id', transactionId)
    .select('transactions.*', 'listings.title as item_title')
    .first();

  if (!transaction) {
    return next(new AppError('Transaction not found.', 404));
  }

  // Security check: Only participants or admin/moderator can request dispute summary
  const isParticipant =
    req.user.id === transaction.buyer_id || req.user.id === transaction.seller_id;
  const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator';

  if (!isParticipant && !isAdminOrMod) {
    return next(new AppError('You do not have permission to view dispute summaries for this transaction.', 403));
  }

  // Fetch recent messages
  const userA = transaction.buyer_id < transaction.seller_id ? transaction.buyer_id : transaction.seller_id;
  const userB = transaction.buyer_id < transaction.seller_id ? transaction.seller_id : transaction.buyer_id;

  const conversation = await db('conversations')
    .where({ user_one_id: userA, user_two_id: userB })
    .first();

  let messages = [];
  if (conversation) {
    const rawMessages = await db('messages')
      .where({ conversation_id: conversation.id })
      .orderBy('created_at', 'desc')
      .limit(20);

    messages = rawMessages.reverse().map((m) => ({
      sender_id: m.sender_id,
      text: m.content || m.text || '',
      created_at: m.created_at,
    }));
  }

  const disputeSummary = await aiService.summarizeDispute({
    transaction,
    messages,
    disputeReason: disputeReason || transaction.dispute_reason || 'Discrepancy reported',
  });

  res.status(200).json({
    status: 'success',
    data: { disputeSummary },
  });
});

module.exports = {
  moderateListing,
  estimateBarter,
  autofillListing,
  suggestSafeMeetup,
  summarizeDispute,
};
