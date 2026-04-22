const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    prescriptionHistory: [
      {
        medicationName: { type: String, required: true },
        issuedDate: { type: Date, default: Date.now },
        notes: { type: String }
      }
    ],
    consentFormUrl: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
