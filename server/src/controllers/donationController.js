const Donation = require('../models/Donation');
const User = require('../models/User');
const { rankDonationsForRecipient } = require('../services/donationService');
const { logAudit } = require('../services/auditService');

/**
 * Create a new surplus food donation
 * POST /api/donations
 */
const createDonation = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      totalQuantity,
      unit,
      prepDateTime,
      expiryDateTime,
      storageHandling,
      allergens,
      pickupLocation,
      pickupStartTime,
      pickupEndTime,
      imageUrl,
      safetyGuidelinesAccepted,
    } = req.body;

    const donation = new Donation({
      title,
      category,
      description,
      totalQuantity,
      availableQuantity: totalQuantity, // initially all is available
      reservedQuantity: 0,
      collectedQuantity: 0,
      unit,
      prepDateTime,
      expiryDateTime,
      storageHandling,
      allergens: allergens || [],
      pickupLocation,
      pickupStartTime,
      pickupEndTime,
      imageUrl: imageUrl || '',
      donor: req.user._id,
      organization: req.user.organization?._id || req.user.organization || null,
      safetyGuidelinesAccepted: Boolean(safetyGuidelinesAccepted),
      status: 'available',
    });

    await donation.save();
    await donation.populate('donor', 'name email phone');
    if (donation.organization) {
      await donation.populate('organization', 'name type');
    }

    await logAudit({
      action: 'DONATION_CREATED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Donation',
      entityId: donation._id,
      details: { title, totalQuantity, unit, category },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Surplus food donation published successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all available food donations with filtering, searching, and ranking
 * GET /api/donations
 */
const getDonations = async (req, res, next) => {
  try {
    const { search, category, status, minQuantity, lat, lng, sort } = req.query;

    const query = {
      isReported: { $ne: true }, // Don't show blocked/reported items by default
    };

    // Filter by status: default to available & partially_reserved with future deadline
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['available', 'partially_reserved'] };
      query.pickupEndTime = { $gt: new Date() };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (minQuantity) {
      query.availableQuantity = { $gte: Number(minQuantity) };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'pickupLocation.address.city': { $regex: search, $options: 'i' } },
      ];
    }

    let donations = await Donation.find(query)
      .populate('donor', 'name email phone avatar')
      .populate('organization', 'name type verificationStatus')
      .sort({ createdAt: -1 });

    // Location coordinates from query or from logged-in recipient
    let recipientLoc = null;
    if (lat && lng) {
      recipientLoc = { coordinates: [parseFloat(lng), parseFloat(lat)] };
    } else if (req.user?.location?.coordinates?.length === 2 && req.user.location.coordinates[0] !== 0) {
      recipientLoc = req.user.location;
    }

    // Rank donations using the matching service
    const rankedDonations = rankDonationsForRecipient(donations, recipientLoc);

    // Apply privacy masking for general discovery:
    // If not admin, and not the donor of the item, mask street address until reservation is approved
    const sanitized = rankedDonations.map((item) => {
      const isOwner = req.user && item.donor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return {
          ...item,
          pickupLocation: {
            ...item.pickupLocation,
            address: {
              city: item.pickupLocation?.address?.city || '',
              state: item.pickupLocation?.address?.state || '',
              postalCode: item.pickupLocation?.address?.postalCode || '',
              street: 'Available upon reservation approval',
            },
          },
        };
      }
      return item;
    });

    res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single donation details by ID
 * GET /api/donations/:id
 */
const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone avatar')
      .populate('organization', 'name type contactEmail contactPhone verificationStatus');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Food donation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current donor's own listings
 * GET /api/donations/my-donations
 */
const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('organization', 'name type')
      .sort({ createdAt: -1 });

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
 * Update an existing donation (only by the owner donor before it is collected)
 * PUT /api/donations/:id
 */
const updateDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Food donation not found',
      });
    }

    if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this food donation',
      });
    }

    if (donation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed donations cannot be edited',
      });
    }

    const updatableFields = [
      'title',
      'description',
      'category',
      'storageHandling',
      'allergens',
      'pickupStartTime',
      'pickupEndTime',
      'imageUrl',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        donation[field] = req.body[field];
      }
    });

    // If totalQuantity is updated, adjust availableQuantity ensuring invariant
    if (req.body.totalQuantity !== undefined) {
      const newTotal = Number(req.body.totalQuantity);
      const difference = newTotal - donation.totalQuantity;
      if (donation.availableQuantity + difference < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reduce total quantity below currently reserved/collected quantity',
        });
      }
      donation.totalQuantity = newTotal;
      donation.availableQuantity += difference;
    }

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report a suspicious or unsafe food donation listing
 * POST /api/donations/:id/report
 */
const reportDonation = async (req, res, next) => {
  try {
    const { reason, details } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Food donation not found',
      });
    }

    donation.reports.push({
      reportedBy: req.user._id,
      reason: reason || 'Suspicious listing or safety concern',
      details: details || '',
    });

    // If multiple reports, flag for admin review
    if (donation.reports.length >= 2) {
      donation.isReported = true;
    }

    await donation.save();

    await logAudit({
      action: 'DONATION_REPORTED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Donation',
      entityId: donation._id,
      details: { reason, details },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for helping keep the community safe. Our team will review this listing immediately.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  getMyDonations,
  updateDonation,
  reportDonation,
};

