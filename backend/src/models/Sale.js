const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: [(arr) => arr.length > 0, 'Sale must contain at least one item']
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    prescriptionImageUrl: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
