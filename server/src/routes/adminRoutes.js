const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  getReportedDonations,
  resolveDonationReport,
  getAuditLogs,
} = require('../controllers/adminController');
const {
  getAdminOrganizations,
  verifyOrganizationByAdmin,
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { verifyOrganizationValidator } = require('../validators/organizationValidators');

// All admin routes require authentication and ADMIN role
router.use(protect, authorize('ADMIN'));

// Organization administrative management (Phase 1 core requirement)
router.get('/organizations', getAdminOrganizations);
router.patch('/organizations/:id/verification', verifyOrganizationValidator, validate, verifyOrganizationByAdmin);
router.patch('/organizations/:id/verify', verifyOrganizationValidator, validate, verifyOrganizationByAdmin);

// User and platform moderation
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/reported-donations', getReportedDonations);
router.patch('/donations/:id/resolve-report', resolveDonationReport);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
