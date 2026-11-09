const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const Reservation = require('../models/Reservation');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../services/auditService');

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }

    const users = await User.find(query)
      .populate('organization', 'name type verificationStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active/deactivated status
 * PATCH /api/admin/users/:id/status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot deactivate their own account',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reported donations for safety review
 * GET /api/admin/reported-donations
 */
const getReportedDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({
      $or: [{ isReported: true }, { 'reports.0': { $exists: true } }],
    })
      .populate('donor', 'name email phone')
      .populate('reports.reportedBy', 'name email role')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve or dismiss a reported donation
 * PATCH /api/admin/donations/:id/resolve-report
 */
const resolveDonationReport = async (req, res, next) => {
  try {
    const { action, notes } = req.body; // 'dismiss' or 'cancel_listing'
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    if (action === 'cancel_listing') {
      donation.status = 'cancelled';
      donation.isReported = true;
    } else {
      donation.isReported = false;
      donation.reports = [];
    }

    await donation.save();

    await logAudit({
      action: action === 'cancel_listing' ? 'DONATION_REMOVED_BY_ADMIN' : 'DONATION_REPORT_DISMISSED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Donation',
      entityId: donation._id,
      details: { notes },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Listing report resolved with action: ${action}`,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get platform audit logs
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  getReportedDonations,
  resolveDonationReport,
  getAuditLogs,
};

