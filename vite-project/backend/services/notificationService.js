const { admin, isFirebaseEnabled } = require("../config/firebase");
const User = require("../models/User");
const Notification = require("../models/Notification");
const NotificationHistory = require("../models/NotificationHistory");

/**
 * Remove an invalid/expired token from all users.
 */
async function removeInvalidToken(token) {
  try {
    await User.updateMany(
      { $or: [{ fcmTokens: token }, { fcmToken: token }] },
      {
        $pull: { fcmTokens: token },
        $set: { fcmToken: null }
      }
    );
    console.log(`[Notification FCM] Cleaned up invalid token: ${token}`);
  } catch (err) {
    console.error(`[Notification FCM] Error removing invalid token: ${err.message}`);
  }
}

/**
 * Sends a push notification to a list of tokens.
 */
async function sendPushNotification(fcmTokens, title, body, data = {}, image = null) {
  try {
    // Normalize to unique list of non-empty strings
    let tokens = [];
    if (Array.isArray(fcmTokens)) {
      tokens = [...new Set(fcmTokens.filter(t => typeof t === "string" && t.trim() !== ""))];
    } else if (typeof fcmTokens === "string" && fcmTokens.trim() !== "") {
      tokens = [fcmTokens];
    }

    if (tokens.length === 0) {
      return { success: false, reason: "No tokens provided" };
    }

    // 1. Simulated push mode if Firebase not initialized
    if (!isFirebaseEnabled || !admin) {
      console.log(`[Simulation Push] Title: "${title}", Body: "${body}", Image: ${image}, Tokens Count: ${tokens.length}`);
      console.log(`[Simulation Payload] Data:`, data);
      return { success: true, simulated: true, responses: tokens.map(() => ({ success: true })) };
    }

    // 2. Format multicast message
    const message = {
      tokens,
      notification: {
        title,
        body,
        ...(image && { imageUrl: image })
      },
      data: Object.keys(data || {}).reduce((acc, k) => {
        acc[k] = typeof data[k] === "object" ? JSON.stringify(data[k]) : String(data[k]);
        return acc;
      }, {}),
      android: {
        notification: {
          sound: "default",
          priority: "high",
          imageUrl: image || undefined,
          icon: "ic_stat_name" // default Buyto app icon name
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

    // 3. Dispatch multicast message
    const batchResponse = await admin.messaging().sendEachForMulticast(message);
    console.log(`[Notification FCM] Sent: ${batchResponse.successCount} success, ${batchResponse.failureCount} failure.`);

    // 4. Handle token failures (e.g., remove unregistered/expired tokens)
    if (batchResponse.failureCount > 0) {
      batchResponse.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          const badToken = tokens[idx];
          if (
            errCode === "messaging/invalid-argument" ||
            errCode === "messaging/registration-token-not-registered"
          ) {
            removeInvalidToken(badToken);
          }
        }
      });
    }

    return {
      success: true,
      successCount: batchResponse.successCount,
      failureCount: batchResponse.failureCount,
      responses: batchResponse.responses
    };
  } catch (error) {
    console.error("Error sending multicast notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends order-related status notifications.
 */
async function sendOrderNotification(order, status) {
  if (!order || !order.userId) return;

  try {
    const user = await User.findById(order.userId);
    if (!user) return;

    // Check order updates preferences
    if (user.notificationPreferences && user.notificationPreferences.orderUpdates === false) {
      console.log(`[Notification FCM] Skipped: Order updates disabled for user ${user.email}`);
      return;
    }

    let title = "";
    let body = "";
    const orderIdStr = String(order._id);

    // Map order status to specific titles and bodies
    switch (status) {
      case "Order Placed":
      case "Confirmed":
        title = "🛒 Order Confirmed";
        body = `Your order #${orderIdStr} has been confirmed.`;
        break;
      case "Preparing":
      case "Packed":
        title = "📦 Order Packed";
        body = "Your order is packed and ready for pickup.";
        break;
      case "Rider Assigned":
        title = "🛵 Rider Assigned";
        body = `${order.riderName || "A rider"} has been assigned to your order.`;
        break;
      case "Out for Delivery":
      case "Out For Delivery":
        title = "🛵 Order Out for Delivery";
        body = "Your order is on the way and will arrive soon.";
        break;
      case "Delivered":
        title = "✅ Order Delivered";
        body = "Your Buyto order has been delivered successfully.";
        break;
      default:
        return; // Skip other untracked statuses
    }

    const deepLink = `/orders/${orderIdStr}`;
    const data = {
      type: "ORDER",
      orderId: orderIdStr,
      deepLink,
      actions: JSON.stringify([
        { id: "track", title: "Track Order", action: deepLink },
        { id: "open", title: "Open App", action: deepLink }
      ])
    };

    // Gather all tokens (support both fcmTokens array and legacy fcmToken)
    let tokens = [...(user.fcmTokens || [])];
    if (user.fcmToken && !tokens.includes(user.fcmToken)) {
      tokens.push(user.fcmToken);
    }

    // Persist to NotificationHistory collection
    const historyItem = new NotificationHistory({
      user: user._id,
      title,
      body,
      type: "ORDER",
      deepLink
    });
    await historyItem.save();

    // Send push
    return await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error("Error dispatching order notification:", error);
  }
}

/**
 * Sends a cart reminder notification to a customer.
 */
async function sendCartReminder(user) {
  if (!user) return;

  try {
    // Check cart reminder preferences
    if (user.notificationPreferences && user.notificationPreferences.cartReminders === false) {
      console.log(`[Notification FCM] Skipped: Cart reminders disabled for user ${user.email}`);
      return;
    }

    const title = "🛒 Complete Your Order";
    const body = "You left items in your cart. Complete your order now.";
    const deepLink = "/cart";

    const data = {
      type: "CART",
      deepLink
    };

    let tokens = [...(user.fcmTokens || [])];
    if (user.fcmToken && !tokens.includes(user.fcmToken)) {
      tokens.push(user.fcmToken);
    }

    // Persist notification
    const historyItem = new NotificationHistory({
      user: user._id,
      title,
      body,
      type: "CART",
      deepLink
    });
    await historyItem.save();

    return await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error("Error sending cart reminder:", error);
  }
}

/**
 * Handles bulk notifications chunking.
 */
async function sendBulkNotification(tokens, title, body, data = {}, image = null) {
  const chunkSize = 500;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    const result = await sendPushNotification(chunk, title, body, data, image);
    if (result.success) {
      successCount += result.successCount || 0;
      failureCount += result.failureCount || 0;
    }
  }

  return { success: true, successCount, failureCount };
}

/**
 * Broadcasts or targeted promotional notifications.
 */
async function sendPromotionalNotification({ title, body, image, target, selectedEmails, createdBy }) {
  try {
    let users = [];
    if (target === "selected") {
      let emailsList = [];
      if (Array.isArray(selectedEmails)) {
        emailsList = selectedEmails;
      } else if (typeof selectedEmails === "string") {
        emailsList = selectedEmails.split(",").map(e => e.trim().toLowerCase());
      }
      users = await User.find({
        email: { $in: emailsList },
        "notificationPreferences.promotions": { $ne: false }
      });
    } else {
      // Send to all normal users
      users = await User.find({
        role: { $in: ["user", "customer"] },
        "notificationPreferences.promotions": { $ne: false }
      });
    }

    const allTokens = [];
    const userIds = [];

    users.forEach(u => {
      userIds.push(u._id);
      if (u.fcmTokens && u.fcmTokens.length > 0) {
        allTokens.push(...u.fcmTokens);
      } else if (u.fcmToken) {
        allTokens.push(u.fcmToken);
      }
    });

    const deepLink = "/offers";
    const data = {
      type: "PROMO",
      deepLink,
      actions: JSON.stringify([
        { id: "shop", title: "Shop Now", action: deepLink }
      ])
    };

    // Save individual user inbox history logs
    const historyPromises = users.map(u => {
      const historyItem = new NotificationHistory({
        user: u._id,
        title,
        body,
        type: "PROMO",
        image,
        deepLink
      });
      return historyItem.save();
    });
    await Promise.all(historyPromises);

    // Save a master record of the campaign to the Notification collection
    const campaignLog = new Notification({
      title,
      body,
      image,
      type: "PROMO",
      recipients: target === "all" ? "all" : userIds,
      sentAt: new Date(),
      status: allTokens.length > 0 ? "sent" : "no_devices",
      createdBy: createdBy || null
    });
    await campaignLog.save();

    // Send push in bulk chunks
    const result = await sendBulkNotification(allTokens, title, body, data, image);
    return {
      success: true,
      recipientsCount: users.length,
      successCount: result.successCount,
      failureCount: result.failureCount
    };
  } catch (error) {
    console.error("Promotional notification broadcast failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendOrderNotification,
  sendPromotionalNotification,
  sendCartReminder,
  sendBulkNotification,
  // Alias for backward compatibility
  sendOrderStatusNotification: sendOrderNotification,
  sendBroadcastNotification: async (params) => {
    // Map properties from the legacy broadcast method if any
    return await sendPromotionalNotification({
      title: params.title,
      body: params.body,
      target: params.target === "all" ? "all" : "selected",
      createdBy: null
    });
  }
};
