const { body, param } = require('express-validator');

const assignVolunteerValidator = [
  param('id').isMongoId().withMessage('Valid pickup task ID is required'),
  body('volunteerId').optional().isMongoId().withMessage('Valid volunteer user ID is required'),
];

const updatePickupStatusValidator = [
  param('id').isMongoId().withMessage('Valid pickup task ID is required'),
  body('status')
    .isIn(['assigned', 'in_progress', 'collected', 'completed', 'cancelled'])
    .withMessage('Invalid pickup status'),
  body('note').optional().isString().isLength({ max: 500 }),
];

module.exports = {
  assignVolunteerValidator,
  updatePickupStatusValidator,
};

