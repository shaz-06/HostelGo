const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  couponCode: {
    type: String,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  minimumOrderValue: {
    type: Number,
    required: true
  },
  issuedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  redeemedAt: {
    type: Date
  },
  isRedeemed: {
    type: Boolean,
    required: true,
    default: false
  },
  source: {
    type: String,
    enum: ["FIRST20", "AGAIN15"],
    required: true
  },
  // Legacy fields for backward compatibility
  isUsed: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  generatedFromOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware hook to sync legacy fields with the new ones
CouponSchema.pre("save", function() {
  if (this.isModified("isRedeemed")) {
    this.isUsed = this.isRedeemed;
  }
  if (this.isModified("isUsed")) {
    this.isRedeemed = this.isUsed;
  }
  if (this.isModified("isRedeemed") && this.isRedeemed && !this.redeemedAt) {
    this.redeemedAt = new Date();
  }
  if (this.expiresAt && !this.expiryDate) {
    this.expiryDate = this.expiresAt;
  }
  if (this.expiryDate && !this.expiresAt) {
    this.expiresAt = this.expiryDate;
  }
});

module.exports = mongoose.model("Coupon", CouponSchema);