const { validationResult } = require('express-validator');

/**
 * Middleware that checks for express-validator validation errors
 * Formats response consistently: { success: false, message: ... }
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.path ? `${err.path}: ` : ''}${err.msg}`)
      .join('; ');

    return res.status(400).json({
      success: false,
      message: `Validation failed: ${errorMessages}`,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = validate;
