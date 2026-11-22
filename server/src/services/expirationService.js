const Donation = require('../models/Donation');
const Reservation = require('../models/Reservation');

/**
 * Automated Expiry Service
 * Automatically marks donations as 'expired' once their pickup deadline passes
 * and cancels dangling unapproved reservations to keep inventory clean and accurate.
 */
let expirationTimer = null;

const runExpirationCheck = async () => {
  try {
    const now = new Date();

    // 1. Find all active donations whose pickup deadline has passed
    const pastDeadlineDonations = await Donation.find({
      pickupEndTime: { $lt: now },
      status: { $in: ['available', 'partially_reserved', 'fully_reserved'] },
    });

    for (const donation of pastDeadlineDonations) {
      // Find all pending (unapproved) reservations for this donation
      const pendingReservations = await Reservation.find({
        donation: donation._id,
        status: 'pending',
      });

      for (const resv of pendingReservations) {
        resv.status = 'cancelled';
        resv.cancellationReason = 'Donation pickup window expired before donor approval';
        await resv.save();
      }

      // Check remaining approved reservations
      const approvedReservations = await Reservation.find({
        donation: donation._id,
        status: 'approved',
      });
      const activeApprovedQuantity = approvedReservations.reduce((sum, r) => sum + r.requestedQuantity, 0);

      // Reconcile quantities to strictly preserve the inventory invariant:
      // totalQuantity = availableQuantity + reservedQuantity + collectedQuantity
      donation.reservedQuantity = activeApprovedQuantity;
      donation.availableQuantity = Math.max(
        0,
        donation.totalQuantity - donation.collectedQuantity - donation.reservedQuantity
      );
      donation.status = 'expired';
      await donation.save();
    }

    // 2. Cancel orphan pending reservations on expired or missing donations
    const danglingReservations = await Reservation.find({
      status: 'pending',
    }).populate('donation', 'pickupEndTime status');

    for (const resv of danglingReservations) {
      if (
        !resv.donation ||
        resv.donation.status === 'expired' ||
        (resv.donation.pickupEndTime && resv.donation.pickupEndTime < now)
      ) {
        resv.status = 'cancelled';
        resv.cancellationReason = 'Donation pickup window expired before donor approval';
        await resv.save();
      }
    }
  } catch (error) {
    // Non-fatal logging for background job
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[ExpirationService] Error during automated expiration cycle:', error.message);
    }
  }
};

/**
 * Start the background expiration interval timer
 * @param {number} intervalMs - interval in milliseconds (default: 5 minutes)
 */
const startExpirationJob = (intervalMs = 5 * 60 * 1000) => {
  if (expirationTimer) return;
  // Run an immediate pass on startup
  runExpirationCheck();
  expirationTimer = setInterval(runExpirationCheck, intervalMs);
  if (expirationTimer.unref) {
    expirationTimer.unref(); // Don't prevent process from exiting
  }
};

const stopExpirationJob = () => {
  if (expirationTimer) {
    clearInterval(expirationTimer);
    expirationTimer = null;
  }
};

module.exports = {
  runExpirationCheck,
  startExpirationJob,
  stopExpirationJob,
};
