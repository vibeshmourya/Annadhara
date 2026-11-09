const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { isTokenRevoked } = require('../services/tokenService');

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

  // Check if token has been explicitly invalidated (logged out)
  if (isTokenRevoked(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token has been invalidated. Please log in again.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste'
    );

    const user = await User.findById(decoded.id).populate('organization');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    if (user.accountStatus === 'INACTIVE' || user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token',
    });
  }
};

/**
 * Authorize role-based access
 * Supports both uppercase and lowercase role checks
 */
const authorize = (...roles) => {
  const normalizedAllowed = roles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = (req.user.role || '').toUpperCase();

    if (!normalizedAllowed.includes(userRole)) {
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
  const role = (req.user.role || '').toUpperCase();
  if (role === 'ADMIN') {
    return next(); // Admins bypass
  }

  if (role === 'RECIPIENT') {
    const orgId = req.user.organizationId || req.user.organization;
    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'You must link an organization to your recipient profile before reserving food',
      });
    }

    const org = await Organization.findById(orgId);
    if (!org || (org.verificationStatus || '').toUpperCase() !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        message: 'Your organization must be verified by platform administrators before reserving surplus food',
        verificationStatus: org ? org.verificationStatus : 'NONE',
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
