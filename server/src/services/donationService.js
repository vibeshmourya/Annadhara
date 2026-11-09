const Donation = require('../models/Donation');

/**
 * Calculates distance in kilometers between two lat/lng coordinates (Haversine formula)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Atomically reserves a quantity for a donation
 * Uses findOneAndUpdate with $gte condition to strictly prevent oversubscription race conditions
 */
async function reserveDonationQuantity(donationId, quantity) {
  const donation = await Donation.findOneAndUpdate(
    {
      _id: donationId,
      status: { $in: ['available', 'partially_reserved'] },
      pickupEndTime: { $gt: new Date() },
      availableQuantity: { $gte: quantity },
    },
    {
      $inc: {
        availableQuantity: -quantity,
        reservedQuantity: quantity,
      },
    },
    { new: true }
  );

  if (!donation) {
    // Determine why it failed
    const existing = await Donation.findById(donationId);
    if (!existing) throw new Error('Donation not found');
    if (existing.pickupEndTime <= new Date()) throw new Error('Donation pickup deadline has passed');
    if (existing.status === 'completed' || existing.status === 'cancelled') {
      throw new Error(`Donation is already ${existing.status}`);
    }
    if (existing.availableQuantity < quantity) {
      throw new Error(
        `Insufficient quantity. Requested ${quantity} ${existing.unit}, but only ${existing.availableQuantity} available`
      );
    }
    throw new Error('Unable to reserve requested quantity');
  }

  // Update status based on remaining available quantity
  let newStatus = donation.status;
  if (donation.availableQuantity === 0) {
    newStatus = 'fully_reserved';
  } else {
    newStatus = 'partially_reserved';
  }

  if (donation.status !== newStatus) {
    donation.status = newStatus;
    await donation.save();
  }

  return donation;
}

/**
 * Atomically releases a reserved quantity when a reservation is rejected or cancelled
 */
async function releaseReservedQuantity(donationId, quantity) {
  const donation = await Donation.findOneAndUpdate(
    { _id: donationId },
    {
      $inc: {
        availableQuantity: quantity,
        reservedQuantity: -quantity,
      },
    },
    { new: true }
  );

  if (!donation) return null;

  // Recompute status
  let newStatus = 'available';
  if (donation.availableQuantity < donation.totalQuantity && donation.availableQuantity > 0) {
    newStatus = 'partially_reserved';
  } else if (donation.availableQuantity === 0 && donation.reservedQuantity > 0) {
    newStatus = 'fully_reserved';
  }

  // Ensure invariants
  if (donation.availableQuantity < 0) donation.availableQuantity = 0;
  if (donation.reservedQuantity < 0) donation.reservedQuantity = 0;

  donation.status = newStatus;
  await donation.save();
  return donation;
}

/**
 * Atomically completes handover of reserved quantity to collected quantity
 */
async function completeHandoverQuantity(donationId, quantity) {
  const donation = await Donation.findOneAndUpdate(
    { _id: donationId },
    {
      $inc: {
        reservedQuantity: -quantity,
        collectedQuantity: quantity,
      },
    },
    { new: true }
  );

  if (!donation) return null;

  // Check if fully collected and complete
  if (donation.availableQuantity === 0 && donation.reservedQuantity <= 0) {
    donation.status = 'completed';
    donation.reservedQuantity = 0;
  }
  await donation.save();
  return donation;
}

/**
 * Explainable matching and ranking function
 */
function rankDonationsForRecipient(donations, recipientLocation = null, preferredCategories = []) {
  const now = new Date();

  return donations
    .map((donation) => {
      let score = 100;
      const reasons = [];

      // 1. Time urgency: items expiring sooner (within 6 hours) are prioritized to avoid food waste
      const hoursUntilPickupEnd = (new Date(donation.pickupEndTime) - now) / (1000 * 60 * 60);
      if (hoursUntilPickupEnd < 4) {
        score += 30;
        reasons.push('High urgency: pickup deadline soon');
      } else if (hoursUntilPickupEnd < 12) {
        score += 15;
        reasons.push('Expiring today');
      }

      // 2. Category preference
      if (preferredCategories.includes(donation.category)) {
        score += 25;
        reasons.push('Matches organization category need');
      }

      // 3. Distance scoring (if recipient location available)
      let distanceKm = null;
      if (
        recipientLocation &&
        recipientLocation.coordinates &&
        recipientLocation.coordinates.length === 2 &&
        donation.pickupLocation?.location?.coordinates?.length === 2
      ) {
        const [recLng, recLat] = recipientLocation.coordinates;
        const [donLng, donLat] = donation.pickupLocation.location.coordinates;
        distanceKm = calculateDistanceKm(recLat, recLng, donLat, donLng);

        if (distanceKm !== null) {
          if (distanceKm <= 5) {
            score += 25;
            reasons.push(`Nearby: ${distanceKm} km away`);
          } else if (distanceKm <= 15) {
            score += 10;
            reasons.push(`Moderate distance: ${distanceKm} km away`);
          } else {
            score -= 10;
          }
        }
      }

      // 4. Quantity availability
      if (donation.availableQuantity > 0) {
        score += 10;
      }

      return {
        ...donation.toObject ? donation.toObject() : donation,
        matchScore: Math.max(0, score),
        matchReasons: reasons,
        distanceKm,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = {
  calculateDistanceKm,
  reserveDonationQuantity,
  releaseReservedQuantity,
  completeHandoverQuantity,
  rankDonationsForRecipient,
};

