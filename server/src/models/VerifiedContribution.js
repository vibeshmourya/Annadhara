const mongoose = require('mongoose');

/**
 * Annadhara Verified Contribution Model
 * 
 * Represents a transparent, immutable record of genuinely rescued surplus food.
 * Only created upon successful, verified physical food handover.
 * Cannot be directly created or manipulated by donors or recipients.
 */
const verifiedContributionSchema = new mongoose.Schema(
  {
    contributionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    handoverRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HandoverRecord',
      required: true,
      unique: true, // Guarantees 1-to-1 relationship with verified handover
      index: true,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      index: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    donorOrg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientOrg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    foodTitle: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Contribution quantity must be greater than zero'],
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    verificationMethod: {
      type: String,
      enum: ['code', 'qr', 'delivery_code', 'donor_confirmation', 'manual_confirmation'],
      default: 'code',
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'UNDER_REVIEW', 'REVERSED'],
      default: 'VERIFIED',
      index: true,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reversalReason: {
      type: String,
      default: '',
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reversedAt: {
      type: Date,
      default: null,
    },
    discrepancyReports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
        status: {
          type: String,
          enum: ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
          default: 'PENDING',
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        resolutionNotes: {
          type: String,
          default: '',
        },
        resolvedAt: {
          type: Date,
          default: null,
        },
        resolvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
      },
    ],
    auditTrail: [
      {
        action: {
          type: String,
          required: true,
        },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        actorRole: {
          type: String,
          default: 'SYSTEM',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant queries
verifiedContributionSchema.index({ donor: 1, status: 1, verifiedAt: -1 });
verifiedContributionSchema.index({ recipientOrg: 1, status: 1, verifiedAt: -1 });
verifiedContributionSchema.index({ status: 1, verifiedAt: -1 });

module.exports = mongoose.model('VerifiedContribution', verifiedContributionSchema);
