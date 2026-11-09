const express = require('express');
const router = express.Router();
const {
  createReservation,
  updateReservationStatus,
  cancelReservation,
  getMyReservations,
} = require('../controllers/reservationController');
const { protect, authorize, requireVerifiedOrg } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createReservationValidator,
  updateReservationStatusValidator,
} = require('../validators/reservationValidators');

router.get('/', protect, getMyReservations);
router.post(
  '/',
  protect,
  authorize('recipient', 'admin'),
  requireVerifiedOrg,
  createReservationValidator,
  validate,
  createReservation
);
router.patch(
  '/:id/status',
  protect,
  authorize('donor', 'admin'),
  updateReservationStatusValidator,
  validate,
  updateReservationStatus
);
router.post('/:id/cancel', protect, cancelReservation);

module.exports = router;

