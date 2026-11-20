/**
 * Centralized API error handling middleware
 * Returns clean, consistent error responses without leaking stack traces or internal secrets
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = Array.isArray(err.errors) ? err.errors : undefined;

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id ${err.value}`;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with this ${field} already exists`;
    errors = [{ field, message: `This ${field} is already registered` }];
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = err.statusCode || 400;
    const fieldErrors = Object.entries(err.errors || {}).map(([field, val]) => ({
      field,
      message: val.message,
    }));
    message = fieldErrors.map((e) => e.message).join(', ');
    errors = fieldErrors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Hide unexpected internal error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  const payload = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
