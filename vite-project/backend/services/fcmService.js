const { admin } = require("../config/firebase");
const User = require("../models/User");
const Order = require("../models/Order");

/**
 * Sends a push notification to all admins for a new order.
 * Implements idempotency, distributed locking, and invalid token pruning.
 * @param {Object} order - The created order document.
 */
async function sendAdminNotification(order) {
  if (!order) return;

  // Idempotency: skip if already sent
  if (order.adminNotificationStatus === "sent" || order.adminNotificationSentAt) {
    return;
  }

  // Acquire Lock: Atomically set status to "processing" to avoid double runs on concurrent servers
  const lockedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      adminNotificationStatus: { $in: ["pending", "failed"] }
    },
    {
      $set: {
        adminNotificationStatus: "processing",
        adminNotificationLastAttemptAt: new Date()
      }
    },
    { new: true }
  );

  if (!lockedOrder) {
    console.log(`[FCM Admin] Order ${order._id} already processing or completed. Skipping.`);
    return;
  }

  try {
    // 1. Fetch all admins
    const admins = await User.find({ role: "admin" });
    if (!admins || admins.length === 0) {
      console.log("[FCM Admin] No admin users found in DB.");
      lockedOrder.adminNotificationStatus = "pending";
      await lockedOrder.save();
      return;
    }

    // 2. Gather active tokens
    const adminTokens = [];
    const tokenToUserMap = {}; // mapping to remove invalid tokens

    admins.forEach(adminUser => {
      const prefs = adminUser.notificationPreferences || {};
      if (prefs.newOrderAlerts !== false) {
        if (Array.isArray(adminUser.fcmTokens)) {
          adminUser.fcmTokens.forEach(t => {
            const tokenStr = (t && typeof t === "object") ? t.token : t;
            if (tokenStr && !adminTokens.includes(tokenStr)) {
              adminTokens.push(tokenStr);
              tokenToUserMap[tokenStr] = adminUser;
            }
          });
        }
        if (adminUser.fcmToken && !adminTokens.includes(adminUser.fcmToken)) {
          adminTokens.push(adminUser.fcmToken);
          tokenToUserMap[adminUser.fcmToken] = adminUser;
        }
      }
    });

    if (adminTokens.length === 0) {
      console.log("[FCM Admin] No admins have valid FCM tokens registered.");
      lockedOrder.adminNotificationStatus = "sent"; // prevent endless retries
      await lockedOrder.save();
      return;
    }

    // 3. Format message payload
    const orderShortId = "BT" + String(order._id).slice(-6).toUpperCase();
    const title = "🚨 New Order Received!";
    const body = `Order #${orderShortId} • ₹${order.totalAmount}`;

    const message = {
      tokens: adminTokens,
      notification: {
        title,
        body
      },
      data: {
        type: "new_order",
        orderId: String(order._id)
      },
      android: {
        priority: "high",
        notification: {
          channelId: "orders",
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default"
          }
        }
      }
    };

    // 4. Send multicast notification
    const batchResponse = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM Admin] Sent: ${batchResponse.successCount} success, ${batchResponse.failureCount} failure.`);

    // 5. Handle invalid/expired tokens returned by FCM
    let messageId = null;
    const invalidTokens = [];

    batchResponse.responses.forEach((resp, idx) => {
      if (resp.success) {
        if (!messageId) messageId = resp.messageId;
      } else {
        const errCode = resp.error?.code;
        const badToken = adminTokens[idx];
        if (
          errCode === "messaging/invalid-argument" ||
          errCode === "messaging/registration-token-not-registered" ||
          resp.error?.message?.includes("not registered")
        ) {
          invalidTokens.push(badToken);
        }
      }
    });

    // Remove invalid tokens
    if (invalidTokens.length > 0) {
      for (const token of invalidTokens) {
        const adminUser = tokenToUserMap[token];
        if (adminUser) {
          adminUser.fcmTokens = adminUser.fcmTokens.filter(t => {
            const tVal = (t && typeof t === "object") ? t.token : t;
            return tVal !== token;
          });
          if (adminUser.fcmToken === token) {
            adminUser.fcmToken = null;
          }
          await adminUser.save();
          console.log(`[FCM Admin] Pruned invalid token for user ${adminUser.email}`);
        }
      }
    }

    // 6. Complete Outbox: mark as sent
    lockedOrder.adminNotificationStatus = "sent";
    lockedOrder.adminNotificationSentAt = new Date();
    if (messageId) {
      lockedOrder.adminNotificationMessageId = messageId;
    }
    await lockedOrder.save();

  } catch (error) {
    console.error("[FCM Admin] Error processing order notification outbox:", error);
    
    // Fallback: Revert lock state, increment retry counters
    lockedOrder.adminNotificationRetries = (lockedOrder.adminNotificationRetries || 0) + 1;
    if (lockedOrder.adminNotificationRetries >= 5) {
      lockedOrder.adminNotificationStatus = "failed";
    } else {
      lockedOrder.adminNotificationStatus = "pending";
    }
    await lockedOrder.save();
  }
}

/**
 * Sends a push notification to a specific user.
 */
async function sendUserNotification(userId, title, body, data = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const tokens = [];
    if (Array.isArray(user.fcmTokens)) {
      user.fcmTokens.forEach(t => {
        const tokenStr = (t && typeof t === "object") ? t.token : t;
        if (tokenStr) tokens.push(tokenStr);
      });
    }
    if (user.fcmToken && !tokens.includes(user.fcmToken)) {
      tokens.push(user.fcmToken);
    }

    if (tokens.length === 0) {
      console.log(`[FCM User] User ${userId} has no FCM tokens.`);
      return;
    }

    const { sendPushNotification } = require("./notificationService");
    await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error("[FCM User] Error sending user notification:", error);
  }
}

module.exports = {
  sendAdminNotification,
  sendUserNotification
};
