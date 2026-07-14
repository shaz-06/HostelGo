const mongoose = require("mongoose");

const BuyCoinWalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false,
    index: true,
    lowercase: true
  },
  availableCoins: {
    type: Number,
    default: 0,
    required: true
  },
  lifetimeEarned: {
    type: Number,
    default: 0,
    required: true
  },
  lifetimeRedeemed: {
    type: Number,
    default: 0,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

BuyCoinWalletSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  if (typeof next === "function") {
    next();
  }
});

module.exports = mongoose.model("BuyCoinWallet", BuyCoinWalletSchema);
