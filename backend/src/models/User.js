const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const config = require('../config');
const { encrypt, decrypt } = require('../utils/crypto');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    currency: {
      type: String,
      default: 'GBP',
      maxlength: 3,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecretEncrypted: {
      type: String,
      select: false,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    disabledReason: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

userSchema.virtual('isLocked').get(function isLocked() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptRounds);
};

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.setMfaSecret = function setMfaSecret(secret) {
  this.mfaSecretEncrypted = encrypt(secret);
};

userSchema.methods.getMfaSecret = function getMfaSecret() {
  return decrypt(this.mfaSecretEncrypted);
};

userSchema.methods.registerFailedLogin = async function registerFailedLogin() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= config.lockoutThreshold) {
    this.lockUntil = new Date(Date.now() + config.lockoutDurationMinutes * 60 * 1000);
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function resetLoginAttempts() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    role: this.role,
    currency: this.currency,
    avatarUrl: this.avatarUrl,
    mfaEnabled: this.mfaEnabled,
    isDisabled: this.isDisabled,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
