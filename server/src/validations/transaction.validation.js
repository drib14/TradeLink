const Joi = require('joi');

const createTransactionSchema = Joi.object({
  listingId: Joi.string().max(100).required(),
  sellerId: Joi.string().max(100).allow(null, ''),
  buyerId: Joi.string().max(100).allow(null, ''),
  tradeMode: Joi.string().valid('buy_sell', 'barter', 'swap', 'donation', 'free_donation', 'flash').default('buy_sell'),
  amount: Joi.number().min(0).max(1000000).allow(null),
  finalPrice: Joi.number().min(0).max(1000000).allow(null),
  paymentMethod: Joi.string().valid('cash', 'gcash', 'maya', 'free').default('cash'),
  swapOfferId: Joi.string().max(100).allow(null, ''),
  notes: Joi.string().max(500).allow(null, ''),
  selectedVariation: Joi.string().max(200).allow(null, ''),
  variationId: Joi.string().max(100).allow(null, '')
});

const confirmHandshakeSchema = Joi.object({
  handshakeCode: Joi.string().pattern(/^\d{4}$/).allow(null, '').optional()
});

module.exports = {
  createTransactionSchema,
  confirmHandshakeSchema
};
