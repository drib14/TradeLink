const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createAnnouncementSchema,
  banUserSchema,
  warnUserSchema,
  resolveDisputeSchema,
  addKeywordSchema,
  updateSystemConfigSchema
} = require('../validations/admin.validation');

// All admin routes require at least admin role
router.use(authenticate, requireRole('admin', 'superadmin'));

// Stats & Overview
router.get('/stats', adminController.getStats);

// Student Verifications
router.get('/verifications', adminController.getVerifications);
router.patch('/verifications/:id/approve', adminController.approveVerification);
router.patch('/verifications/:id/reject', adminController.rejectVerification);

// Flagged Listings
router.get('/flags', adminController.getFlaggedListings);
router.patch('/flags/:id/resolve', adminController.resolveFlag);
router.delete('/flags/:id/remove', adminController.removeListingByAdmin);

// Trade Disputes
router.get('/disputes', adminController.getDisputes);
router.patch('/disputes/:id/resolve', validate(resolveDisputeSchema), adminController.resolveDispute);

// Campus Announcements
router.get('/announcements', adminController.getAnnouncements);
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

// Prohibited Keywords
router.get('/keywords', adminController.getKeywords);
router.post('/keywords', validate(addKeywordSchema), adminController.addKeyword);
router.delete('/keywords/:keyword', adminController.removeKeyword);

// SuperAdmin Only Routes
router.delete('/users/:id', requireRole('superadmin'), adminController.deleteUser);
router.patch('/users/:id/promote', requireRole('superadmin'), adminController.promoteToAdmin);
router.patch('/users/:id/demote', requireRole('superadmin'), adminController.demoteAdmin);

router.get('/config', requireRole('superadmin'), adminController.getSystemConfig);
router.patch('/config', requireRole('superadmin'), validate(updateSystemConfigSchema), adminController.updateSystemConfig);
router.patch('/feature-flags/:id/toggle', requireRole('superadmin'), adminController.toggleFeatureFlag);

module.exports = router;
