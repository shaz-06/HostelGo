const mongoose = require("mongoose");

const PromotionCouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  couponType: {
    type: String,
    enum: ["flat", "percentage", "free_delivery"],
    default: "flat"
  },
  discountValue: {
    type: Number,
    required: true
  },
  minimumOrderValue: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    default: 0 // 0 means no limit
  },
  usageLimit: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  usagePerUser: {
    type: Number,
    default: 1
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  usedCount: {
    type: Number,
    default: 0
  },
  totalDiscountGiven: {
    type: Number,
    default: 0
  },
  revenueGenerated: {
    type: Number,
    default: 0
  },
  ordersCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PromotionCoupon", PromotionCouponSchema);
