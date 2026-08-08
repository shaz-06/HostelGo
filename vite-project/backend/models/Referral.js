const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Only one referral allowed per referred user
    index: true
  },
  referralCode: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["PENDING", "QUALIFIED", "COMPLETED", "CANCELLED", "EXPIRED"],
    default: "PENDING",
    index: true
  },
  rewardCredited: {
    type: Boolean,
    default: false,
    index: true
  },
  rewardAmountReferrer: {
    type: Number,
    required: true
  },
  rewardAmountReferred: {
    type: Number,
    required: true
  },
  qualifyingOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  rewardCreditedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  campaignSnapshot: {
    configVersion: { type: Number, required: true },
    minOrder: { type: Number, required: true },
    referrerReward: { type: Number, required: true },
    referredUserReward: { type: Number, required: true }
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound indexes
ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ referredUser: 1, rewardCredited: 1 });
ReferralSchema.index({ status: 1, rewardCredited: 1 });

module.exports = mongoose.model("Referral", ReferralSchema);
