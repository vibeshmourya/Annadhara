const crypto = require('crypto');
const VerifiedContribution = require('../models/VerifiedContribution');
const HandoverRecord = require('../models/HandoverRecord');
const Reservation = require('../models/Reservation');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { logAudit } = require('./auditService');

/**
 * Configurable Recognition Tiers
 * Calculated purely from actual verified handovers (never from posted or unverified donations).
 */
const RECOGNITION_TIERS = [
  {
    level: 1,
    id: 'starter',
    name: 'Kindness Starter',
    minContributions: 1,
    badgeColor: '#2E7D5B',
    description: 'First successfully verified food rescue contribution.',
  },
  {
    level: 2,
    id: 'friend',
    name: 'Food Friend',
    minContributions: 5,
    badgeColor: '#205B43',
    description: 'Five verified food rescue contributions preventing community hunger.',
  },
  {
    level: 3,
    id: 'supporter',
    name: 'Community Supporter',
    minContributions: 10,
    badgeColor: '#1E6B52',
    description: 'Ten verified contributions strengthening the local food rescue network.',
  },
  {
    level: 4,
    id: 'champion',
    name: 'Annadhara Champion',
    minContributions: 25,
    badgeColor: '#C97A1E',
    description: 'Twenty-five verified contributions ensuring consistent surplus nutrition.',
  },
  {
    level: 5,
    id: 'ambassador',
    name: 'Food Rescue Ambassador',
    minContributions: 50,
    badgeColor: '#6B46C1',
    description: 'Fifty verified contributions championing zero-waste sustainability.',
  },
];

/**
 * Calculates current recognition tier and progress based on verified contribution count
 */
const calculateRecognitionLevel = (verifiedCount = 0) => {
  let currentTier = null;
  let nextTier = null;

  for (let i = 0; i < RECOGNITION_TIERS.length; i++) {
    if (verifiedCount >= RECOGNITION_TIERS[i].minContributions) {
      currentTier = RECOGNITION_TIERS[i];
    } else {
      nextTier = RECOGNITION_TIERS[i];
      break;
    }
  }

  let progressPercentage = 100;
  let contributionsNeeded = 0;

  if (nextTier) {
    const prevThreshold = currentTier ? currentTier.minContributions : 0;
    const range = nextTier.minContributions - prevThreshold;
    const progress = verifiedCount - prevThreshold;
    progressPercentage = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
    contributionsNeeded = nextTier.minContributions - verifiedCount;
  }

  return {
    currentTier: currentTier || {
      level: 0,
      id: 'none',
      name: 'Aspiring Contributor',
      minContributions: 0,
      badgeColor: '#718078',
      description: 'Ready to make your first verified food donation contribution.',
    },
    nextTier,
    progressPercentage,
    contributionsNeeded,
    verifiedCount,
  };
};

/**
 * Generates an unambiguous, human-readable unique Contribution ID
 * e.g. VC-20261121-8F3A
 */
const generateContributionId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `VC-${dateStr}-${randomSuffix}`;
};

/**
 * Atomically records a Verified Contribution from an authentic HandoverRecord
 * Safe against duplicate requests (enforces 1-to-1 unique mapping)
 */
const recordVerifiedContribution = async (handoverRecordId, options = {}) => {
  const { session = null, actorId = null } = options;

  // 1. Check if contribution already exists for this handover record
  let existingContribution = await VerifiedContribution.findOne({
    handoverRecord: handoverRecordId,
  });

  if (existingContribution) {
    return {
      success: true,
      contribution: existingContribution,
      isNew: false,
    };
  }

  // 2. Fetch full HandoverRecord
  const handover = await HandoverRecord.findById(handoverRecordId)
    .populate({
      path: 'reservation',
      select: 'requestedQuantity unit donor recipient recipientOrg donation handoverCode deliveryCode',
      populate: [
        { path: 'donation', select: 'title category unit donor' },
        { path: 'donor', select: 'name email organization' },
        { path: 'recipient', select: 'name email organization' },
        { path: 'recipientOrg', select: 'name type' },
      ],
    })
    .session(session);

  if (!handover) {
    throw new Error('Handover record not found');
  }

  const reservation = handover.reservation;
  const donation = reservation?.donation;

  if (!reservation || !donation) {
    throw new Error('Associated reservation or donation record is missing for this handover');
  }

  // 3. Count donor's current verified contributions to detect milestone achievement
  const priorVerifiedCount = await VerifiedContribution.countDocuments({
    donor: handover.donor,
    status: 'VERIFIED',
  });

  const contributionId = generateContributionId();

  // 4. Create VerifiedContribution
  const newContribution = new VerifiedContribution({
    contributionId,
    handoverRecord: handover._id,
    donation: donation._id,
    reservation: reservation._id,
    donor: handover.donor,
    donorOrg: reservation.donor?.organization || null,
    recipient: handover.recipient,
    recipientOrg: reservation.recipientOrg?._id || null,
    volunteer: handover.volunteer || null,
    foodTitle: donation.title,
    category: donation.category,
    quantity: handover.quantityHandedOver || reservation.requestedQuantity,
    unit: handover.unit || reservation.unit,
    verificationMethod: handover.verificationMethod || 'code',
    verifiedAt: handover.deliveryConfirmedAt || handover.donorConfirmedAt || new Date(),
    status: 'VERIFIED',
    auditTrail: [
      {
        action: 'CONTRIBUTION_VERIFIED',
        actor: actorId || handover.volunteer || handover.donor,
        actorRole: 'SYSTEM',
        timestamp: new Date(),
        details: {
          handoverId: handover._id,
          quantity: handover.quantityHandedOver,
          method: handover.verificationMethod,
        },
      },
    ],
  });

  await newContribution.save({ session });

  // 5. Evaluate if a new recognition tier was unlocked
  const newVerifiedCount = priorVerifiedCount + 1;
  const oldRecognition = calculateRecognitionLevel(priorVerifiedCount);
  const newRecognition = calculateRecognitionLevel(newVerifiedCount);

  const recipientName = reservation.recipientOrg?.name || reservation.recipient?.name || 'community shelter';

  // Dispatch standard verified contribution notification
  await createNotification({
    recipient: handover.donor,
    title: 'Contribution Verified! 🌿',
    message: `Your donation of ${newContribution.quantity} ${newContribution.unit} of "${donation.title}" has been verified as successfully received by ${recipientName}. Thank you for making a real difference!`,
    type: 'contribution_verified',
    relatedId: newContribution._id,
    relatedModel: 'VerifiedContribution',
    actionUrl: '/dashboard',
  });

  // If milestone level unlocked, send a celebration notification
  if (newRecognition.currentTier.level > oldRecognition.currentTier.level) {
    await createNotification({
      recipient: handover.donor,
      title: 'Recognition Level Achieved! 🏆',
      message: `Congratulations! You have reached the "${newRecognition.currentTier.name}" recognition level with ${newVerifiedCount} verified food rescue contributions.`,
      type: 'recognition_milestone',
      relatedId: newContribution._id,
      relatedModel: 'VerifiedContribution',
      actionUrl: '/dashboard',
    });
  }

  await logAudit({
    action: 'VERIFIED_CONTRIBUTION_RECORDED',
    user: actorId || handover.donor,
    role: 'DONOR',
    entityType: 'VerifiedContribution',
    entityId: newContribution._id,
    details: {
      contributionId,
      quantity: newContribution.quantity,
      unit: newContribution.unit,
      donor: handover.donor,
      newVerifiedCount,
      tier: newRecognition.currentTier.name,
    },
  });

  return {
    success: true,
    contribution: newContribution,
    isNew: true,
    recognition: newRecognition,
  };
};

/**
 * Retrieves a donor's verified contribution summary and recognition tier
 */
const getDonorContributionSummary = async (donorId) => {
  const contributions = await VerifiedContribution.find({
    donor: donorId,
    status: 'VERIFIED',
  })
    .populate('recipientOrg', 'name type')
    .sort({ verifiedAt: -1 });

  const totalVerifiedHandovers = contributions.length;

  let totalVerifiedQuantity = 0;
  const organizationsSet = new Set();
  const categoriesSet = new Set();

  contributions.forEach((c) => {
    totalVerifiedQuantity += Number(c.quantity) || 0;
    if (c.recipientOrg?._id) {
      organizationsSet.add(c.recipientOrg._id.toString());
    } else if (c.recipient) {
      organizationsSet.add(c.recipient.toString());
    }
    if (c.category) {
      categoriesSet.add(c.category);
    }
  });

  // Format recent chronological timeline
  const recentTimeline = contributions.slice(0, 10).map((c) => ({
    id: c._id,
    contributionId: c.contributionId,
    foodTitle: c.foodTitle,
    category: c.category,
    quantity: c.quantity,
    unit: c.unit,
    recipientName: c.recipientOrg?.name || 'Verified Recipient',
    verifiedAt: c.verifiedAt,
    verificationMethod: c.verificationMethod,
    status: c.status,
  }));

  const recognition = calculateRecognitionLevel(totalVerifiedHandovers);

  return {
    totalVerifiedHandovers,
    totalVerifiedQuantity: Math.round(totalVerifiedQuantity * 10) / 10,
    organizationsSupportedCount: organizationsSet.size,
    foodCategoriesCount: categoriesSet.size,
    recognition,
    recentTimeline,
  };
};

/**
 * Retrieves paginated contribution history for a donor with filters
 */
const getDonorContributionHistory = async (donorId, filters = {}) => {
  const { page = 1, limit = 15, category, status, startDate, endDate } = filters;

  const query = { donor: donorId };

  if (status) {
    query.status = status;
  }
  if (category) {
    query.category = category;
  }
  if (startDate || endDate) {
    query.verifiedAt = {};
    if (startDate) query.verifiedAt.$gte = new Date(startDate);
    if (endDate) query.verifiedAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    VerifiedContribution.find(query)
      .populate('recipientOrg', 'name type city')
      .populate('donation', 'title category pickupLocation')
      .sort({ verifiedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VerifiedContribution.countDocuments(query),
  ]);

  return {
    records,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Retrieves contributions received by a recipient organization
 * Safe representation: hides donor phone/private contact details
 */
const getRecipientContributions = async (recipientId, filters = {}) => {
  const { page = 1, limit = 15, status = 'VERIFIED' } = filters;

  const user = await User.findById(recipientId).populate('organization');
  const orgId = user?.organization?._id || user?.organization;

  const query = {
    $or: [{ recipient: recipientId }, ...(orgId ? [{ recipientOrg: orgId }] : [])],
  };

  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    VerifiedContribution.find(query)
      .populate('donor', 'name')
      .populate('donorOrg', 'name type city')
      .populate('donation', 'title category unit')
      .sort({ verifiedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VerifiedContribution.countDocuments(query),
  ]);

  return {
    records: records.map((r) => ({
      _id: r._id,
      contributionId: r.contributionId,
      foodTitle: r.foodTitle,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      donorName: r.donorOrg?.name || r.donor?.name || 'Verified Donor',
      verifiedAt: r.verifiedAt,
      verificationMethod: r.verificationMethod,
      status: r.status,
      discrepancyCount: r.discrepancyReports?.length || 0,
    })),
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Administrator review and reversal of a verified contribution
 */
const adminReviewContribution = async (params) => {
  const { contributionId, adminUser, action, reviewNotes = '', reversalReason = '' } = params;

  const contribution = await VerifiedContribution.findById(contributionId);
  if (!contribution) {
    throw new Error('Verified contribution record not found');
  }

  const prevStatus = contribution.status;

  if (action === 'reverse') {
    if (!reversalReason.trim()) {
      throw new Error('A detailed reason is mandatory when reversing a verified contribution');
    }
    contribution.status = 'REVERSED';
    contribution.reversalReason = reversalReason.trim();
    contribution.reversedBy = adminUser._id;
    contribution.reversedAt = new Date();
  } else if (action === 'under_review') {
    contribution.status = 'UNDER_REVIEW';
    contribution.reviewNotes = reviewNotes.trim();
    contribution.reviewedBy = adminUser._id;
    contribution.reviewedAt = new Date();
  } else if (action === 'mark_verified') {
    contribution.status = 'VERIFIED';
    contribution.reviewNotes = reviewNotes.trim() || 'Verified by administrator review';
    contribution.reviewedBy = adminUser._id;
    contribution.reviewedAt = new Date();
  } else {
    throw new Error(`Unsupported review action: ${action}`);
  }

  contribution.auditTrail.push({
    action: `STATUS_CHANGED_TO_${contribution.status}`,
    actor: adminUser._id,
    actorRole: 'ADMIN',
    timestamp: new Date(),
    details: {
      prevStatus,
      newStatus: contribution.status,
      notes: reviewNotes,
      reversalReason,
    },
  });

  await contribution.save();

  // Notify donor if contribution was flagged or reversed
  if (contribution.status === 'REVERSED') {
    await createNotification({
      recipient: contribution.donor,
      title: 'Contribution Status Update',
      message: `Contribution ${contribution.contributionId} (${contribution.quantity} ${contribution.unit}) was reversed by platform administrators. Reason: ${reversalReason}`,
      type: 'contribution_reversed',
      relatedId: contribution._id,
      relatedModel: 'VerifiedContribution',
      actionUrl: '/dashboard',
    });
  }

  await logAudit({
    action: `CONTRIBUTION_${contribution.status}`,
    user: adminUser._id,
    role: 'ADMIN',
    entityType: 'VerifiedContribution',
    entityId: contribution._id,
    details: {
      contributionId: contribution.contributionId,
      prevStatus,
      newStatus: contribution.status,
      reason: reversalReason || reviewNotes,
    },
  });

  return contribution;
};

/**
 * Report a discrepancy on a contribution (used by recipient or admin)
 */
const reportDiscrepancy = async (params) => {
  const { contributionId, reportingUser, reason } = params;

  if (!reason || !reason.trim()) {
    throw new Error('Please provide details of the observed discrepancy');
  }

  const contribution = await VerifiedContribution.findById(contributionId);
  if (!contribution) {
    throw new Error('Verified contribution record not found');
  }

  contribution.discrepancyReports.push({
    reportedBy: reportingUser._id,
    reason: reason.trim(),
    status: 'PENDING',
    reportedAt: new Date(),
  });

  contribution.status = 'UNDER_REVIEW';
  contribution.auditTrail.push({
    action: 'DISCREPANCY_REPORTED',
    actor: reportingUser._id,
    actorRole: reportingUser.role,
    timestamp: new Date(),
    details: { reason },
  });

  await contribution.save();

  await logAudit({
    action: 'CONTRIBUTION_DISCREPANCY_REPORTED',
    user: reportingUser._id,
    role: reportingUser.role,
    entityType: 'VerifiedContribution',
    entityId: contribution._id,
    details: { contributionId: contribution.contributionId, reason },
  });

  return contribution;
};

/**
 * Administrator analytics across all verified contributions
 */
const getAdminContributionAnalytics = async () => {
  const [totalRecords, statusCounts, volumeResult, activeDonors] = await Promise.all([
    VerifiedContribution.countDocuments(),
    VerifiedContribution.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    VerifiedContribution.aggregate([
      { $match: { status: 'VERIFIED' } },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } },
    ]),
    VerifiedContribution.distinct('donor', { status: 'VERIFIED' }),
  ]);

  const statusMap = { VERIFIED: 0, UNDER_REVIEW: 0, REVERSED: 0 };
  statusCounts.forEach((s) => {
    if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count;
  });

  const totalQuantityRescued = volumeResult[0]?.totalQuantity
    ? Math.round(volumeResult[0].totalQuantity * 10) / 10
    : 0;

  // Donor level distribution
  const donorContributions = await VerifiedContribution.aggregate([
    { $match: { status: 'VERIFIED' } },
    { $group: { _id: '$donor', count: { $sum: 1 } } },
  ]);

  const levelDistribution = {
    'Kindness Starter (1-4)': 0,
    'Food Friend (5-9)': 0,
    'Community Supporter (10-24)': 0,
    'Annadhara Champion (25-49)': 0,
    'Food Rescue Ambassador (50+)': 0,
  };

  donorContributions.forEach((d) => {
    if (d.count >= 50) levelDistribution['Food Rescue Ambassador (50+)']++;
    else if (d.count >= 25) levelDistribution['Annadhara Champion (25-49)']++;
    else if (d.count >= 10) levelDistribution['Community Supporter (10-24)']++;
    else if (d.count >= 5) levelDistribution['Food Friend (5-9)']++;
    else if (d.count >= 1) levelDistribution['Kindness Starter (1-4)']++;
  });

  return {
    totalRecords,
    verifiedCount: statusMap.VERIFIED,
    underReviewCount: statusMap.UNDER_REVIEW,
    reversedCount: statusMap.REVERSED,
    totalQuantityRescued,
    activeContributingDonors: activeDonors.length,
    levelDistribution,
    tiers: RECOGNITION_TIERS,
  };
};

module.exports = {
  RECOGNITION_TIERS,
  calculateRecognitionLevel,
  recordVerifiedContribution,
  getDonorContributionSummary,
  getDonorContributionHistory,
  getRecipientContributions,
  adminReviewContribution,
  reportDiscrepancy,
  getAdminContributionAnalytics,
};
