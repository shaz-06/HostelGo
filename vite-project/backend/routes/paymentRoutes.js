const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createHmacSha256, timingSafeCompare } = require("../utils/cryptoUtils");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Config = require("../models/Config");
const DeliverySettings = require("../models/DeliverySettings");
const authMiddleware = require("../middleware/authMiddleware");
const DeliveryServiceZone = require("../models/DeliveryServiceZone");
const { getDistance } = require("../services/routeGenerator");
const Counter = require("../models/Counter");
const validateAddressForCheckout = async (addressId, userId) => {
  if (!addressId) return true;
  const AddressShare = require("../models/AddressShare");
  const Address = require("../models/Address");
  const User = require("../models/User");

  // Check if it belongs to the user
  const ownAddress = await Address.findOne({ _id: addressId, userId });
  if (ownAddress) return true;

  // Check if it's shared with the user and is active
  const share = await AddressShare.findOne({
    addressId,
    sharedWithUserId: userId,
    status: "accepted",
    expiresAt: { $gt: new Date() }
  });

  if (!share) return false;

  // Verify owner and address still exist
  const owner = await User.findById(share.ownerId);
  const address = await Address.findById(share.addressId);
  if (!owner || !address) return false;

  return true;
};

async function generateUniqueOrderId() {
  const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // "260726"
  const counterId = `order_sequence_${todayStr}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const paddedSeq = String(counter.seq).padStart(6, "0");
  return `BUY${todayStr}${paddedSeq}`;
}

async function validateAndCalculateDiscount({ couponCode, subtotal, user }) {
  if (!couponCode) return { discount: 0, couponDetails: null };
  const cleanCode = couponCode.toUpperCase().trim();
  const Coupon = require("../models/Coupon");
  const PromotionCoupon = require("../models/PromotionCoupon");
  const Order = require("../models/Order");
  const now = new Date();

  // Try checking user-specific first
  let coupon = await Coupon.findOne({ couponCode: cleanCode, email: user.email.toLowerCase() });
  if (coupon) {
    if (coupon.isRedeemed) throw new Error("Coupon has already been redeemed");
    if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon has expired");
    if (subtotal < coupon.minimumOrderValue) throw new Error(`Minimum order value of ₹${coupon.minimumOrderValue} required`);
    const discount = Math.min(coupon.discountAmount, subtotal);
    return {
      discount,
      couponDetails: {
        couponId: coupon._id,
        code: coupon.couponCode,
        title: "User Offer",
        discountType: "flat",
        discountValue: coupon.discountAmount,
        actualDiscountApplied: discount
      }
    };
  }

  // Check global promotion
  const promo = await PromotionCoupon.findOne({ code: cleanCode, isArchived: false });
  if (!promo) throw new Error("Coupon not found or invalid");
  if (!promo.isActive) throw new Error("This coupon is currently inactive");
  if (promo.validFrom > now) throw new Error("This coupon has not started yet");
  if (promo.validUntil < now) throw new Error("This coupon has expired");
  if (subtotal < promo.minimumOrderValue) throw new Error(`Minimum order value of ₹${promo.minimumOrderValue} required`);
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) throw new Error("This coupon's total usage limit has been reached");

  // Check per-user limit
  const userUsedCount = await Order.countDocuments({
    $or: [{ userId: user._id }, { "user.phone": user.phone }],
    couponCode: cleanCode,
    paymentStatus: "Paid"
  });
  if (promo.usagePerUser > 0 && userUsedCount >= promo.usagePerUser) {
    throw new Error(`You have already used this coupon the maximum allowed times (${promo.usagePerUser})`);
  }

  // Calculate discount
  let discount = 0;
  if (promo.couponType === "flat") {
    discount = promo.discountValue;
  } else if (promo.couponType === "percentage") {
    discount = Math.round((subtotal * promo.discountValue) / 100);
    if (promo.maximumDiscount > 0) {
      discount = Math.min(discount, promo.maximumDiscount);
    }
  } else if (promo.couponType === "free_delivery") {
    discount = subtotal < 200 ? 28 : 20; // free delivery discount equal to delivery fee
  }

  discount = Math.min(discount, subtotal);

  return {
    discount,
    couponDetails: {
      couponId: promo._id,
      code: promo.code,
      title: promo.title,
      discountType: promo.couponType,
      discountValue: promo.discountValue,
      actualDiscountApplied: discount
    }
  };
}

async function recalculateOrderSummary({ products, couponCode, buyCoinsRedeemed, reqUser, paymentMethod }) {
  const Product = require("../models/Product");
  const Config = require("../models/Config");
  const DeliverySettings = require("../models/DeliverySettings");

  // 1. Fetch products & recalculate subtotal
  const productIds = products.map(p => p.productId ? p.productId.toString() : p._id ? p._id.toString() : "");
  for (const id of productIds) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("One or more products are invalid, unavailable, or no longer exist. Please refresh your cart and try again.");
    }
  }
  const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();

  // Ensure every submitted product exists in MongoDB
  if (dbProducts.length !== new Set(productIds).size) {
    throw new Error("One or more products are invalid, unavailable, or no longer exist. Please refresh your cart and try again.");
  }

  const { calculateSellingPrice } = require("../services/pricingEngine");

  let subtotal = 0;
  const recalculatedProducts = [];
  for (const item of products) {
    const pId = item.productId ? item.productId.toString() : item._id ? item._id.toString() : "";
    const dbProd = dbProducts.find(p => p._id.toString() === pId);
    if (!dbProd) {
      throw new Error("One or more products are invalid, unavailable, or no longer exist. Please refresh your cart and try again.");
    }

    const priceCalc = await calculateSellingPrice(dbProd);
    const dbPrice = priceCalc.finalPrice;

    subtotal += dbPrice * item.quantity;
    
    // Ignore all client-supplied prices/metadata. Derive solely from database.
    recalculatedProducts.push({
      productId: pId,
      name: dbProd.name,
      quantity: item.quantity,
      weight: item.selectedWeight || item.weight || dbProd.weight,
      image: dbProd.image || "",
      imageUrl: dbProd.image || "",
      price: dbPrice,
      basePrice: priceCalc.originalBasePrice,
      pricingRuleId: priceCalc.activeRule ? priceCalc.activeRule._id : null,
      pricingRuleName: priceCalc.activeRule ? priceCalc.activeRule.name : "",
      pricingAdjustment: priceCalc.adjustmentAmount
    });
  }

  // 2. Load configurations
  const configDoc = await Config.findOne({ key: "fees_config" }).lean() || {};
  const deliverySettingsDoc = await DeliverySettings.findOne().lean() || {};

  const cfg = {
    handlingFee: typeof configDoc.handlingFee === "number" ? configDoc.handlingFee : 0,
    gstPercentage: typeof configDoc.gstPercentage === "number" ? configDoc.gstPercentage : 5,
    gstFixedCharges: typeof configDoc.gstFixedCharges === "number" ? configDoc.gstFixedCharges : 2,
  };

  const handling = subtotal > 0 ? cfg.handlingFee : 0;
  const smallCart = (subtotal > 0 && subtotal < 149) ? 20 : 0;
  let delivery = subtotal > 0 ? (subtotal < 200 ? 28 : 20) : 0;
  const rain = (subtotal > 0 && deliverySettingsDoc.rainyDeliveryEnabled) ? 30 : 0;

  const now = new Date();
  const hours = now.getHours();
  const isLateNightTime = hours >= 22 || hours < 6;
  const lateNight = (subtotal > 0 && deliverySettingsDoc.lateNightDeliveryEnabled && isLateNightTime) ? 30 : 0;

  const gst = subtotal > 0 ? Math.round(subtotal * (cfg.gstPercentage / 100) + cfg.gstFixedCharges) : 0;

  // Pre-discount total
  const preDiscountTotal = subtotal > 0 
    ? subtotal + handling + smallCart + delivery + rain + lateNight + gst 
    : 0;

  // 3. Coupon Discount
  const { discount: couponDiscount, couponDetails } = await validateAndCalculateDiscount({
    couponCode,
    subtotal,
    user: reqUser
  });

  // If couponType is free_delivery, coupon discount is exactly equal to the delivery fee
  let finalCouponDiscount = couponDiscount;
  if (couponDetails && couponDetails.discountType === "free_delivery") {
    finalCouponDiscount = delivery;
  }

  // 4. BuyCoins Discount
  const remaining = Math.max(0, preDiscountTotal - finalCouponDiscount);
  let buyCoinsDiscount = 0;
  if (buyCoinsRedeemed && Number(buyCoinsRedeemed) > 0) {
    const minOrder = typeof configDoc.minBuyCoinsOrder === "number" ? configDoc.minBuyCoinsOrder : 99;
    const maxPercent = typeof configDoc.maxRedemptionPercent === "number" ? configDoc.maxRedemptionPercent : 20;

    if (subtotal <= minOrder) {
      throw new Error(`BuyCoins can only be redeemed on orders above ₹${minOrder}.`);
    }
    if (Number(buyCoinsRedeemed) > (reqUser.buyCoins || 0)) {
      throw new Error("Insufficient BuyCoins balance.");
    }
    const maxDiscount = Math.floor(subtotal * (maxPercent / 100));
    const maxRedeemableCoins = Math.min(reqUser.buyCoins || 0, maxDiscount);
    if (Number(buyCoinsRedeemed) > maxRedeemableCoins) {
      throw new Error(`Cannot redeem more than ${maxRedeemableCoins} BuyCoins.`);
    }
    buyCoinsDiscount = Math.min(Number(buyCoinsRedeemed), maxRedeemableCoins, Math.max(0, remaining - 1));
  }

  let finalTotal = subtotal > 0 ? Math.max(1, remaining - buyCoinsDiscount) : 0;

  // 5. COD Convenience Fee
  const codFee = (paymentMethod === "cod" && configDoc.codConvenienceFeeEnabled !== false)
    ? (typeof configDoc.codConvenienceFee === "number" ? configDoc.codConvenienceFee : 14)
    : 0;

  if (finalTotal > 0) {
    finalTotal += codFee;
  }

  return {
    subtotal,
    recalculatedProducts,
    preDiscountTotal,
    couponDiscount: finalCouponDiscount,
    couponDetails,
    buyCoinsDiscount,
    codConvenienceFee: codFee,
    total: finalTotal
  };
}

// Coordinates helper to extract latitude and longitude robustly
function extractCoordinates(obj) {
  if (!obj) return null;
  // Check location field (GeoJSON)
  if (obj.location && obj.location.type === "Point" && Array.isArray(obj.location.coordinates)) {
    const [lon, lat] = obj.location.coordinates;
    return { latitude: Number(lat), longitude: Number(lon) };
  }
  // Check raw coordinates field (GeoJSON style array)
  if (Array.isArray(obj.coordinates)) {
    const [lon, lat] = obj.coordinates;
    return { latitude: Number(lat), longitude: Number(lon) };
  }
  // Plain fields
  const lat = obj.latitude !== undefined ? obj.latitude : obj.lat;
  const lng = obj.longitude !== undefined ? obj.longitude : (obj.lng !== undefined ? obj.lng : obj.lon);
  if (lat !== undefined && lng !== undefined) {
    return { latitude: Number(lat), longitude: Number(lng) };
  }
  return null;
}

async function assignFulfillmentStore(latitude, longitude) {
  console.log("=== ASSIGN FULFILLMENT STORE CHECK ===");
  console.log("Customer Coordinates Input:", { latitude, longitude });

  const customerCoords = extractCoordinates({ latitude, longitude });
  if (!customerCoords) {
    console.warn("⚠️ Invalid/missing customer coordinates. Checking default zone...");
    const defaultZone = await DeliveryServiceZone.findOne({ active: true }).lean();
    if (!defaultZone) {
      console.error("❌ No active delivery zones available for default fallback.");
      return null;
    }
    const defaultCoords = extractCoordinates(defaultZone) || { latitude: defaultZone.latitude, longitude: defaultZone.longitude };
    return {
      storeId: String(defaultZone._id),
      storeName: defaultZone.name,
      latitude: defaultCoords.latitude,
      longitude: defaultCoords.longitude,
      radiusKm: Number(defaultZone.radiusKm)
    };
  }

  const { latitude: custLat, longitude: custLng } = customerCoords;
  console.log("Customer Latitude:", custLat);
  console.log("Customer Longitude:", custLng);

  if (isNaN(custLat) || isNaN(custLng) || custLat === null || custLng === null || custLat === 0 || custLng === 0) {
    console.error("❌ Invalid Customer Coordinates (null, NaN, 0, or empty string) in assignFulfillmentStore.");
    return null;
  }

  const activeZones = await DeliveryServiceZone.find({ active: true }).lean();
  console.log("Delivery Zones", activeZones);

  if (activeZones.length === 0) {
    console.log("Checkout Decision -> 0 Active Zones -> Store Assignment Null");
    return null;
  }

  const eligibleStores = [];

  for (const zone of activeZones) {
    const zoneCoords = extractCoordinates(zone);
    if (!zoneCoords) {
      console.warn(`⚠️ Skipping zone "${zone.name}" because it has invalid or missing coordinates.`);
      continue;
    }

    const { latitude: storeLat, longitude: storeLng } = zoneCoords;
    if (isNaN(storeLat) || isNaN(storeLng) || storeLat === null || storeLng === null || storeLat === 0 || storeLng === 0) {
      console.warn(`⚠️ Skipping zone "${zone.name}" due to invalid coordinate values:`, { storeLat, storeLng });
      continue;
    }

    // Radius validation
    if (zone.radiusKm === undefined || zone.radiusKm === null) {
      console.warn(`⚠️ Skipping zone "${zone.name}" due to missing radiusKm.`);
      continue;
    }
    const radiusKm = Number(zone.radiusKm);
    if (isNaN(radiusKm) || radiusKm <= 0) {
      console.warn(`⚠️ Skipping zone "${zone.name}" due to invalid radiusKm:`, zone.radiusKm);
      continue;
    }

    // Exact Distance calculation
    const distanceKm = getDistance(custLat, custLng, storeLat, storeLng);
    const inside = distanceKm <= radiusKm;

    console.log("-------------------");
    console.log(`Store: ${zone.name}`);
    console.log(`Customer:\n${custLat}, ${custLng}`);
    console.log(`Store:\n${storeLat}, ${storeLng}`);
    console.log(`Distance:\n${distanceKm.toFixed(4)} km`);
    console.log(`Radius:\n${radiusKm} km`);
    console.log(`Radius Type:\n${typeof zone.radiusKm}`);
    console.log(`Eligible:\n${inside ? "YES" : "NO"}`);

    if (inside) {
      eligibleStores.push({
        storeId: String(zone._id),
        storeName: zone.name,
        latitude: storeLat,
        longitude: storeLng,
        radiusKm: radiusKm,
        distanceKm: distanceKm
      });
    } else {
      console.log(`Store "${zone.name}" failed because distance ${distanceKm.toFixed(2)} km is greater than radius ${radiusKm} km`);
    }
  }

  console.log("Eligible Stores:", eligibleStores);

  if (eligibleStores.length === 0) {
    console.log("Checkout Decision -> 0 Eligible Stores -> Store Assignment Null");
    return null;
  }

  // Sort by distance and pick the nearest
  eligibleStores.sort((a, b) => a.distanceKm - b.distanceKm);
  const selectedStore = eligibleStores[0];

  console.log("Checkout Decision");
  console.log("Customer Location");
  console.log(`↓\n${activeZones.length} Active Stores`);
  console.log(`↓\n${eligibleStores.length} Eligible`);
  console.log(`↓\nNearest: ${selectedStore.storeName}`);
  console.log("↓\nProceed");

  return {
    storeId: selectedStore.storeId,
    storeName: selectedStore.storeName,
    latitude: selectedStore.latitude,
    longitude: selectedStore.longitude,
    radiusKm: selectedStore.radiusKm
  };
}
const { createBorzoOrder } = require("../utils/borzo");
const { sendOrderStatusNotification } = require("../services/notificationService");

const TRACKING_STEPS = ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Out for Delivery", "Delivered"];
const STATUS_TIMESTAMP_KEYS = {
  "Order Placed": "orderPlaced",
  Preparing: "preparing",
  Packed: "packed",
  "Rider Assigned": "riderAssigned",
  "Out for Delivery": "outForDelivery",
  Delivered: "delivered",
  Cancelled: "cancelled"
};

const getEtaMinutes = (order) => {
  if (order.orderStatus === "Delivered") return 0;
  if (order.estimatedDeliveryTime) {
    return Math.max(0, Math.ceil((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000));
  }
  return order.estimatedArrivalMinutes || 0;
};

const buildTrackingPayload = async (order) => {
  const orderObject = typeof order.toObject === "function" ? order.toObject() : order;
  const stepIndex = TRACKING_STEPS.indexOf(orderObject.orderStatus);
  const completedIndex = orderObject.orderStatus === "Cancelled" ? 0 : Math.max(stepIndex, 0);
  const progress = orderObject.orderStatus === "Cancelled"
    ? 0
    : Math.round((completedIndex / (TRACKING_STEPS.length - 1)) * 100);

  const rider = orderObject.riderId
    ? await User.findById(orderObject.riderId).select("name phone role vehicleType isOnline currentLocation profileImage").lean()
    : null;

  const minutes = getEtaMinutes(orderObject);
  const eta = {
    estimatedDeliveryTime: orderObject.estimatedDeliveryTime,
    estimatedArrivalMinutes: minutes,
    label: orderObject.orderStatus === "Delivered"
      ? "Delivered"
      : minutes <= 2 && orderObject.riderAssigned
        ? "Rider nearby"
        : `Arriving in ${minutes} mins`
  };

  return {
    order: orderObject,
    rider: rider || (orderObject.riderAssigned ? {
      name: orderObject.riderName,
      phone: orderObject.riderPhone,
      vehicleType: "Delivery Vehicle",
      isOnline: false,
      profileImage: ""
    } : null),
    eta,
    progress,
    timestamps: orderObject.statusTimestamps || {},
    steps: TRACKING_STEPS
  };
};

// Initialize Razorpay SDK instance safely
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ Razorpay Key configuration missing in environment variables!");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "mock_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_key_secret"
  });
};

// POST /api/payment/create-order
router.post("/payment/create-order", authMiddleware, async (req, res) => {
  console.log("=== CREATE ORDER HIT ===");
  console.log("=== [BACKEND] POST /api/payment/create-order ===");
  console.log("Request Body:", JSON.stringify(req.body, null, 2));
  console.log("=== ORDER USER DATA ===");
  console.log(req.body.user);
  console.log("RAZORPAY_KEY_ID in env:", process.env.RAZORPAY_KEY_ID);
  console.log("MongoDB connection state (readyState):", mongoose.connection.readyState);

  try {
    const { amount, user, products, deliveryAddress, couponId, couponCode, buyCoinsRedeemed, noBagPledge, addressId } = req.body;

    if (!user || typeof user !== "object" || !products || !deliveryAddress) {
      console.error("❌ Validation Error: user, products, or deliveryAddress missing or invalid");
      return res.status(400).json({ message: "User, products, and deliveryAddress are required" });
    }

    // Address sharing validation check
    const isAddressValid = await validateAddressForCheckout(addressId, req.user._id);
    if (!isAddressValid) {
      return res.status(400).json({
        success: false,
        message: "This shared address is no longer available. Please choose another delivery address."
      });
    }

    // Server-side recalculation
    let recalculated;
    try {
      recalculated = await recalculateOrderSummary({
        products,
        couponCode,
        buyCoinsRedeemed,
        reqUser: req.user,
        paymentMethod: "razorpay"
      });
    } catch (err) {
      const invalidProductIds = products.map(p => p.productId || p._id).filter(id => !mongoose.Types.ObjectId.isValid(id));
      console.error("[VALIDATION ERROR] Razorpay Order Creation Failed:", {
        requestId: req.headers["x-request-id"] || "N/A",
        userId: req.user?._id || "anonymous",
        invalidProductIds,
        submittedProducts: products.map(p => ({ productId: p.productId || p._id, quantity: p.quantity })),
        cartSize: products.length,
        errorMessage: err.message
      });
      return res.status(400).json({ success: false, requiresRefresh: true, message: err.message });
    }

    // Verify if client-sent amount matches server recalculated total. If they differ, log mismatch and reject.
    const clientAmount = Number(amount);
    if (Math.abs(clientAmount - recalculated.total) > 1) {
      console.warn(`Price/Discount Mismatch (Razorpay): Client sent ₹${clientAmount}, Server calculated ₹${recalculated.total}`);
      return res.status(400).json({
        success: false,
        requiresRefresh: true,
        message: "Your cart or discount has changed. Please review your order before continuing."
      });
    }

    const numericAmount = recalculated.total;

    // 2. Initialize Razorpay
    console.log("Initializing Razorpay instance...");
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(numericAmount * 100), // convert to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Creating order in Razorpay with options:", options);
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("=== RAZORPAY ORDER CREATED ===");
    console.log("Razorpay Order Created Successfully:", razorpayOrder);

    const deliveryLatitude = req.body.deliveryLatitude || null;
    const deliveryLongitude = req.body.deliveryLongitude || null;

    const storeAssignment = await assignFulfillmentStore(deliveryLatitude, deliveryLongitude);
    if (!storeAssignment) {
      console.warn(`[payment/create-order] Location outside all service zones: lat=${deliveryLatitude}, lng=${deliveryLongitude}`);
      return res.status(400).json({
        success: false,
        serviceable: false,
        message: "Sorry! Buyto is not yet delivering to your location."
      });
    }

    // 3. Save pending order in MongoDB
    const orderId = await generateUniqueOrderId();
    const order = new Order({
      orderId,
      user,
      userId: req.user._id,
      products: recalculated.products,
      totalAmount: numericAmount,
      paymentMethod: "razorpay",
      paymentStatus: "Pending",
      razorpayOrderId: razorpayOrder.id,
      codConvenienceFee: recalculated.codConvenienceFee || 0,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      fulfillmentStore: storeAssignment,
      orderStatus: "Order Placed",
      estimatedArrivalMinutes: 30,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
      couponId: recalculated.couponDetails?.couponId || null,
      couponCode: recalculated.couponDetails?.code || "",
      couponDiscount: recalculated.couponDiscount,
      couponDetails: recalculated.couponDetails,
      buyCoinsRedeemed: Number(buyCoinsRedeemed || 0),
      buyCoinsDiscount: recalculated.buyCoinsDiscount,
      buyCoins: {
        applied: Number(buyCoinsRedeemed || 0),
        discount: recalculated.buyCoinsDiscount
      },
      noBagPledge: Boolean(noBagPledge)
    });

    if (deliveryLatitude && deliveryLongitude) {
      req.user.latitude = deliveryLatitude;
      req.user.longitude = deliveryLongitude;
      req.user.currentLocation = {
        lat: deliveryLatitude,
        lng: deliveryLongitude,
        address: deliveryAddress
      };
      await req.user.save();
      console.log(`=== CUSTOMER GPS ===\nUser ID: ${req.user._id}, Lat: ${deliveryLatitude}, Lng: ${deliveryLongitude}`);
    }

    console.log("=== [BACKEND DB SAVE] Attempting to save Pending Order to MongoDB ===");
    console.log("Order Data to be saved:", JSON.stringify(order, null, 2));

    try {
      const savedOrder = await order.save();
      if (req.body.addressId) {
        const Address = require("../models/Address");
        await Address.updateOne({ _id: req.body.addressId }, { lastUsedAt: new Date() }).catch(err => console.error(err));
      }
      console.log("=== ORDER SAVED ===");
      console.log("=== [BACKEND DB SAVE SUCCESS] Pending Order Saved Successfully ===");
      console.log("Saved Pending Order Document ID:", savedOrder._id);

      return res.status(201).json({
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        order: savedOrder
      });
    } catch (dbError) {
      console.error("❌ === [BACKEND DB SAVE ERROR] Failed to save Pending Order to MongoDB ===");
      console.error("Error Message:", dbError.message);
      console.error("Error Stack:", dbError.stack);
      return res.status(500).json({
        message: "Failed to persist pending order in database",
        error: dbError.message,
        stack: dbError.stack
      });
    }
  } catch (error) {
    console.error("❌ Create Razorpay Order Exception Failed!", error);
    return res.status(500).json({
      message: "Razorpay order creation failed",
      error: error.message,
      stack: error.stack,
      keyIdConfigured: !!process.env.RAZORPAY_KEY_ID,
      secretConfigured: !!process.env.RAZORPAY_KEY_SECRET
    });
  }
});

// POST /api/payment/verify
router.post("/payment/verify", async (req, res) => {
  console.log("=== [BACKEND] POST /api/payment/verify ===");
  console.log("Request Body:", JSON.stringify(req.body, null, 2));

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Verification Error: Missing params in req.body");
      return res.status(400).json({ message: "Verification parameters are missing" });
    }

    // Cryptographic signature verification
    console.log("Performing signature verification...");
    const secret = process.env.RAZORPAY_KEY_SECRET || "mock_key_secret";
    const generatedSignature = createHmacSha256(`${razorpay_order_id}|${razorpay_payment_id}`, secret);

    const isValidSignature = timingSafeCompare(generatedSignature, razorpay_signature);
    console.log("Is signature valid?", isValidSignature);

    if (!isValidSignature) {
      console.error("❌ Signature verification failed!");
      try {
        console.log("Attempting to locate pending order to mark as Failed...");
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (order) {
          order.paymentStatus = "Failed";
          await order.save();
          console.log("Order paymentStatus updated to Failed in DB for document ID:", order._id);
        }
      } catch (dbErr) {
        console.error("❌ Failed to update failed order status in database:", dbErr.message);
      }
      return res.status(400).json({ success: false, message: "Invalid payment signature verification failed" });
    }

    console.log("Signature is valid! Retrieving pending order from DB...");
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      console.error(`❌ Database Error: Pending order not found in database for razorpayOrderId: ${razorpay_order_id}`);
      return res.status(404).json({
        message: "Pending order not found in database. Persistent order required to verify payment.",
        razorpay_order_id
      });
    }

    console.log("Retrieved Pending Order from DB:", JSON.stringify(order, null, 2));

    // 1. Update Payment Status to Paid
    order.paymentStatus = "Paid";
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    console.log("=== [BACKEND DB UPDATE] Saving Paid Order to DB ===");
    try {
      let savedOrder = await order.save();
      console.log("=== PAYMENT VERIFIED ===");
      console.log("=== [BACKEND DB UPDATE SUCCESS] Paid Order Saved to MongoDB Successfully ===");
      console.log("Saved Document ID:", savedOrder._id);

      const { consumeOrderDiscounts, handleOrderCheckoutRewards } = require("../utils/rewards");
      await consumeOrderDiscounts(savedOrder);
      await handleOrderCheckoutRewards(savedOrder);

      // Auto-remove purchased products from Save For Later if configured
      try {
        const { AUTO_REMOVE_SAVED_PRODUCT_AFTER_PURCHASE } = require("../config/savedProductsConfig");
        if (AUTO_REMOVE_SAVED_PRODUCT_AFTER_PURCHASE) {
          const userObj = await User.findById(savedOrder.userId);
          if (userObj && userObj.savedProducts && userObj.savedProducts.length > 0) {
            const purchasedProductIds = savedOrder.products.map(p => p.productId ? p.productId.toString() : "");
            userObj.savedProducts = userObj.savedProducts.filter(item =>
              item.productId && !purchasedProductIds.includes(item.productId.toString())
            );
            await userObj.save();
            console.log(`Auto-removed purchased products from User ${userObj._id}'s Save For Later list.`);
          }
        }
      } catch (err) {
        console.error("Auto-remove saved products failed:", err.message);
      }

      // Create Borzo delivery order automatically
      try {
        const borzoResult = await createBorzoOrder(savedOrder);
        if (borzoResult && borzoResult.borzoOrderId) {
          savedOrder.borzoOrderId = borzoResult.borzoOrderId;
          savedOrder.borzoTrackingUrl = borzoResult.trackingUrl;
          savedOrder.borzoDeliveryCost = borzoResult.deliveryCost;
          savedOrder.borzoDeliveryStatus = "new";
          savedOrder.orderStatus = "Order Placed";
          savedOrder.statusTimestamps.orderPlaced = new Date();
          await savedOrder.save();
          console.log(`Borzo order created successfully: ${borzoResult.borzoOrderId}`);
        }
      } catch (borzoError) {
        console.error("❌ Borzo Order Dispatch failed on payment verification:", borzoError.message);
      }

      // Send push notification for successful order placement
      sendOrderStatusNotification(savedOrder, "Order Placed").catch(err => {
        console.error("Failed to send order placed notification:", err);
      });

      // Send admin notifications
      try {
        const { sendAdminNotification } = require("../services/fcmService");
        sendAdminNotification(savedOrder).catch(err => {
          console.error("Failed to send FCM admin notification:", err);
        });
        const { sendNewOrderNotification } = require("../services/adminNotificationService");
        sendNewOrderNotification(savedOrder).catch(err => {
          console.error("Failed to send new order notification to admin:", err);
        });
      } catch (err) {
        console.error("Failed to require/call sendAdminNotification:", err);
      }

      // Emit socket event for admin dashboard
      if (req.io) {
        req.io.emit("newOrderArrived", savedOrder);
        console.log("=== Socket.IO emitted newOrderArrived (Razorpay) ===");
      }


      // 2. Reduce Stock Levels in MongoDB (executed ONLY after successful DB save)
      console.log("Reducing inventory stock...");
      for (const item of savedOrder.products) {
        try {
          const filter = [];
          if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
            filter.push({ _id: item.productId });
          }
          if (item.productId) {
            filter.push({ id: item.productId });
          }
          const product = filter.length > 0 ? await Product.findOne({ $or: filter }) : null;

          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
            const savedProduct = await product.save();
            console.log(`Successfully reduced stock for ${savedProduct.name} (ID: ${item.productId}) by ${item.quantity}. New Stock: ${savedProduct.stock}`);
          } else {
            console.warn(`⚠️ Product not found for stock reduction: ${item.productId}`);
          }
        } catch (dbError) {
          console.error(`❌ Failed to update stock for product ${item.productId}:`, dbError.message);
        }
      }

      // Do not start tracking session on payment verification. Just reload order.
      try {
        const updatedOrder = await Order.findById(savedOrder._id).lean();
        if (updatedOrder) {
          savedOrder = updatedOrder;
        }
      } catch (trackErr) {
        console.error("❌ Failed to reload order on payment verification:", trackErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Payment signature verified successfully and order updated in DB",
        orderId: savedOrder.orderId,
        order: savedOrder,
        trackingReady: true
      });
    } catch (saveError) {
      console.error("❌ === [BACKEND DB UPDATE ERROR] Failed to save Paid Order ===");
      console.error("Error Message:", saveError.message);
      return res.status(500).json({
        message: "Failed to persist Paid order in database",
        error: saveError.message,
        stack: saveError.stack
      });
    }
  } catch (error) {
    console.error("❌ Payment Signature Verification Exception:", error);
    return res.status(500).json({
      message: "Error verifying payment signature",
      error: error.message,
      stack: error.stack
    });
  }
});

// POST /api/orders (Standard COD Order flow)
router.post("/orders", authMiddleware, async (req, res) => {
  console.log("=== CREATE ORDER HIT ===");
  console.log("=== [BACKEND] POST /api/orders (COD) ===");
  console.log("Request Body:", JSON.stringify(req.body, null, 2));
  console.log("=== ORDER USER DATA ===");
  console.log(req.body.user);

  try {
    const { user, products, amount, deliveryAddress, couponId, couponCode, buyCoinsRedeemed, noBagPledge, addressId } = req.body;

    if (!user || typeof user !== "object" || !products || amount === undefined || !deliveryAddress) {
      console.error("❌ COD Validation Error: Missing required fields or invalid user details");
      return res.status(400).json({ message: "All fields are required" });
    }

    // Address sharing validation check
    const isAddressValid = await validateAddressForCheckout(addressId, req.user._id);
    if (!isAddressValid) {
      return res.status(400).json({
        success: false,
        message: "This shared address is no longer available. Please choose another delivery address."
      });
    }

    // Server-side recalculation
    let recalculated;
    try {
      recalculated = await recalculateOrderSummary({
        products,
        couponCode,
        buyCoinsRedeemed,
        reqUser: req.user,
        paymentMethod: "cod"
      });
    } catch (err) {
      const invalidProductIds = products.map(p => p.productId || p._id).filter(id => !mongoose.Types.ObjectId.isValid(id));
      console.error("[VALIDATION ERROR] COD Order Creation Failed:", {
        requestId: req.headers["x-request-id"] || "N/A",
        userId: req.user?._id || "anonymous",
        invalidProductIds,
        submittedProducts: products.map(p => ({ productId: p.productId || p._id, quantity: p.quantity })),
        cartSize: products.length,
        errorMessage: err.message
      });
      return res.status(400).json({ success: false, requiresRefresh: true, message: err.message });
    }

    // Verify if client-sent amount matches server recalculated total. If they differ, log mismatch and reject.
    const clientAmount = Number(amount);
    if (Math.abs(clientAmount - recalculated.total) > 1) {
      console.warn(`Price/Discount Mismatch (COD): Client sent ₹${clientAmount}, Server calculated ₹${recalculated.total}`);
      return res.status(400).json({
        success: false,
        requiresRefresh: true,
        message: "Your cart or discount has changed. Please review your order before continuing."
      });
    }

    const numericAmount = recalculated.total;

    const deliveryLatitude = req.body.deliveryLatitude || null;
    const deliveryLongitude = req.body.deliveryLongitude || null;

    const storeAssignment = await assignFulfillmentStore(deliveryLatitude, deliveryLongitude);
    if (!storeAssignment) {
      console.warn(`[payment/cod] Location outside all service zones: lat=${deliveryLatitude}, lng=${deliveryLongitude}`);
      return res.status(400).json({
        success: false,
        serviceable: false,
        message: "Sorry! Buyto is not yet delivering to your location."
      });
    }

    // 1. Create COD Order record
    const orderId = await generateUniqueOrderId();
    const order = new Order({
      orderId,
      user,
      userId: req.user._id,
      products: recalculated.products,
      totalAmount: numericAmount,
      paymentMethod: "cod",
      paymentStatus: "Pending", // COD remains pending until hand-delivered
      codConvenienceFee: recalculated.codConvenienceFee || 0,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      fulfillmentStore: storeAssignment,
      orderStatus: "Order Placed",
      estimatedArrivalMinutes: 30,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
      couponId: recalculated.couponDetails?.couponId || null,
      couponCode: recalculated.couponDetails?.code || "",
      couponDiscount: recalculated.couponDiscount,
      couponDetails: recalculated.couponDetails,
      buyCoinsRedeemed: Number(buyCoinsRedeemed || 0),
      buyCoinsDiscount: recalculated.buyCoinsDiscount,
      buyCoins: {
        applied: Number(buyCoinsRedeemed || 0),
        discount: recalculated.buyCoinsDiscount
      },
      noBagPledge: Boolean(noBagPledge)
    });

    if (deliveryLatitude && deliveryLongitude) {
      req.user.latitude = deliveryLatitude;
      req.user.longitude = deliveryLongitude;
      req.user.currentLocation = {
        lat: deliveryLatitude,
        lng: deliveryLongitude,
        address: deliveryAddress
      };
      await req.user.save();
      console.log(`=== CUSTOMER GPS ===\nUser ID: ${req.user._id}, Lat: ${deliveryLatitude}, Lng: ${deliveryLongitude}`);
    }

    console.log("=== [BACKEND DB SAVE] Saving COD Order to DB ===");
    try {
      let savedOrder = await order.save();
      if (req.body.addressId) {
        const Address = require("../models/Address");
        await Address.updateOne({ _id: req.body.addressId }, { lastUsedAt: new Date() }).catch(err => console.error(err));
      }
      console.log("=== ORDER SAVED ===");
      console.log("=== [BACKEND DB SAVE SUCCESS] COD Order Saved Successfully ===");
      console.log("Saved Document ID:", savedOrder._id);

      const { consumeOrderDiscounts, handleOrderCheckoutRewards } = require("../utils/rewards");
      await consumeOrderDiscounts(savedOrder);
      await handleOrderCheckoutRewards(savedOrder);

      // Auto-remove purchased products from Save For Later if configured
      try {
        const { AUTO_REMOVE_SAVED_PRODUCT_AFTER_PURCHASE } = require("../config/savedProductsConfig");
        if (AUTO_REMOVE_SAVED_PRODUCT_AFTER_PURCHASE) {
          const userObj = await User.findById(savedOrder.userId);
          if (userObj && userObj.savedProducts && userObj.savedProducts.length > 0) {
            const purchasedProductIds = savedOrder.products.map(p => p.productId ? p.productId.toString() : "");
            userObj.savedProducts = userObj.savedProducts.filter(item =>
              item.productId && !purchasedProductIds.includes(item.productId.toString())
            );
            await userObj.save();
            console.log(`Auto-removed purchased products from User ${userObj._id}'s Save For Later list.`);
          }
        }
      } catch (err) {
        console.error("Auto-remove saved products failed:", err.message);
      }

      // Create Borzo delivery order automatically
      try {
        const borzoResult = await createBorzoOrder(savedOrder);
        if (borzoResult && borzoResult.borzoOrderId) {
          savedOrder.borzoOrderId = borzoResult.borzoOrderId;
          savedOrder.borzoTrackingUrl = borzoResult.trackingUrl;
          savedOrder.borzoDeliveryCost = borzoResult.deliveryCost;
          savedOrder.borzoDeliveryStatus = "new";
          savedOrder.orderStatus = "Order Placed";
          savedOrder.statusTimestamps.orderPlaced = new Date();
          await savedOrder.save();
          console.log(`Borzo order created successfully: ${borzoResult.borzoOrderId}`);
        }
      } catch (borzoError) {
        console.error("❌ Borzo Order Dispatch failed on COD placement:", borzoError.message);
      }

      // Send push notification for successful COD order placement
      sendOrderStatusNotification(savedOrder, "Order Placed").catch(err => {
        console.error("Failed to send COD order placed notification:", err);
      });

      // Send admin notifications
      try {
        const { sendAdminNotification } = require("../services/fcmService");
        sendAdminNotification(savedOrder).catch(err => {
          console.error("Failed to send FCM admin notification:", err);
        });
        const { sendNewOrderNotification } = require("../services/adminNotificationService");
        sendNewOrderNotification(savedOrder).catch(err => {
          console.error("Failed to send new order notification to admin:", err);
        });
      } catch (err) {
        console.error("Failed to require/call sendAdminNotification:", err);
      }

      // Emit socket event for admin dashboard
      if (req.io) {
        req.io.emit("newOrderArrived", savedOrder);
        console.log("=== Socket.IO emitted newOrderArrived (COD) ===");
      }


      // 2. Reduce Stock Levels in MongoDB (executed ONLY after successful DB save)
      console.log("Reducing inventory stock for COD order...");
      for (const item of products) {
        try {
          const filter = [];
          if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
            filter.push({ _id: item.productId });
          }
          if (item.productId) {
            filter.push({ id: item.productId });
          }
          const product = filter.length > 0 ? await Product.findOne({ $or: filter }) : null;

          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
            const savedProduct = await product.save();
            console.log(`Reduced stock for ${savedProduct.name} (ID: ${item.productId}) by ${item.quantity}. New Stock: ${savedProduct.stock}`);
          } else {
            console.warn(`⚠️ Product not found for stock reduction: ${item.productId}`);
          }
        } catch (dbError) {
          console.error(`❌ Failed to update stock for product ${item.productId}:`, dbError.message);
        }
      }

      // Do not start tracking session on COD placement. Just reload order.
      try {
        const updatedOrder = await Order.findById(savedOrder._id).lean();
        if (updatedOrder) {
          savedOrder = updatedOrder;
        }
      } catch (trackErr) {
        console.error("❌ Failed to reload order on COD placement:", trackErr.message);
      }

      return res.status(201).json({
        success: true,
        message: "COD order placed successfully",
        orderId: savedOrder.orderId,
        order: savedOrder,
        trackingReady: true
      });
    } catch (saveError) {
      console.error("❌ === [BACKEND DB SAVE ERROR] Failed to save COD Order ===");
      console.error("Error Message:", saveError.message);
      return res.status(500).json({
        message: "Failed to persist COD order in database",
        error: saveError.message,
        stack: saveError.stack
      });
    }
  } catch (error) {
    console.error("❌ COD Order Placement Exception:", error);
    return res.status(500).json({
      message: "Failed to place COD order",
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/orders/:orderId/invoice or GET /api/invoice/:orderId
const generateInvoicePDFHandler = async (req, res) => {
  const orderId = req.params.orderId || req.params.id;
  console.log(`=== [INVOICE GENERATION START] Order ID: ${orderId} | User: ${req.user?._id} ===`);

  try {
    const order = await Order.findOne({ orderId }).lean();
    if (!order) {
      console.warn(`[INVOICE FAIL] Order not found in DB: ${orderId}`);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Ownership check
    const isOwner = (order.userId && String(order.userId) === String(req.user._id)) ||
      (order.user && order.user.phone === req.user.phone);
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !isOwner) {
      console.warn(`[INVOICE FAIL] Access denied for User ${req.user._id} on Order ${orderId}`);
      return res.status(403).json({ success: false, message: "Access denied to order invoice" });
    }

    console.log(`[INVOICE SUCCESS] Order verified. Generating PDF for Order #${orderId}...`);

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    const shortId = order.orderId;
    const filename = `Buyto-Invoice-${shortId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Buyto Branding Header
    doc.fillColor("#318616").fontSize(26).font("Helvetica-Bold").text("Buyto", { inline: true });
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("  Instant Grocery & Daily Essentials", { inline: true });
    doc.moveDown(0.5);
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Invoice Title & Meta Box
    const metaY = doc.y;
    doc.fillColor("#0f172a").fontSize(16).font("Helvetica-Bold").text("TAX INVOICE", 40, metaY);
    doc.fillColor("#64748b").fontSize(9).font("Helvetica");
    doc.text(`Invoice No: INV-${shortId}`, 40, metaY + 22);
    doc.text(`Order ID: #${shortId}`, 40, metaY + 34);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")}`, 40, metaY + 46);

    // Customer / Address Box
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("Delivered To:", 340, metaY);
    doc.fillColor("#334155").fontSize(9).font("Helvetica");
    doc.text(order.user?.name || req.user.name || "Customer", 340, metaY + 16);
    doc.text(`Phone: +91 ${order.user?.phone || req.user.phone || "N/A"}`, 340, metaY + 28);
    doc.text(`Address: ${order.deliveryAddress || "Standard Hostel Delivery"}`, 340, metaY + 40, { width: 200 });

    doc.moveDown(4);

    // Items Table Header
    const tableTop = doc.y + 10;
    doc.fillColor("#f8fafc").rect(40, tableTop, 510, 22).fill();
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold");
    doc.text("Item Description", 50, tableTop + 6);
    doc.text("Qty", 320, tableTop + 6, { width: 40, align: "center" });
    doc.text("Price", 380, tableTop + 6, { width: 60, align: "right" });
    doc.text("Total", 460, tableTop + 6, { width: 80, align: "right" });

    let currentY = tableTop + 28;
    const items = Array.isArray(order.products) ? order.products : (Array.isArray(order.items) ? order.items : []);

    items.forEach((item, idx) => {
      const name = item.name || item.title || `Item #${idx + 1}`;
      const qty = item.quantity || 1;
      const unitPrice = Number(item.price || 0);
      const totalItemPrice = qty * unitPrice;

      if (idx % 2 === 1) {
        doc.fillColor("#fdfdfd").rect(40, currentY - 4, 510, 20).fill();
      }

      doc.fillColor("#334155").fontSize(9).font("Helvetica");
      doc.text(name, 50, currentY, { width: 260 });
      doc.text(String(qty), 320, currentY, { width: 40, align: "center" });
      doc.text(`INR ${unitPrice.toFixed(2)}`, 380, currentY, { width: 60, align: "right" });
      doc.text(`INR ${totalItemPrice.toFixed(2)}`, 460, currentY, { width: 80, align: "right" });

      currentY += 22;
    });

    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, currentY).lineTo(550, currentY).stroke();
    currentY += 12;

    // Summary Totals Box
    const summaryX = 320;
    const totalAmount = Number(order.totalAmount || order.totalPrice || order.amount || 0);
    const codFee = order.paymentMethod === "COD" || order.paymentMethod === "cash_on_delivery" ? 14 : 0;
    const subtotal = Math.max(0, totalAmount - codFee);

    doc.fillColor("#475569").fontSize(9).font("Helvetica");
    doc.text("Subtotal:", summaryX, currentY, { width: 120 });
    doc.text(`INR ${subtotal.toFixed(2)}`, 460, currentY, { width: 80, align: "right" });
    currentY += 16;

    if (codFee > 0) {
      doc.text("COD Handling Fee:", summaryX, currentY, { width: 120 });
      doc.text(`INR ${codFee.toFixed(2)}`, 460, currentY, { width: 80, align: "right" });
      currentY += 16;
    }

    doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(summaryX, currentY).lineTo(550, currentY).stroke();
    currentY += 8;

    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold");
    doc.text("Grand Total:", summaryX, currentY, { width: 120 });
    doc.text(`INR ${totalAmount.toFixed(2)}`, 460, currentY, { width: 80, align: "right" });

    currentY += 30;

    // Footer Info
    doc.fillColor("#64748b").fontSize(8).font("Helvetica");
    doc.text(`Payment Mode: ${(order.paymentMethod || "COD").toUpperCase()} • Payment Status: ${order.paymentStatus || "Completed"}`, 40, currentY);
    doc.text("Thank you for shopping with Buyto! For support visit buyto.co.in/help", 40, currentY + 14);

    doc.end();
    console.log(`[INVOICE FINISHED] PDF stream sent for Order #${shortId}`);
  } catch (error) {
    console.error("❌ PDF Generation Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Failed to generate PDF invoice", error: error.message });
    }
  }
};

router.get("/orders/:orderId/invoice", authMiddleware, generateInvoicePDFHandler);
router.get("/invoice/:orderId", authMiddleware, generateInvoicePDFHandler);

// GET /api/orders/my-orders
// Returns order history for the logged-in customer (matched by their unique phone number)
router.get("/orders/my-orders", authMiddleware, async (req, res) => {
  console.log("=== [BACKEND] GET /api/orders/my-orders ===");
  console.log("Loading history for User Phone:", req.user.phone);

  try {
    const rawOrders = await Order.find({
      $or: [
        { userId: req.user._id },
        { "user.phone": req.user.phone }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Collect missing productIds across orders to batch fetch images for historic orders
    const missingProductIds = new Set();
    rawOrders.forEach(o => {
      const itemsList = Array.isArray(o.items) && o.items.length > 0 ? o.items : (Array.isArray(o.products) ? o.products : []);
      itemsList.forEach(item => {
        if (!item.image && !item.imageUrl && item.productId) {
          missingProductIds.add(item.productId);
        }
      });
    });

    let imageMap = {};
    if (missingProductIds.size > 0) {
      try {
        const foundProducts = await Product.find({
          $or: [
            { _id: { $in: Array.from(missingProductIds).filter(id => mongoose.isValidObjectId(id)) } },
            { id: { $in: Array.from(missingProductIds) } }
          ]
        }).select("_id id image imageUrl").lean();

        foundProducts.forEach(p => {
          const img = p.image || p.imageUrl || "";
          if (p._id) imageMap[String(p._id)] = img;
          if (p.id) imageMap[String(p.id)] = img;
        });
      } catch (dbErr) {
        console.warn("Product image batch lookup warning:", dbErr.message);
      }
    }

    const DEFAULT_PLACEHOLDER = "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png";

    const normalizedOrders = rawOrders.map(order => {
      let items = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : (Array.isArray(order.products) ? order.products : []);

      items = items.map(item => {
        const img = item.image || item.imageUrl || imageMap[String(item.productId)] || imageMap[String(item._id)] || DEFAULT_PLACEHOLDER;
        return {
          ...item,
          image: img,
          imageUrl: img
        };
      });

      const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

      // Recalculate price if amount is missing or 0
      let computedTotal = Number(
        order.finalAmount !== undefined && order.finalAmount !== null ? order.finalAmount :
        order.grandTotal !== undefined && order.grandTotal !== null ? order.grandTotal :
        order.totalAmount !== undefined && order.totalAmount !== null ? order.totalAmount :
        order.amount !== undefined && order.amount !== null ? order.amount :
        order.total !== undefined && order.total !== null ? order.total : 0
      );

      if (computedTotal <= 0 && items.length > 0) {
        const itemSum = items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
        const codFee = (order.paymentMethod === "COD" || order.paymentMethod === "cash_on_delivery") ? (order.codConvenienceFee || 14) : 0;
        computedTotal = itemSum + codFee;
      }

      const canonicalStatus = order.orderStatus || order.status || "Order Placed";

      return {
        ...order,
        orderStatus: canonicalStatus,
        status: canonicalStatus,
        items,
        products: items, // Alias for backward compatibility
        totalQuantity,
        itemCount: totalQuantity,
        finalAmount: computedTotal,
        grandTotal: computedTotal,
        totalAmount: computedTotal,
        amount: computedTotal,
        total: computedTotal,
        paymentMethod: (order.paymentMethod || "COD").toUpperCase()
      };
    });

    // Calculate total lifetime BuyCoins earned strictly from completed delivered orders
    const purchaseBuyCoinsEarned = rawOrders.reduce((sum, order) => {
      const canonicalStatus = String(order.orderStatus || order.status || "").toLowerCase();
      if (canonicalStatus.includes("delivered")) {
        const amt = Number(order.finalAmount || order.grandTotal || order.totalAmount || order.amount || 0);
        return sum + Math.floor(amt * 0.05); // 5% base purchase rewards rule
      }
      return sum;
    }, 0);

    const userEarned = Number(req.user?.buyCoinsStats?.totalEarned || purchaseBuyCoinsEarned);

    console.log(`Successfully fetched and normalized ${normalizedOrders.length} orders for client. User Purchase BuyCoins Earned: ${userEarned}`);
    return res.json({
      success: true,
      orders: normalizedOrders,
      buyCoinsStats: {
        totalEarned: userEarned
      },
      walletBalance: Number(req.user?.buyCoins || 0)
    });
  } catch (error) {
    console.error("❌ Get My Orders Exception:", error);
    return res.status(500).json({ message: "Failed to load order history", error: error.message });
  }
});

// GET /api/orders/track/:orderId
// Returns live tracking details for the authenticated customer who owns this order.
router.get("/orders/track/:orderId", authMiddleware, async (req, res) => {
  console.log("=== CUSTOMER TRACK ORDER ===");
  console.log("Order ID:", req.params.orderId);
  console.log("Customer Phone:", req.user.phone);

  try {
    let query = {};
    if (mongoose.isValidObjectId(req.params.orderId)) {
      query = { $or: [{ _id: req.params.orderId }, { orderId: req.params.orderId }] };
    } else {
      query = { orderId: req.params.orderId };
    }
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = (order.userId && order.userId.toString() === req.user._id.toString()) ||
      (order.user?.phone === req.user.phone);
    const isAssignedRider = order.riderId && order.riderId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !isOwner && !isAssignedRider) {
      console.error("❌ Track Order Access Denied:", {
        requesterPhone: req.user.phone,
        requesterId: req.user._id,
        orderUserPhone: order.user?.phone,
        orderUserId: order.userId,
        orderRiderId: order.riderId
      });
      return res.status(403).json({ message: "You can only track your own orders" });
    }

    const trackingService = require("../services/trackingService");
    const payload = await trackingService.getTrackingState(order.orderId);
    return res.json(payload);
  } catch (error) {
    console.error("❌ Track Order Error:", error);
    return res.status(500).json({ message: "Failed to load tracking details", error: error.message });
  }
});

// POST /api/borzo/webhook
router.post("/borzo/webhook", async (req, res) => {
  console.log("=== [BACKEND] POST /api/borzo/webhook ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const { event_type, delivery, order: webhookOrder } = req.body;

    const borzoOrderId = webhookOrder?.order_id || delivery?.order_id || delivery?.delivery_id;
    const clientOrderId = webhookOrder?.client_order_id || delivery?.client_order_id;
    const borzoStatus = webhookOrder?.status || delivery?.status;

    if (!borzoOrderId && !clientOrderId) {
      console.warn("⚠️ No identifiers found in Borzo webhook payload");
      return res.status(400).json({ message: "No identifiers found in webhook payload" });
    }

    // Locate the order in MongoDB
    const query = [];
    if (clientOrderId && mongoose.isValidObjectId(clientOrderId)) {
      query.push({ _id: clientOrderId });
    }
    if (borzoOrderId) {
      query.push({ borzoOrderId: String(borzoOrderId) });
    }

    const order = await Order.findOne({ $or: query });
    if (!order) {
      console.warn(`⚠️ Order not found in database for webhook clientOrderId: ${clientOrderId}, borzoOrderId: ${borzoOrderId}`);
      return res.status(404).json({ message: "Order not found in database" });
    }

    console.log(`Found Order ${order._id} for Borzo Order ${borzoOrderId}`);

    // Update webhook raw debugging data
    order.borzoWebhookData = req.body;

    // Extract rider/courier information if present
    const courier = webhookOrder?.courier || delivery?.courier;
    if (courier) {
      order.borzoRiderName = `${courier.name || ""} ${courier.surname || ""}`.trim() || order.borzoRiderName;
      order.borzoRiderPhone = courier.phone || order.borzoRiderPhone;
      order.riderName = order.borzoRiderName;
      order.riderPhone = order.borzoRiderPhone;
      order.riderAssigned = true;
    }

    // Extract delivery cost
    const deliveryFee = webhookOrder?.delivery_fee_amount || delivery?.delivery_fee_amount;
    if (deliveryFee) {
      order.borzoDeliveryCost = Number(deliveryFee);
    }

    // Update raw Borzo status
    if (borzoStatus) {
      order.borzoDeliveryStatus = borzoStatus;
    }

    // Map Borzo status to HostelGo orderStatus
    // Status Mapping:
    // Borzo            Buyto
    // new              Pending
    // courier_assigned Rider Assigned
    // picked_up        Picked Up
    // on_the_way       Out for Delivery
    // delivered        Delivered
    // cancelled        Cancelled
    // (Also mapping failure state to Delivery Failed)
    let nextStatus = null;
    switch (String(borzoStatus).toLowerCase()) {
      case "new":
      case "parked":
        // Keep current Buyto prep stages (Order Placed, Preparing, Packed).
        // Only set status to "Order Placed" if it is currently Pending or empty.
        if (!order.orderStatus || order.orderStatus === "Pending") {
          nextStatus = "Order Placed";
        }
        break;
      case "courier_assigned":
      case "ready_to_pickup":
      case "ready_for_delivery":
        nextStatus = "Rider Assigned";
        break;
      case "picked_up":
        nextStatus = "Picked Up";
        break;
      case "on_the_way":
      case "on_delivery":
        nextStatus = "Out for Delivery";
        break;
      case "delivered":
      case "closed":
        nextStatus = "Delivered";
        break;
      case "cancelled":
      case "canceled":
        nextStatus = "Cancelled";
        break;
      case "delivery_failed":
        nextStatus = "Delivery Failed";
        break;
      default:
        console.log(`Unmapped Borzo status received: ${borzoStatus}`);
    }

    if (nextStatus) {
      order.orderStatus = nextStatus;

      // Update timestamps
      const STATUS_TIMESTAMP_KEYS = {
        "Pending": "pending",
        "Order Placed": "orderPlaced",
        "Preparing": "preparing",
        "Packed": "packed",
        "Rider Assigned": "riderAssigned",
        "Picked Up": "pickedUp",
        "Out for Delivery": "outForDelivery",
        "Delivered": "delivered",
        "Cancelled": "cancelled",
        "Delivery Failed": "deliveryFailed"
      };

      const tsKey = STATUS_TIMESTAMP_KEYS[nextStatus];
      if (tsKey) {
        order.statusTimestamps[tsKey] = new Date();
      }

      if (nextStatus === "Delivered") {
        order.deliveredAt = new Date();
        order.paymentStatus = "Paid";
      }
    }

    await order.save();

    if (nextStatus === "Delivered") {
      try {
        const { clearCustomerCart } = require("../services/cartCleanupService");
        await clearCustomerCart(order.userId);
      } catch (cartErr) {
        console.error("Failed to clear customer cart on Borzo Delivered webhook:", cartErr);
      }
    }

    if (nextStatus) {
      try {
        const { sendOrderStatusNotification } = require("../services/notificationService");
        await sendOrderStatusNotification(order, nextStatus);
      } catch (notifErr) {
        console.error("Failed to send order status notification on webhook transition:", notifErr);
      }
    }

    if (["Cancelled", "Delivery Failed"].includes(order.orderStatus)) {
      const { handleOrderCancellationReversal } = require("../utils/rewards");
      await handleOrderCancellationReversal(order);
    }

    console.log(`Successfully updated Order ${order._id} status to: ${order.orderStatus}`);

    // Emit live Socket.IO update if Socket.IO server is attached
    const io = req.io || req.app.get("io");
    if (io) {
      io.to(order._id.toString()).emit("riderLocationUpdated", {
        orderId: order._id,
        status: order.orderStatus,
        riderName: order.borzoRiderName || order.riderName,
        riderPhone: order.borzoRiderPhone || order.riderPhone,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      });
      console.log(`Socket.IO event broadcast to room ${order._id}`);
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Webhook Processing Failure:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/borzo/test
router.get("/borzo/test", async (req, res) => {
  console.log("=== [BACKEND] GET /api/borzo/test ===");
  const apiToken = process.env.BORZO_API_TOKEN;

  if (!apiToken) {
    return res.status(400).json({
      success: false,
      message: "BORZO_API_TOKEN is missing in env"
    });
  }

  const url = "https://robotapitest-in.borzodelivery.com/api/business/1.6/orders";
  const maskedToken = apiToken.length > 8
    ? `${apiToken.slice(0, 4)}...${apiToken.slice(-4)}`
    : "xxxx";

  console.log(`Testing Borzo authentication against: ${url}`);
  console.log(`X-DV-Auth-Token: ${maskedToken}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-DV-Auth-Token": apiToken
      }
    });

    const text = await response.text();
    console.log("Borzo test response HTTP status:", response.status);
    console.log("Borzo test response body:", text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = text;
    }

    return res.status(response.status).json({
      success: response.ok,
      httpStatus: response.status,
      borzoResponse: result
    });
  } catch (error) {
    console.error("Test auth route error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/borzo/test-order
router.post("/borzo/test-order", async (req, res) => {
  console.log("=== [BACKEND] POST /api/borzo/test-order ===");

  // Construct a minimal temporary order object
  const mockOrder = {
    deliveryAddress: req.body.deliveryAddress || "Indiranagar Metro Station, Bengaluru, Karnataka 560038",
    deliveryLatitude: req.body.deliveryLatitude || 12.9784,
    deliveryLongitude: req.body.deliveryLongitude || 77.6408,
    paymentMethod: req.body.paymentMethod || "razorpay", // Default to prepaid to avoid Sandbox COD restrictions
    totalAmount: req.body.totalAmount || 150,
    user: {
      name: req.body.name || "Test Receiver",
      phone: req.body.phone || "9988776655"
    }
  };

  try {
    const borzoResult = await createBorzoOrder(mockOrder);

    if (!borzoResult.success) {
      return res.status(400).json({
        success: false,
        error: borzoResult.error,
        borzoResponse: borzoResult.rawResponse
      });
    }

    return res.status(200).json({
      success: true,
      order_id: borzoResult.borzoOrderId,
      tracking_url: borzoResult.trackingUrl,
      deliveryCost: borzoResult.deliveryCost,
      borzoResponse: borzoResult.rawResponse
    });
  } catch (error) {
    console.error("Test order route error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/config/fees
// Returns current checkout fees configuration parameters
router.get("/config/fees", async (req, res) => {
  console.log("=== GET FEE CONFIGURATION HIT ===");
  try {
    const feeConfig = await Config.findOne({ key: "fees_config" });
    if (!feeConfig) {
      console.warn("Fee config not found in DB, returning defaults");
      return res.json({
        handlingFee: 4,
        smallCartThreshold: 150,
        smallCartFee: 15,
        deliveryFee: 29,
        freeDeliveryThreshold: 99,
        rainFee: 0,
        lateNightFee: 0,
        gstPercentage: 5,
        gstFixedCharges: 2
      });
    }
    return res.json(feeConfig);
  } catch (error) {
    console.error("Failed to fetch fee configuration:", error);
    return res.json({
      handlingFee: 4,
      smallCartThreshold: 150,
      smallCartFee: 15,
      deliveryFee: 29,
      freeDeliveryThreshold: 99,
      rainFee: 0,
      lateNightFee: 0,
      gstPercentage: 5,
      gstFixedCharges: 2
    });
  }
});

// GET /api/delivery-settings
// Returns current delivery settings/toggles for customer calculations
router.get("/delivery-settings", async (req, res) => {
  console.log("=== GET DELIVERY SETTINGS HIT (PUBLIC) ===");
  try {
    const settings = await DeliverySettings.findOne({ key: "delivery_settings" });
    if (!settings) {
      console.warn("Delivery settings not found in DB, returning defaults");
      return res.json({
        lateNightDeliveryEnabled: false,
        rainyDeliveryEnabled: false
      });
    }
    return res.json(settings);
  } catch (error) {
    console.error("Failed to fetch delivery settings:", error);
    return res.json({
      lateNightDeliveryEnabled: false,
      rainyDeliveryEnabled: false
    });
  }
});

// PUT /api/orders/:id/instructions
// Updates the delivery instructions of an order
router.put("/orders/:id/instructions", authMiddleware, async (req, res) => {
  console.log("=== UPDATE ORDER INSTRUCTIONS ===");
  try {
    const { instructions } = req.body;
    let query = {};
    if (mongoose.isValidObjectId(req.params.id)) {
      query = { $or: [{ _id: req.params.id }, { orderId: req.params.id }] };
    } else {
      query = { orderId: req.params.id };
    }
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check ownership
    const isOwner = (order.userId && order.userId.toString() === req.user._id.toString()) ||
      (order.user?.phone === req.user.phone);
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You can only update instructions for your own orders" });
    }

    order.deliveryInstructions = instructions || "";
    await order.save();
    return res.json({ success: true, deliveryInstructions: order.deliveryInstructions });
  } catch (error) {
    console.error("❌ Update Instructions Error:", error);
    return res.status(500).json({ message: "Failed to update instructions", error: error.message });
  }
});

router.recalculateOrderSummary = recalculateOrderSummary;
module.exports = router;