const { admin } = require("../config/firebase");
const AdminDeviceToken = require("../models/AdminDeviceToken");

exports.sendNewOrderNotification = async (order) => {
  try {
    const adminUser = await AdminDeviceToken.findOne({
      phone: "**",
    });

    if (!adminUser || !adminUser.fcmTokens || adminUser.fcmTokens.length === 0) {
      console.log("[AdminNotification] No registered admin FCM tokens found for **");
      return;
    }

    const customerName = order.user?.name || "A customer";
    const amount = order.totalAmount;

    console.log(`[AdminNotification] Sending new order notification to admin for order ${order._id}`);

    await admin.messaging().sendEachForMulticast({
      tokens: adminUser.fcmTokens,
      notification: {
        title: "🛒 New Order Received",
        body: `${customerName} placed an order worth ₹${amount}`,
      },
      data: {
        type: "NEW_ORDER",
        orderId: order._id.toString(),
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });
    console.log("[AdminNotification] Push notification sent successfully");
  } catch (error) {
    console.error("[AdminNotification] Error sending push notification:", error);
  }
};
