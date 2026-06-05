const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  couponCode: {
    type: String,
    required: true,
    default: "AGAIN20"
  },
  discountAmount: {
    type: Number,
    required: true,
    default: 20
  },
  minOrderValue: {
    type: Number,
    required: true,
    default: 199
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false
  },
  generatedFromOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Coupon", CouponSchema);