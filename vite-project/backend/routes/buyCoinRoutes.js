const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");
const WalletService = require("../services/WalletService");
const GiftCardService = require("../services/giftCardService");

// Scope Check Middleware
function checkScope(requiredScope) {
  return (req, res, next) => {
    // Default admin role gets all scopes
    if (req.user && req.user.role === "admin") {
      return next();
    }
    // Otherwise check for explicit scope arrays
    if (req.user && req.user.scopes && req.user.scopes.includes(requiredScope)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Forbidden: Missing required scope '${requiredScope}'`
    });
  };
}

// Memory cache for background reconciliation jobs
const reconciliationJobs = {};

// GET /api/buycoins/wallet - Fetch user's wallet details and transactions
router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email ? req.user.email.toLowerCase() : "";

    // Backfill Welcome Bonus if user hasn't received it yet
    if (!req.user.welcomeBonusGiven) {
      await WalletService.grantWelcomeBonus(userId, email);
    }

    // Recalculate and fetch wallet details
    const wallet = await WalletService.recalculate(userId, email);

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

// GET /api/buycoins/admin-analytics or /admin/analytics - Admin dashboard analytics for BuyCoins
router.get(["/admin-analytics", "/admin/analytics"], authMiddleware, adminMiddleware, checkScope("buycoins.read"), async (req, res) => {
  try {
    const issuedResult = await BuyCoinTransaction.aggregate([
      { $match: { type: { $in: ["earned", "earn", "bonus", "admin", "refund", "WELCOME_BONUS", "ORDER_REWARD", "CASHBACK", "ADMIN_CREDIT"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", "$coins"] } } } }
    ]);
    const totalIssued = issuedResult[0]?.total || 0;

    const redeemedResult = await BuyCoinTransaction.aggregate([
      { $match: { type: { $in: ["spent", "redeem", "reversal", "ADMIN_DEBIT", "REDEMPTION", "REVERSAL", "EXPIRY"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", "$coins"] } } } }
    ]);
    const totalRedeemed = redeemedResult[0]?.total || 0;

    const outstandingResult = await BuyCoinWallet.aggregate([
      { $group: { _id: null, total: { $sum: "$availableCoins" } } }
    ]);
    const totalOutstanding = outstandingResult[0]?.total || 0;

    const activeWalletsCount = await BuyCoinWallet.countDocuments({ availableCoins: { $gt: 0 } });

    const topWallets = await BuyCoinWallet.find()
      .populate("userId", "name email phone")
      .sort({ availableCoins: -1 })
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

// POST /api/buycoins/admin/adjust - Adjust Customer Coins with strict audit logging
router.post("/admin/adjust", authMiddleware, adminMiddleware, checkScope("buycoins.adjust"), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { email, coins, type, reason } = req.body;
    if (!email || coins === undefined || !type || !reason) {
      return res.status(400).json({ success: false, message: "Email, coins amount, adjustment type, and reason are required" });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() }).session(session);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Customer user not found" });
    }

    const amount = Number(coins);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Coins amount must be a positive integer" });
    }

    const auditMetadata = {
      adminId: req.user._id,
      adminName: req.user.name || "Admin",
      source: "ADMIN_DASHBOARD",
      requestId: req.id || new mongoose.Types.ObjectId().toString(),
      timestamp: new Date(),
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip || ""
    };

    const idempotencyKey = `admin-adjust:${auditMetadata.requestId}`;

    let tx;
    await session.withTransaction(async () => {
      if (type === "redeem" || type === "ADMIN_DEBIT") {
        tx = await WalletService.debit(
          targetUser._id,
          targetUser.email,
          amount,
          "ADMIN_DEBIT",
          reason,
          auditMetadata,
          idempotencyKey,
          session
        );
      } else {
        tx = await WalletService.credit(
          targetUser._id,
          targetUser.email,
          amount,
          type === "bonus" ? "WELCOME_BONUS" : "ADMIN_CREDIT",
          reason,
          auditMetadata,
          idempotencyKey,
          session
        );
      }
    });

    const updatedWallet = await WalletService.recalculate(targetUser._id, targetUser.email);

    return res.json({
      success: true,
      message: "Coins adjusted successfully",
      wallet: updatedWallet,
      transaction: tx
    });
  } catch (error) {
    console.error("❌ Error adjusting coins:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

// GET /api/buycoins/admin/users - Search and Paginate Customer Wallets
router.get("/admin/users", authMiddleware, adminMiddleware, checkScope("buycoins.read"), async (req, res) => {
  try {
    const { query = "", page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const findQuery = {};
    if (query) {
      if (mongoose.Types.ObjectId.isValid(query)) {
        findQuery._id = query;
      } else {
        const cleanQuery = query.trim();
        // Index-friendly prefix searches
        findQuery.$or = [
          { name: { $regex: new RegExp("^" + cleanQuery, "i") } },
          { email: { $regex: new RegExp("^" + cleanQuery, "i") } },
          { phone: { $regex: new RegExp("^" + cleanQuery, "i") } }
        ];
      }
    }

    const totalUsers = await User.countDocuments(findQuery);
    const users = await User.find(findQuery)
      .select("name email phone buyCoins welcomeBonusGiven createdAt")
      .sort({ name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Map cached balances
    const usersWithWallet = await Promise.all(users.map(async (u) => {
      const wallet = await BuyCoinWallet.findOne({ userId: u._id }).lean();
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        welcomeBonusGiven: u.welcomeBonusGiven,
        buyCoins: wallet ? wallet.availableCoins : (u.buyCoins || 0),
        lifetimeEarned: wallet ? wallet.lifetimeEarned : 0,
        lifetimeRedeemed: wallet ? wallet.lifetimeRedeemed : 0
      };
    }));

    return res.json({
      success: true,
      users: usersWithWallet,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalUsers / limitNum)
      }
    });
  } catch (error) {
    console.error("❌ Error searching users:", error);
    return res.status(500).json({ success: false, message: "Failed to search users", error: error.message });
  }
});

// POST /api/buycoins/admin-grant - Legacy adjustment handler for backward compatibility
router.post("/admin-grant", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { phone, email, amount, description } = req.body;
    if ((!phone && !email) || amount === undefined || !description) {
      return res.status(400).json({ success: false, message: "Identifier, amount, and description are required" });
    }

    const query = {};
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const searchPhone = cleanPhone.length > 10 ? cleanPhone.substring(cleanPhone.length - 10) : cleanPhone;
      query.phone = { $regex: new RegExp(searchPhone + "$") };
    } else if (email) {
      query.email = email.toLowerCase();
    }

    const user = await User.findOne(query).session(session);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const numCoins = Math.round(Number(amount));
    const auditMetadata = {
      adminId: req.user._id,
      adminName: req.user.name || "Admin",
      source: "API",
      requestId: req.id || new mongoose.Types.ObjectId().toString(),
      timestamp: new Date()
    };
    const idempotencyKey = `legacy-grant:${auditMetadata.requestId}`;

    let tx;
    await session.withTransaction(async () => {
      if (numCoins < 0) {
        tx = await WalletService.debit(
          user._id,
          user.email,
          Math.abs(numCoins),
          "ADMIN_DEBIT",
          description,
          auditMetadata,
          idempotencyKey,
          session
        );
      } else {
        tx = await WalletService.credit(
          user._id,
          user.email,
          numCoins,
          "ADMIN_CREDIT",
          description,
          auditMetadata,
          idempotencyKey,
          session
        );
      }
    });

    const updatedWallet = await WalletService.recalculate(user._id, user.email);

    return res.json({
      success: true,
      message: `Successfully adjusted ${numCoins} coins`,
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("❌ Error adjusting coins:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

// GET /api/buycoins/admin/transactions - Get all transactions log (Admin Action)
router.get("/admin/transactions", authMiddleware, adminMiddleware, checkScope("buycoins.audit"), async (req, res) => {
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
  const userId = req.user._id;
  try {
    const transactions = await BuyCoinTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      transactions: transactions || []
    });
  } catch (error) {
    console.error("❌ GET /buycoins/transactions failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

// POST /api/buycoins/redeem - Redeem a reward from catalog
router.post("/redeem", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    const { rewardName, cost } = req.body;

    if (!rewardName || !cost) {
      return res.status(400).json({ success: false, message: "Reward name and cost are required" });
    }

    const amount = Number(cost);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Cost must be a positive integer" });
    }

    const email = req.user.email ? req.user.email.toLowerCase() : "";
    const requestId = req.id || new mongoose.Types.ObjectId().toString();
    const idempotencyKey = `redeem:${requestId}`;

    let tx;
    await session.withTransaction(async () => {
      tx = await WalletService.debit(
        userId,
        email,
        amount,
        "REDEMPTION",
        `Redeemed ${rewardName}`,
        {
          source: "API",
          requestId,
          timestamp: new Date()
        },
        idempotencyKey,
        session
      );
    });

    const updatedWallet = await WalletService.recalculate(userId, email);

    return res.json({
      success: true,
      message: `Successfully redeemed ${rewardName}`,
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("❌ Error redeeming reward:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

// POST /api/buycoins/calculate-redemption - Calculate checkout/cart redemption limits
router.post("/calculate-redemption", authMiddleware, async (req, res, next) => {
  try {
    const { subtotal } = req.body;
    if (subtotal === undefined || subtotal === null) {
      return res.status(400).json({ success: false, message: "Subtotal is required" });
    }

    const numericSubtotal = Number(subtotal);
    const buyCoinsBalance = req.user.buyCoins || 0;
    const maxDiscount = Math.floor(numericSubtotal * 0.20);
    const maxRedeemableCoins = Math.min(buyCoinsBalance, maxDiscount);

    return res.json({
      success: true,
      subtotal: numericSubtotal,
      buyCoinsBalance,
      maxDiscount,
      maxRedeemableCoins
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/buycoins/admin/reconcile - Background/Synchronous Reconciliation
router.post("/admin/reconcile", authMiddleware, adminMiddleware, checkScope("buycoins.adjust"), async (req, res) => {
  try {
    const { userId, userIds, mode = "DRY_RUN", async: runAsync } = req.body;

    if (runAsync) {
      const jobId = "job-" + Date.now();
      reconciliationJobs[jobId] = { status: "processing", progress: 0, result: null };

      // Background process
      WalletService.reconcile({ userId, userIds, mode })
        .then((report) => {
          reconciliationJobs[jobId] = { status: "completed", progress: 100, result: report };
        })
        .catch((err) => {
          reconciliationJobs[jobId] = { status: "failed", progress: 100, error: err.message };
        });

      return res.json({ success: true, jobId, status: "processing" });
    } else {
      const report = await WalletService.reconcile({ userId, userIds, mode });
      return res.json({ success: true, result: report });
    }
  } catch (error) {
    console.error("❌ Reconciliation failed:", error);
    return res.status(500).json({ success: false, message: "Reconciliation failed", error: error.message });
  }
});

// GET /api/buycoins/admin/reconcile/status/:jobId - Check background job status
router.get("/admin/reconcile/status/:jobId", authMiddleware, adminMiddleware, checkScope("buycoins.read"), (req, res) => {
  const { jobId } = req.params;
  const job = reconciliationJobs[jobId];
  if (!job) {
    return res.status(404).json({ success: false, message: "Reconciliation job not found" });
  }
  return res.json({ success: true, job });
});

// POST /api/buycoins/dev-grant - Dev-only test BuyCoins grant with feature flag check
router.post("/dev-grant", authMiddleware, async (req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_BUYCOINS !== "true") {
    return res.status(403).json({ success: false, message: "Forbidden: Developer features are disabled in this environment." });
  }

  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    const email = req.user.email || "";
    const requestId = req.id || new mongoose.Types.ObjectId().toString();
    const idempotencyKey = `dev-grant:${userId}:${requestId}`;

    let tx;
    await session.withTransaction(async () => {
      tx = await WalletService.credit(
        userId,
        email,
        50,
        "ADMIN_CREDIT",
        "Dev Mode Test Coins",
        {
          source: "DEV_TOOL",
          requestId,
          timestamp: new Date()
        },
        idempotencyKey,
        session
      );
    });

    const updatedWallet = await WalletService.recalculate(userId, email);

    return res.json({
      success: true,
      message: "Granted 50 test BuyCoins successfully!",
      wallet: updatedWallet,
      transaction: tx
    });
  } catch (error) {
    console.error("❌ Error in dev-grant:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

// Failed attempts storage for rate limiting
const giftCardFailures = new Map();

// Periodic cleanup of expired rate limit blocks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of giftCardFailures.entries()) {
    if (val.cooldownUntil < now) {
      giftCardFailures.delete(key);
    }
  }
}, 5 * 60 * 1000);

// POST /api/buycoins/claim-gift-card - Claim a gift card
router.post("/claim-gift-card", authMiddleware, async (req, res) => {
  try {
    const { code, pin } = req.body;
    const userId = req.user._id.toString();
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const rateLimitKey = `${userId}:${ip}`;

    // 1. Rate Limiting Check
    const now = Date.now();
    const limitRecord = giftCardFailures.get(rateLimitKey);
    if (limitRecord && limitRecord.count >= 5 && limitRecord.cooldownUntil > now) {
      const minutesRemaining = Math.ceil((limitRecord.cooldownUntil - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.`
      });
    }

    // 2. Strict Request Validations
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_CODE_OR_PIN",
        message: "Gift card code is required."
      });
    }
    
    // Normalize code by removing whitespace/spaces
    const normalizedCode = code.replace(/\s+/g, "").trim();
    if (normalizedCode.length !== 16 || isNaN(normalizedCode)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CODE_OR_PIN",
        message: "Invalid gift card code. Must be exactly 16 digits."
      });
    }

    if (!pin || typeof pin !== "string" || pin.length !== 6 || isNaN(pin)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CODE_OR_PIN",
        message: "Invalid PIN. Must be exactly 6 digits."
      });
    }

    // 3. Invoke Service
    const result = await GiftCardService.redeemCard(req.user._id, req.user.email || "", normalizedCode, pin);

    // 4. Handle Service Response & Adjust Rate Limiter
    if (!result.success) {
      // Record failure for rate limiting
      const record = giftCardFailures.get(rateLimitKey) || { count: 0, cooldownUntil: 0 };
      record.count += 1;
      // Lock for 15 minutes if limit reached
      record.cooldownUntil = Date.now() + 15 * 60 * 1000;
      giftCardFailures.set(rateLimitKey, record);

      return res.status(400).json(result);
    }

    // Reset rate limiter upon success
    giftCardFailures.delete(rateLimitKey);
    return res.json(result);
  } catch (error) {
    console.error("❌ Error in claim-gift-card route:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error. Please try again."
    });
  }
});

module.exports = router;
