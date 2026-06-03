const mongoose = require("mongoose");

const DeliverySettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: "delivery_settings"
  },
  lateNightDeliveryEnabled: {
    type: Boolean,
    default: false
  },
  rainyDeliveryEnabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("DeliverySettings", DeliverySettingsSchema);
