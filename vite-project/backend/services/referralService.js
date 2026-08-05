const mongoose = require("mongoose");
const User = require("../models/User");
const Referral = require("../models/Referral");
const ReferralAuditLog = require("../models/ReferralAuditLog");
const Config = require("../models/Config");
const WalletService = require("./WalletService");

let cachedReferralConfig = null;

/**
 * Fetch or initialize the referral configuration.
 * Caches settings in memory to optimize read paths.
 */
async function getReferralConfig() {
  if (cachedReferralConfig) {
    return cachedReferralConfig;
  }

  let config = await Config.findOne({ key: "referral_config" });
  if (!config) {
    config = new Config({
      key: "referral_config",
      referralEnabled: true,
      referralMinOrder: 199,
      referrerReward: 75,
      referredUserReward: 50,
      referralConfigVersion: 1,
      referralExpiryDays: 90
    });
    await config.save().catch(err => console.error("[ReferralService] Error saving default config:", err));
  }

  cachedReferralConfig = config;
  return config;
}

/**
 * Clears the in-memory configuration cache. Called when settings are updated by admins.
 */
function clearConfigCache() {
  cachedReferralConfig = null;
}

/**
 * Transaction helper with graceful fallback for standalone developer MongoDB setups.
 */
async function runInTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (err.message && (err.message.includes("replica set") || err.message.includes("Transaction numbers") || err.message.includes("standalone"))) {
      console.warn("[ReferralService] Transactions not supported by database environment. Falling back to non-transactional run.");
      return await fn(null);
    }
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Links a newly signed up user with a referrer code.
 */
async function linkReferral(referredUser, referralCode, correlationId) {
  if (!referralCode) return { success: false, message: "No code provided" };
  const cleanCode = referralCode.toUpperCase().trim();

  // 1. Prevent self-referral
  if (referredUser.referralCode === cleanCode) {
    return { success: false, message: "You cannot refer yourself." };
  }

  // 2. Validate linking window constraints
  if (referredUser.referredBy) {
    return { success: false, message: "You have already been referred." };
  }

  const Order = mongoose.model("Order");
  const orderCount = await Order.countDocuments({ userId: referredUser._id });
  if (orderCount > 0 || referredUser.referralRewardClaimed) {
    return { success: false, message: "Referral linking is locked after placing an order." };
  }

  // 3. Find referrer
  const referrerUser = await User.findOne({ referralCode: cleanCode });
  if (!referrerUser) {
    return { success: false, message: "Invalid referral code." };
  }

  // Prevent circular referral loop (e.g. A refers B, B refers A)
  if (referrerUser.referredBy && String(referrerUser.referredBy) === String(referredUser._id)) {
    return { success: false, message: "Circular referral loop detected." };
  }

  const config = await getReferralConfig();
  if (!config.referralEnabled) {
    return { success: false, message: "Referral program is currently inactive." };
  }

  // 4. Save updates and create pending referral
  await runInTransaction(async (session) => {
    const opts = session ? { session } : {};

    // Generate expiration date
    const expiryDays = config.referralExpiryDays || 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const referral = new Referral({
      referrer: referrerUser._id,
      referredUser: referredUser._id,
      referralCode: cleanCode,
      status: "PENDING",
      rewardAmountReferrer: config.referrerReward,
      rewardAmountReferred: config.referredUserReward,
      expiresAt,
      campaignSnapshot: {
        configVersion: config.referralConfigVersion || 1,
        minOrder: config.referralMinOrder,
        referrerReward: config.referrerReward,
        referredUserReward: config.referredUserReward
      }
    });

    await referral.save(opts);

    // Link users
    referredUser.referredBy = referrerUser._id;
    await referredUser.save(opts);

    // Update cached counters on referrer
    referrerUser.pendingReferrals = (referrerUser.pendingReferrals || 0) + 1;
    await referrerUser.save(opts);

    // Write audit log
    const auditLog = new ReferralAuditLog({
      referralId: referral._id,
      userId: referredUser._id,
      action: "LINKED",
      correlationId,
      details: { referrerId: referrerUser._id, code: cleanCode, expiresAt }
    });
    await auditLog.save(opts);

    // Non-blocking notification dispatch
    dispatchPendingNotification(referrerUser, cleanCode).catch(err =>
      console.error("[ReferralService] Notification dispatch failed:", err)
    );
  });

  return { success: true };
}

/**
 * Handles order delivery event and validates qualification.
 */
async function processOrderDelivery(eventPayload) {
  const { orderId, userId, orderTotal, correlationId } = eventPayload;

  // 1. Locate pending referral
  const referral = await Referral.findOne({ referredUser: userId, status: "PENDING" });
  if (!referral) return; // No pending referral found

  // 2. Validate Expiration
  if (referral.expiresAt && new Date() > referral.expiresAt) {
    referral.status = "EXPIRED";
    await referral.save();
    
    // Log audit log
    await new ReferralAuditLog({
      referralId: referral._id,
      userId,
      action: "EXPIRED",
      correlationId,
      details: { message: "Referral qualified order placed after expiration window." }
    }).save();

    await rebuildUserStats(referral.referrer);
    return;
  }

  // 3. Validate order threshold
  const minOrder = referral.campaignSnapshot?.minOrder || 199;
  if (orderTotal < minOrder) {
    console.log(`[ReferralService] Order ${orderId} total ${orderTotal} below min ${minOrder}.`);
    return;
  }

  // 4. Transition to QUALIFIED
  referral.status = "QUALIFIED";
  referral.qualifyingOrder = orderId;
  await referral.save();

  await new ReferralAuditLog({
    referralId: referral._id,
    userId,
    action: "QUALIFIED",
    correlationId,
    details: { orderId, orderTotal }
  }).save();

  // 5. Execute Wallet Payout atomically inside dedicated transaction
  try {
    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      // Refetch to prevent race conditions
      const refItem = await Referral.findById(referral._id).session(session);
      if (!refItem || refItem.status !== "QUALIFIED" || refItem.rewardCredited) {
        throw new Error("Referral is already processed or not qualified.");
      }

      const referrerUser = await User.findById(refItem.referrer).session(session);
      const referredUser = await User.findById(refItem.referredUser).session(session);

      if (!referrerUser || !referredUser) {
        throw new Error("Users not found during reward processing.");
      }

      // Unique deterministic idempotency keys
      const rKey = `referral_referrer_${refItem._id.toString()}`;
      const uKey = `referral_referred_${refItem._id.toString()}`;

      // Credit Referrer
      await WalletService.credit(
        referrerUser._id,
        referrerUser.email || "",
        refItem.campaignSnapshot.referrerReward,
        "ADMIN_CREDIT",
        "Refer & Earn Reward",
        { source: "API", actionName: "REFERRAL_CREDIT_REFERRER" },
        rKey,
        session
      );

      // Credit Referred
      await WalletService.credit(
        referredUser._id,
        referredUser.email || "",
        refItem.campaignSnapshot.referredUserReward,
        "ADMIN_CREDIT",
        "Refer & Earn Reward",
        { source: "API", actionName: "REFERRAL_CREDIT_REFERRED" },
        uKey,
        session
      );

      // Save status updates
      refItem.status = "COMPLETED";
      refItem.rewardCredited = true;
      refItem.rewardCreditedAt = new Date();
      await refItem.save(opts);

      referredUser.referralRewardClaimed = true;
      await referredUser.save(opts);

      // Write audit log
      const auditLog = new ReferralAuditLog({
        referralId: refItem._id,
        userId: referredUser._id,
        action: "REWARD_CREDITED",
        correlationId,
        details: { referrerId: referrerUser._id, rewards: refItem.campaignSnapshot }
      });
      await auditLog.save(opts);

      // Sync cached stats
      await rebuildUserStats(referrerUser._id, session);
    });

    // Post-commit asynchronous notification dispatch
    dispatchRewardNotifications(referral.referrer, referral.referredUser, referral.campaignSnapshot).catch(err => {
      console.error("[ReferralService] Notification dispatch error:", err);
    });

  } catch (rewardErr) {
    console.error(`[ReferralService] Reward failed for referral ${referral._id}:`, rewardErr);
    // Write failure audit log
    await new ReferralAuditLog({
      referralId: referral._id,
      userId,
      action: "FAILED_REWARD",
      correlationId,
      details: { error: rewardErr.message }
    }).save().catch(() => {});
  }
}

/**
 * Handles cancelled orders.
 */
async function processOrderCancellation(eventPayload) {
  const { orderId, userId, correlationId } = eventPayload;

  const referral = await Referral.findOne({ referredUser: userId, qualifyingOrder: orderId });
  if (!referral) return;

  // If already completed, rewards were issued. We can mark it cancelled but generally we don't reverse unless required.
  // If QUALIFIED but not completed, revert to PENDING or CANCELLED.
  if (referral.status === "QUALIFIED") {
    referral.status = "CANCELLED";
    await referral.save();

    await new ReferralAuditLog({
      referralId: referral._id,
      userId,
      action: "REWARD_CANCELLED",
      correlationId,
      details: { orderId, reason: "Qualifying order was cancelled before reward completed." }
    }).save();
    
    await rebuildUserStats(referral.referrer);
  }
}

/**
 * Rebuilds cached stats counters for a user based on Referral source-of-truth.
 */
async function rebuildUserStats(userId, session = null) {
  const opts = session ? { session } : {};
  
  const completed = await Referral.countDocuments({ referrer: userId, status: "COMPLETED" }).session(session);
  const pending = await Referral.countDocuments({ referrer: userId, status: "PENDING" }).session(session);
  
  // Aggregate wallet earned
  const rewardSum = await Referral.aggregate([
    { $match: { referrer: new mongoose.Types.ObjectId(userId), status: "COMPLETED" } },
    { $group: { _id: null, totalEarned: { $sum: "$rewardAmountReferrer" } } }
  ]).session(session);

  const walletEarned = (rewardSum.length > 0) ? rewardSum[0].totalEarned : 0;

  const user = await User.findById(userId).session(session);
  if (user) {
    user.successfulReferrals = completed;
    user.pendingReferrals = pending;
    user.referralWalletEarned = walletEarned;
    await user.save(opts);
  }
}

/**
 * Daily Cron Worker / Maintenance Job.
 */
async function runDailyCleanup() {
  console.log("[ReferralService] Running daily referral cleanup worker...");
  const expiredCount = await Referral.updateMany(
    { status: "PENDING", expiresAt: { $lt: new Date() } },
    { $set: { status: "EXPIRED" } }
  );

  console.log(`[ReferralService] Expired ${expiredCount.modifiedCount} overdue pending referrals.`);

  // Find all QUALIFIED but failed completions to retry
  const qualifiedList = await Referral.find({ status: "QUALIFIED" });
  for (const ref of qualifiedList) {
    console.log(`[ReferralService] Retrying rewards for qualified referral: ${ref._id}`);
    await processOrderDelivery({
      orderId: ref.qualifyingOrder,
      userId: ref.referredUser,
      orderTotal: ref.campaignSnapshot.minOrder,
      correlationId: `retry-cron-${ref._id.toString()}-${Date.now()}`
    });
  }

  // Re-sync all users just to be safe
  const activeReferrers = await Referral.distinct("referrer");
  for (const refId of activeReferrers) {
    await rebuildUserStats(refId).catch(err => 
      console.error(`[ReferralService] Stats rebuild failed for user ${refId}:`, err)
    );
  }

  console.log("[ReferralService] Daily cleanup complete.");
}

/**
 * Helper to dispatch invite signup notifications.
 */
async function dispatchPendingNotification(referrerUser, code) {
  try {
    const { sendOrderStatusNotification } = require("./notificationService");
    // Standard mock ordering notification triggers database saves to NotificationHistory
    const NotificationHistory = require("../models/NotificationHistory");
    const historyItem = new NotificationHistory({
      user: referrerUser._id,
      title: "👥 Friend Joined Buyto!",
      body: `Your friend has joined using your code ${code}. Reward will be credited after their first delivered order.`,
      type: "PROMOTIONAL",
      deepLink: "/buycoins/rewards"
    });
    await historyItem.save();
  } catch (err) {
    console.error("[ReferralService] Notification history save failed:", err);
  }
}

/**
 * Helper to dispatch success payout notifications.
 */
async function dispatchRewardNotifications(referrerId, referredId, snapshot) {
  try {
    const NotificationHistory = require("../models/NotificationHistory");
    
    // Notify Referrer
    await new NotificationHistory({
      user: referrerId,
      title: "🎉 Referral Reward Credited!",
      body: `Congratulations! You earned ₹${snapshot.referrerReward} from Refer & Earn.`,
      type: "PROMOTIONAL",
      deepLink: "/buycoins/rewards"
    }).save();

    // Notify Referred
    await new NotificationHistory({
      user: referredId,
      title: "🎉 Welcome Referral Bonus!",
      body: `Congratulations! You earned ₹${snapshot.referredUserReward} wallet credit from using a friend's referral link.`,
      type: "PROMOTIONAL",
      deepLink: "/buycoins/rewards"
    }).save();
  } catch (err) {
    console.error("[ReferralService] Reward notifications history save failed:", err);
  }
}

module.exports = {
  getReferralConfig,
  clearConfigCache,
  linkReferral,
  processOrderDelivery,
  processOrderCancellation,
  rebuildUserStats,
  runDailyCleanup
};
