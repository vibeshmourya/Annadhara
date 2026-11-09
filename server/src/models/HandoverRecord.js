const mongoose = require('mongoose');

const handoverRecordSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
      unique: true, // Only one handover record per reservation
      index: true,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    quantityHandedOver: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    handoverCode: {
      type: String,
      required: true,
    },
    verificationMethod: {
      type: String,
      enum: ['code', 'qr', 'manual_confirmation'],
      default: 'code',
    },
    confirmedByDonor: {
      type: Boolean,
      default: false,
    },
    confirmedByRecipient: {
      type: Boolean,
      default: false,
    },
    donorConfirmedAt: {
      type: Date,
      default: null,
    },
    recipientConfirmedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HandoverRecord', handoverRecordSchema);

