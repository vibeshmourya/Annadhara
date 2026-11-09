const express = require('express');
const router = express.Router();
const {
  createOrganization,
  getMyOrganization,
  updateMyOrganization,
  getOrganizations,
  getOrganizationById,
  verifyOrganizationByAdmin,
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createOrganizationValidator,
  updateOrganizationValidator,
  verifyOrganizationValidator,
} = require('../validators/organizationValidators');

// Protected user organization routes
router.post('/', protect, createOrganizationValidator, validate, createOrganization);
router.get('/me', protect, getMyOrganization);
router.patch('/me', protect, updateOrganizationValidator, validate, updateMyOrganization);

// General discovery routes
router.get('/', protect, getOrganizations);
router.get('/:id', protect, getOrganizationById);

// Admin verification route (backward compatibility)
router.patch('/:id/verify', protect, authorize('ADMIN'), verifyOrganizationValidator, validate, verifyOrganizationByAdmin);

module.exports = router;
