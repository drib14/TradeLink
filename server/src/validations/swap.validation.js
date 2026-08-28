const Joi = require('joi');

const proposeSwapSchema = Joi.object({
  targetListingId: Joi.string().required(),
  offeredListingId: Joi.string().allow('', null),
  offeredDescription: Joi.string().trim().min(5).max(1000).required(),
  cashTopUp: Joi.number().default(0),
  proposedMeetupSpot: Joi.string().trim().min(3).max(200).required(),
  proposedDateTime: Joi.string().trim().min(3).max(100).required()
});

const respondSwapSchema = Joi.object({
  status: Joi.string().valid('accepted', 'declined').required()
});

module.exports = {
  proposeSwapSchema,
  respondSwapSchema
};
