const { admin, isFirebaseEnabled } = require("../firebase");
const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Send a push notification to a specific user and save it in the database.
 * @param {object} params
 * @param {string} params.userId - Target user database ID.
 * @param {string} params.title - Notification title.
 * @param {string} params.body - Notification body.
 * @param {object} [params.data] - Optional metadata/payload.
 */
async function sendPushNotification({ userId, title, body, data = {} }) {
  try {
    // 1. Save notification in database for Notification Center history
    const notification = new Notification({
      userId,
      title,
      body,
      data
    });
    await notification.save();
    console.log(`[Notification History] Saved notification for user: ${userId}`);

    // 2. Fetch the user's FCM token
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.log(`[Notification FCM] Skipped: No registered FCM token for user ${userId}`);
      return { success: false, reason: "No FCM token registered" };
    }

    // 3. Send via Firebase if configured
    if (!isFirebaseEnabled || !admin) {
      console.log(`[Notification FCM] Simulated push to ${user.email} (token: ${user.fcmToken}): "${title}" - "${body}"`);
      return { success: true, simulated: true };
    }

    const message = {
      token: user.fcmToken,
      notification: {
        title,
        body
      },
      data: Object.keys(data).reduce((acc, k) => {
        // FCM data values must be strings
        acc[k] = typeof data[k] === "object" ? JSON.stringify(data[k]) : String(data[k]);
        return acc;
      }, {})
    };

    const response = await admin.messaging().send(message);
    console.log(`[Notification FCM] Successfully sent FCM push: ${response}`);
    return { success: true, messageId: response };

  } catch (error) {
    console.error("Error sending push notification:", error);
    
    // Auto-remove invalid token if FCM tells us it's bad
    if (error.code === "messaging/invalid-argument" || error.code === "messaging/registration-token-not-registered") {
      try {
        await User.findByIdAndUpdate(userId, { fcmToken: null });
        console.log(`[Notification FCM] Cleaned up invalid/expired token for user: ${userId}`);
      } catch (cleanErr) {
        console.error("Failed to clean up invalid token:", cleanErr);
      }
    }
    return { success: false, error: error.message };
  }
}

/**
 * Trigger notifications based on order status updates.
 * @param {object} order - Mongoose order document.
 * @param {string} status - The updated order status.
 */
async function sendOrderStatusNotification(order, status) {
  if (!order || !order.userId) return;

  let title = "";
  let body = "";

  switch (status) {
    case "Order Placed":
      title = "Order Confirmed 🛒";
      body = "Your Buyto order has been received and confirmed.";
      break;
    case "Order Packed":
      title = "Order Prepared 📦";
      body = "Your order has been packed and is ready to go.";
      break;
    case "Out for Delivery":
      title = "Out for Delivery 🛵";
      body = "Your Buyto rider is on the way with your order!";
      break;
    case "Delivered":
      title = "Delivered 🎉";
      body = "Your order has been delivered successfully. Thank you for shopping with Buyto!";
      break;
    default:
      // Skip status updates that don't need notification (like Pending or Cancelled unless custom)
      return;
  }

  return sendPushNotification({
    userId: order.userId,
    title,
    body,
    data: {
      type: "ORDER",
      orderId: String(order._id)
    }
  });
}

/**
 * Broadcast promotional notifications to a target audience group.
 * @param {object} params
 * @param {string} params.target - Audience group ("all", "saved-products", "role").
 * @param {string} params.title - Notification title.
 * @param {string} params.body - Notification body.
 * @param {object} [params.data] - Additional deep link payload.
 */
async function sendBroadcastNotification({ target, title, body, data = {} }) {
  try {
    let query = {};
    if (target === "saved-products") {
      query = { savedProducts: { $exists: true, $not: { $size: 0 } } };
    } else if (target === "rider") {
      query = { role: "rider" };
    } else if (target === "admin") {
      query = { role: "admin" };
    } else {
      query = { role: "user" }; // Default to all normal customers
    }

    const users = await User.find(query);
    console.log(`[Broadcast] Sending push notifications to ${users.length} target users.`);

    let successCount = 0;
    for (const user of users) {
      const result = await sendPushNotification({
        userId: user._id,
        title,
        body,
        data: {
          ...data,
          type: "PROMO"
        }
      });
      if (result.success) successCount++;
    }

    return { success: true, count: successCount };
  } catch (error) {
    console.error("Broadcast notification error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendOrderStatusNotification,
  sendBroadcastNotification
};
