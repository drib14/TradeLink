const Joi = require('joi');

const CAMPUSES = [
  'All',
  'UC Main',
  'UC Banilad',
  'UC LM',
  'UC METC',
  'UC Pardo-Talisay',
  'UC South Campus',
  'UC Medical Center',
  'UC PRI'
];

const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  message: Joi.string().trim().min(5).max(3000).required(),
  campus: Joi.string().valid(...CAMPUSES).default('All'),
  type: Joi.string().valid('info', 'alert', 'event').default('info')
});

const banUserSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required().messages({
    'string.min': 'Please state a clear reason for banning this user.'
  })
});

const warnUserSchema = Joi.object({
  note: Joi.string().trim().max(500).default('Violation of community trading rules.')
});

const adjustTrustScoreSchema = Joi.object({
  delta: Joi.number().integer().min(-100).max(100).required(),
  reason: Joi.string().trim().min(3).max(300).required()
});

const resolveDisputeSchema = Joi.object({
  action: Joi.string().valid('refund', 'warning', 'dismissed', 'ban').required(),
  note: Joi.string().trim().min(5).max(1000).required()
});

const addKeywordSchema = Joi.object({
  keyword: Joi.string().trim().min(2).max(100).required()
});

const updateSystemConfigSchema = Joi.object({
  maintenanceMode: Joi.boolean(),
  maxListingPrice: Joi.number().min(100).max(1000000),
  maxImagesPerListing: Joi.number().min(1).max(20),
  swapModeEnabled: Joi.boolean(),
  wantedBoardEnabled: Joi.boolean(),
  freeDonationEnabled: Joi.boolean(),
  maxListingsPerUser: Joi.number().min(1).max(100)
});

module.exports = {
  createAnnouncementSchema,
  banUserSchema,
  warnUserSchema,
  adjustTrustScoreSchema,
  resolveDisputeSchema,
  addKeywordSchema,
  updateSystemConfigSchema
};
