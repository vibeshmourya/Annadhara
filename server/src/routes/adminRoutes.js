const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  getReportedDonations,
  resolveDonationReport,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/reported-donations', getReportedDonations);
router.patch('/donations/:id/resolve-report', resolveDonationReport);
router.get('/audit-logs', getAuditLogs);

module.exports = router;

