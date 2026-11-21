const express = require('express');
const router = express.Router();
const {
  getPickupTasks,
  getPickupTaskById,
  claimPickupTask,
  updatePickupStatus,
  verifyDelivery,
} = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updatePickupStatusValidator } = require('../validators/pickupValidators');

router.get('/', protect, getPickupTasks);
router.get('/:id', protect, getPickupTaskById);
router.post('/:id/claim', protect, authorize('volunteer', 'admin'), claimPickupTask);
router.patch('/:id/status', protect, updatePickupStatusValidator, validate, updatePickupStatus);
router.post('/:id/verify-delivery', protect, verifyDelivery);

module.exports = router;

