const Joi = require('joi');

const createReviewSchema = Joi.object({
  transactionId: Joi.string().required(),
  targetUserId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('', null),
  itemTitle: Joi.string().trim().max(200).required(),
  tradeType: Joi.string().trim().max(50).required(),
  wasPunctual: Joi.boolean().default(true),
  traitBadges: Joi.array().items(Joi.string().trim().max(50)).default([])
});

module.exports = {
  createReviewSchema
};
