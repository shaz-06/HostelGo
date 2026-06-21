const express = require("express");
const router = express.Router();
const User = require("../models/User");
const NotificationHistory = require("../models/NotificationHistory");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPushNotification } = require("../services/notificationService");

// POST /api/users/fcm-token
router.post("/fcm-token", authMiddleware, async (req, res) => {
  try {
    const { token, removeToken } = req.body;

    if (token) {
      if (!req.user.fcmTokens) req.user.fcmTokens = [];
      if (!req.user.fcmTokens.includes(token)) {
        req.user.fcmTokens.push(token);
      }
      req.user.fcmToken = token; // backward-compatibility
    } else {
      const tokenToRemove = removeToken || token;
      if (tokenToRemove) {
        req.user.fcmTokens = (req.user.fcmTokens || []).filter(t => t !== tokenToRemove);
      } else {
        req.user.fcmTokens = [];
        req.user.fcmToken = null;
      }
    }

    await req.user.save();

    console.log(`FCM Token updated for user: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully"
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating FCM token",
      error: error.message
    });
  }
});

// GET /api/users/notifications or GET /api/notifications
const getNotificationsHandler = async (req, res) => {
  try {
    const notifications = await NotificationHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(
      notifications.map(n => ({
        _id: n._id,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
        type: n.type,
        image: n.image,
        deepLink: n.deepLink
      }))
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notifications"
    });
  }
};

router.get("/notifications", authMiddleware, getNotificationsHandler);
router.get("/", authMiddleware, getNotificationsHandler);

// POST /api/users/notifications/read
router.post("/notifications/read", authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (notificationId) {
      await NotificationHistory.updateOne(
        { _id: notificationId, user: req.user._id },
        { read: true }
      );
    } else {
      await NotificationHistory.updateMany(
        { user: req.user._id, read: false },
        { read: true }
      );
    }
    return res.status(200).json({
      success: true,
      message: "Notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating notifications"
    });
  }
});

// POST /api/users/notifications/test
router.post("/notifications/test", authMiddleware, async (req, res) => {
  try {
    console.log(`[Test Push] Dispatching test notification to user: ${req.user.email}`);
    
    let tokens = [...(req.user.fcmTokens || [])];
    if (req.user.fcmToken && !tokens.includes(req.user.fcmToken)) {
      tokens.push(req.user.fcmToken);
    }

    const result = await sendPushNotification(
      tokens,
      "Test Notification ⚡",
      "This is a successful test push notification from your Buyto app setup!",
      {
        type: "TEST",
        timestamp: String(Date.now()),
        deepLink: "/offers"
      }
    );
    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error dispatching test notification:", error);
    return res.status(500).json({
      success: false,
      message: "Server error triggering test notification",
      error: error.message
    });
  }
});

// POST /api/users/cart-activity
router.post("/cart-activity", authMiddleware, async (req, res) => {
  try {
    const { hasItems } = req.body;
    req.user.cartHasItems = Boolean(hasItems);
    req.user.cartActivityAt = new Date();
    if (hasItems) {
      req.user.cartReminderSent = false;
    }
    await req.user.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating cart activity:", error);
    return res.status(500).json({ success: false, message: "Server error updating cart activity" });
  }
});

// PUT /api/users/preferences
router.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const { orderUpdates, promotions, cartReminders } = req.body;
    req.user.notificationPreferences = {
      orderUpdates: orderUpdates !== undefined ? Boolean(orderUpdates) : req.user.notificationPreferences?.orderUpdates ?? true,
      promotions: promotions !== undefined ? Boolean(promotions) : req.user.notificationPreferences?.promotions ?? true,
      cartReminders: cartReminders !== undefined ? Boolean(cartReminders) : req.user.notificationPreferences?.cartReminders ?? true
    };
    await req.user.save();
    return res.status(200).json({ success: true, preferences: req.user.notificationPreferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return res.status(500).json({ success: false, message: "Server error updating preferences" });
  }
});

module.exports = router;
