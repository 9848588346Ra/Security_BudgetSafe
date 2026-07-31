const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');
const { sanitize } = require('../utils/sanitize');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    descriptionEncrypted: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    anomalyFlagged: {
      type: Boolean,
      default: false,
    },
    anomalyReason: {
      type: String,
      default: '',
    },
    anomalyReviewed: {
      type: Boolean,
      default: false,
    },
    anomalyReviewNote: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

transactionSchema.virtual('description')
  .get(function getDescription() {
    return decrypt(this.descriptionEncrypted) || '';
  })
  .set(function setDescription(value) {
    const cleaned = sanitize(String(value || '').slice(0, 500));
    this.descriptionEncrypted = cleaned ? encrypt(cleaned) : '';
  });

transactionSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    amount: this.amount,
    category: this.category,
    description: this.description,
    date: this.date,
    confirmed: this.confirmed,
    anomalyFlagged: this.anomalyFlagged,
    anomalyReason: this.anomalyReason,
    anomalyReviewed: this.anomalyReviewed,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
