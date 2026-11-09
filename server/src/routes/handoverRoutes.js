const express = require('express');
const router = express.Router();
const { confirmHandover, getHandoverByReservation } = require('../controllers/handoverController');
const { protect } = require('../middleware/auth');

router.post('/confirm', protect, confirmHandover);
router.get('/reservation/:reservationId', protect, getHandoverByReservation);

module.exports = router;

