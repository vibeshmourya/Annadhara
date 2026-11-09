const User = require('../models/User');
const { logAudit } = require('../services/auditService');

/**
 * Get current user profile
 * GET /api/users/me
 */
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organizationId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user permitted profile information
 * PATCH /api/users/me
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone, address, coordinates, role, accountStatus, email } = req.body;

    // Security check: Disallow self-modification of privileges, role, email, or account status
    if (role || accountStatus || email) {
      return res.status(400).json({
        success: false,
        message: 'Modifying account role, email, or account status is not permitted through profile updates',
      });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (address && typeof address === 'object') updates.address = address;
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      updates.location = {
        type: 'Point',
        coordinates,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate('organizationId');

    await logAudit({
      action: 'USER_PROFILE_UPDATED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'User',
      entityId: req.user._id,
      details: updates,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};

