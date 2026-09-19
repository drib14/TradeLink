const Joi = require('joi');

const createReviewSchema = Joi.object({
  listingId: Joi.string().allow('', null),
  transactionId: Joi.string().allow('', null),
  targetUserId: Joi.string().allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('', null),
  itemTitle: Joi.string().trim().max(200).allow('', null),
  tradeType: Joi.string().trim().max(50).allow('', null),
  wasPunctual: Joi.boolean().optional(),
  traitBadges: Joi.array().items(Joi.string().trim().max(50)).optional()
});

module.exports = {
  createReviewSchema
};
