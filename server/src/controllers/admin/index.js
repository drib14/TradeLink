const verificationController = require('./verification.controller');
const moderationController = require('./moderation.controller');
const communicationsController = require('./communications.controller');
const systemController = require('./system.controller');
const passwordResetsController = require('./passwordResets.controller');
const listingsAdminController = require('./listings.controller');

module.exports = {
  ...verificationController,
  ...moderationController,
  ...communicationsController,
  ...systemController,
  ...passwordResetsController,
  ...listingsAdminController
};

