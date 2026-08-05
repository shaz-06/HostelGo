const mongoose = require("mongoose");

const ReferralAuditLogSchema = new mongoose.Schema({
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Referral",
    default: null,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  action: {
    type: String,
    enum: [
      "LINKED",
      "QUALIFIED",
      "REWARD_CREDITED",
      "REWARD_CANCELLED",
      "EXPIRED",
      "CONFIG_UPDATED",
      "FAILED_REWARD",
      "FAILED_NOTIFICATION",
      "RECONCILED"
    ],
    required: true,
    index: true
  },
  correlationId: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model("ReferralAuditLog", ReferralAuditLogSchema);
