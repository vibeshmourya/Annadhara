const express = require('express');
const router = express.Router();
const {
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  verifyOrganization,
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getOrganizations);
router.get('/:id', protect, getOrganizationById);
router.put('/:id', protect, updateOrganization);
router.patch('/:id/verify', protect, authorize('admin'), verifyOrganization);

module.exports = router;

