/**
 * Annadhara AI — Role-Aware Platform Intelligence Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Provides strictly allowlisted, read-only access to Annadhara platform data.
 *
 * Core Security & Invariant Rules:
 * 1. The LLM NEVER receives direct database access.
 * 2. No arbitrary Mongoose queries, filters, or collection names from client requests.
 * 3. Role isolation is absolute:
 *    - Donors access only their own donations, incoming reservation requests, and handover status.
 *    - Recipient NGOs access only their organization verification status, reservation history, and active pickups.
 *    - Volunteers access only their assigned transport missions.
 *    - Admins access aggregated platform metrics, verification queues, and audit summaries.
 * 4. Data minimization: Never exposes passwords, passwordHash, tokens, private secrets, or internal IDs.
 * 5. Strictly read-only: No state-mutating functions exist in this service.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const Reservation = require('../models/Reservation');
const PickupTask = require('../models/PickupTask');
const HandoverRecord = require('../models/HandoverRecord');
const AuditLog = require('../models/AuditLog');

/**
 * Checks if MongoDB is currently connected
 */
const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Retrieves sanitized, role-isolated donor data
 */
const getDonorData = async (userId, isTestUser = false) => {
  const simulatedData = {
    summary: {
      role: 'DONOR',
      totalDonations: 4,
      activeDonations: 2,
      pendingRequests: 1,
      completedDonations: 1,
      totalCollectedFood: '30 meals',
    },
    recentDonations: [
      { title: 'Vegetable Curry & Rice', category: 'cooked_meals', availableQuantity: 30, unit: 'meals', status: 'partially_reserved' },
      { title: 'Whole Wheat Roti Packs', category: 'bakery_grains', availableQuantity: 25, unit: 'boxes', status: 'available' },
    ],
    recentReservations: [
      { requestedQuantity: 10, unit: 'meals', status: 'approved', handoverCode: 'FB-7294', recipientName: 'Hope Harvest NGO' },
    ],
    isSimulated: true,
  };

  if (!isDbConnected() || isTestUser || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return simulatedData;
  }

  try {
    const [donations, reservations] = await Promise.all([
      Donation.find({ donor: userId })
        .select('title category dietaryType totalQuantity availableQuantity reservedQuantity collectedQuantity unit status pickupStartTime pickupEndTime createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Reservation.find({ donor: userId })
        .select('requestedQuantity unit status handoverCode requestNotes donorNotes approvedAt createdAt')
        .populate('recipient', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const activeDonations = donations.filter((d) => d.status === 'available' || d.status === 'partially_reserved').length;
    const completedDonations = donations.filter((d) => d.status === 'completed').length;
    const pendingRequests = reservations.filter((r) => r.status === 'pending').length;
    const totalCollected = donations.reduce((acc, d) => acc + (d.collectedQuantity || 0), 0);

    return {
      summary: {
        role: 'DONOR',
        totalDonations: donations.length,
        activeDonations,
        pendingRequests,
        completedDonations,
        totalCollectedQuantity: totalCollected,
      },
      recentDonations: donations.map((d) => ({
        title: d.title,
        category: d.category,
        dietaryType: d.dietaryType,
        availableQuantity: d.availableQuantity,
        reservedQuantity: d.reservedQuantity,
        collectedQuantity: d.collectedQuantity,
        unit: d.unit,
        status: d.status,
        pickupDeadline: d.pickupEndTime,
      })),
      recentReservations: reservations.map((r) => ({
        requestedQuantity: r.requestedQuantity,
        unit: r.unit,
        status: r.status,
        handoverCode: r.handoverCode,
        recipientName: r.recipient?.name || 'Authorized Recipient',
        notes: r.requestNotes || '',
      })),
      isSimulated: false,
    };
  } catch (err) {
    console.warn('[AIPlatformService] Error querying donor data, using simulated fallback:', err.message);
    return simulatedData;
  }
};

/**
 * Retrieves sanitized, role-isolated recipient NGO data
 */
const getRecipientData = async (userId, organizationId, isTestUser = false) => {
  const simulatedData = {
    summary: {
      role: 'RECIPIENT',
      organizationName: 'Hope Harvest Seva Trust',
      verificationStatus: 'VERIFIED',
      totalReservations: 3,
      activeReservations: 1,
      completedCollections: 2,
    },
    recentReservations: [
      { foodTitle: 'Vegetable Curry with Rice', requestedQuantity: 10, unit: 'meals', status: 'approved', handoverCode: 'FB-7294' },
      { foodTitle: 'Steamed Idli Packs', requestedQuantity: 30, unit: 'meals', status: 'completed', handoverCode: 'FB-3810' },
    ],
    isSimulated: true,
  };

  if (!isDbConnected() || isTestUser || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return simulatedData;
  }

  try {
    const orgQuery = organizationId && mongoose.Types.ObjectId.isValid(organizationId)
      ? Organization.findById(organizationId)
          .select('organizationName organizationType verificationStatus verificationNotes submittedAt reviewedAt')
          .lean()
      : Promise.resolve(null);

    const [reservations, organization] = await Promise.all([
      Reservation.find({ recipient: userId })
        .select('requestedQuantity unit status handoverCode requestNotes approvedAt completedAt createdAt')
        .populate('donation', 'title category unit pickupEndTime status')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      orgQuery,
    ]);

    const activeReservations = reservations.filter((r) => r.status === 'pending' || r.status === 'approved').length;
    const completedCollections = reservations.filter((r) => r.status === 'completed').length;

    return {
      summary: {
        role: 'RECIPIENT',
        organizationName: organization?.organizationName || 'Hope Harvest Seva Trust',
        organizationType: organization?.organizationType || 'Unspecified',
        verificationStatus: organization?.verificationStatus || 'PENDING',
        verificationNotes: organization?.verificationNotes || '',
        totalReservations: reservations.length,
        activeReservations,
        completedCollections,
      },
      recentReservations: reservations.map((r) => ({
        foodTitle: r.donation?.title || 'Surplus Food Listing',
        category: r.donation?.category || 'general',
        requestedQuantity: r.requestedQuantity,
        unit: r.unit,
        status: r.status,
        handoverCode: r.handoverCode,
        pickupDeadline: r.donation?.pickupEndTime,
      })),
      isSimulated: false,
    };
  } catch (err) {
    console.warn('[AIPlatformService] Error querying recipient data, using simulated fallback:', err.message);
    return simulatedData;
  }
};

/**
 * Retrieves sanitized, role-isolated volunteer data
 */
const getVolunteerData = async (userId, isTestUser = false) => {
  const simulatedData = {
    summary: {
      role: 'VOLUNTEER',
      assignedMissions: 1,
      completedMissions: 2,
      currentStatus: 'active',
    },
    recentTasks: [
      {
        taskStatus: 'assigned',
        foodTitle: 'Vegetable Curry with Rice',
        pickupCity: 'Bengaluru (Indiranagar)',
        deliveryCity: 'Bengaluru (Malleshwaram)',
        instructions: 'Pick up from Green Garden Bistro side kitchen door.',
      },
    ],
    isSimulated: true,
  };

  if (!isDbConnected() || isTestUser || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return simulatedData;
  }

  try {
    const tasks = await PickupTask.find({ volunteer: userId })
      .select('status instructions pickupWindowStart pickupWindowEnd assignedAt collectedAt completedAt pickupAddress deliveryAddress')
      .populate('donation', 'title category unit')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const assignedCount = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
    const completedCount = tasks.filter((t) => t.status === 'completed').length;

    return {
      summary: {
        role: 'VOLUNTEER',
        assignedMissions: assignedCount,
        completedMissions: completedCount,
        totalMissions: tasks.length,
      },
      recentTasks: tasks.map((t) => ({
        taskStatus: t.status,
        foodTitle: t.donation?.title || 'Food Transport Mission',
        category: t.donation?.category || 'general',
        pickupCity: `${t.pickupAddress?.city || 'Bengaluru'} (${t.pickupAddress?.street || ''})`,
        deliveryCity: `${t.deliveryAddress?.city || 'Bengaluru'} (${t.deliveryAddress?.street || ''})`,
        instructions: t.instructions || 'Handle food in thermal insulated carrier.',
        pickupWindow: t.pickupWindowEnd,
      })),
      isSimulated: false,
    };
  } catch (err) {
    console.warn('[AIPlatformService] Error querying volunteer data, using simulated fallback:', err.message);
    return simulatedData;
  }
};

/**
 * Retrieves aggregated, read-only administrator data
 */
const getAdminData = async () => {
  const simulatedData = {
    summary: {
      role: 'ADMIN',
      totalUsers: 8,
      registeredOrganizations: 4,
      pendingVerifications: 1,
      totalDonations: 12,
      activeDonations: 4,
      completedHandovers: 7,
      totalReservations: 9,
    },
    verificationQueue: [
      { organizationName: 'Community Care Shelter', organizationType: 'Community Kitchen', verificationStatus: 'PENDING' },
    ],
    recentAuditLogs: [
      { action: 'DONATION_CREATED', entityType: 'Donation', role: 'DONOR' },
      { action: 'RESERVATION_APPROVED', entityType: 'Reservation', role: 'DONOR' },
      { action: 'HANDOVER_VERIFIED', entityType: 'HandoverRecord', role: 'DONOR' },
    ],
    isSimulated: true,
  };

  if (!isDbConnected()) {
    return simulatedData;
  }

  try {
    const [
      totalUsers,
      registeredOrganizations,
      pendingVerifications,
      totalDonations,
      completedHandovers,
      activeDonations,
      totalReservations,
      pendingOrgs,
      auditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Organization.countDocuments({ verificationStatus: 'PENDING' }),
      Donation.countDocuments(),
      HandoverRecord.countDocuments(),
      Donation.countDocuments({ status: { $in: ['available', 'partially_reserved'] } }),
      Reservation.countDocuments(),
      Organization.find({ verificationStatus: 'PENDING' })
        .select('organizationName organizationType submittedAt email phone')
        .limit(5)
        .lean(),
      AuditLog.find()
        .select('action entityType role createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      summary: {
        role: 'ADMIN',
        totalUsers,
        registeredOrganizations,
        pendingVerifications,
        totalDonations,
        activeDonations,
        completedHandovers,
        totalReservations,
      },
      verificationQueue: pendingOrgs.map((org) => ({
        organizationName: org.organizationName,
        organizationType: org.organizationType,
        submittedAt: org.submittedAt,
      })),
      recentAuditLogs: auditLogs.map((log) => ({
        action: log.action,
        entityType: log.entityType,
        role: log.role,
        timestamp: log.createdAt,
      })),
      isSimulated: false,
    };
  } catch (err) {
    console.warn('[AIPlatformService] Error querying admin data, using simulated fallback:', err.message);
    return simulatedData;
  }
};

/**
 * Top-level dispatcher enforcing role-based data isolation
 *
 * @param {Object} user - Authenticated user from verified JWT
 * @returns {Promise<Object>} Role-authorized sanitized platform context
 */
const getAuthorizedPlatformContext = async (user) => {
  if (!user) {
    throw new Error('Authentication required to access platform data');
  }

  const roleUpper = (user.role || '').toUpperCase();
  const userId = user._id || user.id;
  const orgId = user.organizationId || user.organization;
  const isTest = Boolean(user.isTestUser);

  switch (roleUpper) {
    case 'DONOR':
      return await getDonorData(userId, isTest);
    case 'RECIPIENT':
      return await getRecipientData(userId, orgId, isTest);
    case 'VOLUNTEER':
      return await getVolunteerData(userId, isTest);
    case 'ADMIN':
      return await getAdminData();
    default:
      return {
        summary: { role: 'MEMBER', message: 'Standard platform member without specialized role data' },
        isSimulated: true,
      };
  }
};

module.exports = {
  getDonorData,
  getRecipientData,
  getVolunteerData,
  getAdminData,
  getAuthorizedPlatformContext,
  isDbConnected,
};
