const { body, param } = require('express-validator');

const createOrganizationValidator = [
  body('organizationName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization name cannot be empty'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body()
    .custom((value, { req }) => {
      if (!req.body.organizationName && !req.body.name) {
        throw new Error('Organization name is required');
      }
      return true;
    }),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid organization email is required')
    .normalizeEmail(),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Valid contact email is required')
    .normalizeEmail(),
  body()
    .custom((value, { req }) => {
      if (!req.body.email && !req.body.contactEmail) {
        throw new Error('Organization email is required');
      }
      return true;
    }),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization phone cannot be empty'),
  body('contactPhone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Contact phone cannot be empty'),
  body()
    .custom((value, { req }) => {
      if (!req.body.phone && !req.body.contactPhone) {
        throw new Error('Organization phone is required');
      }
      return true;
    }),
];

const updateOrganizationValidator = [
  body('organizationName').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('contactEmail').optional().isEmail().normalizeEmail(),
  body('verificationStatus')
    .not()
    .exists()
    .withMessage('Users cannot modify verificationStatus directly'),
  body('reviewedBy')
    .not()
    .exists()
    .withMessage('Modifying reviewedBy is not permitted'),
  body('reviewedAt')
    .not()
    .exists()
    .withMessage('Modifying reviewedAt is not permitted'),
];

const verifyOrganizationValidator = [
  param('id').isMongoId().withMessage('Valid organization ID is required'),
  body('status')
    .customSanitizer((v) => (v ? v.toUpperCase() : v))
    .isIn(['VERIFIED', 'REJECTED'])
    .withMessage("Status must be either 'VERIFIED' or 'REJECTED'"),
  body('notes').optional().isString(),
];

module.exports = {
  createOrganizationValidator,
  updateOrganizationValidator,
  verifyOrganizationValidator,
};

