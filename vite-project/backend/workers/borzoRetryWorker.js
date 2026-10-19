const mongoose = require("mongoose");
const Order = require("../models/Order");
const { createBorzoOrder } = require("../utils/borzo");

async function retryPendingBorzoDispatches() {
  try {
    // Find one order that needs dispatching
    const orderToDispatch = await Order.findOne({
      borzoDeliveryStatus: "pending_dispatch",
      $or: [{ paymentStatus: "Paid" }, { paymentMethod: "cod" }],
      orderStatus: "Order Placed"
    });

    if (!orderToDispatch) return;

    // Atomically claim the dispatch task
    const claimedOrder = await Order.findOneAndUpdate(
      { _id: orderToDispatch._id, borzoDeliveryStatus: "pending_dispatch" },
      { $set: { borzoDeliveryStatus: "dispatching" } },
      { new: true }
    );

    if (!claimedOrder) {
      console.log(\`[BorzoRetryWorker] Order \${orderToDispatch._id} was already claimed by another worker.\`);
      return;
    }

    console.log(\`[BorzoRetryWorker] Attempting to dispatch Order \${claimedOrder._id} to Borzo...\`);

    const borzoResult = await createBorzoOrder(claimedOrder);
    if (borzoResult && borzoResult.borzoOrderId) {
      claimedOrder.borzoOrderId = borzoResult.borzoOrderId;
      claimedOrder.borzoTrackingUrl = borzoResult.trackingUrl;
      claimedOrder.borzoDeliveryCost = borzoResult.deliveryCost;
      claimedOrder.borzoDeliveryStatus = "new";
      await claimedOrder.save();
      console.log(\`[BorzoRetryWorker] Borzo order created successfully: \${borzoResult.borzoOrderId}\`);
    } else {
      console.error("[BorzoRetryWorker] Borzo dispatch failed again. Reverting to pending_dispatch.");
      claimedOrder.borzoDeliveryStatus = "pending_dispatch";
      await claimedOrder.save();
    }
  } catch (error) {
    console.error("[BorzoRetryWorker] Exception in retry loop:", error.message);
  }
}

let retryInterval;

function startBorzoRetryWorker(intervalMs = 60000) {
  console.log("[BorzoRetryWorker] Starting worker...");
  retryInterval = setInterval(retryPendingBorzoDispatches, intervalMs);
}

function stopBorzoRetryWorker() {
  if (retryInterval) {
    clearInterval(retryInterval);
    console.log("[BorzoRetryWorker] Worker stopped.");
  }
}

module.exports = { startBorzoRetryWorker, stopBorzoRetryWorker };
