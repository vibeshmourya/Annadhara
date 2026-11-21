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

    // 1. Mark past-deadline donations as expired
    const expiredDonations = await Donation.updateMany(
      {
        pickupEndTime: { $lt: now },
        status: { $in: ['available', 'partially_reserved'] },
      },
      {
        $set: { status: 'expired' },
      }
    );

    // 2. Cancel pending unapproved reservations on expired donations
    const danglingReservations = await Reservation.find({
      status: 'pending',
    }).populate('donation', 'pickupEndTime status');

    for (const resv of danglingReservations) {
      if (!resv.donation || resv.donation.pickupEndTime < now || resv.donation.status === 'expired') {
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
