const Joi = require('joi');
const { CAMPUSES, DISPUTE_ACTIONS } = require('../config/constants');
const ALLOWED_CAMPUSES = ['All', ...CAMPUSES];

const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  message: Joi.string().trim().min(5).max(3000).required(),
  campus: Joi.string().valid(...ALLOWED_CAMPUSES).default('All'),
  type: Joi.string().valid('info', 'alert', 'event').default('info')
});

const banUserSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required().messages({
    'string.min': 'Please state a clear reason for banning this user.'
  })
});

const warnUserSchema = Joi.object({
  note: Joi.string().trim().max(500),
  reason: Joi.string().trim().max(500)
});

const adjustTrustScoreSchema = Joi.object({
  delta: Joi.number().integer().min(-100).max(100),
  adjustment: Joi.number().integer().min(-100).max(100),
  amount: Joi.number().integer().min(-100).max(100),
  newScore: Joi.number().integer().min(0).max(100),
  reason: Joi.string().trim().min(1).max(300).default('Administrator adjustment')
}).or('delta', 'adjustment', 'amount', 'newScore');

const resolveDisputeSchema = Joi.object({
  action: Joi.string().valid(...DISPUTE_ACTIONS).required(),
  note: Joi.string().trim().min(1).max(1000).default('Dispute resolved by administrator')
});

const addKeywordSchema = Joi.object({
  keyword: Joi.string().trim().min(2).max(100).required()
});

const updateSystemConfigSchema = Joi.object({
  maintenanceMode: Joi.boolean(),
  maxListingPrice: Joi.number().min(100).max(1000000),
  maxImagesPerListing: Joi.number().min(1).max(20),
  swapModeEnabled: Joi.boolean(),
  flashMarketEnabled: Joi.boolean(),
  wantedBoardEnabled: Joi.boolean(),
  freeDonationEnabled: Joi.boolean(),
  maxListingsPerUser: Joi.number().min(1).max(100)
});

const adminCreateListingSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(5000).allow('', null),
  price: Joi.number().min(0).max(1000000).default(0),
  originalSrp: Joi.number().min(0).max(1000000).allow(null),
  category: Joi.string().trim().required(),
  tradeMode: Joi.string().valid('buy_sell', 'swap', 'free_donation').default('buy_sell'),
  condition: Joi.string().trim().default('Like New'),
  quantity: Joi.number().integer().min(1).max(9999).default(1),
  isFeatured: Joi.boolean().default(false),
  images: Joi.array().items(Joi.string().uri().allow('')).max(10).default([]),
  media: Joi.array().items(Joi.object({
    url: Joi.string().required(),
    type: Joi.string().valid('image', 'video').default('image')
  })).max(10).default([]),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).default([]),
  sellerId: Joi.string().uuid().optional()
});

const adminUpdateListingSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200),
  description: Joi.string().trim().max(5000).allow('', null),
  price: Joi.number().min(0).max(1000000),
  originalSrp: Joi.number().min(0).max(1000000).allow(null),
  category: Joi.string().trim(),
  tradeMode: Joi.string().valid('buy_sell', 'swap', 'free_donation'),
  condition: Joi.string().trim(),
  quantity: Joi.number().integer().min(0).max(9999),
  isFeatured: Joi.boolean(),
  status: Joi.string().valid('active', 'sold', 'flagged', 'archived'),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20),
  images: Joi.array().items(Joi.string().uri().allow('')).max(10),
  media: Joi.array().items(Joi.object({
    url: Joi.string().required(),
    type: Joi.string().valid('image', 'video').default('image')
  })).max(10)
});

module.exports = {
  createAnnouncementSchema,
  banUserSchema,
  warnUserSchema,
  adjustTrustScoreSchema,
  resolveDisputeSchema,
  addKeywordSchema,
  updateSystemConfigSchema,
  adminCreateListingSchema,
  adminUpdateListingSchema
};
