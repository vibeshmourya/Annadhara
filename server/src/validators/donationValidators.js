const { body } = require('express-validator');

const createDonationValidator = [
  body('title').trim().notEmpty().withMessage('Food title is required').isLength({ max: 150 }),
  body('category')
    .isIn([
      'cooked_meals',
      'bakery_grains',
      'produce_fresh',
      'packaged_groceries',
      'dairy',
      'beverages',
      'prepared_catering',
      'other',
    ])
    .withMessage('Valid food category is required'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
  body('totalQuantity').isFloat({ min: 0.1 }).withMessage('Total quantity must be greater than 0'),
  body('unit')
    .isIn(['meals', 'kg', 'portions', 'boxes', 'liters', 'packs'])
    .withMessage('Valid quantity unit is required'),
  body('prepDateTime').isISO8601().withMessage('Valid preparation date and time is required'),
  body('expiryDateTime')
    .isISO8601()
    .withMessage('Valid consumption deadline is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.prepDateTime)) {
        throw new Error('Expiry deadline must be after preparation time');
      }
      return true;
    }),
  body('storageHandling')
    .isIn(['room_temperature', 'refrigerated', 'frozen', 'hot_held'])
    .withMessage('Valid storage instruction is required'),
  body('pickupLocation.address.street').notEmpty().withMessage('Pickup street address is required'),
  body('pickupLocation.address.city').notEmpty().withMessage('Pickup city is required'),
  body('pickupLocation.location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Pickup coordinates must be an array of [longitude, latitude]'),
  body('pickupStartTime').isISO8601().withMessage('Valid pickup start time is required'),
  body('pickupEndTime')
    .isISO8601()
    .withMessage('Valid pickup deadline is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.pickupStartTime)) {
        throw new Error('Pickup deadline must be after pickup start time');
      }
      return true;
    }),
  body('safetyGuidelinesAccepted')
    .custom((val) => val === true || val === 'true')
    .withMessage('You must confirm the food safety declaration'),
];

const updateDonationValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty(),
  body('totalQuantity').optional().isFloat({ min: 0.1 }),
  body('pickupEndTime').optional().isISO8601(),
  body('storageHandling').optional().isIn(['room_temperature', 'refrigerated', 'frozen', 'hot_held']),
];

module.exports = {
  createDonationValidator,
  updateDonationValidator,
};

