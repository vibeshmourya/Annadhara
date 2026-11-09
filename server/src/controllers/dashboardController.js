const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const Reservation = require('../models/Reservation');
const PickupTask = require('../models/PickupTask');
const HandoverRecord = require('../models/HandoverRecord');

/**
 * Get dashboard metrics tailored to the current user's role
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'donor') {
      const [totalDonations, activeDonations, pendingRequests, completedDonations, recentDonations, reservations] =
        await Promise.all([
          Donation.countDocuments({ donor: userId }),
          Donation.countDocuments({ donor: userId, status: { $in: ['available', 'partially_reserved'] } }),
          Reservation.countDocuments({ donor: userId, status: 'pending' }),
          Donation.countDocuments({ donor: userId, status: 'completed' }),
          Donation.find({ donor: userId }).sort({ createdAt: -1 }).limit(5),
          Reservation.find({ donor: userId })
            .populate('recipient', 'name email phone')
            .populate('donation', 'title unit')
            .sort({ createdAt: -1 })
            .limit(5),
        ]);

      // Calculate total collected food by summing collectedQuantity across donor's donations
      const collectedStats = await Donation.aggregate([
        { $match: { donor: userId } },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$collectedQuantity' },
            totalMealsEquivalent: {
              $sum: {
                $cond: [{ $eq: ['$unit', 'meals'] }, '$collectedQuantity', { $multiply: ['$collectedQuantity', 2.5] }],
              },
            },
          },
        },
      ]);

      const categoryDistribution = await Donation.aggregate([
        { $match: { donor: userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          role,
          totalDonations,
          activeDonations,
          pendingRequests,
          completedDonations,
          totalCollected: collectedStats[0]?.totalCollected || 0,
          totalMealsEquivalent: Math.round(collectedStats[0]?.totalMealsEquivalent || 0),
          recentDonations,
          recentReservations: reservations,
          categoryDistribution,
        },
      });
    }

    if (role === 'recipient') {
      const [availableFoodCount, activeReservations, upcomingPickups, completedCollections, recentReservations] =
        await Promise.all([
          Donation.countDocuments({
            status: { $in: ['available', 'partially_reserved'] },
            pickupEndTime: { $gt: new Date() },
          }),
          Reservation.countDocuments({ recipient: userId, status: { $in: ['pending', 'approved'] } }),
          PickupTask.countDocuments({ recipient: userId, status: { $in: ['pending', 'assigned', 'in_progress'] } }),
          Reservation.countDocuments({ recipient: userId, status: 'completed' }),
          Reservation.find({ recipient: userId })
            .populate('donation')
            .populate('donor', 'name email phone')
            .sort({ createdAt: -1 })
            .limit(5),
        ]);

      const mealsReceived = await Reservation.aggregate([
        { $match: { recipient: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$requestedQuantity' } } },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          role,
          availableFoodCount,
          activeReservations,
          upcomingPickups,
          completedCollections,
          totalMealsReceived: mealsReceived[0]?.total || 0,
          recentReservations,
        },
      });
    }

    if (role === 'volunteer') {
      const [assignedPickups, pendingTasks, completedPickups, recentPickups] = await Promise.all([
        PickupTask.countDocuments({ volunteer: userId, status: { $in: ['assigned', 'in_progress'] } }),
        PickupTask.countDocuments({ status: 'pending', volunteer: null }),
        PickupTask.countDocuments({ volunteer: userId, status: 'completed' }),
        PickupTask.find({ volunteer: userId })
          .populate('donation', 'title category pickupLocation unit')
          .populate('donor', 'name phone')
          .populate('recipient', 'name phone')
          .sort({ updatedAt: -1 })
          .limit(5),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          role,
          assignedPickups,
          pendingTasks,
          completedPickups,
          recentPickups,
        },
      });
    }

    if (role === 'admin') {
      const [
        totalUsers,
        registeredOrganizations,
        pendingVerifications,
        totalDonations,
        completedHandovers,
        activeDonations,
        totalReservations,
      ] = await Promise.all([
        User.countDocuments(),
        Organization.countDocuments(),
        Organization.countDocuments({ verificationStatus: 'pending' }),
        Donation.countDocuments(),
        HandoverRecord.countDocuments(),
        Donation.countDocuments({ status: { $in: ['available', 'partially_reserved'] } }),
        Reservation.countDocuments(),
      ]);

      // Category breakdown
      const donationsByCategory = await Donation.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);

      // Role distribution
      const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

      // Recent platform activity
      const recentDonations = await Donation.find().populate('donor', 'name').sort({ createdAt: -1 }).limit(5);

      return res.status(200).json({
        success: true,
        data: {
          role,
          totalUsers,
          registeredOrganizations,
          pendingVerifications,
          totalDonations,
          completedHandovers,
          activeDonations,
          totalReservations,
          donationsByCategory,
          usersByRole,
          recentDonations,
        },
      });
    }

    res.status(400).json({
      success: false,
      message: 'Unknown role',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};

