const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { logAudit } = require('../services/auditService');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, organizationName, organizationType, registrationNumber } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Create user record
    const user = new User({
      name,
      email,
      password,
      role,
      phone: phone || '',
      address: address || {},
      isVerified: role === 'donor' || role === 'volunteer', // Recipients require admin verification by default
    });

    await user.save();

    // If organization details provided for donor or recipient, create organization
    if (organizationName && (role === 'donor' || role === 'recipient')) {
      const org = await Organization.create({
        name: organizationName,
        type: organizationType || (role === 'donor' ? 'restaurant' : 'ngo'),
        registrationNumber: registrationNumber || '',
        contactEmail: email,
        contactPhone: phone || '',
        address: address || {},
        verificationStatus: role === 'donor' ? 'verified' : 'pending', // NGOs undergo verification
        createdBy: user._id,
      });

      user.organization = org._id;
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    // Audit log
    await logAudit({
      action: 'USER_REGISTERED',
      user: user._id,
      role: user.role,
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    // Populate organization before responding
    await user.populate('organization');

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user,
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

    const user = await User.findOne({ email }).select('+password').populate('organization');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact platform support.',
      });
    }

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
    const user = await User.findById(req.user._id).populate('organization');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, coordinates } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address) updates.address = address;
    if (coordinates && coordinates.length === 2) {
      updates.location = {
        type: 'Point',
        coordinates,
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate('organization');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};

