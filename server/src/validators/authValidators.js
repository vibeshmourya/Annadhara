const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .customSanitizer((v) => (v ? v.toUpperCase() : v))
    .isIn(['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'])
    .withMessage('Role must be one of: DONOR, RECIPIENT, VOLUNTEER'),
  body('phone').optional().isString().trim(),
  body('organizationName').optional().isString().trim(),
  body('organizationType').optional().isString().trim(),
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('phone').optional().isString().trim(),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('role')
    .not()
    .exists()
    .withMessage('Modifying user role through profile update is not permitted'),
  body('accountStatus')
    .not()
    .exists()
    .withMessage('Modifying accountStatus through profile update is not permitted'),
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
};
