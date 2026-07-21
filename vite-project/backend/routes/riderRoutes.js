const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const generateToken = require("../utils/generateToken");
const authMiddleware = require("../middleware/authMiddleware");
const riderMiddleware = require("../middleware/riderMiddleware");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const { loginLimiter } = require("../middleware/rateLimiter");
const { logAuditEvent } = require("../utils/auditLogger");

// Validation helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const DELIVERY_EARNING = 35;
const ACTIVE_DELIVERY_STATUSES = ["Rider Assigned", "Out for Delivery"];

const publicRider = (rider) => ({
  _id: rider._id,
  name: rider.name,
  email: rider.email,
  phone: rider.phone,
  role: rider.role,
  vehicleType: rider.vehicleType,
  isOnline: rider.isOnline,
  isSuspended: rider.isSuspended,
  currentLocation: rider.currentLocation,
  totalDeliveries: rider.totalDeliveries,
  totalEarnings: rider.totalEarnings,
  todayEarnings: rider.todayEarnings,
  weeklyEarnings: rider.weeklyEarnings,
  profileImage: rider.profileImage,
  aadhaarVerified: rider.aadhaarVerified,
  drivingLicenseVerified: rider.drivingLicenseVerified
});

// POST /api/rider/signup
router.post("/signup", async (req, res) => {
  console.log("=== [RIDER SIGNUP] ===");
  console.log("Body:", JSON.stringify({ ...req.body, password: "***" }, null, 2));

  try {
    const { name, email, phone, password, vehicleType, profileImage } = req.body;

    if (!name || !email || !phone || !password || !vehicleType) {
      return res.status(400).json({ message: "Name, email, phone, password, and vehicle type are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    });

    if (existing) {
      return res.status(400).json({ message: "Email or phone is already registered" });
    }

    const rider = await User.create({
      name,
      email,
      phone,
      password,
      role: "rider",
      vehicleType,
      profileImage: profileImage || "",
      isOnline: false
    });

    const token = generateToken(rider._id, rider.email, rider.role);
    console.log("=== [RIDER SIGNUP SUCCESS] ===");
    console.log("Rider ID:", rider._id);

    return res.status(201).json({ success: true, token, user: publicRider(rider) });
  } catch (error) {
    console.error("❌ Rider Signup Error:", error);
    return res.status(500).json({ message: "Rider signup failed", error: error.message });
  }
});

// POST /api/rider/login
router.post("/login", loginLimiter, [
  body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
  validate
], async (req, res) => {
  console.log("=== [RIDER LOGIN] ===");
  try {
    const { email, password } = req.body;

    const rider = await User.findOne({ email: email.toLowerCase(), role: "rider" });

    // Lockout verification
    if (rider) {
      if (rider.accountLockedUntil && rider.accountLockedUntil > new Date()) {
        logAuditEvent({
          eventType: "RIDER_LOGIN_LOCKED_ACCOUNT",
          userId: rider._id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          status: "FAILURE",
          details: { email }
        });
        return res.status(401).json({ message: "Invalid credentials" });
      } else if (rider.accountLockedUntil && rider.accountLockedUntil <= new Date()) {
        // Lock has expired, reset counter and clear lock atomically
        await User.updateOne(
          { _id: rider._id },
          { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
        );
        rider.failedLoginAttempts = 0;
        rider.accountLockedUntil = null;
      }
    }

    // Dummy hash for constant-time if rider not found
    const dummyHash = "$2b$12$1234567890123456789012345678901234567890123456789012";
    const valid = rider ? await bcrypt.compare(password, rider.password) : await bcrypt.compare(password, dummyHash);

    if (!rider || !valid) {
      if (rider) {
        // Increment attempts atomically
        const updates = { $inc: { failedLoginAttempts: 1 } };
        if (rider.failedLoginAttempts + 1 >= 5) {
          updates.$set = { accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000) };
          logAuditEvent({
            eventType: "RIDER_ACCOUNT_LOCK",
            userId: rider._id,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            status: "FAILURE",
            details: { email }
          });
        }
        await User.updateOne({ _id: rider._id }, updates);
      }

      logAuditEvent({
        eventType: "RIDER_LOGIN_FAILED",
        userId: rider ? rider._id : null,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { email }
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (rider.isSuspended) {
      logAuditEvent({
        eventType: "RIDER_LOGIN_SUSPENDED",
        userId: rider._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { email }
      });
      return res.status(403).json({ message: "Rider account is suspended" });
    }

    // Reset attempts on successful verify
    await User.updateOne(
      { _id: rider._id },
      { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
    );

    const token = generateToken(rider._id, rider.email, rider.role);
    console.log("=== [RIDER LOGIN SUCCESS] ===");
    console.log("Rider ID:", rider._id);

    logAuditEvent({
      eventType: "RIDER_LOGIN_SUCCESS",
      userId: rider._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });

    return res.json({ success: true, token, user: publicRider(rider) });
  } catch (error) {
    console.error("❌ Rider Login Error:", error);
    return res.status(500).json({ message: "Rider login failed" });
  }
});

router.use(authMiddleware, riderMiddleware);

// GET /api/rider/dashboard
router.get("/dashboard", async (req, res) => {
  console.log("=== [RIDER DASHBOARD] ===");
  try {
    const riderId = req.user._id;
    const [activeDelivery, availableOrdersCount, completedDeliveries, pendingDeliveries] = await Promise.all([
      Order.findOne({ riderId, orderStatus: { $in: ACTIVE_DELIVERY_STATUSES } }).sort({ acceptedAt: -1 }).lean(),
      Order.countDocuments({ orderStatus: "Packed", riderAssigned: false }),
      Order.countDocuments({ riderId, orderStatus: "Delivered" }),
      Order.countDocuments({ riderId, orderStatus: { $in: ACTIVE_DELIVERY_STATUSES } })
    ]);

    return res.json({
      rider: req.user,
      stats: {
        availableOrdersCount: req.user.isOnline ? availableOrdersCount : 0,
        completedDeliveries,
        pendingDeliveries
      },
      activeDelivery
    });
  } catch (error) {
    console.error("❌ Rider Dashboard Error:", error);
    return res.status(500).json({ message: "Failed to load rider dashboard", error: error.message });
  }
});

// PUT /api/rider/status
router.put("/status", async (req, res) => {
  console.log("=== [RIDER STATUS UPDATE] ===");
  try {
    const { isOnline, currentLocation } = req.body;
    const rider = await User.findById(req.user._id);
    rider.isOnline = Boolean(isOnline);
    if (currentLocation) {
      rider.currentLocation = {
        lat: currentLocation.lat ?? rider.currentLocation?.lat ?? null,
        lng: currentLocation.lng ?? rider.currentLocation?.lng ?? null,
        address: currentLocation.address ?? rider.currentLocation?.address ?? ""
      };
    }
    await rider.save();

    console.log(`Rider ${rider.name} is now ${rider.isOnline ? "ONLINE" : "OFFLINE"}`);
    return res.json({ success: true, rider: publicRider(rider) });
  } catch (error) {
    console.error("❌ Rider Status Error:", error);
    return res.status(500).json({ message: "Failed to update rider status", error: error.message });
  }
});

// GET /api/rider/orders/available
router.get("/orders/available", async (req, res) => {
  console.log("=== [RIDER AVAILABLE ORDERS] ===");
  try {
    if (!req.user.isOnline) {
      return res.json([]);
    }

    const orders = await Order.find({ orderStatus: "Packed", riderAssigned: false })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(orders);
  } catch (error) {
    console.error("❌ Rider Available Orders Error:", error);
    return res.status(500).json({ message: "Failed to load available orders", error: error.message });
  }
});

// GET /api/rider/orders/active
router.get("/orders/active", async (req, res) => {
  console.log("=== [RIDER ACTIVE DELIVERY] ===");
  try {
    const orders = await Order.find({ riderId: req.user._id, orderStatus: { $in: ACTIVE_DELIVERY_STATUSES } })
      .sort({ acceptedAt: -1 })
      .lean();

    return res.json(orders);
  } catch (error) {
    console.error("❌ Rider Active Orders Error:", error);
    return res.status(500).json({ message: "Failed to load active delivery", error: error.message });
  }
});

// PUT /api/rider/orders/:id/accept
router.put("/orders/:id/accept", async (req, res) => {
  console.log("=== RIDER ACCEPT ORDER ===");
  console.log("Order ID:", req.params.id);
  console.log("Rider:", req.user.name, req.user.phone);

  try {
    if (!req.user.isOnline) {
      return res.status(400).json({ message: "Go online before accepting orders" });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, orderStatus: "Packed", riderAssigned: false },
      {
        $set: {
          riderAssigned: true,
          riderId: req.user._id,
          riderName: req.user.name,
          riderPhone: req.user.phone,
          acceptedAt: new Date(),
          orderStatus: "Rider Assigned",
          "statusTimestamps.riderAssigned": new Date(),
          estimatedArrivalMinutes: 15,
          estimatedDeliveryTime: new Date(Date.now() + 15 * 60 * 1000)
        }
      },
      { returnDocument: "after" }
    );

    if (!order) {
      return res.status(409).json({ message: "Order is no longer available for pickup" });
    }

    try {
      const { sendOrderStatusNotification } = require("../services/notificationService");
      sendOrderStatusNotification(order, "Rider Assigned").catch(err => console.error(err));
    } catch (err) {
      console.error(err);
    }

    console.log("=== RIDER ASSIGNED ===");
    console.log({
      orderId: order._id,
      riderId: req.user._id,
      riderName: req.user.name
    });
    console.log("=== ETA UPDATED ===");
    console.log({ orderId: order._id, estimatedArrivalMinutes: order.estimatedArrivalMinutes });

    setTimeout(async () => {
      try {
        const updated = await Order.findOneAndUpdate(
          { _id: order._id, orderStatus: "Rider Assigned" },
          {
            $set: {
              orderStatus: "Out for Delivery",
              "statusTimestamps.outForDelivery": new Date(),
              estimatedArrivalMinutes: 12,
              estimatedDeliveryTime: new Date(Date.now() + 12 * 60 * 1000)
            }
          },
          { returnDocument: "after" }
        );

        if (updated) {
          console.log("=== ETA UPDATED ===");
          console.log({ orderId: updated._id, estimatedArrivalMinutes: updated.estimatedArrivalMinutes });
          
          try {
            const { sendOrderStatusNotification } = require("../services/notificationService");
            sendOrderStatusNotification(updated, "Out for Delivery").catch(err => console.error(err));
          } catch (err) {
            console.error(err);
          }
        }
      } catch (transitionError) {
        console.error("❌ Auto Out For Delivery Transition Error:", transitionError.message);
      }
    }, 1500);

    console.log("Accepted Order:", order._id);
    return res.json({ success: true, order });
  } catch (error) {
    console.error("❌ Rider Accept Order Error:", error);
    return res.status(500).json({ message: "Failed to accept order", error: error.message });
  }
});

// PUT /api/rider/orders/:id/delivered
router.put("/orders/:id/delivered", async (req, res) => {
  console.log("=== RIDER DELIVERY COMPLETE ===");
  console.log("Order ID:", req.params.id);
  console.log("Rider:", req.user.name);

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      riderId: req.user._id,
      orderStatus: { $in: ACTIVE_DELIVERY_STATUSES }
    });

    if (!order) {
      return res.status(404).json({ message: "Active delivery not found for this rider" });
    }

    order.orderStatus = "Delivered";
    order.deliveredAt = new Date();
    order.statusTimestamps = order.statusTimestamps || {};
    order.statusTimestamps.delivered = order.deliveredAt;
    order.estimatedArrivalMinutes = 0;
    order.estimatedDeliveryTime = new Date();
    if (order.paymentMethod === "cod") {
      order.paymentStatus = "Paid";
    }
    try {
      const { handleOrderCheckoutRewards } = require("../utils/rewards");
      await handleOrderCheckoutRewards(order);
    } catch (rewardErr) {
      console.error("Failed to credit BuyCoins on Delivered (Rider):", rewardErr);
    }
    try {
      const { clearCustomerCart } = require("../services/cartCleanupService");
      await clearCustomerCart(order.userId);
    } catch (cartErr) {
      console.error("Failed to clear customer cart on Delivered status (Rider):", cartErr);
    }
    await order.save();

    try {
      const { sendOrderStatusNotification } = require("../services/notificationService");
      sendOrderStatusNotification(order, "Delivered").catch(err => console.error(err));
    } catch (err) {
      console.error(err);
    }


    const rider = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          totalDeliveries: 1,
          totalEarnings: DELIVERY_EARNING,
          todayEarnings: DELIVERY_EARNING,
          weeklyEarnings: DELIVERY_EARNING
        }
      },
      { returnDocument: "after" }
    ).select("-password");

    console.log("=== RIDER EARNINGS UPDATED ===");
    console.log({
      riderId: rider._id,
      added: DELIVERY_EARNING,
      totalEarnings: rider.totalEarnings,
      todayEarnings: rider.todayEarnings,
      weeklyEarnings: rider.weeklyEarnings
    });

    return res.json({ success: true, order, rider });
  } catch (error) {
    console.error("❌ Rider Delivered Error:", error);
    return res.status(500).json({ message: "Failed to mark delivered", error: error.message });
  }
});

module.exports = router;