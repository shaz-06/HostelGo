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
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  paymentId: { type: String },
  paidAt: { type: Date },
  amount: { type: Number },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  deliveryAddress: { type: String, required: true },
  deliveryLatitude: { type: Number, default: null },
  deliveryLongitude: { type: Number, default: null },
  orderStatus: {
    type: String,
    enum: ["Pending", "Order Placed", "Preparing", "Packed", "Rider Assigned", "Picked Up", "Out for Delivery", "Delivered", "Cancelled", "Delivery Failed"],
    default: "Order Placed"
  },
  statusTimestamps: {
    pending: { type: Date, default: null },
    orderPlaced: { type: Date, default: Date.now },
    preparing: { type: Date, default: null },
    packed: { type: Date, default: null },
    riderAssigned: { type: Date, default: null },
    pickedUp: { type: Date, default: null },
    outForDelivery: { type: Date, default: null },
    delivered: { type: Date, default: null },
    cancelled: { type: Date, default: null },
    deliveryFailed: { type: Date, default: null }
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
  borzoOrderId: {
    type: String,
    default: null
  },
  borzoTrackingUrl: {
    type: String,
    default: null
  },
  borzoDeliveryStatus: {
    type: String,
    default: null
  },
  borzoRiderName: {
    type: String,
    default: null
  },
  borzoRiderPhone: {
    type: String,
    default: null
  },
  borzoDeliveryCost: {
    type: Number,
    default: 0
  },
  borzoWebhookData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
  couponCode: { type: String, default: "" },
  couponDiscount: { type: Number, default: 0 },
  buyCoinsRedeemed: { type: Number, default: 0 },
  buyCoinsDiscount: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
