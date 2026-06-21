const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Config = require("../models/Config");
const DeliverySettings = require("../models/DeliverySettings");
const authMiddleware = require("../middleware/authMiddleware");
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
    const { amount, user, products, deliveryAddress, couponId, couponCode, couponDiscount, buyCoinsRedeemed, buyCoinsDiscount, noBagPledge } = req.body;

    // 1. Validation
    if (amount === undefined || amount === null) {
      console.error("❌ Validation Error: Amount is missing");
      return res.status(400).json({ message: "Amount is required" });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error(`❌ Validation Error: Amount must be a positive number. Received: ${amount}`);
      return res.status(400).json({ message: `Amount must be a valid number greater than 0. Received: ${amount}` });
    }

    if (!user || typeof user !== "object" || !products || !deliveryAddress) {
      console.error("❌ Validation Error: user, products, or deliveryAddress missing or invalid");
      return res.status(400).json({ message: "User, products, and deliveryAddress are required" });
    }

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

    // 3. Save pending order in MongoDB
    const order = new Order({
      user,
      userId: req.user._id,
      products,
      totalAmount: numericAmount,
      paymentMethod: "razorpay",
      paymentStatus: "Pending",
      razorpayOrderId: razorpayOrder.id,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      orderStatus: "Order Placed",
      estimatedArrivalMinutes: 30,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
      couponId: couponId || null,
      couponCode: couponCode || "",
      couponDiscount: Number(couponDiscount || 0),
      buyCoinsRedeemed: Number(buyCoinsRedeemed || 0),
      buyCoinsDiscount: Number(buyCoinsDiscount || 0),
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
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mock_key_secret");
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    const isValidSignature = generatedSignature === razorpay_signature;
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
      const savedOrder = await order.save();
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


      // 2. Reduce Stock Levels in MongoDB (executed ONLY after successful DB save)
      console.log("Reducing inventory stock...");
      for (const item of savedOrder.products) {
        try {
          const product = await Product.findOne({
            $or: [
              { _id: item.productId },
              { id: item.productId }
            ]
          });

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

      return res.status(200).json({
        success: true,
        message: "Payment signature verified successfully and order updated in DB",
        order: savedOrder
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
    const { user, products, amount, deliveryAddress, couponId, couponCode, couponDiscount, buyCoinsRedeemed, buyCoinsDiscount, noBagPledge } = req.body;

    if (!user || typeof user !== "object" || !products || amount === undefined || !deliveryAddress) {
      console.error("❌ COD Validation Error: Missing required fields or invalid user details");
      return res.status(400).json({ message: "All fields are required" });
    }

    const deliveryLatitude = req.body.deliveryLatitude || null;
    const deliveryLongitude = req.body.deliveryLongitude || null;

    // 1. Create COD Order record
    const order = new Order({
      user,
      userId: req.user._id,
      products,
      totalAmount: amount,
      paymentMethod: "cod",
      paymentStatus: "Pending", // COD remains pending until hand-delivered
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      orderStatus: "Order Placed",
      estimatedArrivalMinutes: 30,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
      couponId: couponId || null,
      couponCode: couponCode || "",
      couponDiscount: Number(couponDiscount || 0),
      buyCoinsRedeemed: Number(buyCoinsRedeemed || 0),
      buyCoinsDiscount: Number(buyCoinsDiscount || 0),
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
      const savedOrder = await order.save();
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


      // 2. Reduce Stock Levels in MongoDB (executed ONLY after successful DB save)
      console.log("Reducing inventory stock for COD order...");
      for (const item of products) {
        try {
          const product = await Product.findOne({
            $or: [
              { _id: item.productId },
              { id: item.productId }
            ]
          });

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

      return res.status(201).json({
        success: true,
        message: "COD order placed successfully",
        order: savedOrder
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

// GET /api/orders/my-orders
// Returns order history for the logged-in customer (matched by their unique phone number)
router.get("/orders/my-orders", authMiddleware, async (req, res) => {
  console.log("=== [BACKEND] GET /api/orders/my-orders ===");
  console.log("Loading history for User Phone:", req.user.phone);

  try {
    const orders = await Order.find({
      $or: [
        { userId: req.user._id },
        { "user.phone": req.user.phone }
      ]
    }).sort({ createdAt: -1 }).lean();
    console.log(`Successfully fetched ${orders.length} orders for client.`);
    return res.json(orders);
  } catch (error) {
    console.error("❌ Get My Orders Exception:", error);
    return res.status(500).json({ message: "Failed to load order history", error: error.message });
  }
});

// GET /api/orders/track/:id
// Returns live tracking details for the authenticated customer who owns this order.
router.get("/orders/track/:id", authMiddleware, async (req, res) => {
  console.log("=== CUSTOMER TRACK ORDER ===");
  console.log("Order ID:", req.params.id);
  console.log("Customer Phone:", req.user.phone);

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(req.params.id);
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

    const minutes = getEtaMinutes(order);
    if (order.estimatedArrivalMinutes !== minutes && order.orderStatus !== "Delivered") {
      order.estimatedArrivalMinutes = minutes;
      await order.save();
      console.log("=== ETA UPDATED ===");
      console.log({ orderId: order._id, estimatedArrivalMinutes: minutes });
    }

    const payload = await buildTrackingPayload(order);
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

module.exports = router;