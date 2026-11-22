const PickupTask = require('../models/PickupTask');
const Reservation = require('../models/Reservation');
const Donation = require('../models/Donation');
const HandoverRecord = require('../models/HandoverRecord');
const { completeHandoverQuantity } = require('../services/donationService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { recordVerifiedContribution } = require('../services/contributionService');

/**
 * Get pickup tasks
 * - Volunteers see available (unassigned) and their own assigned tasks
 * - Donors and Recipients see tasks linked to their donations/reservations
 * - Admin sees all
 * GET /api/pickups
 */
const getPickupTasks = async (req, res, next) => {
  try {
    const { status, view } = req.query;
    const role = (req.user.role || '').toUpperCase();
    let query = {};

    if (role === 'VOLUNTEER') {
      if (view === 'available') {
        // Unassigned tasks ready to be claimed
        query.status = 'pending';
        query.volunteer = null;
      } else {
        // Volunteer's own tasks
        query.volunteer = req.user._id;
      }
    } else if (role === 'DONOR') {
      query.donor = req.user._id;
    } else if (role === 'RECIPIENT') {
      query.recipient = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const tasks = await PickupTask.find(query)
      .populate('reservation')
      .populate('donation', 'title category pickupLocation pickupStartTime pickupEndTime imageUrl unit')
      .populate('donor', 'name phone email')
      .populate('recipient', 'name phone email')
      .populate('volunteer', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single pickup task by ID
 * GET /api/pickups/:id
 */
const getPickupTaskById = async (req, res, next) => {
  try {
    const task = await PickupTask.findById(req.params.id)
      .populate('reservation')
      .populate('donation')
      .populate('donor', 'name phone email')
      .populate('recipient', 'name phone email')
      .populate('volunteer', 'name phone email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Volunteer accepts/claims an available pickup task
 * POST /api/pickups/:id/claim
 */
const claimPickupTask = async (req, res, next) => {
  try {
    // Atomic update to eliminate race condition between simultaneous claims
    const task = await PickupTask.findOneAndUpdate(
      {
        _id: req.params.id,
        volunteer: null,
        status: 'pending',
      },
      {
        $set: {
          volunteer: req.user._id,
          status: 'assigned',
          assignedAt: new Date(),
        },
        $push: {
          trackingNotes: {
            status: 'assigned',
            note: `Claimed by volunteer ${req.user.name}`,
            updatedBy: req.user._id,
          },
        },
      },
      { new: true }
    )
      .populate('donation', 'title')
      .populate('donor')
      .populate('recipient');

    if (!task) {
      const existing = await PickupTask.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Pickup task not found',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Pickup task is already assigned to another volunteer or is no longer pending',
      });
    }

    // Notify donor and recipient
    await createNotification({
      recipient: task.donor._id,
      title: 'Volunteer Assigned for Food Pickup',
      message: `Volunteer ${req.user.name} has been assigned to pick up "${task.donation.title}".`,
      type: 'pickup_assigned',
      relatedId: task._id,
      relatedModel: 'PickupTask',
    });

    await createNotification({
      recipient: task.recipient._id,
      title: 'Volunteer Assigned for Delivery',
      message: `Volunteer ${req.user.name} is scheduled to collect and deliver your food reservation.`,
      type: 'pickup_assigned',
      relatedId: task._id,
      relatedModel: 'PickupTask',
    });

    await logAudit({
      action: 'PICKUP_CLAIMED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'PickupTask',
      entityId: task._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'You have accepted this pickup task. Thank you!',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update pickup status
 * PATCH /api/pickups/:id/status
 */
const updatePickupStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const task = await PickupTask.findById(req.params.id)
      .populate('donation', 'title')
      .populate('reservation');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found',
      });
    }

    // Authorization: Assigned volunteer, recipient, donor, or admin
    const isAssignedVolunteer = task.volunteer && task.volunteer.toString() === req.user._id.toString();
    const isRecipient = task.recipient.toString() === req.user._id.toString();
    const isDonor = task.donor.toString() === req.user._id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isAssignedVolunteer && !isRecipient && !isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pickup task status',
      });
    }

    task.status = status;
    if (status === 'collected') {
      task.collectedAt = new Date();
    } else if (status === 'completed') {
      task.completedAt = new Date();
    }

    task.trackingNotes.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await task.save();

    // Broadcast notifications to parties
    const notifyType =
      status === 'collected'
        ? 'pickup_collected'
        : status === 'completed'
        ? 'pickup_completed'
        : 'pickup_in_progress';

    const targetUsers = [task.donor, task.recipient].filter((u) => u.toString() !== req.user._id.toString());
    for (const userId of targetUsers) {
      await createNotification({
        recipient: userId,
        title: `Pickup Update: ${status.replace('_', ' ').toUpperCase()}`,
        message: `Food collection status for "${task.donation.title}" is now: ${status}. Note: ${note || 'No notes'}`,
        type: notifyType,
        relatedId: task._id,
        relatedModel: 'PickupTask',
      });
    }

    res.status(200).json({
      success: true,
      message: `Pickup status updated to ${status}`,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify delivery handover via Recipient's Delivery Verification Code
 * POST /api/pickups/:id/verify-delivery
 */
const verifyDelivery = async (req, res, next) => {
  try {
    const { deliveryCode, notes } = req.body;

    if (!deliveryCode) {
      return res.status(400).json({
        success: false,
        message: 'Recipient delivery verification code is required',
      });
    }

    const task = await PickupTask.findById(req.params.id)
      .populate('donation')
      .populate('reservation')
      .populate('donor', 'name email phone')
      .populate('recipient', 'name email phone')
      .populate('volunteer', 'name email phone');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found',
      });
    }

    // Authorization: Assigned volunteer, recipient, or admin
    const isAssignedVolunteer = task.volunteer && task.volunteer._id.toString() === req.user._id.toString();
    const isRecipient = task.recipient._id.toString() === req.user._id.toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isAssignedVolunteer && !isRecipient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned volunteer or recipient can verify delivery',
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This delivery has already been verified and completed',
      });
    }

    // Verify code: Check either task's deliveryCode, reservation's deliveryCode, derived DL-XXXX, or handoverCode
    const cleanProvided = deliveryCode.trim().toUpperCase();
    const cleanNumOnly = cleanProvided.replace(/^(DL|FB)-?/, '');

    const validCodes = new Set();
    if (task.deliveryCode) {
      const tc = task.deliveryCode.trim().toUpperCase();
      validCodes.add(tc);
      validCodes.add(tc.replace(/^(DL|FB)-?/, ''));
    }
    if (task.reservation?.deliveryCode) {
      const rc = task.reservation.deliveryCode.trim().toUpperCase();
      validCodes.add(rc);
      validCodes.add(rc.replace(/^(DL|FB)-?/, ''));
    }
    if (task.reservation?.handoverCode) {
      const ho = task.reservation.handoverCode.trim().toUpperCase();
      validCodes.add(ho); // e.g. FB-7294
      validCodes.add(`DL-${ho.replace(/^(DL|FB)-?/, '')}`); // e.g. DL-7294
      validCodes.add(ho.replace(/^(DL|FB)-?/, '')); // e.g. 7294
    }

    const isMatch = validCodes.has(cleanProvided) || validCodes.has(cleanNumOnly);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery verification code. Please request the correct code from the food recipient.',
      });
    }

    const effectiveDeliveryCode = cleanProvided.startsWith('DL-')
      ? cleanProvided
      : (task.deliveryCode || `DL-${cleanNumOnly}`);
    const providedCode = effectiveDeliveryCode;

    // Ensure task and reservation have deliveryCode populated
    if (!task.deliveryCode) {
      task.deliveryCode = effectiveDeliveryCode;
    }

    // Transaction & compensation boundary
    let session = null;
    let useTransaction = false;
    try {
      const topologyType = mongoose.connection.client?.topology?.description?.type;
      if (topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded') {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
      }
    } catch (_sessionErr) {
      session = null;
      useTransaction = false;
    }

    let handoverRecord = null;
    try {
      // Mark task completed
      task.status = 'completed';
      task.completedAt = new Date();
      task.deliveryConfirmedAt = new Date();
      task.deliveryNotes = notes || 'Food delivered and verified by recipient code';
      task.trackingNotes.push({
        status: 'completed',
        note: `Delivery verified with code ${providedCode}. ${notes || ''}`.trim(),
        updatedBy: req.user._id,
        timestamp: new Date(),
      });
      await task.save(useTransaction ? { session } : undefined);

      // Mark reservation completed & delivery confirmed
      if (task.reservation) {
        await Reservation.findByIdAndUpdate(
          task.reservation._id,
          {
            status: 'completed',
            deliveryCodeVerified: true,
            deliveryConfirmedAt: new Date(),
            completedAt: new Date(),
          },
          useTransaction ? { session } : {}
        );
      }

      // Atomically complete handover quantity in donation
      if (task.donation) {
        const quantity = task.reservation?.requestedQuantity || 0;
        if (quantity > 0) {
          await completeHandoverQuantity(
            task.donation._id,
            quantity,
            useTransaction ? { session } : {}
          );
        }
      }

      // Update or create HandoverRecord
      handoverRecord = await HandoverRecord.findOne({ reservation: task.reservation?._id }).session(
        useTransaction ? session : null
      );
      if (handoverRecord) {
        handoverRecord.confirmedByRecipient = true;
        handoverRecord.recipientConfirmedAt = new Date();
        handoverRecord.deliveryCode = providedCode;
        handoverRecord.deliveryCodeVerified = true;
        handoverRecord.deliveryConfirmedAt = new Date();
        handoverRecord.notes =
          (handoverRecord.notes ? handoverRecord.notes + ' | ' : '') + (notes || 'Delivery code verified');
        await handoverRecord.save(useTransaction ? { session } : undefined);
      } else if (task.reservation && task.donation) {
        const newRecord = new HandoverRecord({
          reservation: task.reservation._id,
          donation: task.donation._id,
          donor: task.donor._id,
          recipient: task.recipient._id,
          volunteer: task.volunteer?._id || req.user._id,
          quantityHandedOver: task.reservation.requestedQuantity,
          unit: task.reservation.unit,
          handoverCode: task.reservation.handoverCode || providedCode,
          verificationMethod: 'delivery_code',
          confirmedByDonor: true,
          confirmedByRecipient: true,
          donorConfirmedAt: task.collectedAt || new Date(),
          recipientConfirmedAt: new Date(),
          deliveryCode: providedCode,
          deliveryCodeVerified: true,
          deliveryConfirmedAt: new Date(),
          notes: notes || 'Delivery verified by recipient code',
        });
        await newRecord.save(useTransaction ? { session } : undefined);
        handoverRecord = newRecord;
      }

      if (useTransaction && session) {
        await session.commitTransaction();
        session.endSession();
        session = null;
      }
    } catch (saveError) {
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
        session = null;
      }
      throw saveError;
    }

    // Automatically record verified donor contribution if handover record exists
    if (handoverRecord) {
      try {
        await recordVerifiedContribution(handoverRecord._id, { actorId: req.user._id });
      } catch (vcErr) {
        console.warn('[VerifiedContribution] Note on recording contribution:', vcErr.message);
      }
    }

    // Notifications to all parties
    await createNotification({
      recipient: task.recipient._id,
      title: 'Food Delivery Confirmed! 🎉',
      message: `Your food delivery for "${task.donation.title}" was verified and completed. Thank you for rescuing surplus food!`,
      type: 'pickup_completed',
      relatedId: task._id,
      relatedModel: 'PickupTask',
      actionUrl: '/reservations',
    });

    if (task.volunteer) {
      await createNotification({
        recipient: task.volunteer._id,
        title: 'Mission Complete! 🌟',
        message: `Delivery for "${task.donation.title}" verified successfully with code ${providedCode}. Thank you for your service!`,
        type: 'pickup_completed',
        relatedId: task._id,
        relatedModel: 'PickupTask',
        actionUrl: '/pickups',
      });
    }

    await logAudit({
      action: 'FOOD_DELIVERY_CONFIRMED',
      user: req.user._id,
      role: req.user.role,
      entityType: 'PickupTask',
      entityId: task._id,
      details: { deliveryCode: providedCode, reservationId: task.reservation?._id },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Delivery successfully verified and marked as completed',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPickupTasks,
  getPickupTaskById,
  claimPickupTask,
  updatePickupStatus,
  verifyDelivery,
};

