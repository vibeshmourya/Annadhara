const { body, param } = require('express-validator');

const createReservationValidator = [
  body('donationId').isMongoId().withMessage('Valid donation ID is required'),
  body('requestedQuantity').isFloat({ min: 0.1 }).withMessage('Requested quantity must be greater than 0'),
  body('requestNotes').optional().isString().isLength({ max: 500 }),
];

const updateReservationStatusValidator = [
  param('id').isMongoId().withMessage('Valid reservation ID is required'),
  body('status')
    .isIn(['approved', 'rejected', 'cancelled'])
    .withMessage('Status must be approved, rejected, or cancelled'),
  body('donorNotes').optional().isString().isLength({ max: 500 }),
  body('cancellationReason').optional().isString().isLength({ max: 500 }),
];

module.exports = {
  createReservationValidator,
  updateReservationStatusValidator,
};

