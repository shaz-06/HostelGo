const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  senderName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin", "bot"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const supportChatSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    status: {
      type: String,
      enum: ["connecting", "waiting", "connected", "closed"],
      default: "waiting"
    },
    queuePosition: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    feedback: {
      type: String,
      default: ""
    },
    messages: [supportMessageSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SupportChat", supportChatSchema);
