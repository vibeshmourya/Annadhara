const PickupTask = require('../models/PickupTask');
const Reservation = require('../models/Reservation');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

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
    let query = {};

    if (req.user.role === 'volunteer') {
      if (view === 'available') {
        // Unassigned tasks ready to be claimed
        query.status = 'pending';
        query.volunteer = null;
      } else {
        // Volunteer's own tasks
        query.volunteer = req.user._id;
      }
    } else if (req.user.role === 'donor') {
      query.donor = req.user._id;
    } else if (req.user.role === 'recipient') {
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
    const task = await PickupTask.findById(req.params.id)
      .populate('donation', 'title')
      .populate('donor')
      .populate('recipient');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found',
      });
    }

    if (task.volunteer) {
      return res.status(400).json({
        success: false,
        message: 'Task is already assigned to another volunteer',
      });
    }

    task.volunteer = req.user._id;
    task.status = 'assigned';
    task.assignedAt = new Date();
    task.trackingNotes.push({
      status: 'assigned',
      note: `Claimed by volunteer ${req.user.name}`,
      updatedBy: req.user._id,
    });

    await task.save();

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
    const isAdmin = req.user.role === 'admin';

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

module.exports = {
  getPickupTasks,
  getPickupTaskById,
  claimPickupTask,
  updatePickupStatus,
};

