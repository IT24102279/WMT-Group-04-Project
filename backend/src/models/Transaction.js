const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      trim: true
    },
    documentUrl: {
      type: String,
      default: null
    },
    isReminder: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

transactionSchema.index({ date: -1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
