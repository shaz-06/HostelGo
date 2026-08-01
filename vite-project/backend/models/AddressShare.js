const mongoose = require("mongoose");

const addressShareSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sharedWithUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: false // Optional while status is "pending"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired", "revoked", "removed"],
      default: "pending"
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  },
  {
    timestamps: true
  }
);

// Indexes for optimization
addressShareSchema.index({ ownerId: 1 });
addressShareSchema.index({ sharedWithUserId: 1 });
addressShareSchema.index({ status: 1 });
addressShareSchema.index({ addressId: 1 });
addressShareSchema.index({ expiresAt: 1 });

// Composite indexes for specific lookups
addressShareSchema.index({ ownerId: 1, status: 1 });
addressShareSchema.index({ sharedWithUserId: 1, status: 1 });

module.exports = mongoose.model("AddressShare", addressShareSchema);
