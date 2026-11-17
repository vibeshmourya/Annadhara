const { body } = require('express-validator');
const {
  ORGANIZATION_TYPES,
  normalizeRole,
  normalizeOrgType,
  isValidPhone,
  normalizeAddress,
} = require('../utils/validationHelpers');

/**
 * Normalizes optional input aliases before validation without mutating API response contracts.
 */
const normalizeRegisterInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    if (!req.body.name && req.body.fullName) req.body.name = req.body.fullName;
    if (!req.body.phone && req.body.contactPhone) req.body.phone = req.body.contactPhone;
    if (!req.body.registrationNumber && req.body.registrationId) {
      req.body.registrationNumber = req.body.registrationId;
    }
    if (
      !req.body.address &&
      (req.body.street !== undefined ||
        req.body.city !== undefined ||
        req.body.state !== undefined ||
        req.body.postalCode !== undefined ||
        req.body.pincode !== undefined)
    ) {
      req.body.address = normalizeAddress({}, req.body);
    } else if (req.body.address && typeof req.body.address === 'object' && !Array.isArray(req.body.address)) {
      if (req.body.address.postalCode === undefined && req.body.address.pincode !== undefined) {
        req.body.address.postalCode = req.body.address.pincode;
      }
    }
  }
  next();
};

const registerValidator = [
  normalizeRegisterInput,
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .customSanitizer((v) => normalizeRole(v))
    .isIn(['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'])
    .withMessage('Role must be one of: DONOR, RECIPIENT, VOLUNTEER'),
  body('phone')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Phone number must be text')
    .trim()
    .custom((value, { req }) => {
      const role = normalizeRole(req.body.role || 'DONOR');
      const hasOrgSubmission = Boolean(req.body.organizationName && String(req.body.organizationName).trim());
      if (hasOrgSubmission && (role === 'DONOR' || role === 'RECIPIENT') && !value) {
        throw new Error('Contact phone number is required for organization registration');
      }
      if (value && !isValidPhone(value)) {
        throw new Error('Please provide a valid contact phone number (7 to 15 digits)');
      }
      return true;
    }),
  body('organizationName')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Organization name must be text')
    .trim()
    .custom((value, { req }) => {
      const role = normalizeRole(req.body.role || 'DONOR');
      if ((role === 'DONOR' || role === 'RECIPIENT') && req.body.organizationName !== undefined && !value) {
        throw new Error('Organization name is required');
      }
      return true;
    }),
  body('organizationType')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Organization type must be text')
    .trim()
    .custom((value, { req }) => {
      const role = normalizeRole(req.body.role || 'DONOR');
      if ((role === 'DONOR' || role === 'RECIPIENT') && value && !req.body.organizationName?.trim()) {
        throw new Error('Organization name is required when organization type is provided');
      }
      if (value && !normalizeOrgType(value)) {
        throw new Error(`Organization type must be one of: ${ORGANIZATION_TYPES.join(', ')}`);
      }
      return true;
    }),
  body('registrationNumber').optional({ values: 'null' }).isString().trim(),
  body('address')
    .optional({ values: 'null' })
    .custom((value, { req }) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Address must be an object');
      }
      const hasOrgSubmission = Boolean(req.body.organizationName && String(req.body.organizationName).trim());
      if (hasOrgSubmission && 'city' in value && !String(value.city || '').trim()) {
        throw new Error('City is required for organization address');
      }
      const postal = String(value.postalCode ?? value.pincode ?? '').trim();
      if (postal && !/^[A-Za-z0-9\s-]{4,10}$/.test(postal)) {
        throw new Error('Please provide a valid postal code / pincode');
      }
      return true;
    }),
];

const loginValidator = [
  body('email')
    .trim()
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
