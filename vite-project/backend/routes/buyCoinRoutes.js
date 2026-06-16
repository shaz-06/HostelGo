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
    const email = req.user.email.toLowerCase();

    // Recalculate wallet balance on query to reflect any expired coins
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

// GET /api/buycoins/admin/analytics - Admin dashboard analytics for BuyCoins
router.get("/admin/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // 1. Total Coins Issued
    const issuedResult = await BuyCoinTransaction.aggregate([
      { $match: { type: { $in: ["earn", "bonus"] } } },
      { $group: { _id: null, total: { $sum: "$coins" } } }
    ]);
    const totalIssued = issuedResult[0]?.total || 0;

    // 2. Total Coins Redeemed
    const redeemedResult = await BuyCoinTransaction.aggregate([
      { $match: { type: "redeem" } },
      { $group: { _id: null, total: { $sum: "$coins" } } }
    ]);
    const totalRedeemed = redeemedResult[0]?.total || 0;

    // 3. Active Wallets Count
    const activeWallets = await BuyCoinWallet.countDocuments({ availableCoins: { $gt: 0 } });

    // 4. Coins Expiring Soon (Next 30 Days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Find unexpired earn/bonus transactions that will expire within the next 30 days
    const expiringSoonTxs = await BuyCoinTransaction.find({
      type: { $in: ["earn", "bonus"] },
      expiresAt: { $gt: now, $lte: thirtyDaysFromNow }
    }).lean();

    // Sum of remaining unredeemed coins for those expiring transactions
    let coinsExpiringSoon = 0;
    for (const tx of expiringSoonTxs) {
      // Find total redeemed coins before this transaction's expiry to determine if consumed
      const userRedeems = await BuyCoinTransaction.aggregate([
        { $match: { userId: tx.userId, type: "redeem" } },
        { $group: { _id: null, total: { $sum: "$coins" } } }
      ]);
      const totalUserRedeemed = userRedeems[0]?.total || 0;

      // Find sum of all earn/bonus transactions before this one (FIFO order)
      const priorEarns = await BuyCoinTransaction.aggregate([
        { $match: { userId: tx.userId, type: { $in: ["earn", "bonus"] }, issuedAt: { $lt: tx.issuedAt } } },
        { $group: { _id: null, total: { $sum: "$coins" } } }
      ]);
      const totalPriorEarned = priorEarns[0]?.total || 0;

      // Calculate how many of tx.coins are already covered by the user's total redemptions
      const consumedByRedeems = Math.max(0, totalUserRedeemed - totalPriorEarned);
      const remainingUnredeemed = Math.max(0, tx.coins - consumedByRedeems);

      coinsExpiringSoon += remainingUnredeemed;
    }

    // 5. Top Customers by Coins Earned
    const topWallets = await BuyCoinWallet.find()
      .sort({ lifetimeEarned: -1 })
      .limit(10)
      .lean();

    return res.json({
      success: true,
      totalIssued,
      totalRedeemed,
      activeWallets,
      coinsExpiringSoon,
      topWallets
    });
  } catch (error) {
    console.error("❌ Error fetching admin analytics:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error.message });
  }
});

// POST /api/buycoins/admin/adjust - Adjust a user's coins manually (Admin Action)
router.post("/admin/adjust", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, coins, type, reason } = req.body;

    if (!email || !coins || !type || !reason) {
      return res.status(400).json({ success: false, message: "All fields (email, coins, type, reason) are required" });
    }

    if (!["earn", "redeem", "bonus"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid transaction type" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const numCoins = Number(coins);
    if (isNaN(numCoins) || numCoins <= 0) {
      return res.status(400).json({ success: false, message: "Coins must be a positive number" });
    }

    // For manual redemption (deduct), verify available balance first
    if (type === "redeem") {
      // Recalculate to ensure balance is accurate
      const wallet = await recalculateWallet(user._id, user.email);
      if (wallet.availableCoins < numCoins) {
        return res.status(400).json({ success: false, message: `Insufficient coins. User only has ${wallet.availableCoins} available.` });
      }
    }

    // Create adjustment transaction
    const adjustTx = new BuyCoinTransaction({
      userId: user._id,
      email: user.email.toLowerCase(),
      type,
      coins: numCoins,
      source: `manual_adjustment: ${reason}`
    });
    await adjustTx.save();

    // Recalculate wallet
    const updatedWallet = await recalculateWallet(user._id, user.email);

    return res.json({
      success: true,
      message: `Successfully adjusted coins for ${user.email}`,
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("❌ Error adjusting coins:", error);
    return res.status(500).json({ success: false, message: "Failed to adjust coins", error: error.message });
  }
});

// GET /api/buycoins/admin/transactions - Get all transactions log
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

module.exports = router;
