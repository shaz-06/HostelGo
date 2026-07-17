const Order = require("../models/Order");
const { generateRoute, getDistance } = require("./routeGenerator");
const { calculateTrackingState } = require("./movementEngine");
const { getSimulatedRider } = require("./riderSimulator");
const cron = require("node-cron");

class TrackingService {
  constructor() {
    this.activeSessions = new Map(); // orderId -> { intervalId, version }
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

      const storeLat = order.fulfillmentStore?.latitude || 13.0835363;
      const storeLng = order.fulfillmentStore?.longitude || 77.6403678;

      const customerLat = order.deliveryLatitude || (storeLat + 0.0055);
      const customerLng = order.deliveryLongitude || (storeLng + 0.0055);

      if (!order.deliveryLatitude || !order.deliveryLongitude) {
        order.deliveryLatitude = customerLat;
        order.deliveryLongitude = customerLng;
      }

      const dist = getDistance(storeLat, storeLng, customerLat, customerLng);
      const etaMinutes = Math.round(8 + dist * 2);
      const route = generateRoute(storeLat, storeLng, customerLat, customerLng);

      // Increment version
      const currentVersion = (order.trackingVersion || 0) + 1;

      order.simulatedRoute = route;
      order.trackingSessionActive = true;
      order.orderStatus = "Rider Assigned";
      order.trackingVersion = currentVersion;
      order.statusTimestamps = order.statusTimestamps || {};
      order.statusTimestamps.riderAssigned = new Date();
      order.estimatedArrivalMinutes = etaMinutes;
      order.estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);

      await order.save();

      // Initialize local session state
      this.activeSessions.set(orderIdStr, { version: currentVersion, intervalId: null });

      // Start the Socket.IO broadcasting loop
      this._startBroadcastTimer(orderIdStr, order.statusTimestamps.riderAssigned, order.estimatedDeliveryTime, route, currentVersion);

      // Immediately broadcast statusUpdated & riderAssigned
      this.emitStatusUpdated(orderIdStr, order, currentVersion);
      this.emitRiderAssigned(orderIdStr, currentVersion);

      console.log(`[TrackingService] Session successfully started for order: ${orderIdStr} (ETA: ${etaMinutes} mins)`);
    } catch (err) {
      console.error(`[TrackingService] Error starting session for order: ${orderIdStr}`, err);
    }
  }

  /**
   * Emits the complete status update payload.
   */
  emitStatusUpdated(orderIdStr, order, version) {
    if (!this.io) return;
    console.log("[SOCKET] Emitting order:statusUpdated", {
      orderId: orderIdStr,
      status: order.orderStatus
    });
    const rider = getSimulatedRider(orderIdStr);
    const tracking = {
      version,
      progress: order.orderStatus === "Delivered" ? 100 : 0,
      etaMinutes: order.estimatedArrivalMinutes || 0,
      estimatedArrival: order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toISOString() : new Date().toISOString(),
      stage: order.orderStatus,
      currentLocation: null,
      bearing: 0,
      route: order.simulatedRoute || [],
      lastUpdated: new Date().toISOString(),
      isSimulated: true
    };

    const payload = {
      type: "status",
      orderId: orderIdStr,
      status: order.orderStatus,
      eta: order.estimatedArrivalMinutes,
      rider: {
        riderName: rider.name,
        riderPhoto: rider.profileImage,
        phone: rider.phone,
        rating: rider.rating,
        vehicle: rider.vehicleType,
        vehicleNumber: rider.plateNumber
      },
      tracking,
      updatedAt: new Date().toISOString(),
      version
    };

    // Broadcast to backward compatible and exact room names
    this.io.to(`order_${orderIdStr}`).emit("order:statusUpdated", payload);
    this.io.to(`order:${orderIdStr}`).emit("order:statusUpdated", payload);
    // Legacy support
    this.io.to(`order:${orderIdStr}`).emit("tracking:update", { orderId: orderIdStr, tracking });
  }

  /**
   * Emits rider assignment details.
   */
  emitRiderAssigned(orderIdStr, version) {
    if (!this.io) return;
    const rider = getSimulatedRider(orderIdStr);
    const payload = {
      type: "rider",
      orderId: orderIdStr,
      riderName: rider.name,
      riderPhoto: rider.profileImage,
      phone: rider.phone,
      rating: rider.rating,
      vehicle: rider.vehicleType,
      vehicleNumber: rider.plateNumber,
      updatedAt: new Date().toISOString(),
      version
    };

    this.io.to(`order_${orderIdStr}`).emit("order:riderAssigned", payload);
    this.io.to(`order:${orderIdStr}`).emit("order:riderAssigned", payload);
  }

  /**
   * Stops and cleans up the tracking session registry entry.
   */
  stopSession(orderId) {
    const orderIdStr = String(orderId);
    const session = this.activeSessions.get(orderIdStr);
    if (session) {
      if (session.intervalId) {
        clearInterval(session.intervalId);
      }
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
      const version = order.trackingVersion || 1;

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
            version,
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

      const minutes = order.orderStatus === "Delivered" ? 0 : Math.max(0, Math.ceil((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000));
      return {
        order: orderObj,
        rider: order.orderStatus === "Delivered" || order.trackingSessionActive ? rider : null,
        tracking: {
          version,
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
      const activeOrders = await Order.find({
        $or: [
          { trackingSessionActive: true },
          { orderStatus: { $in: ["Rider Assigned", "Picked Up", "Out for Delivery", "Near You", "On The Way", "Preparing", "Packed"] } }
        ]
      });
      console.log(`[TrackingService] Found ${activeOrders.length} active/pending orders to resume.`);

      for (const order of activeOrders) {
        const orderIdStr = String(order._id);
        const start = order.statusTimestamps.riderAssigned || order.createdAt;
        const end = order.estimatedDeliveryTime;
        const route = order.simulatedRoute;

        const currentVersion = (order.trackingVersion || 0) + 1;
        order.trackingVersion = currentVersion;
        order.trackingSessionActive = true;
        await order.save();

        if (Date.now() >= new Date(end).getTime()) {
          console.log(`[TrackingService] Order ${orderIdStr} expired while offline. Marking as Delivered.`);
          await this._completeOrderDelivery(order);
        } else {
          this.activeSessions.set(orderIdStr, { version: currentVersion, intervalId: null });
          this._startBroadcastTimer(orderIdStr, start, end, route, currentVersion);
          console.log(`[TrackingService] Resumed broadcast timer for order ${orderIdStr} at version ${currentVersion}`);
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
  _startBroadcastTimer(orderIdStr, start, end, route, initialVersion) {
    this.stopSession(orderIdStr);

    let version = initialVersion;

    const intervalId = setInterval(async () => {
      try {
        const state = calculateTrackingState(start, end, route);
        version += 1;

        // Update session version locally
        const session = this.activeSessions.get(orderIdStr);
        if (session) {
          session.version = version;
        }

        // Check if status transitioned on the movement engine
        const order = await Order.findById(orderIdStr);
        if (order) {
          let hasChanged = false;
          if (state.stage !== order.orderStatus) {
            order.orderStatus = state.stage;
            order.statusTimestamps = order.statusTimestamps || {};
            const tsKey = state.stage.toLowerCase().replace(/ /g, "");
            order.statusTimestamps[tsKey] = new Date();
            hasChanged = true;
          }
          order.trackingVersion = version;
          order.estimatedArrivalMinutes = state.etaMinutes;
          await order.save();

          if (hasChanged) {
            this.emitStatusUpdated(orderIdStr, order, version);
          }
        }

        if (this.io) {
          const locPayload = {
            type: "location",
            orderId: orderIdStr,
            latitude: state.currentLocation.lat,
            longitude: state.currentLocation.lng,
            progress: state.progress,
            eta: state.etaMinutes,
            distanceRemaining: state.distanceRemaining,
            bearing: state.currentLocation.bearing,
            updatedAt: new Date().toISOString(),
            version
          };

          this.io.to(`order_${orderIdStr}`).emit("order:locationUpdated", locPayload);
          this.io.to(`order:${orderIdStr}`).emit("order:locationUpdated", locPayload);

          // Backward compatibility tracking:update trigger
          this.io.to(`order:${orderIdStr}`).emit("tracking:update", {
            orderId: orderIdStr,
            tracking: {
              version,
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

        // Automatic completion when progress reaches 100% or ETA is 0
        if (state.progress >= 100) {
          const freshOrder = await Order.findById(orderIdStr);
          if (freshOrder) {
            await this._completeOrderDelivery(freshOrder);
          }
        }
      } catch (err) {
        console.error(`[TrackingService Timer] Error broadcasting order ${orderIdStr}:`, err);
      }
    }, 2000);

    this.activeSessions.set(orderIdStr, { version, intervalId });
  }

  /**
   * Internal helper to finalize order delivery, save state, and run rewards.
   */
  async _completeOrderDelivery(order) {
    const orderIdStr = String(order._id);
    this.stopSession(orderIdStr);

    try {
      const finalVersion = (order.trackingVersion || 0) + 1;
      order.orderStatus = "Delivered";
      order.trackingSessionActive = false;
      order.deliveredAt = new Date();
      order.estimatedArrivalMinutes = 0;
      order.estimatedDeliveryTime = new Date();
      order.statusTimestamps = order.statusTimestamps || {};
      order.statusTimestamps.delivered = new Date();
      order.trackingVersion = finalVersion;

      try {
        const { handleOrderCheckoutRewards } = require("../utils/rewards");
        await handleOrderCheckoutRewards(order);
      } catch (rewardErr) {
        console.error(`[TrackingService] Failed to credit BuyCoins for order ${orderIdStr}:`, rewardErr);
      }

      await order.save();
      console.log(`[TrackingService] Order ${orderIdStr} marked as Delivered. Session completed.`);

      if (this.io) {
        const payload = {
          type: "delivered",
          orderId: orderIdStr,
          status: "Delivered",
          updatedAt: new Date().toISOString(),
          version: finalVersion
        };
        this.io.to(`order_${orderIdStr}`).emit("order:delivered", payload);
        this.io.to(`order:${orderIdStr}`).emit("order:delivered", payload);

        // Backward compatibility
        this.emitStatusUpdated(orderIdStr, order, finalVersion);

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
