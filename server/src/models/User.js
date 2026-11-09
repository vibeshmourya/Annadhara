const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      uppercase: true,
      enum: {
        values: ['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'DONOR',
      index: true,
    },
    accountStatus: {
      type: String,
      uppercase: true,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias 'organization' pointing to organizationId for seamless interoperability
userSchema.virtual('organization', {
  ref: 'Organization',
  localField: 'organizationId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for password input before hashing
userSchema.virtual('password')
  .set(function (password) {
    this._plainPassword = password;
  })
  .get(function () {
    return this._plainPassword;
  });

// Virtual isActive for boolean compatibility
userSchema.virtual('isActive').get(function () {
  return this.accountStatus === 'ACTIVE';
});

// 2dsphere index for geospatial discovery
userSchema.index({ location: '2dsphere' });

// Hash password before validation so required: true on passwordHash passes
userSchema.pre('validate', async function () {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  } else if (this.isModified('passwordHash') && !this.passwordHash?.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

// Fallback hash before save
userSchema.pre('save', async function (next) {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  } else if (this.isModified('passwordHash') && !this.passwordHash?.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

// Compare candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Omit sensitive fields from toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.password;
  delete obj._plainPassword;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
