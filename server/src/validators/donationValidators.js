const { body } = require('express-validator');
const {
  ALL_FOOD_CATEGORIES,
  QUANTITY_UNITS,
  STORAGE_CONDITIONS,
} = require('../utils/validationHelpers');

const createDonationValidator = [
  body('title').trim().notEmpty().withMessage('Food title is required').isLength({ max: 150 }),
  body('category')
    .isIn(ALL_FOOD_CATEGORIES)
    .withMessage('Valid food category is required'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
  body('totalQuantity').isFloat({ min: 0.1 }).withMessage('Total quantity must be greater than 0'),
  body('unit')
    .isIn(QUANTITY_UNITS)
    .withMessage('Valid quantity unit is required'),
  body('storageHandling')
    .isIn(STORAGE_CONDITIONS)
    .withMessage('Valid storage instruction is required'),
  body('pickupLocation.address.street').notEmpty().withMessage('Pickup street address is required'),
  body('pickupLocation.address.city').notEmpty().withMessage('Pickup city is required'),
  body('pickupLocation.location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Pickup coordinates must be an array of [longitude, latitude]'),
  body('pickupStartTime').optional().isISO8601().withMessage('Valid pickup start time is required'),
  body('pickupEndTime')
    .isISO8601()
    .withMessage('Valid pickup deadline is required')
    .custom((value, { req }) => {
      if (req.body.pickupStartTime && new Date(value) <= new Date(req.body.pickupStartTime)) {
        throw new Error('Pickup deadline must be after pickup start time');
      }
      return true;
    }),
  body('safetyGuidelinesAccepted')
    .optional()
    .custom((val) => val === true || val === 'true')
    .withMessage('You must confirm the food information declaration'),
];

const updateDonationValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('category').optional().isIn(ALL_FOOD_CATEGORIES).withMessage('Valid food category is required'),
  body('description').optional().trim().notEmpty(),
  body('totalQuantity').optional().isFloat({ min: 0.1 }),
  body('unit').optional().isIn(QUANTITY_UNITS).withMessage('Valid quantity unit is required'),
  body('pickupEndTime').optional().isISO8601(),
  body('storageHandling').optional().isIn(STORAGE_CONDITIONS),
];

module.exports = {
  createDonationValidator,
  updateDonationValidator,
};
