const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationById,
  getMyDonations,
  updateDonation,
  cancelDonation,
  reportDonation,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createDonationValidator, updateDonationValidator } = require('../validators/donationValidators');

// Public or optionally authenticated discovery
router.get('/', (req, res, next) => {
  // Optional auth middleware so req.user is set if token provided
  if (req.headers.authorization) {
    return protect(req, res, () => getDonations(req, res, next));
  }
  getDonations(req, res, next);
});

router.get('/my-donations', protect, authorize('donor', 'admin'), getMyDonations);
router.get('/my', protect, authorize('donor', 'admin'), getMyDonations);
router.get('/:id', protect, getDonationById);
router.post('/', protect, authorize('donor', 'admin'), createDonationValidator, validate, createDonation);
router.put('/:id', protect, authorize('donor', 'admin'), updateDonationValidator, validate, updateDonation);
router.delete('/:id', protect, authorize('donor', 'admin'), cancelDonation);
router.post('/:id/report', protect, reportDonation);

module.exports = router;

