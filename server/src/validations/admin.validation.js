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
}).unknown(true);

module.exports = {
  createAnnouncementSchema,
  banUserSchema,
  warnUserSchema,
  adjustTrustScoreSchema,
  resolveDisputeSchema,
  addKeywordSchema,
  updateSystemConfigSchema
};
