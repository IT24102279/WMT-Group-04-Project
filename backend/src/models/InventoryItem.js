const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    supplier: {
      type: String,
      required: true,
      trim: true
    },
    invoiceUrl: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

inventoryItemSchema.index({ expiryDate: 1, itemName: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
