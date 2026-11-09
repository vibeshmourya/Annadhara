const Organization = require('../models/Organization');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Get current user's organization or all verified organizations
 * GET /api/organizations
 */
const getOrganizations = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.verificationStatus = status;
    if (type) filter.type = type;

    // Non-admins only see verified organizations unless viewing their own
    if (req.user && req.user.role !== 'admin' && !status) {
      filter.verificationStatus = 'verified';
    }

    const organizations = await Organization.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get organization by ID
 * GET /api/organizations/:id
 */
const getOrganizationById = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id).populate('createdBy', 'name email phone');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update organization
 * PUT /api/organizations/:id
 */
const updateOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Check ownership or admin
    if (organization.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this organization',
      });
    }

    const allowedFields = ['name', 'contactPhone', 'contactEmail', 'registrationNumber', 'address', 'documents'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        organization[field] = req.body[field];
      }
    });

    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Organization details updated',
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Verify or reject organization
 * PATCH /api/organizations/:id/verify
 */
const verifyOrganization = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'verified' or 'rejected'",
      });
    }

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    organization.verificationStatus = status;
    organization.verificationNotes = notes || '';
    organization.verifiedBy = req.user._id;
    organization.verifiedAt = new Date();
    await organization.save();

    // Also update creator's isVerified flag
    await User.findByIdAndUpdate(organization.createdBy, {
      isVerified: status === 'verified',
    });

    // Notify organization owner
    await createNotification({
      recipient: organization.createdBy,
      title: status === 'verified' ? 'Organization Verified!' : 'Organization Verification Update',
      message:
        status === 'verified'
          ? `Congratulations! ${organization.name} has been verified. You can now reserve surplus food donations.`
          : `Your organization verification was not approved. Note: ${notes || 'Please contact admin'}`,
      type: 'org_verification',
      relatedId: organization._id,
      relatedModel: 'Organization',
    });

    await logAudit({
      action: `ORG_${status.toUpperCase()}`,
      user: req.user._id,
      role: req.user.role,
      entityType: 'Organization',
      entityId: organization._id,
      details: { status, notes },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Organization ${status} successfully`,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  verifyOrganization,
};

