const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a food title'],
      trim: true,
      maxlength: [150, 'Food title cannot exceed 150 characters'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Food category is required'],
      enum: {
        values: [
          'cooked_meals',
          'bakery_grains',
          'produce_fresh',
          'packaged_groceries',
          'dairy',
          'beverages',
          'prepared_catering',
          'other',
        ],
        message: '{VALUE} is not a supported category',
      },
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    collectedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Collected quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      enum: ['meals', 'kg', 'portions', 'boxes', 'liters', 'packs'],
    },
    prepDateTime: {
      type: Date,
      required: [true, 'Preparation date and time is required'],
    },
    expiryDateTime: {
      type: Date,
      required: [true, 'Food consumption / expiry deadline is required'],
      index: true,
    },
    storageHandling: {
      type: String,
      required: [true, 'Storage and handling information is required'],
      enum: ['room_temperature', 'refrigerated', 'frozen', 'hot_held'],
      default: 'room_temperature',
    },
    allergens: {
      type: [String],
      default: [],
    },
    pickupLocation: {
      address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, default: '' },
        postalCode: { type: String, default: '' },
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
    },
    pickupStartTime: {
      type: Date,
      required: [true, 'Pickup start time is required'],
    },
    pickupEndTime: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'partially_reserved', 'fully_reserved', 'completed', 'expired', 'cancelled'],
      default: 'available',
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    safetyGuidelinesAccepted: {
      type: Boolean,
      required: [true, 'Must accept food safety and handling declaration'],
      default: false,
    },
    reports: [
      {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        details: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isReported: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location-based distance queries
donationSchema.index({ 'pickupLocation.location': '2dsphere' });
donationSchema.index({ status: 1, pickupEndTime: 1, availableQuantity: 1 });

module.exports = mongoose.model('Donation', donationSchema);

