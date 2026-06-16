const mongoose = require("mongoose");

const DeliveryServiceZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    radiusKm: {
      type: Number,
      required: true,
      default: 3
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DeliveryServiceZone", DeliveryServiceZoneSchema);
