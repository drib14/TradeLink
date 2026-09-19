const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateAdmin } = require('../middleware/auth');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const validateUUID = require('../middleware/validateUUID');
const {
  createAnnouncementSchema,
  banUserSchema,
  warnUserSchema,
  adjustTrustScoreSchema,
  resolveDisputeSchema,
  addKeywordSchema,
  updateSystemConfigSchema,
  adminCreateListingSchema,
  adminUpdateListingSchema
} = require('../validations/admin.validation');

decodeParams.bindRouter(router);

// Publicly readable bulletin announcements & public system config
router.get('/announcements', adminController.getAnnouncements);
router.get('/config', adminController.getSystemConfig);

// All protected admin routes strictly require dedicated administrator authentication
router.use(authenticateAdmin);

// Stats & Overview
router.get('/stats', adminController.getStats);

// Listings Full Admin CRUD
router.get('/listings', adminController.getAllListingsAdmin);
router.post('/listings', validate(adminCreateListingSchema), adminController.createListingAdmin);
router.put('/listings/:id', validateUUID('id'), validate(adminUpdateListingSchema), adminController.updateListingAdmin);
router.delete('/listings/:id', validateUUID('id'), adminController.deleteListingAdmin);

// Student Verifications
router.get('/verifications', adminController.getVerifications);
router.patch('/verifications/:id/approve', validateUUID('id'), adminController.approveVerification);
router.patch('/verifications/:id/reject', validateUUID('id'), adminController.rejectVerification);

// Password Reset Requests (Admin Confirmation / Refusal)
router.get('/password-resets', adminController.getPasswordResetRequests);
router.patch('/password-resets/:id/approve', validateUUID('id'), adminController.approvePasswordReset);
router.patch('/password-resets/:id/reject', validateUUID('id'), adminController.rejectPasswordReset);

// Flagged Listings
router.get('/flags', adminController.getFlaggedListings);
router.patch('/flags/:id/resolve', validateUUID('id'), adminController.resolveFlag);
router.delete('/flags/:id/remove', validateUUID('id'), adminController.removeListingByAdmin);

// Trade Disputes
router.get('/disputes', adminController.getDisputes);
router.patch('/disputes/:id/resolve', validate(resolveDisputeSchema), adminController.resolveDispute);

// Campus Announcements Management
router.post('/announcements', validate(createAnnouncementSchema), adminController.createAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);
router.patch('/announcements/:id/toggle', adminController.toggleAnnouncement);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/ban', validate(banUserSchema), adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.patch('/users/:id/warn', validate(warnUserSchema), adminController.warnUser);
router.patch('/users/:id/toggle-verify', adminController.toggleVerifyUser);
router.patch('/users/:id/adjust-trust', validate(adjustTrustScoreSchema), adminController.adjustUserTrustScore);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/promote', adminController.promoteToAdmin);
router.patch('/users/:id/demote', adminController.demoteAdmin);

// Prohibited Keywords
router.get('/keywords', adminController.getKeywords);
router.post('/keywords', validate(addKeywordSchema), adminController.addKeyword);
router.delete('/keywords/:keyword', adminController.removeKeyword);

// System Configuration & Feature Flags
router.patch('/config', validate(updateSystemConfigSchema), adminController.updateSystemConfig);
router.patch('/feature-flags/:id/toggle', adminController.toggleFeatureFlag);

module.exports = router;
