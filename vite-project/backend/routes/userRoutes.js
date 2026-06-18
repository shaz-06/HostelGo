const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPushNotification } = require("../services/notificationService");

// POST /api/users/fcm-token
router.post("/fcm-token", authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    
    // Save token to current authenticated user
    req.user.fcmToken = token || null;
    await req.user.save();

    console.log(`FCM Token registered for user: ${req.user.email}`);
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

// GET /api/users/notifications
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notifications"
    });
  }
});

// POST /api/users/notifications/read
router.post("/notifications/read", authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, userId: req.user._id },
        { read: true }
      );
    } else {
      await Notification.updateMany(
        { userId: req.user._id, read: false },
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
    const result = await sendPushNotification({
      userId: req.user._id,
      title: "Test Notification ⚡",
      body: "This is a successful test push notification from your Buyto app setup!",
      data: {
        type: "TEST",
        timestamp: String(Date.now())
      }
    });
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

module.exports = router;
