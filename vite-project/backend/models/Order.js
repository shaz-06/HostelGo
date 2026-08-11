const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    index: true
  },
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
      image: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      variant: { type: String, default: "" },
      price: { type: Number, required: true },
      basePrice: { type: Number },
      pricingRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "PricingRule", default: null },
      pricingRuleName: { type: String, default: "" },
      pricingAdjustment: { type: Number, default: 0 }
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
  codConvenienceFee: { type: Number, default: 0 },
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
  assignedRider: {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    vehicleNumber: { type: String, default: "" },
    rating: { type: Number, default: 5.0 },
    assignedAt: { type: Date }
  },
  assignmentHistory: [
    {
      action: { type: String, default: "Assigned" },
      riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      previousRiderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      assignedAt: { type: Date, default: Date.now },
      assignedBy: { type: String, default: "Admin" },
      unassignedAt: { type: Date, default: null },
      reason: { type: String, default: "" }
    }
  ],
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
  couponDetails: {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "PromotionCoupon", default: null },
    code: { type: String, default: "" },
    title: { type: String, default: "" },
    discountType: { type: String, default: "" },
    discountValue: { type: Number, default: 0 },
    actualDiscountApplied: { type: Number, default: 0 }
  },
  buyCoinsRedeemed: { type: Number, default: 0 },
  buyCoinsDiscount: { type: Number, default: 0 },
  buyCoins: {
    applied: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  },
  buyCoinsCredited: { type: Boolean, default: false },
  buyCoinsEarned: { type: Number, default: 0 },
  noBagPledge: { type: Boolean, default: false },
  inventoryDeducted: { type: Boolean, default: false },
  adminNotificationStatus: {
    type: String,
    enum: ["pending", "processing", "sent", "failed"],
    default: "pending"
  },
  adminNotificationRetries: {
    type: Number,
    default: 0
  },
  adminNotificationLastAttemptAt: {
    type: Date,
    default: null
  },
  adminNotificationSentAt: {
    type: Date,
    default: null
  },
  adminNotificationMessageId: {
    type: String,
    default: null
  },
  simulatedRoute: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  ],
  trackingSessionActive: {
    type: Boolean,
    default: false
  },
  fulfillmentStore: {
    storeId: { type: String },
    storeName: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    radiusKm: { type: Number }
  },
  trackingVersion: {
    type: Number,
    default: 0
  },
  deliveryInstructions: {
    type: String,
    default: ""
  },
  birthdayReward: {
    applied: { type: Boolean, default: false },
    productId: { type: String, default: "" },
    year: { type: Number, default: null },
    promotionalPrice: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "assignedRider.riderId": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "user.phone": 1 });

module.exports = mongoose.model("Order", orderSchema);