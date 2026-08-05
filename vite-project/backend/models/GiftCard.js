const mongoose = require("mongoose");

const GiftCardSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  pinHash: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["ACTIVE", "REDEEMED", "EXPIRED"],
    default: "ACTIVE",
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  redeemedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("GiftCard", GiftCardSchema);
