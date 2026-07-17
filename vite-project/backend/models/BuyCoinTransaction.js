const mongoose = require("mongoose");
const BuyCoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  email: {
    type: String,
    required: false,
    index: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: [
      "earned", "spent", "bonus", "refund", "reversal", "admin", // Legacy types
      "WELCOME_BONUS", "ORDER_REWARD", "CASHBACK", "ADMIN_CREDIT", "ADMIN_DEBIT", "REDEMPTION", "REVERSAL", "EXPIRY" // Enforced enums
    ],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
    default: "COMPLETED",
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },
  coins: {
    type: Number,
    required: false,
    validate: {
      validator: function(val) {
        return val === undefined || Number.isInteger(val);
      },
      message: "{VALUE} is not an integer value"
    }
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: false,
    index: true
  },
  description: {
    type: String,
    default: ""
  },
  source: {
    type: String,
    required: false
  },
  balanceAfter: {
    type: Number,
    required: false
  },
  buyCoinExpiryDate: {
    type: Date,
    required: false
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  audit: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    adminName: {
      type: String,
      required: false
    },
    source: {
      type: String,
      enum: ["ADMIN_DASHBOARD", "API", "DEV_TOOL"],
      required: false
    },
    requestId: {
      type: String,
      required: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userAgent: {
      type: String,
      required: false
    },
    ipAddress: {
      type: String,
      required: false
    },
    previousBalance: {
      type: Number,
      required: false
    },
    newBalance: {
      type: Number,
      required: false
    },
    actionName: {
      type: String,
      required: false
    },
    outcome: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      required: false
    },
    errorCode: {
      type: String,
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
});

// Ensure immutability for completed transactions
BuyCoinTransactionSchema.pre("save", function(next) {
  if (!this.isNew && this.status === "COMPLETED") {
    const err = new Error("Cannot modify a completed transaction. Corrections must be made via new transactions.");
    if (typeof next === "function") {
      return next(err);
    }
    throw err;
  }
  if (typeof next === "function") {
    next();
  }
});

module.exports = mongoose.model("BuyCoinTransaction", BuyCoinTransactionSchema);

