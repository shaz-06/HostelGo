const Order = require("../models/Order");
const { sendAdminNotification } = require("./fcmService");

let reconcilerInterval = null;

function startReconciler() {
  if (reconcilerInterval) return;

  console.log("[Reconciler] Starting production-grade notification outbox reconciler daemon...");
  reconcilerInterval = setInterval(async () => {
    try {
      // Find orders that are pending, excluding ones currently processing or already sent
      const pendingOrders = await Order.find({
        adminNotificationStatus: "pending",
        adminNotificationRetries: { $lt: 5 }
      }).limit(20);

      if (pendingOrders.length > 0) {
        console.log(`[Reconciler] Outbox reconciling ${pendingOrders.length} pending order notifications...`);
      }

      for (const order of pendingOrders) {
        // Send order notification using standard sendAdminNotification (which handles locks, retries and success)
        await sendAdminNotification(order);
      }
    } catch (error) {
      console.error("[Reconciler Error] Execution loop encountered an error:", error.message);
    }
  }, 15000); // 15 seconds
}

function stopReconciler() {
  if (reconcilerInterval) {
    clearInterval(reconcilerInterval);
    reconcilerInterval = null;
    console.log("[Reconciler] Notification outbox reconciler stopped.");
  }
}

module.exports = {
  startReconciler,
  stopReconciler
};
