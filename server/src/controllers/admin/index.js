const verificationController = require('./verification.controller');
const moderationController = require('./moderation.controller');
const announcementsController = require('./announcements.controller');
const systemController = require('./system.controller');
const passwordResetsController = require('./passwordResets.controller');

module.exports = {
  ...verificationController,
  ...moderationController,
  ...announcementsController,
  ...systemController,
  ...passwordResetsController
};
