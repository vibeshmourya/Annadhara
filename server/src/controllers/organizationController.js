const Organization = require('../models/Organization');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Normalize organization type helper
const normalizeOrgType = (type) => {
  if (!type) return 'Other';
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
 * Submit organization details (Starts with PENDING status)
 * POST /api/organizations
 */
const createOrganization = async (req, res, next) => {
  try {
    const {
      organizationName,
      name,
      organizationType,
      type,
      description,
      contactPerson,
      email,
      contactEmail,
      phone,
      contactPhone,
      address,
      location,
      registrationNumber,
    } = req.body;

    const orgName = (organizationName || name || '').trim();
    if (!orgName) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required',
      });
    }

    // Check if user already submitted an active organization
    const existingOrg = await Organization.findOne({ createdBy: req.user._id });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered an organization. Please update your existing organization instead.',
        data: existingOrg,
      });
    }

    const org = new Organization({
      organizationName: orgName,
      organizationType: normalizeOrgType(organizationType || type),
      description: (description || '').trim(),
      contactPerson: (contactPerson || req.user.name || '').trim(),
      email: (email || contactEmail || req.user.email).trim().toLowerCase(),
      phone: (phone || contactPhone || req.user.phone || '').trim(),
      address: address || {},
      location: location || { type: 'Point', coordinates: [0, 0] },
      registrationNumber: registrationNumber || '',
      verificationStatus: 'PENDING', // Always starts as PENDING per requirement
      submittedAt: new Date(),
      createdBy: req.user._id,
    });

    await org.save();

    // Link organization to user profile
    await User.findByIdAndUpdate(req.user._id, { organizationId: org._id });

    await logAudit({
      action: 'ORGANIZATION_SUBMITTED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Organization',
      entityId: org._id,
      details: { organizationName: org.organizationName, type: org.organizationType },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Organization details submitted successfully and pending verification',
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's organization
 * GET /api/organizations/me
 */
const getMyOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne({
      $or: [{ _id: req.user.organizationId }, { createdBy: req.user._id }],
    }).populate('reviewedBy', 'name email');

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'No organization associated with this account',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organization retrieved successfully',
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's organization
 * PATCH /api/organizations/me
 */
const updateMyOrganization = async (req, res, next) => {
  try {
    const { verificationStatus, reviewedBy, reviewedAt, ...updates } = req.body;

    // Security check: User cannot self-verify or modify administrative review fields
    if (verificationStatus || reviewedBy || reviewedAt) {
      return res.status(400).json({
        success: false,
        message: 'Modifying verificationStatus or administrative review data is not permitted',
      });
    }

    const org = await Organization.findOne({
      $or: [{ _id: req.user.organizationId }, { createdBy: req.user._id }],
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for this account',
      });
    }

    if (updates.organizationName || updates.name) {
      org.organizationName = (updates.organizationName || updates.name).trim();
    }
    if (updates.organizationType || updates.type) {
      org.organizationType = normalizeOrgType(updates.organizationType || updates.type);
    }
    if (updates.description !== undefined) org.description = updates.description.trim();
    if (updates.contactPerson !== undefined) org.contactPerson = updates.contactPerson.trim();
    if (updates.email || updates.contactEmail) {
      org.email = (updates.email || updates.contactEmail).trim().toLowerCase();
    }
    if (updates.phone || updates.contactPhone) {
      org.phone = (updates.phone || updates.contactPhone).trim();
    }
    if (updates.address && typeof updates.address === 'object') {
      org.address = { ...org.address, ...updates.address };
    }
    if (updates.registrationNumber !== undefined) org.registrationNumber = updates.registrationNumber.trim();

    await org.save();

    await logAudit({
      action: 'ORGANIZATION_UPDATED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Organization',
      entityId: org._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Organization details updated successfully',
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all registered organizations with optional status filter
 * GET /api/admin/organizations
 */
const getAdminOrganizations = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) {
      filter.verificationStatus = status.toUpperCase();
    }
    if (type) {
      filter.organizationType = type;
    }

    const organizations = await Organization.find(filter)
      .populate('createdBy', 'name email phone role')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Organizations retrieved successfully',
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Verify or reject an organization
 * PATCH /api/admin/organizations/:id/verification
 */
const verifyOrganizationByAdmin = async (req, res, next) => {
  try {
    const { status, notes, verificationNotes } = req.body;
    const targetStatus = (status || '').toUpperCase();

    if (!['VERIFIED', 'REJECTED'].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'VERIFIED' or 'REJECTED'",
      });
    }

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // State transition validation: cannot transition back to PENDING
    if (targetStatus === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset an organization back to PENDING verification status',
      });
    }

    const reviewNote = notes || verificationNotes || (targetStatus === 'VERIFIED' ? 'Approved by platform administrator' : 'Declined by platform administrator');

    organization.verificationStatus = targetStatus;
    organization.verificationNotes = reviewNote;
    organization.reviewedBy = req.user._id;
    organization.reviewedAt = new Date();
    await organization.save();

    // Sync isVerified flag on submitting user
    await User.findByIdAndUpdate(organization.createdBy, {
      isVerified: targetStatus === 'VERIFIED',
    });

    // Notify organization owner
    await createNotification({
      recipient: organization.createdBy,
      title: targetStatus === 'VERIFIED' ? 'Organization Verified!' : 'Organization Verification Update',
      message:
        targetStatus === 'VERIFIED'
          ? `Congratulations! ${organization.organizationName} has been verified. You can now participate fully in food donations and reservations.`
          : `Your organization verification was not approved. Note: ${reviewNote}`,
      type: 'org_verification',
      relatedId: organization._id,
      relatedModel: 'Organization',
    });

    await logAudit({
      action: `ORG_${targetStatus}`,
      user: req.user._id,
      role: req.user.role,
      entityType: 'Organization',
      entityId: organization._id,
      details: { status: targetStatus, notes: reviewNote },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Organization ${targetStatus.toLowerCase()} successfully`,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all verified organizations for discovery
 * GET /api/organizations
 */
const getOrganizations = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) {
      filter.verificationStatus = status.toUpperCase();
    } else if (!req.user || (req.user.role || '').toUpperCase() !== 'ADMIN') {
      filter.verificationStatus = 'VERIFIED';
    }

    if (type) {
      filter.organizationType = type;
    }

    const organizations = await Organization.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Organizations retrieved successfully',
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
    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', 'name email phone')
      .populate('reviewedBy', 'name email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organization retrieved successfully',
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganization,
  getMyOrganization,
  updateMyOrganization,
  getAdminOrganizations,
  verifyOrganizationByAdmin,
  getOrganizations,
  getOrganizationById,
};
