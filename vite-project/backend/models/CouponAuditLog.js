const mongoose = require("mongoose");

const CouponAuditLogSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromotionCoupon",
    required: true
  },
  couponCode: {
    type: String,
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true // "CREATE", "UPDATE", "STATUS_TOGGLE", "ARCHIVE"
  },
  details: {
    type: String,
    default: ""
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CouponAuditLog", CouponAuditLogSchema);
