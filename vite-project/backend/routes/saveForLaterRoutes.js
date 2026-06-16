const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// GET /api/save-for-later - Get all saved products for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("savedProducts.productId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validSaved = user.savedProducts.filter(item => item.productId);
    
    return res.status(200).json({
      success: true,
      savedProducts: validSaved
    });
  } catch (error) {
    console.error("GET saved products failed:", error);
    return res.status(500).json({ message: "Failed to fetch saved products", error: error.message });
  }
});

// GET /api/save-for-later/count - Get count of saved products
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      count: user.savedProducts ? user.savedProducts.length : 0
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get saved products count", error: error.message });
  }
});

// POST /api/save-for-later/:productId - Add product to save for later list
router.post("/:productId", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadySaved = user.savedProducts.some(
      item => item.productId && item.productId.toString() === productId
    );

    if (alreadySaved) {
      return res.status(200).json({
        success: true,
        message: "Product already saved for later",
        savedProducts: user.savedProducts
      });
    }

    user.savedProducts.push({ productId });
    await user.save();

    product.saveCount = (product.saveCount || 0) + 1;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product saved for later",
      savedProducts: user.savedProducts
    });
  } catch (error) {
    console.error("POST save product failed:", error);
    return res.status(500).json({ message: "Failed to save product", error: error.message });
  }
});

// DELETE /api/save-for-later/:productId - Remove product from save for later list
router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.savedProducts = user.savedProducts.filter(
      item => item.productId && item.productId.toString() !== productId
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from save for later",
      savedProducts: user.savedProducts
    });
  } catch (error) {
    console.error("DELETE saved product failed:", error);
    return res.status(500).json({ message: "Failed to remove saved product", error: error.message });
  }
});

module.exports = router;
