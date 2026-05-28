const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    room: { type: String }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  products: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      weight: { type: String },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true }, // 'cod' or 'razorpay'
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  deliveryAddress: { type: String, required: true },
  deliveryLatitude: { type: Number, default: null },
  deliveryLongitude: { type: Number, default: null },
  orderStatus: {
    type: String,
    enum: ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Order Placed"
  },
  statusTimestamps: {
    orderPlaced: { type: Date, default: Date.now },
    preparing: { type: Date, default: null },
    packed: { type: Date, default: null },
    riderAssigned: { type: Date, default: null },
    outForDelivery: { type: Date, default: null },
    delivered: { type: Date, default: null },
    cancelled: { type: Date, default: null }
  },
  estimatedDeliveryTime: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000)
  },
  estimatedArrivalMinutes: {
    type: Number,
    default: 30
  },
  riderAssigned: {
    type: Boolean,
    default: false
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  riderName: {
    type: String,
    default: ""
  },
  riderPhone: {
    type: String,
    default: ""
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
