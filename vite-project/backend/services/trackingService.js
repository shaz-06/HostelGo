const Order = require("../models/Order");
const { generateRoute, getDistance } = require("./routeGenerator");
const { calculateTrackingState } = require("./movementEngine");
const { getSimulatedRider } = require("./riderSimulator");
const cron = require("node-cron");

class TrackingService {
  constructor() {
    this.activeSessions = new Map(); // orderId -> { intervalId }
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
    console.log("[TrackingService] Socket.IO instance attached.");
  }

  /**
   * Starts a tracking session for the given order. Idempotent.
   */
  async startSession(orderId) {
    const orderIdStr = String(orderId);
    console.log(`[TrackingService] Starting session for order: ${orderIdStr}`);

    if (this.activeSessions.has(orderIdStr)) {
      console.log(`[TrackingService] Session already active for order: ${orderIdStr}`);
      return this.activeSessions.get(orderIdStr);
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        console.error(`[TrackingService] Order not found for session start: ${orderIdStr}`);
        return null;
      }

      // Store coordinates loaded from config/env
      const storeLat = parseFloat(process.env.STORE_LAT) || 13.0835363;
      const storeLng = parseFloat(process.env.STORE_LNG) || 77.6403678;

      // Customer coordinates fallback
      const customerLat = order.deliveryLatitude || (storeLat + 0.0055);
      const customerLng = order.deliveryLongitude || (storeLng + 0.0055);

      if (!order.deliveryLatitude || !order.deliveryLongitude) {
        console.warn(`[TrackingService] Missing customer coordinates for order ${orderIdStr}. Defaulting near store.`);
        order.deliveryLatitude = customerLat;
        order.deliveryLongitude = customerLng;
      }

      // Calculate distance and duration
      const dist = getDistance(storeLat, storeLng, customerLat, customerLng);
      const etaMinutes = Math.round(8 + dist * 2);

      // Generate simulated route once
      const route = generateRoute(storeLat, storeLng, customerLat, customerLng);

      // Save to Database
      order.simulatedRoute = route;
      order.trackingSessionActive = true;
      order.orderStatus = "Rider Assigned";
      order.statusTimestamps = order.statusTimestamps || {};
      order.statusTimestamps.riderAssigned = new Date();
      order.estimatedArrivalMinutes = etaMinutes;
      order.estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);

      await order.save();

      // Start the Socket.IO broadcasting loop
      this._startBroadcastTimer(orderIdStr, order.statusTimestamps.riderAssigned, order.estimatedDeliveryTime, route);

      console.log(`[TrackingService] Session successfully started for order: ${orderIdStr} (ETA: ${etaMinutes} mins)`);
    } catch (err) {
      console.error(`[TrackingService] Error starting session for order: ${orderIdStr}`, err);
    }
  }

  /**
   * Stops and cleans up the tracking session registry entry.
   */
  stopSession(orderId) {
    const orderIdStr = String(orderId);
    const session = this.activeSessions.get(orderIdStr);
    if (session) {
      clearInterval(session.intervalId);
      this.activeSessions.delete(orderIdStr);
      console.log(`[TrackingService] Session stopped and cleared for order: ${orderIdStr}`);
    }
  }

  /**
   * Calculates current state of order tracking for API & Socket.IO.
   */
  async getTrackingState(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) return null;

      const Product = require("../models/Product");
      const populatedProducts = await Promise.all(order.products.map(async (item) => {
        const prod = await Product.findOne({ id: item.productId });
        return {
          ...item.toObject ? item.toObject() : item,
          image: prod ? prod.image : "https://images.unsplash.com/photo-1542838132-92c53300491e"
        };
      }));

      const orderObj = order.toObject ? order.toObject() : order;
      orderObj.products = populatedProducts;

      const rider = getSimulatedRider(orderId);

      if (order.trackingSessionActive && order.simulatedRoute && order.simulatedRoute.length > 0) {
        const state = calculateTrackingState(
          order.statusTimestamps.riderAssigned || order.createdAt,
          order.estimatedDeliveryTime,
          order.simulatedRoute
        );

        return {
          order: orderObj,
          rider,
          tracking: {
            version: 1,
            progress: state.progress,
            etaMinutes: state.etaMinutes,
            estimatedArrival: state.estimatedArrival,
            stage: state.stage,
            currentLocation: state.currentLocation,
            bearing: state.currentLocation.bearing,
            route: order.simulatedRoute,
            lastUpdated: new Date().toISOString(),
            isSimulated: true
          }
        };
      }

      // Default fallback when tracking is inactive (e.g. Delivered or Placed)
      const minutes = order.orderStatus === "Delivered" ? 0 : Math.max(0, Math.ceil((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000));
      return {
        order: orderObj,
        rider: order.orderStatus === "Delivered" || order.trackingSessionActive ? rider : null,
        tracking: {
          version: 1,
          progress: order.orderStatus === "Delivered" ? 100 : 0,
          etaMinutes: minutes,
          estimatedArrival: order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toISOString() : new Date().toISOString(),
          stage: order.orderStatus,
          currentLocation: null,
          bearing: 0,
          route: order.simulatedRoute || [],
          lastUpdated: new Date().toISOString(),
          isSimulated: true
        }
      };
    } catch (err) {
      console.error(`[TrackingService] Error getting tracking state for order ${orderId}:`, err);
      return null;
    }
  }

  /**
   * Resumes active sessions on server startup (crash / restart recovery).
   */
  async resumeActiveSessions() {
    console.log("[TrackingService] Resuming active tracking sessions...");
    try {
      const activeOrders = await Order.find({ trackingSessionActive: true });
      console.log(`[TrackingService] Found ${activeOrders.length} active sessions to resume.`);

      for (const order of activeOrders) {
        const orderIdStr = String(order._id);
        const start = order.statusTimestamps.riderAssigned || order.createdAt;
        const end = order.estimatedDeliveryTime;
        const route = order.simulatedRoute;

        if (Date.now() >= new Date(end).getTime()) {
          console.log(`[TrackingService] Order ${orderIdStr} expired while offline. Marking as Delivered.`);
          await this._completeOrderDelivery(order);
        } else {
          this._startBroadcastTimer(orderIdStr, start, end, route);
          console.log(`[TrackingService] Resumed broadcast for order ${orderIdStr}`);
        }
      }
    } catch (err) {
      console.error("[TrackingService] Error resuming active sessions:", err);
    }
  }

  /**
   * Periodically check for completed tracking sessions (cron job).
   */
  initTrackingCron() {
    console.log("[TrackingService] Initializing delivery completion cron scheduler (runs every 30s)...");
    cron.schedule("*/30 * * * * *", async () => {
      try {
        const expiredOrders = await Order.find({
          trackingSessionActive: true,
          estimatedDeliveryTime: { $lte: new Date() }
        });

        if (expiredOrders.length > 0) {
          console.log(`[TrackingService Cron] Found ${expiredOrders.length} expired delivery sessions to complete.`);
          for (const order of expiredOrders) {
            await this._completeOrderDelivery(order);
          }
        }
      } catch (err) {
        console.error("[TrackingService Cron] Error in execution:", err);
      }
    });
  }

  /**
   * Internal helper to start the broadcast interval.
   */
  _startBroadcastTimer(orderIdStr, start, end, route) {
    this.stopSession(orderIdStr);

    const intervalId = setInterval(async () => {
      try {
        const state = calculateTrackingState(start, end, route);
        if (this.io) {
          this.io.to(`order:${orderIdStr}`).emit("tracking:update", {
            orderId: orderIdStr,
            tracking: {
              version: 1,
              progress: state.progress,
              etaMinutes: state.etaMinutes,
              estimatedArrival: state.estimatedArrival,
              stage: state.stage,
              currentLocation: state.currentLocation,
              bearing: state.currentLocation.bearing,
              lastUpdated: new Date().toISOString(),
              isSimulated: true
            }
          });
        }
      } catch (err) {
        console.error(`[TrackingService Timer] Error broadcasting order ${orderIdStr}:`, err);
      }
    }, 2000);

    this.activeSessions.set(orderIdStr, { intervalId });
  }

  /**
   * Internal helper to finalize order delivery, save state, and run rewards.
   */
  async _completeOrderDelivery(order) {
    const orderIdStr = String(order._id);
    this.stopSession(orderIdStr);

    try {
      order.orderStatus = "Delivered";
      order.trackingSessionActive = false;
      order.deliveredAt = order.deliveredAt || new Date();
      order.estimatedArrivalMinutes = 0;
      order.estimatedDeliveryTime = new Date();
      order.statusTimestamps = order.statusTimestamps || {};
      order.statusTimestamps.delivered = new Date();

      try {
        const { handleOrderCheckoutRewards } = require("../utils/rewards");
        await handleOrderCheckoutRewards(order);
      } catch (rewardErr) {
        console.error(`[TrackingService] Failed to credit BuyCoins for order ${orderIdStr}:`, rewardErr);
      }

      await order.save();
      console.log(`[TrackingService] Order ${orderIdStr} marked as Delivered in database. Session completed.`);

      if (this.io) {
        this.io.to(`order:${orderIdStr}`).emit("tracking:update", {
          orderId: orderIdStr,
          tracking: {
            version: 1,
            progress: 100,
            etaMinutes: 0,
            estimatedArrival: new Date().toISOString(),
            stage: "Delivered",
            currentLocation: order.simulatedRoute && order.simulatedRoute.length > 0 ? {
              ...order.simulatedRoute[order.simulatedRoute.length - 1],
              bearing: 0
            } : null,
            bearing: 0,
            lastUpdated: new Date().toISOString(),
            isSimulated: true
          }
        });

        try {
          const { sendOrderStatusNotification } = require("../services/notificationService");
          await sendOrderStatusNotification(order, "Delivered");
        } catch (notifErr) {
          console.error(`[TrackingService] Failed to send status notification for order ${orderIdStr}:`, notifErr.message);
        }
      }
    } catch (err) {
      console.error(`[TrackingService] Error completing delivery for order ${orderIdStr}:`, err);
    }
  }
}

module.exports = new TrackingService();
