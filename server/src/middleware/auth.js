const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Protect routes: verify JWT Bearer token and attach active user
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required to access this resource',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste');

    const user = await User.findById(decoded.id).populate('organization');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      error: error.message,
    });
  }
};

/**
 * Authorize role-based access
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to perform this action. Required: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

/**
 * Ensures recipient organization is verified before reserving food
 */
const requireVerifiedOrg = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next(); // Admins bypass
  }

  if (req.user.role === 'recipient') {
    if (!req.user.organization) {
      return res.status(403).json({
        success: false,
        message: 'You must link an organization to your recipient profile before reserving food',
      });
    }

    const org = await Organization.findById(req.user.organization);
    if (!org || org.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your organization must be verified by platform administrators before reserving surplus food',
        verificationStatus: org ? org.verificationStatus : 'none',
      });
    }
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireVerifiedOrg,
};

