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

    const activeDeliveries = await Order.aggregate([
      { $match: { orderStatus: "Out for Delivery", riderAssigned: true } },
      { $group: { _id: "$riderId", activeOrders: { $sum: 1 } } }
    ]);

    const activeMap = activeDeliveries.reduce((acc, row) => {
      acc[String(row._id)] = row.activeOrders;
      return acc;
    }, {});

    return res.json(
      riders.map((rider) => ({
        ...rider,
        activeOrders: activeMap[String(rider._id)] || 0
      }))
    );
  } catch (error) {
    console.error("❌ Admin Riders List Error:", error);
    return res.status(500).json({ message: "Failed to get riders", error: error.message });
  }
});

// PUT /api/admin/riders/:id/suspend
// Toggles rider suspension and forces offline when suspended
router.put("/riders/:id/suspend", async (req, res) => {
  console.log("=== [ADMIN RIDER SUSPEND TOGGLE] ===");
  console.log("Rider ID:", req.params.id);
  try {
    const { isSuspended } = req.body;
    const rider = await User.findOne({ _id: req.params.id, role: "rider" });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    rider.isSuspended = Boolean(isSuspended);
    if (rider.isSuspended) {
      rider.isOnline = false;
    }
    await rider.save();

    console.log(`Rider ${rider.name} suspension status: ${rider.isSuspended}`);
    const sanitized = rider.toObject();
    delete sanitized.password;
    return res.json(sanitized);
  } catch (error) {
    console.error("❌ Admin Rider Suspend Error:", error);
    return res.status(500).json({ message: "Failed to update rider suspension", error: error.message });
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
      console.error(`Order not found for status update: ${req.params.id}`);
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("Old Status:", order.orderStatus);
    console.log("New Status:", orderStatus);

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
    }
    const updatedOrder = await order.save();
    console.log("Order status updated successfully in DB:", updatedOrder._id);

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
      gstFixedCharges
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

module.exports = router;