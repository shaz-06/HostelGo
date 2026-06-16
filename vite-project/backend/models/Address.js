const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    label: {
      type: String,
      required: true,
      default: "Hostel"
    },
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    addressLine: {
      type: String,
      required: true
    },
    landmark: {
      type: String,
      default: ""
    },
    roomNumber: {
      type: String,
      default: ""
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    serviceable: {
      type: Boolean,
      default: true
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Address", addressSchema);
