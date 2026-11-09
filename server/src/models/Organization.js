const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [150, 'Organization name cannot exceed 150 characters'],
      index: true,
    },
    organizationType: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: {
        values: [
          'Restaurant',
          'Hotel',
          'College Canteen',
          'Event Organizer',
          'NGO',
          'Food Distribution Organization',
          'Other',
        ],
        message: '{VALUE} is not a valid organization type',
      },
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Organization contact email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Organization contact phone is required'],
      trim: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
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
        default: [0, 0],
      },
    },
    verificationStatus: {
      type: String,
      uppercase: true,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    documents: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for backward compatibility across modules
organizationSchema.virtual('name')
  .get(function () {
    return this.organizationName;
  })
  .set(function (val) {
    this.organizationName = val;
  });

organizationSchema.virtual('type')
  .get(function () {
    return this.organizationType;
  })
  .set(function (val) {
    this.organizationType = val;
  });

organizationSchema.virtual('contactEmail')
  .get(function () {
    return this.email;
  })
  .set(function (val) {
    this.email = val;
  });

organizationSchema.virtual('contactPhone')
  .get(function () {
    return this.phone;
  })
  .set(function (val) {
    this.phone = val;
  });

organizationSchema.virtual('verifiedAt')
  .get(function () {
    return this.reviewedAt;
  })
  .set(function (val) {
    this.reviewedAt = val;
  });

organizationSchema.virtual('verifiedBy')
  .get(function () {
    return this.reviewedBy;
  })
  .set(function (val) {
    this.reviewedBy = val;
  });

// Geospatial index
organizationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Organization', organizationSchema);
