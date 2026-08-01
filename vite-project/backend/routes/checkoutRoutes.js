const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper function to calculate cart subtotal from database prices
const calculateCartSubtotal = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.items || cart.items.length === 0) {
    console.log("DEBUG: No cart or cart items found for user", userId);
    return 0;
  }

  // Extract all product ObjectIds from the cart
  const productIds = cart.items.map(item => item.productId).filter(id => mongoose.Types.ObjectId.isValid(id));
  console.log("DEBUG: productIds mapped from cart:", productIds);
  
  // Load products from DB to get the latest, authoritative prices
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  console.log("DEBUG: products loaded from DB:", products.map(p => ({ _id: p._id, price: p.price })));
  
  // Create a map for quick price lookup
  const priceMap = new Map();
  for (const prod of products) {
    priceMap.set(prod._id.toString(), prod.price);
  }

  let subtotal = 0;
  for (const item of cart.items) {
    const price = priceMap.get(item.productId.toString());
    console.log(`DEBUG: item.productId=${item.productId}, price found=${price}, quantity=${item.quantity}`);
    if (price !== undefined) {
      subtotal += price * item.quantity;
    }
  }

  console.log("DEBUG: calculated subtotal:", subtotal);
  return subtotal;
};

// POST /api/checkout/cart - Sync frontend cart to database
router.post("/cart", authMiddleware, async (req, res, next) => {
  const requestId = req.id || "none";
  const routeName = "POST /api/checkout/cart";
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: "Cart items must be provided as an array." });
      }

      // Quick projection check to find the pre-update version for tracing logs
      const existingCart = await Cart.findOne({ userId: req.user._id }, { _id: 1, __v: 1 }).lean();
      const prevVersion = existingCart ? existingCart.__v : 0;
      const cartId = existingCart ? existingCart._id : "new";

      console.log(`[CONCURRENCY INFO] Route: ${routeName}, ReqId: ${requestId}, CartId: ${cartId}, PrevVersion: ${prevVersion}, Attempt: ${attempts}/${maxAttempts}`);

      const cartItems = [];
      for (const item of items) {
        const pId = item.productId || item._id;
        if (!pId || !mongoose.Types.ObjectId.isValid(pId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid product ID format: "${pId}". Must be a valid 24-character hexadecimal ObjectId.`
          });
        }
        cartItems.push({
          productId: pId,
          quantity: Number(item.quantity) || 1
        });
      }

      // Atomic overwrite to avoid Mongoose VersionError conflicts
      const cart = await Cart.findOneAndUpdate(
        { userId: req.user._id },
        {
          $set: {
            items: cartItems,
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true, runValidators: true }
      );

      return res.json({ success: true, message: "Cart synchronized successfully.", cartId: cart._id });
    } catch (error) {
      if (error.name === "VersionError" && attempts < maxAttempts) {
        console.warn(`[CONCURRENCY WARNING] VersionError caught on cart sync. Retrying... Route: ${routeName}, ReqId: ${requestId}, Attempt: ${attempts}/${maxAttempts}, Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 50 * attempts));
        continue;
      }
      console.error(`[CONCURRENCY ERROR] Failed to sync cart. Route: ${routeName}, ReqId: ${requestId}, Attempt: ${attempts}/${maxAttempts}, Error: ${error.message}`);
      return next(error);
    }
  }
});

// POST /api/checkout/apply-buycoins - Calculate checkout BuyCoins redemption details using authoritative DB values
router.post("/apply-buycoins", authMiddleware, async (req, res, next) => {
  try {
    const { coins } = req.body;
    const requestedCoins = Number(coins) || 0;

    if (requestedCoins < 0) {
      return res.status(400).json({ success: false, message: "Requested coins cannot be negative." });
    }

    const { MIN_BUYCOINS_ORDER, MAX_REDEMPTION_PERCENT } = require("../config/constants");

    // Load subtotal and balance authoritatively from DB
    const subtotal = await calculateCartSubtotal(req.user._id);
    const buyCoinsBalance = req.user.buyCoins || 0;

    if (subtotal <= MIN_BUYCOINS_ORDER) {
      return res.status(400).json({ success: false, message: `BuyCoins can only be redeemed on orders above ₹${MIN_BUYCOINS_ORDER}.` });
    }

    if (requestedCoins > buyCoinsBalance) {
      return res.status(400).json({ success: false, message: "Insufficient BuyCoins balance." });
    }

    const maxDiscount = Math.floor(subtotal * (MAX_REDEMPTION_PERCENT / 100));
    const maxRedeemableCoins = Math.min(buyCoinsBalance, maxDiscount);
    const appliedCoins = Math.min(requestedCoins, maxRedeemableCoins);
    const discount = appliedCoins;
    const payableAmount = subtotal - discount;

    // Development-only logging
    if (process.env.NODE_ENV !== "production") {
      console.log("=== [REDEMPTION CALCULATION DEBUG] ===");
      console.log({
        subtotal,
        twentyPercentDiscountValue: maxDiscount,
        userBuyCoinsBalance: buyCoinsBalance,
        maxRedeemableCoins,
        requestedCoins,
        appliedCoins,
        finalDiscount: discount,
        payableAmount
      });
    }

    return res.json({
      success: true,
      subtotal,
      buyCoinsBalance,
      maxRedeemableCoins,
      appliedCoins,
      discount,
      payableAmount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
