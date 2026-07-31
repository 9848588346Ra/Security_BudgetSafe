const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['budget_threshold', 'anomaly'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    category: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

alertSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    message: this.message,
    category: this.category,
    read: this.read,
    meta: this.meta,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Alert', alertSchema);
