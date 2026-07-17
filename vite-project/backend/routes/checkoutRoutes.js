const express = require("express");
const router = express.Router();
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
  const productIds = cart.items.map(item => item.productId);
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
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Cart items must be provided as an array." });
    }

    // Save or update user cart in DB
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id });
    }

    cart.items = items.map(item => ({
      productId: item.productId || item._id, // Support both formats
      quantity: Number(item.quantity) || 1
    }));
    cart.updatedAt = new Date();

    await cart.save();

    return res.json({ success: true, message: "Cart synchronized successfully." });
  } catch (error) {
    next(error);
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
