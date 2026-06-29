const mongoose = require("mongoose");

const sentNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["General", "Offer", "BuyCoins", "Order Update", "Announcement"],
      required: true 
    },
    image: { type: String, default: null },
    ctaText: { type: String, default: null },
    ctaLink: { type: String, default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientCount: { type: Number, required: true, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    scheduledFor: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SentNotification", sentNotificationSchema);
