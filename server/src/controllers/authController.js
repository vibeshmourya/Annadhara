const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { logAudit } = require('../services/auditService');
const { revokeToken } = require('../services/tokenService');
const {
  ORGANIZATION_TYPES,
  normalizeRole,
  normalizeOrgType,
  normalizeAddress,
} = require('../utils/validationHelpers');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role ? role.toUpperCase() : 'DONOR' },
    process.env.JWT_SECRET || 'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Formats Mongoose ValidationError into structured { message, errors } payload.
 */
const formatValidationErrors = (validationErr, prefix = '') => {
  const errors = Object.entries(validationErr.errors || {}).map(([field, detail]) => ({
    field,
    message: detail.message,
  }));
  const joined = errors.map((e) => e.message).join(', ');
  return {
    message: prefix ? `${prefix}: ${joined}` : joined,
    errors,
  };
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  let savedUserId = null;

  try {
    const rawName = req.body.name ?? req.body.fullName ?? '';
    const name = String(rawName).trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    const rawPhone = req.body.phone ?? req.body.contactPhone ?? '';
    const phone = String(rawPhone || '').trim();
    const rawRegNo = req.body.registrationNumber ?? req.body.registrationId ?? '';
    const registrationNumber = String(rawRegNo || '').trim();
    const normalizedAddress = normalizeAddress(req.body.address, req.body);

    const orgName = req.body.organizationName ? String(req.body.organizationName).trim() : '';
    const orgTypeRaw = req.body.organizationType ?? req.body.type ?? '';

    // Normalize role to uppercase (supporting FOOD_DONOR / RECIPIENT_NGO aliases)
    const requestedRole = normalizeRole(req.body.role || 'DONOR');

    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth][Register] Request payload summary:', {
        name,
        email,
        role: requestedRole,
        hasPhone: Boolean(phone),
        organizationName: orgName || null,
        organizationType: orgTypeRaw || null,
        city: normalizedAddress.city || null,
      });
    }

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
        errors: [{ field: 'role', message: 'Role must be one of: DONOR, RECIPIENT, VOLUNTEER' }],
      });
    }

    // Check duplicate email (409 Conflict)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
        errors: [{ field: 'email', message: 'This email address is already registered' }],
      });
    }

    const shouldCreateOrg = Boolean(orgName) && (requestedRole === 'DONOR' || requestedRole === 'RECIPIENT');
    let org = null;

    // Prepare user instance (validation runs before any writes)
    const user = new User({
      name,
      email,
      phone,
      role: requestedRole,
      accountStatus: 'ACTIVE',
      address: normalizedAddress,
      isVerified: requestedRole === 'DONOR' || requestedRole === 'VOLUNTEER',
    });
    user.password = password;

    if (shouldCreateOrg) {
      if (!phone) {
        return res.status(422).json({
          success: false,
          message: 'Organization validation failed: Contact phone number is required',
          errors: [{ field: 'phone', message: 'Organization contact phone is required' }],
        });
      }

      const defaultOrgType = requestedRole === 'DONOR' ? 'Restaurant' : 'NGO';
      const normalizedOrgType = normalizeOrgType(orgTypeRaw, defaultOrgType);
      if (!normalizedOrgType) {
        return res.status(422).json({
          success: false,
          message: `Organization validation failed: Invalid organization type "${orgTypeRaw}"`,
          errors: [
            {
              field: 'organizationType',
              message: `Organization type must be one of: ${ORGANIZATION_TYPES.join(', ')}`,
            },
          ],
        });
      }

      const rawFssai = req.body.fssaiNumber ?? req.body.fssaiLicenseNumber ?? '';
      const fssaiNumber = String(rawFssai || '').trim();

      org = new Organization({
        organizationName: orgName,
        organizationType: normalizedOrgType,
        registrationNumber,
        fssaiNumber,
        contactPerson: name,
        email,
        phone,
        address: normalizedAddress,
        verificationStatus: requestedRole === 'DONOR' ? 'VERIFIED' : 'PENDING',
        createdBy: user._id,
      });

      // Validate both User and Organization BEFORE writing to MongoDB so partial failures never orphan users
      await user.validate();
      try {
        await org.validate();
      } catch (orgValErr) {
        if (orgValErr.name === 'ValidationError') {
          const formatted = formatValidationErrors(orgValErr, 'Organization validation failed');
          return res.status(422).json({
            success: false,
            message: formatted.message,
            errors: formatted.errors,
          });
        }
        throw orgValErr;
      }
    }

    await user.save();
    savedUserId = user._id;

    if (org) {
      await org.save();
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
    // Rollback orphaned user record if organization save/linking failed unexpectedly after user save
    if (savedUserId) {
      try {
        await User.findByIdAndDelete(savedUserId);
      } catch (rollbackErr) {
        console.error('[Auth][Register] Rollback cleanup failed:', rollbackErr.message);
      }
    }
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
