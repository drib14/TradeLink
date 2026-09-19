const Joi = require('joi');
const { CONDITIONS, TRADE_MODES, CATEGORIES, CAMPUSES } = require('../config/constants');

const mediaItemSchema = Joi.alternatives().try(
  Joi.string().uri().allow(''),
  Joi.object({
    url: Joi.string().required(),
    mediaType: Joi.string().valid('image', 'video').default('image'),
    thumbnailUrl: Joi.string().uri().allow('', null).optional()
  })
);

const createListingSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required()
    .pattern(/^[^<>]*$/, 'no HTML tags')
    .messages({
      'string.min': 'Listing title must be at least 5 characters long.',
      'string.empty': 'Listing title is required.',
      'string.pattern.name': 'Listing title must not contain HTML tags.'
    }),
  description: Joi.string().trim().min(10).max(5000).required().messages({
    'string.min': 'Description must be at least 10 characters long.',
    'string.empty': 'Description is required.'
  }),
  price: Joi.number().min(0).max(100000).default(0),
  originalSrp: Joi.number().min(0).max(200000).default(0),
  tradeMode: Joi.string().valid(...TRADE_MODES).required(),
  swapPreference: Joi.string().trim().max(300).allow('', null),
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': 'Please select a valid category from the approved list.'
  }),
  condition: Joi.string().valid(...CONDITIONS).required(),
  quantity: Joi.number().integer().min(1).max(999).default(1),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
  media: Joi.array().items(mediaItemSchema).min(1).max(5).optional(),
  images: Joi.array().items(Joi.string()).min(1).max(5).optional(),
  preferredMeetupSpots: Joi.array().items(Joi.string().trim().max(200)).default([]),
  customMeetupSpot: Joi.string().trim().max(200).allow('', null),
  campus: Joi.string().valid(...CAMPUSES).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  acceptedPaymentMethods: Joi.array().items(Joi.string().valid('cash', 'gcash', 'maya')).default(['cash', 'gcash', 'maya'])
}).or('media', 'images').messages({
  'object.missing': 'At least one listing photo is required (provide media or images).'
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200)
    .pattern(/^[^<>]*$/, 'no HTML tags'),
  description: Joi.string().trim().min(10).max(5000),
  price: Joi.number().min(0).max(100000),
  originalSrp: Joi.number().min(0).max(200000),
  tradeMode: Joi.string().valid(...TRADE_MODES),
  swapPreference: Joi.string().trim().max(300).allow('', null),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  quantity: Joi.number().integer().min(0).max(999),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
  media: Joi.array().items(mediaItemSchema).max(5),
  images: Joi.array().items(Joi.string()).max(5),
  preferredMeetupSpots: Joi.array().items(Joi.string().trim().max(200)),
  customMeetupSpot: Joi.string().trim().max(200).allow('', null),
  campus: Joi.string().valid(...CAMPUSES).allow('', null),
  department: Joi.string().trim().max(100).allow('', null),
  acceptedPaymentMethods: Joi.array().items(Joi.string().valid('cash', 'gcash', 'maya')),
  status: Joi.string().valid('active', 'sold'),
  isSold: Joi.boolean()
});

const queryListingsSchema = Joi.object({
  campus: Joi.string().valid('All', '', ...CAMPUSES).default('All'),
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
