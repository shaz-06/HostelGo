const mongoose = require("mongoose");

const addressRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    requestTokenHash: {
      type: String,
      required: false, // Can be set to null/empty after completed for one-time read
      default: null
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    requesterSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true }
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "completed", "expired", "cancelled"],
      default: "pending",
      index: true
    },
    submittedAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      landmark: { type: String },
      roomNumber: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      source: { type: String, default: "shared-request" }
    },
    recipientMetadata: {
      ip: { type: String },
      userAgent: { type: String },
      submittedAt: { type: Date }
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    // Future-proofing fields
    deliveryInstructions: { type: String, default: "" },
    buildingAccessCode: { type: String, default: "" },
    preferredDeliveryTime: { type: String, default: "" },
    recipientName: { type: String, default: "" },
    recipientPhoto: { type: String, default: "" },
    shareMethod: { type: String, default: "" },
    locale: { type: String, default: "en" }
  },
  {
    timestamps: true
  }
);

// Indexes
addressRequestSchema.index({ createdAt: 1 });

module.exports = mongoose.model("AddressRequest", addressRequestSchema);
