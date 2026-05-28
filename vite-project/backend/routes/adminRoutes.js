const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const STATUS_TIMESTAMP_KEYS = {
  "Order Placed": "orderPlaced",
  Preparing: "preparing",
  Packed: "packed",
  "Rider Assigned": "riderAssigned",
  "Out for Delivery": "outForDelivery",
  Delivered: "delivered",
  Cancelled: "cancelled"
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
      activeRiderDeliveries
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

  const validStatuses = ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Out for Delivery", "Delivered", "Cancelled"];
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
    }
    const updatedOrder = await order.save();
    console.log("Order status updated successfully in DB:", updatedOrder._id);

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
    const { name, category, price, originalPrice, weight, stock, image, variants, isTrending, subCategory } = req.body;
    
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
    const { name, category, price, originalPrice, weight, stock, image, variants, isTrending, subCategory } = req.body;
    
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

module.exports = router;
