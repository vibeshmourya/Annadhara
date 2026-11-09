const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['donor', 'recipient', 'volunteer', 'admin'])
    .withMessage('Role must be one of: donor, recipient, volunteer, admin'),
  body('phone').optional().isString().trim(),
  body('organizationName').optional().isString().trim(),
  body('organizationType').optional().isString().trim(),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isString().trim(),
  body('address').optional().isObject().withMessage('Address must be an object'),
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
};

