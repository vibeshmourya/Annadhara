const mongoose = require('mongoose');
const HandoverRecord = require('../models/HandoverRecord');
const Reservation = require('../models/Reservation');
const Donation = require('../models/Donation');
const PickupTask = require('../models/PickupTask');
const { completeHandoverQuantity } = require('../services/donationService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Confirm food handover
 * POST /api/handover/confirm
 */
const confirmHandover = async (req, res, next) => {
  try {
    const { reservationId, handoverCode, notes, verificationMethod = 'code' } = req.body;

    if (!handoverCode) {
      return res.status(400).json({
        success: false,
        message: 'Handover verification code is required',
      });
    }

    let reservation;
    if (reservationId && reservationId !== 'by_code' && mongoose.Types.ObjectId.isValid(reservationId)) {
      reservation = await Reservation.findById(reservationId)
        .populate('donation')
        .populate('donor', 'name email phone')
        .populate('recipient', 'name email phone');
    } else if (handoverCode) {
      reservation = await Reservation.findOne({
        handoverCode: handoverCode.trim().toUpperCase(),
        status: { $in: ['approved', 'pending'] },
      })
        .populate('donation')
        .populate('donor', 'name email phone')
        .populate('recipient', 'name email phone');
    }

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation matching verification code not found',
      });
    }

    // Verify authorized user
    const isDonor = reservation.donor._id.toString() === req.user._id.toString();
    const isRecipient = reservation.recipient._id.toString() === req.user._id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    // Check if volunteer is attached to pickup task
    const pickupTask = await PickupTask.findOne({ reservation: reservation._id });
    const isVolunteer = pickupTask && pickupTask.volunteer && pickupTask.volunteer.toString() === req.user._id.toString();

    if (!isDonor && !isRecipient && !isVolunteer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm handover for this reservation',
      });
    }

    // Verify reservation status
    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This food handover has already been confirmed and completed',
      });
    }

    if (reservation.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot handover a reservation with status: ${reservation.status}. Reservation must be approved.`,
      });
    }

    // Verify handover code (case-insensitive trim)
    if (reservation.handoverCode.trim().toUpperCase() !== handoverCode.trim().toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid handover verification code. Please check and try again.',
      });
    }

    // Check if record already exists
    let handoverRecord = await HandoverRecord.findOne({ reservation: reservation._id });
    if (handoverRecord) {
      return res.status(400).json({
        success: false,
        message: 'Handover record already exists for this reservation',
      });
    }

    // 1. Create HandoverRecord
    handoverRecord = new HandoverRecord({
      reservation: reservation._id,
      donation: reservation.donation._id,
      donor: reservation.donor._id,
      recipient: reservation.recipient._id,
      volunteer: isVolunteer ? req.user._id : pickupTask?.volunteer || null,
      quantityHandedOver: reservation.requestedQuantity,
      unit: reservation.unit,
      handoverCode: reservation.handoverCode,
      verificationMethod: verificationMethod || 'code',
      confirmedByDonor: isDonor || isAdmin,
      confirmedByRecipient: isRecipient || isVolunteer || isAdmin,
      donorConfirmedAt: isDonor || isAdmin ? new Date() : null,
      recipientConfirmedAt: isRecipient || isVolunteer || isAdmin ? new Date() : null,
      notes: notes || 'Handover successfully completed via verification code',
    });

    await handoverRecord.save();

    // 2. Mark reservation as completed
    reservation.status = 'completed';
    reservation.completedAt = new Date();
    await reservation.save();

    // 3. Atomically update donation quantities (decrement reserved, increment collected)
    await completeHandoverQuantity(reservation.donation._id, reservation.requestedQuantity);

    // 4. Update pickup task to completed if exists
    if (pickupTask) {
      pickupTask.status = 'completed';
      pickupTask.completedAt = new Date();
      pickupTask.trackingNotes.push({
        status: 'completed',
        note: `Handover confirmed via ${verificationMethod}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      });
      await pickupTask.save();
    }

    // 5. Send notifications to donor and recipient
    await createNotification({
      recipient: reservation.donor._id,
      title: 'Food Handover Confirmed! 🎉',
      message: `Successfully handed over ${reservation.requestedQuantity} ${reservation.unit} of "${reservation.donation.title}". Thank you for eliminating food waste!`,
      type: 'handover_success',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
    });

    await createNotification({
      recipient: reservation.recipient._id,
      title: 'Food Receipt Confirmed! 🎉',
      message: `You have successfully received ${reservation.requestedQuantity} ${reservation.unit} of "${reservation.donation.title}".`,
      type: 'handover_success',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
    });

    await logAudit({
      action: 'HANDOVER_COMPLETED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'HandoverRecord',
      entityId: handoverRecord._id,
      details: {
        reservationId: reservation._id,
        quantity: reservation.requestedQuantity,
        unit: reservation.unit,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Handover confirmed successfully. Zero waste achieved!',
      data: handoverRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm delivery handover via Recipient's Delivery Verification Code
 * POST /api/handover/confirm-delivery
 */
const confirmDeliveryHandover = async (req, res, next) => {
  try {
    const { deliveryCode, reservationId, notes } = req.body;

    if (!deliveryCode) {
      return res.status(400).json({
        success: false,
        message: 'Recipient delivery verification code is required',
      });
    }

    const cleanCode = deliveryCode.trim().toUpperCase();

    let reservation;
    if (reservationId && mongoose.Types.ObjectId.isValid(reservationId)) {
      reservation = await Reservation.findById(reservationId)
        .populate('donation')
        .populate('donor', 'name email phone')
        .populate('recipient', 'name email phone');
    } else {
      reservation = await Reservation.findOne({
        $or: [{ deliveryCode: cleanCode }, { handoverCode: cleanCode }],
        status: { $in: ['approved', 'in_progress', 'pending'] },
      })
        .populate('donation')
        .populate('donor', 'name email phone')
        .populate('recipient', 'name email phone');
    }

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'No active reservation matches this delivery code',
      });
    }

    // Verify deliveryCode matches
    const expected = (reservation.deliveryCode || reservation.handoverCode || '').trim().toUpperCase();
    if (cleanCode !== expected) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery code. Please verify the code displayed on the recipient screen.',
      });
    }

    const pickupTask = await PickupTask.findOne({ reservation: reservation._id });
    const isVolunteer = pickupTask && pickupTask.volunteer && pickupTask.volunteer.toString() === req.user._id.toString();
    const isRecipient = reservation.recipient._id.toString() === req.user._id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isVolunteer && !isRecipient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned volunteer, recipient, or administrator can confirm delivery',
      });
    }

    if (reservation.status === 'completed' && reservation.deliveryCodeVerified) {
      return res.status(400).json({
        success: false,
        message: 'This delivery has already been verified and completed',
      });
    }

    // 1. Mark reservation completed
    reservation.status = 'completed';
    reservation.completedAt = new Date();
    reservation.deliveryConfirmedAt = new Date();
    reservation.deliveryCodeVerified = true;
    await reservation.save();

    // 2. Mark pickup task completed
    if (pickupTask) {
      pickupTask.status = 'completed';
      pickupTask.completedAt = new Date();
      pickupTask.deliveryConfirmedAt = new Date();
      pickupTask.deliveryNotes = notes || 'Delivery verified via recipient code';
      pickupTask.trackingNotes.push({
        status: 'completed',
        note: `Delivery confirmed with code ${cleanCode}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      });
      await pickupTask.save();
    }

    // 3. Atomically update donation quantities
    await completeHandoverQuantity(reservation.donation._id, reservation.requestedQuantity);

    // 4. Update or create HandoverRecord
    let handoverRecord = await HandoverRecord.findOne({ reservation: reservation._id });
    if (handoverRecord) {
      handoverRecord.confirmedByRecipient = true;
      handoverRecord.recipientConfirmedAt = new Date();
      handoverRecord.deliveryCode = cleanCode;
      handoverRecord.deliveryCodeVerified = true;
      handoverRecord.deliveryConfirmedAt = new Date();
      handoverRecord.notes = (handoverRecord.notes ? handoverRecord.notes + ' | ' : '') + (notes || 'Delivery code verified');
      await handoverRecord.save();
    } else {
      handoverRecord = await HandoverRecord.create({
        reservation: reservation._id,
        donation: reservation.donation._id,
        donor: reservation.donor._id,
        recipient: reservation.recipient._id,
        volunteer: pickupTask?.volunteer || req.user._id,
        quantityHandedOver: reservation.requestedQuantity,
        unit: reservation.unit,
        handoverCode: reservation.handoverCode,
        deliveryCode: cleanCode,
        deliveryCodeVerified: true,
        deliveryConfirmedAt: new Date(),
        verificationMethod: 'delivery_code',
        confirmedByDonor: true,
        confirmedByRecipient: true,
        donorConfirmedAt: new Date(),
        recipientConfirmedAt: new Date(),
        notes: notes || 'Delivery verified via recipient code',
      });
    }

    // 5. Send celebrations & notifications
    await createNotification({
      recipient: reservation.recipient._id,
      title: 'Food Delivery Confirmed! 🍛',
      message: `You have successfully received and verified ${reservation.requestedQuantity} ${reservation.unit} of "${reservation.donation.title}". Thank you for rescuing surplus food!`,
      type: 'pickup_completed',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
      actionUrl: '/reservations',
    });

    if (pickupTask?.volunteer) {
      await createNotification({
        recipient: pickupTask.volunteer,
        title: 'Mission Complete! 🌟',
        message: `Delivery for "${reservation.donation.title}" successfully verified by recipient code ${cleanCode}. Excellent work!`,
        type: 'pickup_completed',
        relatedId: pickupTask._id,
        relatedModel: 'PickupTask',
        actionUrl: '/pickups',
      });
    }

    await logAudit({
      action: 'FOOD_DELIVERY_CONFIRMED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'HandoverRecord',
      entityId: handoverRecord._id,
      details: { deliveryCode: cleanCode, reservationId: reservation._id },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Delivery successfully verified and marked as completed',
      data: {
        handoverRecord,
        reservation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get handover details for a reservation
 * GET /api/handover/reservation/:reservationId
 */
const getHandoverByReservation = async (req, res, next) => {
  try {
    const handover = await HandoverRecord.findOne({ reservation: req.params.reservationId })
      .populate('donor', 'name email phone')
      .populate('recipient', 'name email phone')
      .populate('donation', 'title category unit');

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: 'No handover record found for this reservation',
      });
    }

    res.status(200).json({
      success: true,
      data: handover,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  confirmHandover,
  confirmDeliveryHandover,
  getHandoverByReservation,
};

