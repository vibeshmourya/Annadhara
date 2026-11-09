const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileValidator } = require('../validators/authValidators');

// All user profile routes require authentication
router.use(protect);

router.get('/me', getMyProfile);
router.patch('/me', updateProfileValidator, validate, updateMyProfile);

module.exports = router;

