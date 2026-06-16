const mongoose = require("mongoose");

const BuyCoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ["earn", "redeem", "expire", "bonus"],
    required: true
  },
  coins: {
    type: Number,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  source: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Calculate expiresAt for earn and bonus types automatically
BuyCoinTransactionSchema.pre("save", function(next) {
  if ((this.type === "earn" || this.type === "bonus") && !this.expiresAt) {
    // 90 days from issuedAt
    const issued = this.issuedAt || new Date();
    this.expiresAt = new Date(issued.getTime() + 90 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("BuyCoinTransaction", BuyCoinTransactionSchema);
