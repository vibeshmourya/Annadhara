const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'reservation_request',
        'reservation_approved',
        'reservation_rejected',
        'reservation_cancelled',
        'pickup_assigned',
        'pickup_in_progress',
        'pickup_collected',
        'pickup_completed',
        'handover_success',
        'deadline_warning',
        'org_verification',
        'system',
      ],
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Donation', 'Reservation', 'PickupTask', 'Organization', 'User', null],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

