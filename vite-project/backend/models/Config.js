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
  codConvenienceFeeEnabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Config", ConfigSchema);