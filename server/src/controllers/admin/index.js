const verificationController = require('./verification.controller');
const moderationController = require('./moderation.controller');
const announcementsController = require('./announcements.controller');
const systemController = require('./system.controller');

module.exports = {
  ...verificationController,
  ...moderationController,
  ...announcementsController,
  ...systemController
};
