const Joi = require('joi');
const { CONDITIONS, TRADE_MODES } = require('../config/constants');

const createListingSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required().messages({
    'string.min': 'Listing title must be at least 5 characters long.',
    'string.empty': 'Listing title is required.'
  }),
  description: Joi.string().trim().min(10).max(5000).required().messages({
    'string.min': 'Description must be at least 10 characters long.',
    'string.empty': 'Description is required.'
  }),
  price: Joi.number().min(0).max(100000).default(0),
  originalSrp: Joi.number().min(0).max(200000).default(0),
  tradeMode: Joi.string().valid(...TRADE_MODES).required(),
  swapPreference: Joi.string().trim().max(300).allow('', null),
  category: Joi.string().trim().min(2).max(100).required(),
  condition: Joi.string().valid(...CONDITIONS).required(),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
  images: Joi.array().items(Joi.string().uri()).min(1).required().messages({
    'array.min': 'At least one listing photo is required.'
  }),
  preferredMeetupSpots: Joi.array().items(Joi.string().trim().max(200)).default([]),
  customMeetupSpot: Joi.string().trim().max(200).allow('', null),
  courseCode: Joi.string().trim().max(30).allow('', null)
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  description: Joi.string().trim().min(10).max(5000),
  price: Joi.number().min(0).max(100000),
  originalSrp: Joi.number().min(0).max(200000),
  tradeMode: Joi.string().valid(...TRADE_MODES),
  swapPreference: Joi.string().trim().max(300).allow('', null),
  category: Joi.string().trim().min(2).max(100),
  condition: Joi.string().valid(...CONDITIONS),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  images: Joi.array().items(Joi.string().uri()).min(1),
  preferredMeetupSpots: Joi.array().items(Joi.string().trim().max(200)),
  customMeetupSpot: Joi.string().trim().max(200).allow('', null),
  courseCode: Joi.string().trim().max(30).allow('', null),
  isSold: Joi.boolean(),
  isBoosted: Joi.boolean()
});

const queryListingsSchema = Joi.object({
  campus: Joi.string().trim().allow('All', ''),
  category: Joi.string().trim().allow('All', ''),
  tradeMode: Joi.string().valid('All', ...TRADE_MODES).default('All'),
  condition: Joi.string().valid('All', ...CONDITIONS).default('All'),
  search: Joi.string().trim().max(100).allow(''),
  sortBy: Joi.string().valid('recent', 'price_low', 'price_high', 'trust_high', 'views_high').default('recent'),
  priceMin: Joi.number().min(0).default(0),
  priceMax: Joi.number().min(0).default(100000),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const reportListingSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(1000).required().messages({
    'string.min': 'Please provide a clear reason for reporting this item.'
  })
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  reportListingSchema
};
