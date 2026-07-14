const mongoose = require("mongoose");

const adminDeviceTokenSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    fcmTokens: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminDeviceToken", adminDeviceTokenSchema);
