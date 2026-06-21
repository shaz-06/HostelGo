const mongoose = require("mongoose");

const BuyCoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  email: {
    type: String,
    required: false,
    index: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ["earned", "spent", "bonus", "refund", "reversal", "admin"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  coins: {
    type: Number,
    required: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: false
  },
  description: {
    type: String,
    default: ""
  },
  source: {
    type: String,
    required: false
  },
  buyCoinExpiryDate: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

module.exports = mongoose.model("BuyCoinTransaction", BuyCoinTransactionSchema);
