const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");
const { recalculateWallet } = require("../utils/rewards");

// GET /api/buycoins/wallet - Fetch user's wallet details and transactions
router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email ? req.user.email.toLowerCase() : "";

    // Recalculate wallet balance on query
    const wallet = await recalculateWallet(userId, email);

    // Get transactions list, sorted newest first
    const transactions = await BuyCoinTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      wallet,
      transactions
    });
  } catch (error) {
    console.error("❌ Error fetching wallet:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch wallet", error: error.message });
  }
});

// GET /api/buycoins/admin-analytics - Admin dashboard analytics for BuyCoins
router.get("/admin-analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // 1. Total Coins Issued: sum of amount (or coins) for types earned, earn, bonus, admin, refund
    const issuedResult = await BuyCoinTransaction.aggregate([
      { $match: { type: { $in: ["earned", "earn", "bonus", "admin", "refund"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", "$coins"] } } } }
    ]);
    const totalIssued = issuedResult[0]?.total || 0;

    // 2. Total Coins Redeemed: sum of amount (or coins) for types spent, redeem, reversal
    const redeemedResult = await BuyCoinTransaction.aggregate([
      { $match: { type: { $in: ["spent", "redeem", "reversal"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", "$coins"] } } } }
    ]);
    const totalRedeemed = redeemedResult[0]?.total || 0;

    // 3. Total Outstanding Coins (Sum of available coins across all wallets)
    const outstandingResult = await BuyCoinWallet.aggregate([
      { $group: { _id: null, total: { $sum: "$availableCoins" } } }
    ]);
    const totalOutstanding = outstandingResult[0]?.total || 0;

    // 4. Active Wallets Count
    const activeWalletsCount = await BuyCoinWallet.countDocuments({ availableCoins: { $gt: 0 } });

    // 5. Top Customers by Coins Earned
    const topWallets = await BuyCoinWallet.find()
      .populate("userId", "name email phone")
      .sort({ lifetimeEarned: -1 })
      .limit(10)
      .lean();

    return res.json({
      success: true,
      totalIssued,
      totalRedeemed,
      totalOutstanding,
      activeWallets: activeWalletsCount,
      topWallets
    });
  } catch (error) {
    console.error("❌ Error fetching admin analytics:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error.message });
  }
});

// POST /api/buycoins/admin-grant - Grant/Deduct coins to/from a user manually (Admin Action)
router.post("/admin-grant", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phone, email, amount, description } = req.body;

    if ((!phone && !email) || amount === undefined || !description) {
      return res.status(400).json({ success: false, message: "Identifier (phone or email), amount, and description are required" });
    }

    const query = {};
    if (phone) {
      // Find user by phone number
      const cleanPhone = phone.replace(/\D/g, "");
      const searchPhone = cleanPhone.length > 10 ? cleanPhone.substring(cleanPhone.length - 10) : cleanPhone;
      query.phone = { $regex: new RegExp(searchPhone + "$") };
    } else if (email) {
      query.email = email.toLowerCase();
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const numCoins = Number(amount);
    if (isNaN(numCoins)) {
      return res.status(400).json({ success: false, message: "Amount must be a valid number" });
    }

    // Determine type (positive amount is admin grant, negative amount is administrative deduction)
    const type = numCoins >= 0 ? "admin" : "spent";
    const absoluteCoins = Math.abs(numCoins);

    // If deduction, verify available balance first
    if (type === "spent") {
      const wallet = await recalculateWallet(user._id, user.email || "");
      if (wallet.availableCoins < absoluteCoins) {
        return res.status(400).json({ success: false, message: `Insufficient coins. User only has ${wallet.availableCoins} available.` });
      }
    }

    // Create grant/deduction transaction
    const grantTx = new BuyCoinTransaction({
      userId: user._id,
      email: user.email || "",
      type,
      amount: absoluteCoins,
      coins: absoluteCoins,
      description: description
    });
    await grantTx.save();

    // Recalculate wallet
    const updatedWallet = await recalculateWallet(user._id, user.email || "");

    return res.json({
      success: true,
      message: `Successfully adjusted ${numCoins} coins for user ${user.phone || user.email}`,
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("❌ Error adjusting coins:", error);
    return res.status(500).json({ success: false, message: "Failed to adjust coins", error: error.message });
  }
});

// GET /api/buycoins/admin/transactions - Get all transactions log (Admin Action)
router.get("/admin/transactions", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const transactions = await BuyCoinTransaction.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions", error: error.message });
  }
});

// GET /api/buycoins/transactions - Get logged in user's transactions
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await BuyCoinTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, transactions });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions", error: error.message });
  }
});

// POST /api/buycoins/redeem - Redeem a reward from catalog
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { rewardName, cost } = req.body;
    
    if (!rewardName || !cost) {
      return res.status(400).json({ success: false, message: "Reward name and cost are required" });
    }
    
    const email = req.user.email ? req.user.email.toLowerCase() : "";
    const wallet = await recalculateWallet(userId, email);
    
    if (wallet.availableCoins < cost) {
      return res.status(400).json({ success: false, message: "Insufficient BuyCoins" });
    }
    
    // Create redeemed transaction
    const tx = new BuyCoinTransaction({
      userId,
      email,
      type: "redeemed",
      amount: Number(cost),
      coins: Number(cost),
      description: `Redeemed ${rewardName}`
    });
    await tx.save();
    
    // Recalculate wallet
    const updatedWallet = await recalculateWallet(userId, email);
    
    return res.json({
      success: true,
      message: `Successfully redeemed ${rewardName}`,
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("❌ Error redeeming reward:", error);
    return res.status(500).json({ success: false, message: "Failed to redeem reward", error: error.message });
  }
});

module.exports = router;
