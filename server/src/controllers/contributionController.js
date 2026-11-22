const VerifiedContribution = require('../models/VerifiedContribution');
const {
  getDonorContributionSummary,
  getDonorContributionHistory,
  getRecipientContributions,
  adminReviewContribution,
  reportDiscrepancy,
  getAdminContributionAnalytics,
} = require('../services/contributionService');

/**
 * Get current donor's verified contribution summary and recognition level
 * GET /api/contributions/my-summary
 */
const getMySummary = async (req, res, next) => {
  try {
    const summary = await getDonorContributionSummary(req.user._id);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current donor's paginated contribution history
 * GET /api/contributions/my-history
 */
const getMyHistory = async (req, res, next) => {
  try {
    const { page, limit, category, status, startDate, endDate } = req.query;
    const history = await getDonorContributionHistory(req.user._id, {
      page,
      limit,
      category,
      status,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single verified contribution
 * GET /api/contributions/:id
 */
const getContributionById = async (req, res, next) => {
  try {
    const contribution = await VerifiedContribution.findById(req.params.id)
      .populate('donor', 'name email organization')
      .populate('donorOrg', 'name type city')
      .populate('recipient', 'name email organization')
      .populate('recipientOrg', 'name type city address')
      .populate('donation', 'title category pickupLocation unit imageUrl')
      .populate('volunteer', 'name phone');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Verified contribution record not found',
      });
    }

    const userId = req.user._id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';
    const isDonor = contribution.donor?._id.toString() === userId;
    const isRecipient = contribution.recipient?._id.toString() === userId;

    if (!isAdmin && !isDonor && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this contribution detail',
      });
    }

    res.status(200).json({
      success: true,
      data: contribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recipient: Get received contributions history
 * GET /api/contributions/received
 */
const getReceivedContributions = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const data = await getRecipientContributions(req.user._id, { page, limit, status });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recipient / Admin: Report discrepancy on a contribution
 * POST /api/contributions/:id/discrepancy
 */
const reportContributionDiscrepancy = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const contribution = await reportDiscrepancy({
      contributionId: req.params.id,
      reportingUser: req.user,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'Discrepancy reported successfully. Record placed under review.',
      data: contribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all verified contributions with filters
 * GET /api/contributions/admin/all
 */
const adminGetAllContributions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, donorId, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (donorId) query.donor = donorId;
    if (search) {
      query.$or = [
        { contributionId: { $regex: search, $options: 'i' } },
        { foodTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      VerifiedContribution.find(query)
        .populate('donor', 'name email')
        .populate('donorOrg', 'name')
        .populate('recipient', 'name')
        .populate('recipientOrg', 'name')
        .populate('volunteer', 'name')
        .sort({ verifiedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      VerifiedContribution.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        records,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Review or reverse a contribution
 * PATCH /api/contributions/admin/:id/review
 */
const adminReview = async (req, res, next) => {
  try {
    const { action, reviewNotes, reversalReason } = req.body;
    const contribution = await adminReviewContribution({
      contributionId: req.params.id,
      adminUser: req.user,
      action,
      reviewNotes,
      reversalReason,
    });

    res.status(200).json({
      success: true,
      message: `Contribution status updated to ${contribution.status}`,
      data: contribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get contribution analytics
 * GET /api/contributions/admin/analytics
 */
const adminGetAnalytics = async (req, res, next) => {
  try {
    const analytics = await getAdminContributionAnalytics();
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySummary,
  getMyHistory,
  getContributionById,
  getReceivedContributions,
  reportContributionDiscrepancy,
  adminGetAllContributions,
  adminReview,
  adminGetAnalytics,
};
