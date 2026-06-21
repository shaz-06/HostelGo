const mongoose = require("mongoose");

const notificationHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true // "ORDER", "PROMO", "CART", etc.
    },
    image: {
      type: String,
      default: null
    },
    deepLink: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("NotificationHistory", notificationHistorySchema);
