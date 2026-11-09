const Reservation = require('../models/Reservation');
const Donation = require('../models/Donation');
const PickupTask = require('../models/PickupTask');
const { reserveDonationQuantity, releaseReservedQuantity } = require('../services/donationService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { generateHandoverCode } = require('../utils/generateCode');

/**
 * Recipient requests food reservation
 * POST /api/reservations
 */
const createReservation = async (req, res, next) => {
  try {
    const { donationId, requestedQuantity, requestNotes } = req.body;
    const quantity = Number(requestedQuantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be greater than zero',
      });
    }

    // 1. Fetch donation to check details & donor
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Food donation not found',
      });
    }

    if (donation.donor.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Donors cannot reserve their own food listing',
      });
    }

    // 2. Perform atomic quantity decrement & invariant check
    let updatedDonation;
    try {
      updatedDonation = await reserveDonationQuantity(donationId, quantity);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // 3. Generate unique handover verification code
    const handoverCode = generateHandoverCode();

    // 4. Create reservation record
    const reservation = new Reservation({
      donation: donation._id,
      recipient: req.user._id,
      recipientOrg: req.user.organization?._id || req.user.organization || null,
      donor: donation.donor,
      requestedQuantity: quantity,
      unit: donation.unit,
      status: 'pending',
      handoverCode,
      requestNotes: requestNotes || '',
    });

    await reservation.save();
    await reservation.populate([
      { path: 'donation', select: 'title category pickupLocation pickupStartTime pickupEndTime imageUrl' },
      { path: 'recipient', select: 'name email phone' },
      { path: 'recipientOrg', select: 'name type contactPhone' },
      { path: 'donor', select: 'name email phone' },
    ]);

    // 5. Notify donor about incoming reservation request
    await createNotification({
      recipient: donation.donor,
      title: 'New Food Reservation Request',
      message: `${req.user.name} requested ${quantity} ${donation.unit} of "${donation.title}". Please review and approve.`,
      type: 'reservation_request',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
      actionUrl: `/reservations`,
    });

    await logAudit({
      action: 'RESERVATION_REQUESTED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Reservation',
      entityId: reservation._id,
      details: { requestedQuantity: quantity, unit: donation.unit },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Reservation request submitted successfully. Awaiting donor approval.',
      data: {
        reservation,
        remainingAvailableQuantity: updatedDonation.availableQuantity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Donor approves or rejects a reservation request
 * PATCH /api/reservations/:id/status
 */
const updateReservationStatus = async (req, res, next) => {
  try {
    const { status, donorNotes, cancellationReason } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('donation')
      .populate('recipient', 'name email phone')
      .populate('donor', 'name email phone');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    // Only the donor or platform admin can approve / reject
    const isDonor = reservation.donor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the food donor can approve or reject this reservation request',
      });
    }

    if (reservation.status !== 'pending' && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Reservation is already marked as ${reservation.status}`,
      });
    }

    if (status === 'approved') {
      reservation.status = 'approved';
      reservation.approvedAt = new Date();
      if (donorNotes) reservation.donorNotes = donorNotes;
      await reservation.save();

      // Create a coordinated PickupTask automatically
      const pickupTask = await PickupTask.create({
        reservation: reservation._id,
        donation: reservation.donation._id,
        donor: reservation.donor._id,
        recipient: reservation.recipient._id,
        status: 'pending',
        pickupAddress: reservation.donation.pickupLocation.address,
        pickupWindowStart: reservation.donation.pickupStartTime,
        pickupWindowEnd: reservation.donation.pickupEndTime,
        instructions: donorNotes || 'Please handle food with care following food safety hygiene protocols.',
      });

      // Notify recipient
      await createNotification({
        recipient: reservation.recipient._id,
        title: 'Reservation Approved!',
        message: `Your request for ${reservation.requestedQuantity} ${reservation.unit} of "${reservation.donation.title}" was approved! Your handover verification code is: ${reservation.handoverCode}`,
        type: 'reservation_approved',
        relatedId: reservation._id,
        relatedModel: 'Reservation',
        actionUrl: `/reservations`,
      });

      await logAudit({
        action: 'RESERVATION_APPROVED',
        user: req.user._id,
        role: req.user.role,
        entityType: 'Reservation',
        entityId: reservation._id,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Reservation approved. Pickup task created.',
        data: {
          reservation,
          pickupTaskId: pickupTask._id,
        },
      });
    }

    if (status === 'rejected') {
      reservation.status = 'rejected';
      reservation.rejectedAt = new Date();
      reservation.donorNotes = donorNotes || 'Request could not be accommodated.';
      await reservation.save();

      // Atomically restore quantity back to donation available pool
      await releaseReservedQuantity(reservation.donation._id, reservation.requestedQuantity);

      // Notify recipient
      await createNotification({
        recipient: reservation.recipient._id,
        title: 'Reservation Request Declined',
        message: `Your request for "${reservation.donation.title}" could not be accommodated. Note: ${reservation.donorNotes}`,
        type: 'reservation_rejected',
        relatedId: reservation._id,
        relatedModel: 'Reservation',
      });

      await logAudit({
        action: 'RESERVATION_REJECTED',
        user: req.user._id,
        role: req.user.role,
        entityType: 'Reservation',
        entityId: reservation._id,
        details: { reason: donorNotes },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Reservation rejected and quantity returned to available surplus.',
        data: reservation,
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid status transition requested',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel reservation (Recipient, Donor, or Admin)
 * POST /api/reservations/:id/cancel
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('donation')
      .populate('recipient', 'name email phone')
      .populate('donor', 'name email phone');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    const isRecipient = reservation.recipient._id.toString() === req.user._id.toString();
    const isDonor = reservation.donor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRecipient && !isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this reservation',
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed reservation that has already been handed over',
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is already cancelled',
      });
    }

    const previousStatus = reservation.status;
    reservation.status = 'cancelled';
    reservation.cancellationReason = reason || 'Cancelled by user';
    reservation.cancelledBy = req.user._id;
    await reservation.save();

    // If reservation was pending or approved, release the quantity
    if (previousStatus === 'pending' || previousStatus === 'approved') {
      await releaseReservedQuantity(reservation.donation._id, reservation.requestedQuantity);
    }

    // Cancel corresponding pickup task if exists
    await PickupTask.updateMany(
      { reservation: reservation._id, status: { $in: ['pending', 'assigned'] } },
      { status: 'cancelled' }
    );

    // Notify the other party
    const targetUserId = isRecipient ? reservation.donor._id : reservation.recipient._id;
    await createNotification({
      recipient: targetUserId,
      title: 'Reservation Cancelled',
      message: `Reservation for "${reservation.donation.title}" was cancelled. Reason: ${reason || 'No reason provided'}`,
      type: 'reservation_cancelled',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
    });

    await logAudit({
      action: 'RESERVATION_CANCELLED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'Reservation',
      entityId: reservation._id,
      details: { reason },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully and quantities updated',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reservations for logged-in user:
 * - If recipient: shows their requests & reservations
 * - If donor: shows requests on their donations
 * GET /api/reservations
 */
const getMyReservations = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'recipient') {
      filter.recipient = req.user._id;
    } else if (req.user.role === 'donor') {
      filter.donor = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin sees all or filtered by query
      if (req.query.status) filter.status = req.query.status;
    }

    const reservations = await Reservation.find(filter)
      .populate('donation')
      .populate('recipient', 'name email phone avatar')
      .populate('recipientOrg', 'name type')
      .populate('donor', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  updateReservationStatus,
  cancelReservation,
  getMyReservations,
};

