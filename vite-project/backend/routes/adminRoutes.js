const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Config = require("../models/Config");
const DeliverySettings = require("../models/DeliverySettings");
const Coupon = require("../models/Coupon");
const DeliveryServiceZone = require("../models/DeliveryServiceZone");
const UnserviceableRequest = require("../models/UnserviceableRequest");
const Category = require("../models/Category");
const SentNotification = require("../models/SentNotification");
const NotificationHistory = require("../models/NotificationHistory");


const STATUS_TIMESTAMP_KEYS = {
  "Pending": "pending",
  "Order Placed": "orderPlaced",
  Preparing: "preparing",
  Packed: "packed",
  "Rider Assigned": "riderAssigned",
  "Picked Up": "pickedUp",
  "Out for Delivery": "outForDelivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
  "Delivery Failed": "deliveryFailed"
};

// GET /api/admin/analytics
// Returns aggregated stats for admin dashboard
router.get("/analytics", async (req, res) => {
  console.log("=== [ADMIN GET ANALYTICS] ===");
  console.log("=== ADMIN ANALYTICS REQUEST ===");
  console.log("Token received");
  console.log("Decoded user:", JSON.stringify(req.user, null, 2));
  console.log("Role verified:", req.user?.role);

  try {
    // 1. Total Sales: sum of totalAmount for paymentStatus === "Paid"
    const salesResult = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalSales = salesResult.length > 0 ? Math.round(salesResult[0].total) : 0;

    // 2. Total Orders
    const totalOrders = await Order.countDocuments();

    // 3. Orders Today (Created from start of today till now)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // 4. Pending Orders (orderStatus NOT equal to "Delivered" and NOT equal to "Cancelled")
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $nin: ["Delivered", "Cancelled"] }
    });

    // 5. Total Products
    const totalProducts = await Product.countDocuments();

    // 6. Delivered Orders
    const deliveredOrders = await Order.countDocuments({
      orderStatus: "Delivered"
    });

    const totalRiders = await User.countDocuments({ role: "rider" });
    const onlineRiders = await User.countDocuments({ role: "rider", isOnline: true, isSuspended: false });
    const activeRiderDeliveries = await Order.countDocuments({
      orderStatus: "Out for Delivery",
      riderAssigned: true
    });

    const analytics = {
      totalSales,
      totalOrders,
      ordersToday,
      pendingOrders,
      totalProducts,
      deliveredOrders,
      totalRiders,
      onlineRiders,
      activeRiderDeliveries,
      totalCouponsGenerated: await Coupon.countDocuments({}),
      totalCouponsRedeemed: await Coupon.countDocuments({ isUsed: true }),
      totalBuyCoinsIssued: (await User.aggregate([{ $group: { _id: null, total: { $sum: "$buyCoinsLifetimeEarned" } } }]))[0]?.total || 0,
      totalBuyCoinsRedeemed: (await User.aggregate([{ $group: { _id: null, total: { $sum: "$buyCoinsRedeemed" } } }]))[0]?.total || 0,
      recentCoupons: await Coupon.find({}).populate("userId", "name email phone").sort({ createdAt: -1 }).limit(10).lean(),
      recentBuyCoinOrders: await Order.find({ $or: [{ orderStatus: "Delivered" }, { buyCoinsRedeemed: { $gt: 0 } }] }).sort({ updatedAt: -1 }).limit(10).lean()
    };

    console.log("Analytics calculated successfully:", analytics);
    console.log("Analytics generated successfully");
    return res.json(analytics);
  } catch (error) {
    console.error("❌ Admin Analytics Error:", error);
    return res.status(500).json({ message: "Failed to calculate analytics", error: error.message });
  }
});

// GET /api/admin/riders
// Returns rider fleet summary for admin management
router.get("/riders", async (req, res) => {
  console.log("=== [ADMIN GET RIDERS] ===");
  try {
    const riders = await User.find({ role: "rider" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const activeOrdersForRiders = await Order.find({
      riderId: { $in: riders.map(r => r._id) },
      orderStatus: { $nin: ["Delivered", "Cancelled", "Delivery Failed"] }
    }).lean();

    const activeOrderMap = activeOrdersForRiders.reduce((acc, order) => {
      acc[String(order.riderId)] = order._id.toString();
      return acc;
    }, {});

    const activeMap = activeOrdersForRiders.reduce((acc, order) => {
      acc[String(order.riderId)] = (acc[String(order.riderId)] || 0) + 1;
      return acc;
    }, {});

    return res.json(
      riders.map((rider) => ({
        ...rider,
        activeOrders: activeMap[String(rider._id)] || 0,
        assignedOrder: activeOrderMap[String(rider._id)] || null
      }))
    );
  } catch (error) {
    console.error("❌ Admin Riders List Error:", error);
    return res.status(500).json({ message: "Failed to get riders", error: error.message });
  }
});

// PUT /api/admin/riders/:id/suspend
// Toggles rider suspension with audit reason and forces offline when suspended
router.put("/riders/:id/suspend", async (req, res) => {
  console.log("=== [ADMIN RIDER SUSPEND TOGGLE] ===");
  console.log("Rider ID:", req.params.id);
  try {
    const { isSuspended, reason, notes } = req.body;
    const rider = await User.findOne({ _id: req.params.id, role: "rider" });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    rider.isSuspended = Boolean(isSuspended);
    if (rider.isSuspended) {
      rider.isOnline = false;
      rider.suspensionReason = reason || "Other";
      rider.suspensionNotes = notes || "";
      rider.suspendedAt = new Date();
      rider.suspendedBy = "Admin";
    } else {
      rider.suspensionReason = "";
      rider.suspensionNotes = "";
      rider.suspendedAt = null;
      rider.suspendedBy = "";
    }
    await rider.save();

    console.log(`Rider ${rider.name} suspension status: ${rider.isSuspended}`);
    const sanitized = rider.toObject();
    delete sanitized.password;
    return res.json(sanitized);
  } catch (error) {
    console.error("❌ Admin Rider Suspend Error:", error);
    return res.status(500).json({ message: "Failed to toggle suspend", error: error.message });
  }
});

// POST /api/admin/riders
// Onboards a new rider with sequence-based rider code generation
router.post("/riders", async (req, res) => {
  const { 
    name, phone, email, vehicleType, vehicleNumber, 
    fulfillmentStoreId, fulfillmentStoreName, profileImage, 
    driversLicense, emergencyContact, notes 
  } = req.body;

  if (!name || !phone || !vehicleNumber || !fulfillmentStoreId) {
    return res.status(400).json({ message: "Name, Phone, Vehicle Number, and Fulfillment Store are required" });
  }

  // Normalize vehicle number
  const normalizedVehicleNumber = vehicleNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  try {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number is already registered." });
    }

    const allRiders = await User.find({ role: "rider" }).lean();
    const dupVehicle = allRiders.find(r => (r.vehicleNumber || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() === normalizedVehicleNumber);
    if (dupVehicle) {
      return res.status(400).json({ message: "Vehicle number is already registered to another rider." });
    }

    // Safely increment counter sequence
    const Counter = require("../models/Counter");
    let counterDoc = await Counter.findOneAndUpdate(
      { id: "riderCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const seqNum = String(counterDoc.seq).padStart(4, "0");
    const riderCode = `BUY-R${seqNum}`;

    const defaultPassword = `BuytoRider123!`;

    const rider = new User({
      name,
      phone,
      email: email || `${phone}@buyto.com`,
      role: "rider",
      password: defaultPassword,
      vehicleType: vehicleType || "Bike",
      vehicleNumber: normalizedVehicleNumber,
      fulfillmentStoreId,
      fulfillmentStoreName,
      profileImage: profileImage || "",
      riderStatus: "Available",
      isOnline: true,
      rating: 5.0,
      totalDeliveries: 0,
      totalEarnings: 0,
      riderCode,
      isActive: true,
      driversLicense: driversLicense || "",
      emergencyContact: emergencyContact || "",
      notes: notes || "",
      joiningDate: new Date()
    });

    await rider.save();
    return res.status(201).json(rider);
  } catch (error) {
    console.error("❌ Admin Rider Creation Error:", error);
    return res.status(500).json({ message: "Failed to onboard rider", error: error.message });
  }
});

// PUT /api/admin/riders/:id
// Edits a rider's personal/vehicle/additional details
router.put("/riders/:id", async (req, res) => {
  const { name, phone, email, vehicleType, vehicleNumber, driversLicense, emergencyContact, notes } = req.body;
  try {
    const rider = await User.findOne({ _id: req.params.id, role: "rider" });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    if (phone && phone !== rider.phone) {
      const dupPhone = await User.findOne({ phone, _id: { $ne: rider._id } });
      if (dupPhone) return res.status(400).json({ message: "Phone number is already in use." });
      rider.phone = phone;
    }

    if (vehicleNumber) {
      const normalized = vehicleNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const allRiders = await User.find({ role: "rider", _id: { $ne: rider._id } }).lean();
      const dupVehicle = allRiders.find(r => (r.vehicleNumber || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() === normalized);
      if (dupVehicle) return res.status(400).json({ message: "Vehicle number is already in use." });
      rider.vehicleNumber = normalized;
    }

    if (name) rider.name = name;
    if (email !== undefined) rider.email = email;
    if (vehicleType) rider.vehicleType = vehicleType;
    if (driversLicense !== undefined) rider.driversLicense = driversLicense;
    if (emergencyContact !== undefined) rider.emergencyContact = emergencyContact;
    if (notes !== undefined) rider.notes = notes;

    await rider.save();
    return res.json(rider);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update rider details", error: error.message });
  }
});

// PUT /api/admin/riders/:id/status
// Updates riderStatus or online status
router.put("/riders/:id/status", async (req, res) => {
  const { riderStatus, isOnline } = req.body;
  try {
    const rider = await User.findOne({ _id: req.params.id, role: "rider" });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    if (riderStatus) rider.riderStatus = riderStatus;
    if (isOnline !== undefined) rider.isOnline = isOnline;

    await rider.save();
    return res.json(rider);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

// PUT /api/admin/riders/:id/store
// Changes the assigned store (restricted if rider is Busy)
router.put("/riders/:id/store", async (req, res) => {
  const { fulfillmentStoreId, fulfillmentStoreName } = req.body;
  try {
    const rider = await User.findOne({ _id: req.params.id, role: "rider" });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    if (rider.riderStatus === "Busy") {
      return res.status(400).json({
        message: "This rider has an active delivery. Complete or reassign the order before changing the fulfillment store."
      });
    }

    if (fulfillmentStoreId) rider.fulfillmentStoreId = fulfillmentStoreId;
    if (fulfillmentStoreName) rider.fulfillmentStoreName = fulfillmentStoreName;

    await rider.save();
    return res.json(rider);
  } catch (error) {
    return res.status(500).json({ message: "Failed to change store", error: error.message });
  }
});

// DELETE /api/admin/riders/:id
// Soft deletes a rider, validating no active assignments exist
router.delete("/riders/:id", async (req, res) => {
  try {
    const rider = await User.findOne({ _id: req.params.id, role: "rider" });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    // Check active order assignment
    const activeOrder = await Order.findOne({
      riderId: rider._id,
      orderStatus: { $nin: ["Delivered", "Cancelled", "Delivery Failed"] }
    }).lean();

    if (activeOrder) {
      const shortId = activeOrder._id.toString().substring(activeOrder._id.toString().length - 8).toUpperCase();
      return res.status(400).json({
        message: `This rider is currently assigned to Order #${shortId}. Complete or reassign the order before deleting this rider.`
      });
    }

    rider.isActive = false;
    rider.deletedAt = new Date();
    rider.deletedBy = "Admin";
    await rider.save();

    return res.json({ success: true, message: "Rider archived successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete rider", error: error.message });
  }
});

// GET /api/admin/orders
// Returns all orders sorted by newest first
router.get("/orders", async (req, res) => {
  console.log("=== [ADMIN GET ALL ORDERS] ===");
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json(orders);
  } catch (error) {
    console.error("❌ Admin Get Orders Error:", error);
    return res.status(500).json({ message: "Failed to get orders", error: error.message });
  }
});

// GET /api/admin/orders/:id
// Returns single order details
router.get("/orders/:id", async (req, res) => {
  console.log("=== [ADMIN GET SINGLE ORDER] ===");
  console.log("Order ID:", req.params.id);
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.json(order);
  } catch (error) {
    console.error("❌ Admin Get Single Order Error:", error);
    return res.status(500).json({ message: "Failed to get order details", error: error.message });
  }
});

// PUT /api/admin/orders/:id/status
// Updates the status of a specific order
router.put("/orders/:id/status", async (req, res) => {
  console.log("=== [ADMIN STATUS UPDATE] ===");
  console.log("Updating Order ID:", req.params.id);

  const { orderStatus } = req.body;
  if (!orderStatus) {
    return res.status(400).json({ message: "orderStatus is required" });
  }

  const validStatuses = ["Pending", "Order Placed", "Preparing", "Packed", "Rider Assigned", "Picked Up", "Out for Delivery", "Delivered", "Cancelled", "Delivery Failed"];
  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("Old Status:", order.orderStatus);
    console.log("New Status:", orderStatus);

    const trackingService = require("../services/trackingService");
    const currentVersion = (order.trackingVersion || 0) + 1;
    order.trackingVersion = currentVersion;

    if (orderStatus === "Rider Assigned") {
      await trackingService.startSession(order._id);
      const updatedOrder = await Order.findById(order._id);
      
      try {
        const { sendOrderStatusNotification } = require("../services/notificationService");
        await sendOrderStatusNotification(updatedOrder, orderStatus);
      } catch (notifErr) {
        console.error("Failed to send order status notification:", notifErr.message);
      }
      return res.json(updatedOrder);
    }

    if (["Delivered", "Cancelled", "Delivery Failed"].includes(orderStatus)) {
      trackingService.stopSession(order._id);
      order.trackingSessionActive = false;
      if (order.assignedRider && order.assignedRider.riderId) {
        try {
          const assignedUser = await User.findById(order.assignedRider.riderId);
          if (assignedUser) {
            assignedUser.riderStatus = "Available";
            await assignedUser.save();
            console.log(`[Rider Status] Released rider ${assignedUser.name} to Available on order status update: ${orderStatus}`);
          }
        } catch (riderErr) {
          console.error("Failed to release rider on order status update:", riderErr.message);
        }
      }
    }

    order.orderStatus = orderStatus;
    const timestampKey = STATUS_TIMESTAMP_KEYS[orderStatus];
    if (timestampKey) {
      order.statusTimestamps = order.statusTimestamps || {};
      order.statusTimestamps[timestampKey] = new Date();
    }
    if (orderStatus === "Out for Delivery") {
      order.estimatedArrivalMinutes = 12;
      order.estimatedDeliveryTime = new Date(Date.now() + 12 * 60 * 1000);
      console.log("=== ETA UPDATED ===");
      console.log({ orderId: order._id, estimatedArrivalMinutes: order.estimatedArrivalMinutes });
    }
    if (orderStatus === "Delivered") {
      order.deliveredAt = order.deliveredAt || new Date();
      order.estimatedArrivalMinutes = 0;
      order.estimatedDeliveryTime = new Date();
      try {
        const { handleOrderCheckoutRewards } = require("../utils/rewards");
        await handleOrderCheckoutRewards(order);
      } catch (rewardErr) {
        console.error("Failed to credit BuyCoins on Delivered:", rewardErr);
      }
      try {
        const { clearCustomerCart } = require("../services/cartCleanupService");
        await clearCustomerCart(order.userId);
      } catch (cartErr) {
        console.error("Failed to clear customer cart on Delivered status:", cartErr);
      }
    }
    const updatedOrder = await order.save();
    console.log("Order status updated successfully in DB:", updatedOrder._id);

    // Broadcast live event instantly
    trackingService.emitStatusUpdated(String(updatedOrder._id), updatedOrder, currentVersion);

    try {
      const { sendOrderStatusNotification } = require("../services/notificationService");
      await sendOrderStatusNotification(updatedOrder, orderStatus);
    } catch (notifErr) {
      console.error("Failed to send order status notification:", notifErr.message);
    }

    if (["Cancelled", "Delivery Failed"].includes(orderStatus)) {
      const { handleOrderCancellationReversal } = require("../utils/rewards");
      await handleOrderCancellationReversal(updatedOrder);
    }

    return res.json(updatedOrder);
  } catch (error) {
    console.error("❌ Admin Status Update Error:", error);
    return res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
});

// PUT /api/admin/orders/:id/assign-rider
// Manually assigns a rider to an order
router.put("/orders/:id/assign-rider", async (req, res) => {
  console.log("=== [ADMIN RIDER ASSIGNMENT] ===");
  console.log("Order ID:", req.params.id);
  console.log("Rider ID to assign:", req.body.riderId);

  const { riderId } = req.body;
  if (!riderId) {
    return res.status(400).json({ message: "riderId is required" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const rider = await User.findOne({ _id: riderId, role: "rider" });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // 2. Prevent Assigning Riders to Multiple Orders
    if (String(order.assignedRider?.riderId) !== String(rider._id)) {
      if (rider.riderStatus && rider.riderStatus !== "Available") {
        return res.status(400).json({
          message: "This rider is already assigned to another active order."
        });
      }
    }

    let isReassignment = false;

    // If order already has a rider, unassign them first
    if (order.assignedRider && order.assignedRider.riderId && String(order.assignedRider.riderId) !== String(rider._id)) {
      isReassignment = true;
      const prevRiderId = order.assignedRider.riderId;
      try {
        const prevRider = await User.findById(prevRiderId);
        if (prevRider) {
          prevRider.riderStatus = "Available";
          await prevRider.save();
          console.log(`[Rider Status] Released previous rider ${prevRider.name} back to Available`);
        }
      } catch (err) {
        console.error("Failed to release previous rider:", err.message);
      }

      // Record in assignmentHistory that the previous rider was unassigned
      if (order.assignmentHistory && order.assignmentHistory.length > 0) {
        const lastIndex = order.assignmentHistory.length - 1;
        if (!order.assignmentHistory[lastIndex].unassignedAt) {
          order.assignmentHistory[lastIndex].unassignedAt = new Date();
          order.assignmentHistory[lastIndex].reason = "Reassigned";
        }
      }
    }

    // Update new rider status to Busy
    rider.riderStatus = "Busy";
    await rider.save();

    // Snapshot the rider inside order
    order.assignedRider = {
      riderId: rider._id,
      name: rider.name,
      phone: rider.phone,
      profilePhoto: rider.profileImage || "",
      vehicleType: rider.vehicleType || "",
      vehicleNumber: rider.vehicleNumber || "",
      rating: rider.rating || 5.0
    };

    // Keep legacy order fields in sync
    order.riderId = rider._id;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.riderAssigned = true;

    // Record the new assignment in history
    order.assignmentHistory.push({
      riderId: rider._id,
      assignedAt: new Date(),
      assignedBy: "Admin"
    });

    order.orderStatus = "Rider Assigned";
    order.statusTimestamps = order.statusTimestamps || {};
    order.statusTimestamps.riderAssigned = new Date();

    const currentVersion = (order.trackingVersion || 0) + 1;
    order.trackingVersion = currentVersion;

    updatedOrder.assignmentHistory.push({
      action: isReassignment ? "Reassigned" : "Assigned",
      riderId: rider._id,
      previousRiderId: expectedPrevRiderId,
      assignedAt: new Date(),
      assignedBy: "Admin",
      reason: "Status update manual dispatch"
    });

    await updatedOrder.save();

    // Start live tracking session if store config is correct
    if (updatedOrder.fulfillmentStore?.latitude && updatedOrder.fulfillmentStore?.longitude) {
      const trackingService = require("../services/trackingService");
      await trackingService.startSession(updatedOrder._id);
    }

    // Fetch fresh order
    const finalOrder = await Order.findById(updatedOrder._id);

    // Send notifications
    try {
      const { sendOrderNotification } = require("../services/notificationService");
      if (isReassignment) {
        await sendOrderNotification(finalOrder, "Rider Assigned", `🔄 Your delivery partner has changed. New Rider: ${rider.name}`);
      } else {
        await sendOrderNotification(finalOrder, "Rider Assigned", `🛵 ${rider.name} has been assigned to your order.`);
      }
    } catch (notifErr) {
      console.error("Failed to send order assignment notification:", notifErr.message);
    }

    return res.json(finalOrder);
  } catch (error) {
    console.error("❌ Admin Rider Assignment Error:", error);
    return res.status(500).json({ message: "Failed to assign rider", error: error.message });
  }
});

// GET /api/admin/orders/search-suggestions
// Finds active orders ready for rider assignment matching query
router.get("/orders/search-suggestions", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }

  try {
    const q = query.trim().toLowerCase();
    
    // Find active orders ready for rider assignment
    // Allowed statuses: "Preparing" (Store Accepted), "Packed" (Packing)
    const activeOrders = await Order.find({
      orderStatus: { $in: ["Preparing", "Packed"] }
    }).sort({ createdAt: 1 }).lean();

    const { getDistance } = require("../services/routeGenerator");

    const matched = activeOrders.filter(order => {
      const orderIdStr = order._id.toString().toLowerCase();
      const customerName = (order.user?.name || "").toLowerCase();
      const customerPhone = (order.user?.phone || "").toLowerCase();
      
      return orderIdStr.includes(q) || 
             customerName.includes(q) || 
             customerPhone.includes(q);
    });

    const suggestions = matched.slice(0, 20).map(order => {
      // Calculate ETA using the exact same tracking service distance-based logic
      const storeLat = order.fulfillmentStore?.latitude || 13.0835363;
      const storeLng = order.fulfillmentStore?.longitude || 77.6403678;
      const customerLat = order.deliveryLatitude || (storeLat + 0.0055);
      const customerLng = order.deliveryLongitude || (storeLng + 0.0055);
      const dist = getDistance(storeLat, storeLng, customerLat, customerLng);
      const etaMinutes = Math.round(8 + dist * 2);
      
      const timeSinceOrderedMs = Date.now() - new Date(order.createdAt).getTime();
      const waitingMinutes = Math.round(timeSinceOrderedMs / 60000);

      // Determine priority: if waiting > 10 min, it is High Priority
      const priority = waitingMinutes > 10 ? "High Priority" : "Standard";

      return {
        _id: order._id,
        orderId: order._id.toString(),
        shortId: order._id.toString().substring(order._id.toString().length - 8).toUpperCase(),
        customerName: order.user?.name || "Customer",
        customerPhone: order.user?.phone || "",
        deliveryAddress: order.deliveryAddress || "",
        fulfillmentStoreName: order.fulfillmentStore?.storeName || "HQ",
        fulfillmentStoreId: order.fulfillmentStore?.storeId || "",
        orderStatus: order.orderStatus,
        waitingMinutes,
        eta: `${etaMinutes - 2}–${etaMinutes + 2} min`,
        priority
      };
    });

    return res.json(suggestions);
  } catch (err) {
    console.error("Error fetching search suggestions:", err);
    return res.status(500).json({ message: "Failed to load suggestions" });
  }
});

// PUT /api/admin/riders/:riderId/assign-order
// Assigns a rider to an order by order ID/number
router.put("/riders/:riderId/assign-order", async (req, res) => {
  const { riderId } = req.params;
  const { orderNumber, reason } = req.body;

  if (!orderNumber) {
    return res.status(400).json({ message: "Order Number is required" });
  }

  try {
    const rider = await User.findOne({ _id: riderId, role: "rider" });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (rider.isSuspended) {
      return res.status(400).json({ message: "This rider is suspended." });
    }

    let order = null;
    if (mongoose.isValidObjectId(orderNumber)) {
      order = await Order.findById(orderNumber);
    } else {
      const suffix = orderNumber.trim();
      const allOrders = await Order.find({});
      order = allOrders.find(o => o._id.toString().toLowerCase().endsWith(suffix.toLowerCase()));
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 1. Prevent Assignment Before Store Acceptance / Eligibility check
    const allowedStatuses = ["Preparing", "Packed"];
    if (["Out for Delivery", "Delivered", "Cancelled", "Delivery Failed"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "This order has already left the store and cannot be reassigned." });
    }
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ message: "This order is not ready for rider assignment." });
    }

    // 2. Verify Rider Belongs to the Same Fulfillment Store
    if (order.fulfillmentStore?.storeId && rider.fulfillmentStoreId) {
      if (order.fulfillmentStore.storeId !== rider.fulfillmentStoreId) {
        return res.status(400).json({
          message: "This rider is assigned to a different fulfillment center."
        });
      }
    }

    const expectedPrevRiderId = order.assignedRider?.riderId || null;
    let isReassignment = !!expectedPrevRiderId;

    // Release previous rider if applicable
    if (isReassignment && String(expectedPrevRiderId) !== String(rider._id)) {
      try {
        const prevRider = await User.findById(expectedPrevRiderId);
        if (prevRider) {
          prevRider.riderStatus = "Available";
          await prevRider.save();
        }
      } catch (err) {
        console.error("Failed to release previous rider:", err.message);
      }
    }

    // Release any previous order assigned to this new rider
    const activeOrdersForRider = await Order.find({
      riderId: rider._id,
      _id: { $ne: order._id },
      orderStatus: { $nin: ["Delivered", "Cancelled", "Delivery Failed"] }
    });

    for (const activeOrder of activeOrdersForRider) {
      activeOrder.assignedRider = null;
      activeOrder.riderId = null;
      activeOrder.riderName = "";
      activeOrder.riderPhone = "";
      activeOrder.riderAssigned = false;
      activeOrder.orderStatus = "Preparing";
      
      activeOrder.assignmentHistory.push({
        action: "Unassigned",
        riderId: rider._id,
        assignedBy: "Admin",
        reason: "Rider reassigned to another order"
      });
      await activeOrder.save();

      const trackingService = require("../services/trackingService");
      trackingService.stopSession(activeOrder._id);
      trackingService.emitStatusUpdated(String(activeOrder._id), activeOrder, (activeOrder.trackingVersion || 0) + 1);
    }

    // Update new rider status to Busy
    rider.riderStatus = "Busy";
    await rider.save();

    // Perform atomic/concurrency-safe order update
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        orderStatus: order.orderStatus,
        "assignedRider.riderId": expectedPrevRiderId
      },
      {
        $set: {
          assignedRider: {
            riderId: rider._id,
            name: rider.name,
            phone: rider.phone,
            profilePhoto: rider.profileImage || "",
            vehicleType: rider.vehicleType || "",
            vehicleNumber: rider.vehicleNumber || "",
            rating: rider.rating || 5.0
          },
          riderId: rider._id,
          riderName: rider.name,
          riderPhone: rider.phone,
          riderAssigned: true,
          orderStatus: "Rider Assigned",
          "statusTimestamps.riderAssigned": new Date()
        },
        $inc: { trackingVersion: 1 },
        $push: {
          assignmentHistory: {
            action: isReassignment ? "Reassigned" : "Assigned",
            riderId: rider._id,
            previousRiderId: expectedPrevRiderId,
            assignedAt: new Date(),
            assignedBy: "Admin",
            reason: reason || "Standard assignment"
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        message: "This order is no longer eligible for rider assignment. Please refresh the list."
      });
    }

    // 7. Tracking Session Safety: Only start tracking if store exists
    if (updatedOrder.fulfillmentStore?.latitude && updatedOrder.fulfillmentStore?.longitude) {
      const trackingService = require("../services/trackingService");
      await trackingService.startSession(updatedOrder._id);
    }

    // Send notifications
    try {
      const { sendOrderNotification } = require("../services/notificationService");
      if (isReassignment) {
        await sendOrderNotification(updatedOrder, "Rider Assigned", `🔄 Your delivery partner has changed. New Rider: ${rider.name}`);
      } else {
        await sendOrderNotification(updatedOrder, "Rider Assigned", `🛵 ${rider.name} has been assigned to your order. Vehicle: ${rider.vehicleNumber || "KA 03 JM 1234"}`);
      }
    } catch (notifErr) {
      console.error("Failed to send order assignment notification:", notifErr.message);
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("❌ Assign Order by Rider Error:", error);
    return res.status(500).json({ message: "Failed to assign order", error: error.message });
  }
});

// GET /api/admin/products
// Returns all products catalog
router.get("/products", async (req, res) => {
  console.log("=== [ADMIN GET PRODUCTS] ===");
  try {
    const products = await Product.find().lean();
    return res.json(products);
  } catch (error) {
    console.error("❌ Admin Products List Error:", error);
    return res.status(500).json({ message: "Failed to retrieve products", error: error.message });
  }
});

// POST /api/admin/products
// Adds a new product to the catalog
router.post("/products", async (req, res) => {
  console.log("=== [ADMIN CREATE PRODUCT] ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const { name, category, price, originalPrice, weight, stock, image, variants, isTrending, subCategory, section, brand, description, eta, isAd } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ message: "Name, category, price, and stock are required fields" });
    }

    const count = await Product.countDocuments();
    const customId = `prod_${Date.now()}_${count}`;

    const product = new Product({
      id: customId,
      name,
      category,
      subCategory: subCategory || category,
      subcategory: subCategory || category,
      price,
      originalPrice: originalPrice || price,
      weight: weight || "1 unit",
      stock: Number(stock),
      image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e",
      variants: variants || [],
      isTrending: !!isTrending,
      section,
      brand,
      description,
      eta,
      isAd: isAd !== undefined ? !!isAd : undefined,
      tags: [category.toLowerCase(), name.toLowerCase()]
    });

    const savedProduct = await product.save();
    console.log("Product saved successfully:", savedProduct._id);
    return res.status(201).json(savedProduct);
  } catch (error) {
    console.error("❌ Product Admin Post Error:", error);
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
});

// PUT /api/admin/products/:id
// Updates product stock, price, etc.
router.put("/products/:id", async (req, res) => {
  console.log("=== [ADMIN UPDATE PRODUCT] ===");
  console.log("Product ID:", req.params.id);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const { name, category, price, originalPrice, weight, stock, image, variants, isTrending, subCategory, section, brand, description, eta, isAd } = req.body;

    const product = await Product.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
        { id: req.params.id }
      ].filter(Boolean)
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) {
      product.category = category;
      product.subCategory = subCategory || category;
      product.subcategory = subCategory || category;
    }
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (weight !== undefined) product.weight = weight;
    if (stock !== undefined) product.stock = Number(stock);
    if (image !== undefined) product.image = image;
    if (variants !== undefined) product.variants = variants;
    if (isTrending !== undefined) product.isTrending = isTrending;
    if (section !== undefined) product.section = section;
    if (brand !== undefined) product.brand = brand;
    if (description !== undefined) product.description = description;
    if (eta !== undefined) product.eta = eta;
    if (isAd !== undefined) product.isAd = isAd;

    const updatedProduct = await product.save();
    console.log("Product updated successfully:", updatedProduct._id);
    return res.json(updatedProduct);
  } catch (error) {
    console.error("❌ Product Admin Put Error:", error);
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});

// DELETE /api/admin/products/:id
// Deletes a product from catalog
router.delete("/products/:id", async (req, res) => {
  console.log("=== [ADMIN DELETE PRODUCT] ===");
  console.log("Product ID:", req.params.id);

  try {
    const result = await Product.deleteOne({
      $or: [
        { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
        { id: req.params.id }
      ].filter(Boolean)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Product deleted successfully");
    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Product Admin Delete Error:", error);
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});

// PUT /api/admin/config/fees
// Updates checkout fees configuration
router.put("/config/fees", async (req, res) => {
  console.log("=== ADMIN UPDATE FEE CONFIGURATION HIT ===");
  try {
    const {
      handlingFee,
      smallCartThreshold,
      smallCartFee,
      deliveryFee,
      freeDeliveryThreshold,
      rainFee,
      lateNightFee,
      gstPercentage,
      gstFixedCharges,
      codConvenienceFee,
      codConvenienceFeeEnabled
    } = req.body;

    let feeConfig = await Config.findOne({ key: "fees_config" });
    if (!feeConfig) {
      feeConfig = new Config({ key: "fees_config" });
    }

    if (handlingFee !== undefined) feeConfig.handlingFee = Number(handlingFee);
    if (smallCartThreshold !== undefined) feeConfig.smallCartThreshold = Number(smallCartThreshold);
    if (smallCartFee !== undefined) feeConfig.smallCartFee = Number(smallCartFee);
    if (deliveryFee !== undefined) feeConfig.deliveryFee = Number(deliveryFee);
    if (freeDeliveryThreshold !== undefined) feeConfig.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    if (rainFee !== undefined) feeConfig.rainFee = Number(rainFee);
    if (lateNightFee !== undefined) feeConfig.lateNightFee = Number(lateNightFee);
    if (gstPercentage !== undefined) feeConfig.gstPercentage = Number(gstPercentage);
    if (gstFixedCharges !== undefined) feeConfig.gstFixedCharges = Number(gstFixedCharges);
    if (codConvenienceFee !== undefined) feeConfig.codConvenienceFee = Number(codConvenienceFee);
    if (codConvenienceFeeEnabled !== undefined) feeConfig.codConvenienceFeeEnabled = Boolean(codConvenienceFeeEnabled);

    const savedConfig = await feeConfig.save();
    console.log("Fee configuration updated successfully by admin:", savedConfig);
    return res.json({ success: true, config: savedConfig });
  } catch (error) {
    console.error("❌ Admin Fee Config Update Error:", error);
    return res.status(500).json({ message: "Failed to update fee configuration", error: error.message });
  }
});

// GET /api/admin/delivery-settings
// Returns current delivery settings for admin panel
router.get("/delivery-settings", async (req, res) => {
  console.log("=== GET DELIVERY SETTINGS HIT (ADMIN) ===");
  try {
    let settings = await DeliverySettings.findOne({ key: "delivery_settings" });
    if (!settings) {
      settings = new DeliverySettings({ key: "delivery_settings" });
      await settings.save();
    }
    return res.json(settings);
  } catch (error) {
    console.error("❌ Admin Get Delivery Settings Error:", error);
    return res.status(500).json({ message: "Failed to get delivery settings", error: error.message });
  }
});

// PUT /api/admin/delivery-settings
// Updates delivery settings toggles
router.put("/delivery-settings", async (req, res) => {
  console.log("=== ADMIN UPDATE DELIVERY SETTINGS HIT ===");
  try {
    const { lateNightDeliveryEnabled, rainyDeliveryEnabled } = req.body;

    let settings = await DeliverySettings.findOne({ key: "delivery_settings" });
    if (!settings) {
      settings = new DeliverySettings({ key: "delivery_settings" });
    }

    if (lateNightDeliveryEnabled !== undefined) {
      settings.lateNightDeliveryEnabled = Boolean(lateNightDeliveryEnabled);
    }
    if (rainyDeliveryEnabled !== undefined) {
      settings.rainyDeliveryEnabled = Boolean(rainyDeliveryEnabled);
    }

    const savedSettings = await settings.save();
    console.log("Delivery settings updated successfully by admin:", savedSettings);

    // Emit event to all connected Socket.IO clients in real-time
    if (req.io) {
      console.log("=== EMITTING deliverySettingsUpdated via Socket.IO ===");
      req.io.emit("deliverySettingsUpdated", savedSettings);
    }

    return res.json({ success: true, settings: savedSettings });
  } catch (error) {
    console.error("❌ Admin Delivery Settings Update Error:", error);
    return res.status(500).json({ message: "Failed to update delivery settings", error: error.message });
  }
});

// Haversine formula helper function
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/admin/delivery-summary-stats
router.get("/delivery-summary-stats", async (req, res) => {
  try {
    const activeZones = await DeliveryServiceZone.find({ active: true }).lean();
    const totalActiveZones = activeZones.length;
    const totalRadiusCoverage = activeZones.reduce((sum, zone) => sum + (zone.radiusKm || 0), 0);
    const totalNotifyRequests = await UnserviceableRequest.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await Order.find({ createdAt: { $gte: startOfToday } }).lean();

    let serviceableOrdersToday = 0;
    for (const order of ordersToday) {
      if (order.deliveryLatitude && order.deliveryLongitude) {
        const isServiceable = activeZones.some(zone => {
          const dist = haversineDistance(
            order.deliveryLatitude,
            order.deliveryLongitude,
            zone.latitude,
            zone.longitude
          );
          return dist <= zone.radiusKm;
        });
        if (isServiceable) {
          serviceableOrdersToday++;
        }
      }
    }

    return res.json({
      activeZonesCount: totalActiveZones,
      totalRadiusCoverage,
      notifyRequestsCount: totalNotifyRequests,
      serviceableOrdersToday
    });
  } catch (error) {
    console.error("❌ Delivery Summary Stats Error:", error);
    return res.status(500).json({ message: "Failed to get stats", error: error.message });
  }
});

// GET /api/admin/delivery-zones
router.get("/delivery-zones", async (req, res) => {
  try {
    const zones = await DeliveryServiceZone.find().sort({ createdAt: -1 }).lean();
    return res.json(zones);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch delivery zones", error: error.message });
  }
});

// POST /api/admin/delivery-zones
router.post("/delivery-zones", async (req, res) => {
  try {
    const { name, address, latitude, longitude, radiusKm, active } = req.body;
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Name, address, latitude, and longitude are required" });
    }

    const zone = new DeliveryServiceZone({
      name,
      address,
      latitude,
      longitude,
      radiusKm: radiusKm !== undefined ? Number(radiusKm) : 3,
      active: active !== undefined ? Boolean(active) : true
    });

    const savedZone = await zone.save();
    return res.status(201).json(savedZone);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create delivery zone", error: error.message });
  }
});

// PUT /api/admin/delivery-zones/:id
router.put("/delivery-zones/:id", async (req, res) => {
  try {
    const { name, address, latitude, longitude, radiusKm, active } = req.body;
    const zone = await DeliveryServiceZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: "Delivery zone not found" });
    }

    if (name !== undefined) zone.name = name;
    if (address !== undefined) zone.address = address;
    if (latitude !== undefined) zone.latitude = Number(latitude);
    if (longitude !== undefined) zone.longitude = Number(longitude);
    if (radiusKm !== undefined) zone.radiusKm = Number(radiusKm);
    if (active !== undefined) zone.active = Boolean(active);

    const updatedZone = await zone.save();
    return res.json(updatedZone);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update delivery zone", error: error.message });
  }
});

// DELETE /api/admin/delivery-zones/:id
router.delete("/delivery-zones/:id", async (req, res) => {
  try {
    const result = await DeliveryServiceZone.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Delivery zone not found" });
    }
    return res.json({ success: true, message: "Delivery zone deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete delivery zone", error: error.message });
  }
});

// GET /api/admin/unserviceable-requests
router.get("/unserviceable-requests", async (req, res) => {
  try {
    const requests = await UnserviceableRequest.find().sort({ createdAt: -1 }).lean();
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch unserviceable requests", error: error.message });
  }
});

// GET /api/admin/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ priority: -1, name: 1 }).lean();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
});

// POST /api/admin/categories
router.post("/categories", async (req, res) => {
  try {
    const { name, image, icon, showInHeader, priority } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = new Category({
      name,
      image,
      icon,
      showInHeader: showInHeader !== undefined ? Boolean(showInHeader) : true,
      priority: priority !== undefined ? Number(priority) : 0
    });
    const saved = await category.save();
    return res.status(201).json(saved);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create category", error: error.message });
  }
});

// PUT /api/admin/categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const { name, image, icon, showInHeader, priority } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (name !== undefined) category.name = name;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (showInHeader !== undefined) category.showInHeader = Boolean(showInHeader);
    if (priority !== undefined) category.priority = Number(priority);

    const updated = await category.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update category", error: error.message });
  }
});

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    const result = await Category.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete category", error: error.message });
  }
});

// GET /api/admin/notifications/stats
router.get("/notifications/stats", async (req, res) => {
  try {
    const totalDevicesResult = await User.aggregate([
      { $project: { tokensCount: { $size: { $ifNull: ["$fcmTokens", []] } } } },
      { $group: { _id: null, total: { $sum: "$tokensCount" } } }
    ]);
    const totalDevices = totalDevicesResult[0]?.total || 0;

    const totalCampaigns = await Notification.countDocuments({ type: "PROMO" });
    const successResult = await User.countDocuments(); // Fallback/general metrics

    // Let's count total historical pushes sent (order + cart + promo)
    const totalSent = await NotificationHistory.countDocuments();
    const lastCampaign = await Notification.findOne({ type: "PROMO" }).sort({ sentAt: -1 });

    return res.json({
      success: true,
      totalDevices,
      totalCampaigns,
      totalSent,
      successCount: totalSent, // approximate delivery count
      failureCount: 0,
      lastSentTime: lastCampaign ? lastCampaign.sentAt : null
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

// GET /api/admin/users/count
router.get("/users/count", async (req, res) => {
  try {
    const count = await User.countDocuments({ role: { $in: ["user", "customer"] } });
    return res.json({ success: true, count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return res.status(500).json({ message: "Failed to fetch user count", error: error.message });
  }
});

// GET /api/admin/notifications/history
router.get("/notifications/history", async (req, res) => {
  try {
    const campaigns = await SentNotification.find()
      .populate("sentBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(campaigns);
  } catch (error) {
    console.error("Error fetching notification history:", error);
    return res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
});

// POST /api/admin/notifications/send-test
router.post("/notifications/send-test", async (req, res) => {
  const { title, message, type, image, ctaText, ctaLink } = req.body;
  if (!title || !message || !type) {
    return res.status(400).json({ message: "Title, message, and type are required" });
  }
  if (message.length > 200) {
    return res.status(400).json({ message: "Message cannot exceed 200 characters" });
  }

  try {
    const adminUser = await User.findById(req.user._id);
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    // Save in-app notification for the Admin
    const inAppNotif = new NotificationHistory({
      user: adminUser._id,
      title,
      body: message,
      type,
      image: image || null,
      deepLink: ctaLink || null
    });
    await inAppNotif.save();

    // Collect admin tokens
    const tokens = [...(adminUser.fcmTokens || [])];
    if (adminUser.fcmToken && !tokens.includes(adminUser.fcmToken)) {
      tokens.push(adminUser.fcmToken);
    }

    let successCount = 0;
    let failedCount = 0;
    if (tokens.length > 0) {
      const { sendPushNotification } = require("../services/notificationService");
      const pushRes = await sendPushNotification(
        tokens,
        title,
        message,
        { type, deepLink: ctaLink || "", ctaText: ctaText || "" },
        image || null
      );
      if (pushRes.success) {
        successCount = pushRes.successCount || tokens.length;
        failedCount = pushRes.failureCount || 0;
      } else {
        failedCount = tokens.length;
      }
    }

    return res.json({
      success: true,
      message: "Test notification dispatched to your admin device",
      tokensCount: tokens.length,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error("Test campaign notification error:", error);
    return res.status(500).json({ message: "Failed to dispatch test notification", error: error.message });
  }
});

// POST /api/admin/notifications/send
router.post("/notifications/send", async (req, res) => {
  const { title, message, body, type, image, ctaText, ctaLink } = req.body;
  const finalMessage = message || body;
  const finalType = type || "Announcement";
  if (!title || !finalMessage) {
    return res.status(400).json({ message: "Title, message (or body) are required" });
  }
  if (finalMessage.length > 200) {
    return res.status(400).json({ message: "Message cannot exceed 200 characters" });
  }

  try {
    // 1. Fetch all normal users/customers
    const users = await User.find({ role: { $in: ["user", "customer"] } });
    if (users.length === 0) {
      return res.json({ success: true, message: "No recipients found", recipientCount: 0 });
    }

    // 2. Save individual in-app notification logs to MongoDB
    const historyPromises = users.map(u => {
      const historyItem = new NotificationHistory({
        user: u._id,
        title,
        body: finalMessage,
        type: finalType,
        image: image || null,
        deepLink: ctaLink || null
      });
      return historyItem.save();
    });
    await Promise.all(historyPromises);

    // 3. Gather active FCM tokens
    const allTokens = [];
    users.forEach(u => {
      if (Array.isArray(u.fcmTokens)) {
        u.fcmTokens.forEach(t => {
          const tokenStr = (t && typeof t === "object") ? t.token : t;
          if (tokenStr && !allTokens.includes(tokenStr)) {
            allTokens.push(tokenStr);
          }
        });
      }
      if (u.fcmToken && !allTokens.includes(u.fcmToken)) {
        allTokens.push(u.fcmToken);
      }
    });

    // 4. Send FCM push notifications (chunked)
    let successCount = 0;
    let failedCount = 0;
    if (allTokens.length > 0) {
      console.log(`[Campaign Dispatch] Dispatching FCM push to ${allTokens.length} active devices.`);
      const { sendBulkNotification } = require("../services/notificationService");
      const pushRes = await sendBulkNotification(
        allTokens,
        title,
        finalMessage,
        { type: finalType, deepLink: ctaLink || "", ctaText: ctaText || "" },
        image || null
      );
      successCount = pushRes.successCount || 0;
      failedCount = pushRes.failureCount || 0;
      console.log(`[Campaign Dispatch] Firebase Admin SDK Call Result: success=${successCount}, failed=${failedCount}`);
    } else {
      console.log("[Campaign Dispatch] No active FCM devices found to target. Skipping push dispatch.");
      successCount = 0;
    }

    // 5. Create SentNotification campaign log
    const campaignLog = new SentNotification({
      title,
      message: finalMessage,
      type: finalType,
      image: image || null,
      ctaText: ctaText || null,
      ctaLink: ctaLink || null,
      sentBy: req.user?._id,
      recipientCount: users.length,
      deliveredCount: successCount,
      failedCount: failedCount,
      scheduledFor: null
    });
    await campaignLog.save();

    return res.json({
      success: true,
      recipientCount: users.length,
      deliveredCount: successCount,
      failedCount: failedCount
    });
  } catch (error) {
    console.error("Send campaign notification error:", error);
    return res.status(500).json({ message: "Failed to dispatch notifications", error: error.message });
  }
});

// POST /api/admin/broadcast
// Sends promotional broadcast push notifications to all users
router.post("/broadcast", async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required for broadcast" });
  }

  try {
    const { sendPromotionalNotification } = require("../services/notificationService");
    const result = await sendPromotionalNotification({
      target: "all",
      title,
      body: message,
      createdBy: req.user?._id
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Notification sent to ${result.recipientsCount} users.`,
        recipientCount: result.recipientsCount,
        deliveredCount: result.successCount,
        failedCount: result.failureCount
      });
    } else {
      return res.status(500).json({ message: "Failed to broadcast notifications", error: result.error });
    }
  } catch (error) {
    console.error("Broadcast endpoint error:", error);
    return res.status(500).json({ message: "Failed to broadcast notifications", error: error.message });
  }
});

// POST /api/admin/send-broadcast
// Sends promotional broadcast push notifications (legacy fallback)
router.post("/send-broadcast", async (req, res) => {
  const { target, title, body, data } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required for broadcast" });
  }

  try {
    const { sendPromotionalNotification } = require("../services/notificationService");
    const result = await sendPromotionalNotification({
      target: target === "all" ? "all" : "selected",
      title,
      body,
      createdBy: req.user?._id
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Broadcast endpoint error:", error);
    return res.status(500).json({ message: "Failed to broadcast notifications", error: error.message });
  }
});
// GET /api/admin/notifications/queue
router.get("/notifications/queue", async (req, res) => {
  try {
    const Order = require("../models/Order");

    // Fetch counts
    const pendingCount = await Order.countDocuments({ adminNotificationStatus: "pending" });
    const processingCount = await Order.countDocuments({ adminNotificationStatus: "processing" });
    const sentCount = await Order.countDocuments({ adminNotificationStatus: "sent" });
    const failedCount = await Order.countDocuments({ adminNotificationStatus: "failed" });

    // Fetch recent orders with notification status
    const queue = await Order.find({}, {
      _id: 1,
      totalAmount: 1,
      adminNotificationStatus: 1,
      adminNotificationRetries: 1,
      adminNotificationLastAttemptAt: 1,
      adminNotificationSentAt: 1,
      adminNotificationMessageId: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      stats: {
        pending: pendingCount,
        processing: processingCount,
        sent: sentCount,
        failed: failedCount
      },
      queue
    });
  } catch (error) {
    console.error("Error fetching notification queue:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notification queue", error: error.message });
  }
});

// POST /api/admin/notifications/queue/retry/:orderId
router.post("/notifications/queue/retry/:orderId", async (req, res) => {
  try {
    const Order = require("../models/Order");
    const { sendAdminNotification } = require("../services/fcmService");

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Reset status to pending and reset retry count
    order.adminNotificationStatus = "pending";
    order.adminNotificationRetries = 0;
    await order.save();

    // Trigger sending immediately in the background
    sendAdminNotification(order).catch(console.error);

    return res.status(200).json({ success: true, message: "Retry triggered successfully" });
  } catch (error) {
    console.error("Error retrying notification:", error);
    return res.status(500).json({ success: false, message: "Failed to retry notification", error: error.message });
  }
});

// GET /api/admin/coupons
router.get("/coupons", async (req, res) => {
  try {
    const PromotionCoupon = require("../models/PromotionCoupon");
    const coupons = await PromotionCoupon.find({ isArchived: false }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching promotional coupons:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coupons", error: error.message });
  }
});

// GET /api/admin/coupons/audit-logs/:couponId
router.get("/coupons/audit-logs/:couponId", async (req, res) => {
  try {
    const CouponAuditLog = require("../models/CouponAuditLog");
    const logs = await CouponAuditLog.find({ couponId: req.params.couponId }).sort({ timestamp: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching coupon audit logs:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch logs", error: error.message });
  }
});

// POST /api/admin/coupons
router.post("/coupons", async (req, res) => {
  console.log("=== [ADMIN CREATE COUPON] ===");
  try {
    const PromotionCoupon = require("../models/PromotionCoupon");
    const CouponAuditLog = require("../models/CouponAuditLog");
    const { code, title, description, couponType, discountValue, minimumOrderValue, maximumDiscount, usageLimit, usagePerUser, validFrom, validUntil, priority, isActive } = req.body;
    console.log("Backend: Coupon received. Payload:", req.body);
    console.log("Backend: Admin user:", req.user?.email || "Unknown");

    if (!code || !title || discountValue === undefined || !validUntil) {
      return res.status(400).json({ success: false, message: "Required fields missing (code, title, discountValue, validUntil)" });
    }

    const existing = await PromotionCoupon.findOne({ code: code.toUpperCase().trim(), isArchived: false });
    if (existing) {
      return res.status(400).json({ success: false, message: "A coupon with this code already exists" });
    }

    const coupon = new PromotionCoupon({
      code: code.toUpperCase().trim(),
      title,
      description,
      couponType,
      discountValue,
      minimumOrderValue,
      maximumDiscount,
      usageLimit,
      usagePerUser,
      validFrom: validFrom || new Date(),
      validUntil,
      priority: priority || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await coupon.save();
    console.log("Backend: Coupon saved successfully. ID:", coupon._id);

    // Audit Log
    const audit = new CouponAuditLog({
      couponId: coupon._id,
      couponCode: coupon.code,
      adminId: req.user._id || req.user.id,
      adminName: req.user.name || "Admin",
      action: "CREATE",
      details: JSON.stringify(coupon)
    });
    await audit.save();

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({ success: false, message: "Failed to create coupon", error: error.message });
  }
});

// PUT /api/admin/coupons/:id
router.put("/coupons/:id", async (req, res) => {
  try {
    const PromotionCoupon = require("../models/PromotionCoupon");
    const CouponAuditLog = require("../models/CouponAuditLog");
    const { code, title, description, couponType, discountValue, minimumOrderValue, maximumDiscount, usageLimit, usagePerUser, validFrom, validUntil, priority, isActive } = req.body;

    const coupon = await PromotionCoupon.findById(req.params.id);
    if (!coupon || coupon.isArchived) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (code && code.toUpperCase().trim() !== coupon.code) {
      const existing = await PromotionCoupon.findOne({ code: code.toUpperCase().trim(), isArchived: false });
      if (existing) {
        return res.status(400).json({ success: false, message: "A coupon with this code already exists" });
      }
      coupon.code = code.toUpperCase().trim();
    }

    if (title !== undefined) coupon.title = title;
    if (description !== undefined) coupon.description = description;
    if (couponType !== undefined) coupon.couponType = couponType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minimumOrderValue !== undefined) coupon.minimumOrderValue = minimumOrderValue;
    if (maximumDiscount !== undefined) coupon.maximumDiscount = maximumDiscount;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (usagePerUser !== undefined) coupon.usagePerUser = usagePerUser;
    if (validFrom !== undefined) coupon.validFrom = validFrom;
    if (validUntil !== undefined) coupon.validUntil = validUntil;
    if (priority !== undefined) coupon.priority = priority;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    // Audit Log
    const audit = new CouponAuditLog({
      couponId: coupon._id,
      couponCode: coupon.code,
      adminId: req.user._id || req.user.id,
      adminName: req.user.name || "Admin",
      action: "UPDATE",
      details: JSON.stringify(req.body)
    });
    await audit.save();

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({ success: false, message: "Failed to update coupon", error: error.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete("/coupons/:id", async (req, res) => {
  try {
    const PromotionCoupon = require("../models/PromotionCoupon");
    const CouponAuditLog = require("../models/CouponAuditLog");

    const coupon = await PromotionCoupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isArchived = true;
    await coupon.save();

    // Audit Log
    const audit = new CouponAuditLog({
      couponId: coupon._id,
      couponCode: coupon.code,
      adminId: req.user._id || req.user.id,
      adminName: req.user.name || "Admin",
      action: "ARCHIVE",
      details: "Soft deleted/archived coupon"
    });
    await audit.save();

    return res.status(200).json({ success: true, message: "Coupon archived successfully" });
  } catch (error) {
    console.error("Error archiving coupon:", error);
    return res.status(500).json({ success: false, message: "Failed to archive coupon", error: error.message });
  }
});

// PATCH /api/admin/coupons/:id/status
router.patch("/coupons/:id/status", async (req, res) => {
  try {
    const PromotionCoupon = require("../models/PromotionCoupon");
    const CouponAuditLog = require("../models/CouponAuditLog");
    const { isActive } = req.body;

    const coupon = await PromotionCoupon.findById(req.params.id);
    if (!coupon || coupon.isArchived) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = isActive;
    await coupon.save();

    // Audit Log
    const audit = new CouponAuditLog({
      couponId: coupon._id,
      couponCode: coupon.code,
      adminId: req.user._id || req.user.id,
      adminName: req.user.name || "Admin",
      action: "STATUS_TOGGLE",
      details: `Status toggled to ${isActive ? "Active" : "Inactive"}`
    });
    await audit.save();

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error("Error toggling status:", error);
    return res.status(500).json({ success: false, message: "Failed to toggle coupon status", error: error.message });
  }
});

module.exports = router;