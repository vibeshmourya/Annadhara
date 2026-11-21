const express = require('express');
const router = express.Router();
const {
  confirmHandover,
  confirmDeliveryHandover,
  getHandoverByReservation,
} = require('../controllers/handoverController');
const { protect } = require('../middleware/auth');

router.post('/confirm', protect, confirmHandover);
router.post('/confirm-delivery', protect, confirmDeliveryHandover);
router.get('/reservation/:reservationId', protect, getHandoverByReservation);

module.exports = router;

