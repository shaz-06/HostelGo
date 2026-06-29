const { sendPushNotification } = require("./notificationService");
const User = require("../models/User");

/**
 * Sends a push notification to all admins for a new order.
 * @param {Object} order - The created order document.
 */
async function sendAdminNotification(order) {
  if (!order) return;

  try {
    // Find all admins
    const admins = await User.find({ role: "admin" });
    if (!admins || admins.length === 0) {
      console.log("[FCM Service] No admins found to notify.");
      return;
    }

    // Get order details
    const orderIdStr = String(order._id);
    const orderShortId = "BT" + orderIdStr.slice(-6).toUpperCase();
    const amount = order.totalAmount;
    const itemCount = order.products ? order.products.reduce((sum, p) => sum + p.quantity, 0) : 0;
    const customerName = order.user ? order.user.name : "Customer";

    const title = "🛒 New Buyto Order";
    const body = `${orderShortId} • ₹${amount}\n${itemCount} Items\n${customerName}`;

    // Collect tokens for admins who have newOrderAlerts enabled (defaults to true)
    const adminTokens = [];
    admins.forEach(admin => {
      const prefs = admin.notificationPreferences || {};
      if (prefs.newOrderAlerts !== false) {
        if (Array.isArray(admin.fcmTokens)) {
          admin.fcmTokens.forEach(t => {
            const tokenStr = (t && typeof t === "object") ? t.token : t;
            if (tokenStr) adminTokens.push(tokenStr);
          });
        }
        if (admin.fcmToken && !adminTokens.includes(admin.fcmToken)) {
          adminTokens.push(admin.fcmToken);
        }
      }
    });

    if (adminTokens.length === 0) {
      console.log("[FCM Service] No admins with active tokens/preferences for order alerts.");
      return;
    }

    const data = {
      type: "NEW_ORDER",
      orderId: orderIdStr,
      deepLink: "/admin/orders"
    };

    console.log(`[FCM Service] Sending new order push to ${adminTokens.length} tokens: ${title}`);
    await sendPushNotification(adminTokens, title, body, data);
  } catch (error) {
    console.error("[FCM Service] Error sending admin notification:", error);
  }
}

/**
 * Sends a push notification to a specific user.
 * @param {String} userId - The user ID.
 * @param {String} title - The notification title.
 * @param {String} body - The notification body.
 * @param {Object} data - Optional extra data payload.
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
      console.log(`[FCM Service] User ${userId} has no FCM tokens.`);
      return;
    }

    await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error("[FCM Service] Error sending user notification:", error);
  }
}

module.exports = {
  sendAdminNotification,
  sendUserNotification
};
