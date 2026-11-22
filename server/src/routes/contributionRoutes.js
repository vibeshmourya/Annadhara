const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMySummary,
  getMyHistory,
  getContributionById,
  getReceivedContributions,
  reportContributionDiscrepancy,
  adminGetAllContributions,
  adminReview,
  adminGetAnalytics,
} = require('../controllers/contributionController');

// All contribution routes require authentication
router.use(protect);

// Donor endpoints
router.get('/my-summary', authorize('DONOR', 'ADMIN'), getMySummary);
router.get('/my-history', authorize('DONOR', 'ADMIN'), getMyHistory);

// Recipient endpoints
router.get('/received', authorize('RECIPIENT', 'ADMIN'), getReceivedContributions);
router.post('/:id/discrepancy', authorize('RECIPIENT', 'ADMIN'), reportContributionDiscrepancy);

// Admin endpoints
router.get('/admin/all', authorize('ADMIN'), adminGetAllContributions);
router.get('/admin/analytics', authorize('ADMIN'), adminGetAnalytics);
router.patch('/admin/:id/review', authorize('ADMIN'), adminReview);

// General detail endpoint (permission checked inside controller)
router.get('/:id', getContributionById);

module.exports = router;
