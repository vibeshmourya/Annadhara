const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { logAudit } = require('../services/auditService');
const { revokeToken } = require('../services/tokenService');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role ? role.toUpperCase() : 'DONOR' },
    process.env.JWT_SECRET || 'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Normalize organization type string
const normalizeOrgType = (type, role) => {
  if (!type) return role === 'DONOR' ? 'Restaurant' : 'NGO';
  const lower = type.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.includes('restaurant')) return 'Restaurant';
  if (lower.includes('hotel')) return 'Hotel';
  if (lower.includes('canteen')) return 'College Canteen';
  if (lower.includes('event')) return 'Event Organizer';
  if (lower.includes('ngo')) return 'NGO';
  if (lower.includes('distribution') || lower.includes('foodbank')) return 'Food Distribution Organization';
  return 'Other';
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, organizationName, organizationType, registrationNumber } =
      req.body;

    // Normalize role to uppercase
    const requestedRole = (role || 'DONOR').toUpperCase();

    // Security requirement: Prevent public registration as ADMIN
    if (requestedRole === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Registration as ADMIN is not permitted through public registration',
      });
    }

    if (!['DONOR', 'RECIPIENT', 'VOLUNTEER'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be one of: DONOR, RECIPIENT, VOLUNTEER',
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Create user record (pre-save hashes plain password virtual into passwordHash)
    const user = new User({
      name,
      email,
      phone: phone || '',
      role: requestedRole,
      accountStatus: 'ACTIVE',
      address: address || {},
      isVerified: requestedRole === 'DONOR' || requestedRole === 'VOLUNTEER',
    });
    user.password = password;

    await user.save();

    // If organization details provided, create organization with PENDING status for NGOs, VERIFIED for Donors
    if (organizationName && (requestedRole === 'DONOR' || requestedRole === 'RECIPIENT')) {
      const org = await Organization.create({
        organizationName,
        organizationType: normalizeOrgType(organizationType, requestedRole),
        registrationNumber: registrationNumber || '',
        email,
        phone: phone || '',
        address: address || {},
        verificationStatus: requestedRole === 'DONOR' ? 'VERIFIED' : 'PENDING',
        createdBy: user._id,
      });

      user.organizationId = org._id;
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    await logAudit({
      action: 'USER_REGISTERED',
      user: user._id,
      role: user.role,
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    await user.populate('organizationId');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Explicitly select passwordHash
    const user = await User.findOne({ email }).select('+passwordHash').populate('organizationId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check accountStatus
    if (user.accountStatus === 'INACTIVE' || user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact platform support.',
      });
    }

    // Verify candidate password against passwordHash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    await logAudit({
      action: 'USER_LOGIN',
      user: user._id,
      role: user.role,
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organizationId');
    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invalidate user session
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.token) {
      revokeToken(req.token);
    }

    await logAudit({
      action: 'USER_LOGOUT',
      user: req.user?._id || null,
      role: req.user?.role || '',
      entityType: 'User',
      entityId: req.user?._id || null,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Token has been invalidated on the server.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
