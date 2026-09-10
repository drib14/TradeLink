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
  quantity: Joi.number().integer().min(1).max(999).default(1),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
  images: Joi.array().items(Joi.string()).min(1).max(5).required().messages({
    'array.min': 'At least one listing photo is required.',
    'array.max': 'A maximum of 5 photos are allowed per listing.'
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
  quantity: Joi.number().integer().min(0).max(999),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
  images: Joi.array().items(Joi.string()).min(1).max(5),
  preferredMeetupSpots: Joi.array().items(Joi.string().trim().max(200)),
  customMeetupSpot: Joi.string().trim().max(200).allow('', null),
  courseCode: Joi.string().trim().max(30).allow('', null),
  status: Joi.string().valid('active', 'sold'),
  isSold: Joi.boolean()
});

const queryListingsSchema = Joi.object({
  campus: Joi.string().trim().allow('All', ''),
  category: Joi.string().trim().allow('All', ''),
  tradeMode: Joi.string().valid('All', ...TRADE_MODES).default('All'),
  condition: Joi.string().valid('All', ...CONDITIONS).default('All'),
  status: Joi.string().valid('All', 'active', 'sold', 'flagged').default('active'),
  search: Joi.string().trim().max(100).allow(''),
  sortBy: Joi.string().valid('recent', 'price_low', 'price_high', 'trust_high', 'views_high').default('recent'),
  priceMin: Joi.number().min(0).default(0),
  priceMax: Joi.number().min(0).default(100000),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const reportListingSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(1000).required().messages({
    'string.min': 'Please provide a clear reason for reporting this item (at least 10 characters).'
  })
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  reportListingSchema
};
