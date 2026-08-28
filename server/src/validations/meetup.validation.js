const Joi = require('joi');

const CAMPUSES = [
  'UC Main',
  'UC Banilad',
  'UC LM',
  'UC METC',
  'UC Pardo-Talisay',
  'UC South Campus',
  'UC Medical Center',
  'UC PRI'
];

const scheduleMeetupSchema = Joi.object({
  listingId: Joi.string().required(),
  sellerId: Joi.string().required(),
  buyerId: Joi.string().required(),
  tradeMode: Joi.string().valid('buy_sell', 'swap', 'free_donation').required(),
  finalPrice: Joi.number().min(0).default(0),
  swapSummary: Joi.string().trim().max(500).allow('', null),
  campus: Joi.string().valid(...CAMPUSES).required(),
  landmarkSpot: Joi.string().trim().min(3).max(200).required(),
  scheduledDateTime: Joi.string().trim().min(3).max(100).required(),
  notes: Joi.string().trim().max(500).allow('', null)
});

const verifyMeetupCodeSchema = Joi.object({
  code: Joi.string().trim().length(4).required().messages({
    'string.length': 'Verification code must be exactly 4 digits.',
    'string.empty': 'Please enter the 4-digit code.'
  })
});

const updateMeetupStatusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'on_the_way', 'completed', 'cancelled').required()
});

module.exports = {
  scheduleMeetupSchema,
  verifyMeetupCodeSchema,
  updateMeetupStatusSchema
};
