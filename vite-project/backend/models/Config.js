const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: "fees_config"
  },
  handlingFee: { type: Number, default: 4 },
  smallCartThreshold: { type: Number, default: 150 },
  smallCartFee: { type: Number, default: 15 },
  deliveryFee: { type: Number, default: 29 },
  freeDeliveryThreshold: { type: Number, default: 99 },
  rainFee: { type: Number, default: 0 },
  lateNightFee: { type: Number, default: 0 },
  gstPercentage: { type: Number, default: 5 },
  gstFixedCharges: { type: Number, default: 2 },
  codConvenienceFee: { type: Number, default: 14 },
  codConvenienceFeeEnabled: { type: Boolean, default: true },
  referralEnabled: { type: Boolean, default: true },
  referralMinOrder: { type: Number, default: 199 },
  referrerReward: { type: Number, default: 75 },
  referredUserReward: { type: Number, default: 50 },
  referralConfigVersion: { type: Number, default: 1 },
  referralExpiryDays: { type: Number, default: 90 },
  birthdayRewardEnabled: { type: Boolean, default: true },
  birthdayRewardProductId: { type: String, default: "DBE4" },
  birthdayMinOrderValue: { type: Number, default: 99 },
  birthdayRewardPrice: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("Config", ConfigSchema);