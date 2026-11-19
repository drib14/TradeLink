/**
 * TradeLink Database Row-Level Security (RLS) Query Enforcer
 * Enforces multi-tenant row isolation across student and administrator tiers.
 */

const AppError = require('./AppError');

const rls = {
  /**
   * Scopes listings queries according to user privileges
   * - Public / Guest: Only active, non-deleted listings
   * - Student: Active listings OR listings owned by student (including reserved/archived)
   * - Admin: All non-deleted listings (or all including deleted if requested)
   */
  scopedListings(db, user, options = {}) {
    let query = db('listings');

    // Filter soft-deleted rows unless explicitly requested by admin
    if (!options.includeDeleted) {
      query = query.whereNull('deleted_at').whereNot('status', 'deleted');
    }

    if (!user) {
      // Unauthenticated guest: strictly active items
      return query.where('status', 'active');
    }

    if (user.role === 'admin') {
      return query;
    }

    // Authenticated student: active items OR own listings
    return query.where((builder) => {
      builder.where('status', 'active').orWhere('seller_id', user.id);
    });
  },

  /**
   * Scopes transactions queries
   * - Guest: Blocked (401)
   * - Student: Only transactions where student is buyer OR seller
   * - Admin: Unrestricted access
   */
  scopedTransactions(db, user) {
    if (!user) {
      throw new AppError('Authentication required to access transactions.', 401);
    }

    let query = db('transactions');

    if (user.role === 'admin') {
      return query;
    }

    return query.where((builder) => {
      builder.where('buyer_id', user.id).orWhere('seller_id', user.id);
    });
  },

  /**
   * Scopes conversations queries
   * - Guest: Blocked (401)
   * - Student: Only conversations where student is participant (user_one or user_two)
   * - Admin: Full moderation oversight
   */
  scopedConversations(db, user) {
    if (!user) {
      throw new AppError('Authentication required to access conversations.', 401);
    }

    let query = db('conversations');

    if (user.role === 'admin') {
      return query;
    }

    return query.where((builder) => {
      builder.where('user_one_id', user.id).orWhere('user_two_id', user.id);
    });
  },

  /**
   * Scopes swap offers queries
   * - Guest: Blocked (401)
   * - Student: Offers created by student OR received for student's listings
   * - Admin: Full moderation oversight
   */
  scopedSwapOffers(db, user) {
    if (!user) {
      throw new AppError('Authentication required to access swap proposals.', 401);
    }

    let query = db('swap_offers');

    if (user.role === 'admin') {
      return query;
    }

    return query
      .leftJoin('listings', 'swap_offers.listing_id', 'listings.id')
      .where((builder) => {
        builder.where('swap_offers.proposer_id', user.id).orWhere('listings.seller_id', user.id);
      })
      .select('swap_offers.*');
  },

  /**
   * Scopes verification requests queries
   * - Guest: Blocked (401)
   * - Student: Only student's own verification request
   * - Admin: Full moderation review access
   */
  scopedVerificationRequests(db, user) {
    if (!user) {
      throw new AppError('Authentication required to access verification records.', 401);
    }

    let query = db('verification_requests');

    if (user.role === 'admin') {
      return query;
    }

    return query.where('user_id', user.id);
  },

  /**
   * Scopes user favorites queries
   * - Student: Strictly own favorites
   */
  scopedFavorites(db, user) {
    if (!user) {
      throw new AppError('Authentication required to access saved listings.', 401);
    }

    return db('user_favorites').where('user_id', user.id);
  }
};

module.exports = rls;
