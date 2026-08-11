const express = require("express");
const router = express.Router();
const User = require("../models/User");
const NotificationHistory = require("../models/NotificationHistory");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPushNotification } = require("../services/notificationService");

// POST /api/users/fcm-token
router.post("/fcm-token", authMiddleware, async (req, res) => {
  console.log("=== [API REQUEST: POST /api/users/fcm-token] ===");
  try {
    const { token, platform, removeToken } = req.body;
    console.log(`Payload: token="${token || ''}", platform="${platform || ''}", removeToken="${removeToken || ''}"`);
    console.log(`User context: email="${req.user.email}", id="${req.user._id}"`);

    if (token) {
      if (!req.user.fcmTokens) req.user.fcmTokens = [];
      
      let exists = false;
      req.user.fcmTokens.forEach(t => {
        if (t && typeof t === "object" && t.token === token) {
          t.lastUsedAt = new Date();
          if (platform) t.platform = platform;
          exists = true;
        }
      });

      if (!exists) {
        req.user.fcmTokens.push({
          token,
          platform: platform || "unknown",
          lastUsedAt: new Date()
        });
        console.log(`Added new FCM token: ${token} [Platform: ${platform || 'unknown'}]`);
      } else {
        console.log(`Updated lastUsedAt for existing FCM token: ${token}`);
      }
      req.user.fcmToken = token; // backward-compatibility
    } else {
      const tokenToRemove = removeToken;
      if (tokenToRemove) {
        req.user.fcmTokens = (req.user.fcmTokens || []).filter(t => {
          const tVal = (t && typeof t === "object") ? t.token : t;
          return tVal !== tokenToRemove;
        });
        console.log(`Removed FCM token: ${tokenToRemove}`);
      } else {
        req.user.fcmTokens = [];
        req.user.fcmToken = null;
        console.log("Cleared all FCM tokens for user.");
      }
    }

    const savedUser = await req.user.save();
    console.log("=== [MONGODB SAVE RESULT] ===");
    console.log(`User ID: ${savedUser._id}`);
    console.log(`Current fcmTokens:`, JSON.stringify(savedUser.fcmTokens, null, 2));

    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully",
      fcmTokens: savedUser.fcmTokens
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

    return res.status(200).json({
      success: true,
      notifications: notifications.map(n => ({
        _id: n._id,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
        type: n.type,
        image: n.image,
        deepLink: n.deepLink
      }))
    });
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
    
    let tokens = [];
    if (Array.isArray(req.user.fcmTokens)) {
      req.user.fcmTokens.forEach(t => {
        if (t && typeof t === "object" && t.token) {
          tokens.push(t.token);
        } else if (typeof t === "string") {
          tokens.push(t);
        }
      });
    }
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

// GET /api/users/preferences
router.get("/preferences", authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({ 
      success: true, 
      preferences: req.user.notificationPreferences || {} 
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return res.status(500).json({ success: false, message: "Server error fetching preferences" });
  }
});

// PUT /api/users/preferences
router.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const allowedKeys = [
      "orderUpdates",
      "promotions",
      "cartReminders",
      "newOrderAlerts",
      "riderAlerts",
      "lowStockAlerts",
      "newUserRegistrations",
      "promotionalWhatsApp",
      "promotionalSMS"
    ];

    const bodyKeys = Object.keys(req.body);
    const hasInvalidKey = bodyKeys.some(key => !allowedKeys.includes(key));
    if (hasInvalidKey) {
      return res.status(400).json({ success: false, message: "Invalid preference field" });
    }

    if (!req.user.notificationPreferences) {
      req.user.notificationPreferences = {};
    }

    let hasChanged = false;
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        const newVal = Boolean(req.body[key]);
        const oldVal = req.user.notificationPreferences[key];
        if (oldVal !== newVal) {
          req.user.notificationPreferences[key] = newVal;
          hasChanged = true;
        }
      }
    }

    if (hasChanged) {
      req.user.markModified("notificationPreferences");
      await req.user.save();
    }

    return res.status(200).json({ success: true, preferences: req.user.notificationPreferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return res.status(500).json({ success: false, message: "Server error updating preferences" });
  }
});

// GET /api/users/referrals
router.get("/referrals", authMiddleware, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    if (!req.user.referralCode) {
      const { getOrCreateReferralCode } = require("../services/referralCodeService");
      await getOrCreateReferralCode(req.user);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const Referral = require("../models/Referral");

    const total = await Referral.countDocuments({ referrer: req.user._id });
    const completed = await Referral.countDocuments({ referrer: req.user._id, status: "COMPLETED" });
    const pending = await Referral.countDocuments({ referrer: req.user._id, status: "PENDING" });

    const earnedAggregate = await Referral.aggregate([
      { $match: { referrer: req.user._id, status: "COMPLETED" } },
      { $group: { _id: null, totalEarned: { $sum: "$rewardAmountReferrer" } } }
    ]);
    const earned = earnedAggregate.length > 0 ? earnedAggregate[0].totalEarned : 0;

    const history = await Referral.find({ referrer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("referredUser", "name")
      .lean();

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      referralCode: req.user.referralCode,
      stats: {
        total,
        completed,
        pending,
        earned
      },
      history: history.map(item => ({
        id: item._id,
        friendName: item.referredUser ? item.referredUser.name : "Friend",
        status: item.status,
        reward: item.rewardAmountReferrer,
        date: item.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch referral history" });
  }
});

// In-memory store for phone update OTP verification
const phoneOtpStore = new Map();

// PUT /api/profile (also mounted at /api/users/profile)
const updateProfileHandler = async (req, res) => {
  try {
    const { name, email, dateOfBirth, gender, avatar } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({ success: false, message: "Name must be between 2 and 50 characters" });
      }
      req.user.name = trimmedName;
    }

    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      // Check email uniqueness if changed
      if (trimmedEmail && trimmedEmail !== req.user.email) {
        const existing = await User.findOne({ email: trimmedEmail, _id: { $ne: req.user._id } });
        if (existing) {
          return res.status(400).json({ success: false, message: "Email is already in use by another account" });
        }
      }
      req.user.email = trimmedEmail || undefined;
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        const dobDate = new Date(dateOfBirth);
        if (isNaN(dobDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid date format for Date of Birth" });
        }
        
        const { getISTDate, getISTYear } = require("../utils/birthdayCampaign");
        const istToday = getISTDate();
        if (dobDate > istToday) {
          return res.status(400).json({ success: false, message: "Date of Birth cannot be in the future" });
        }

        const currentYear = getISTYear();
        const hasRedeemed = req.user.birthdayRedemptions && req.user.birthdayRedemptions.some(r => r.year === currentYear);
        
        const oldDobStr = req.user.dateOfBirth ? req.user.dateOfBirth.toISOString().split("T")[0] : "";
        const newDobStr = dobDate.toISOString().split("T")[0];
        
        if (oldDobStr !== newDobStr) {
          if (hasRedeemed) {
            return res.status(400).json({ success: false, message: "Cannot change birthday because you have already redeemed your birthday reward for this year." });
          }
          if (req.user.birthdayChangeCount >= 1 && req.user.birthdayLastChanged) {
            const timeDiff = istToday.getTime() - new Date(req.user.birthdayLastChanged).getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            if (daysDiff < 365) {
              return res.status(400).json({ success: false, message: "Birthday can only be updated once every 365 days." });
            }
          }
          req.user.birthdayChangeCount = (req.user.birthdayChangeCount || 0) + 1;
          req.user.birthdayLastChanged = istToday;
          req.user.dateOfBirth = dobDate;
        }
      } else {
        req.user.dateOfBirth = null;
      }
    }

    if (gender !== undefined) {
      req.user.gender = String(gender).trim();
    }

    if (avatar !== undefined) {
      req.user.avatar = String(avatar).trim();
    }

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        avatar: req.user.avatar,
        dateOfBirth: req.user.dateOfBirth,
        gender: req.user.gender,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Server error updating profile", error: error.message });
  }
};

router.put("/profile", authMiddleware, updateProfileHandler);

// POST /api/users/request-phone-otp
router.post("/request-phone-otp", authMiddleware, async (req, res) => {
  try {
    const { newPhone } = req.body;
    if (!newPhone || !/^\d{10}$/.test(String(newPhone).trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit phone number" });
    }
    const cleanPhone = String(newPhone).trim();
    const existing = await User.findOne({ phone: cleanPhone, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Phone number is already linked to another account" });
    }

    const otp = "123456"; // Default OTP for development / demo
    phoneOtpStore.set(String(req.user._id), { newPhone: cleanPhone, otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`📱 [PHONE UPDATE OTP] Generated OTP for user ${req.user._id} to update phone to ${cleanPhone}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent to new phone number (Default OTP: 123456)"
    });
  } catch (error) {
    console.error("Error requesting phone OTP:", error);
    return res.status(500).json({ success: false, message: "Server error sending OTP" });
  }
});

// POST /api/users/verify-phone-otp
router.post("/verify-phone-otp", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;
    const record = phoneOtpStore.get(String(req.user._id));

    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired or not requested. Please request a new OTP." });
    }

    if (String(otp).trim() !== record.otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code" });
    }

    req.user.phone = record.newPhone;
    await req.user.save();
    phoneOtpStore.delete(String(req.user._id));

    return res.status(200).json({
      success: true,
      message: "Phone number verified and updated successfully",
      phone: req.user.phone
    });
  } catch (error) {
    console.error("Error verifying phone OTP:", error);
    return res.status(500).json({ success: false, message: "Server error verifying phone OTP" });
  }
});

// POST /api/notifications/register-token
router.post("/register-token", async (req, res) => {
  try {
    const { phone, fcmToken } = req.body;
    if (!phone || !fcmToken) {
      return res.status(400).json({ success: false, message: "Missing phone or fcmToken" });
    }

    const AdminDeviceToken = require("../models/AdminDeviceToken");
    let adminTokenDoc = await AdminDeviceToken.findOne({ phone });

    if (!adminTokenDoc) {
      adminTokenDoc = await AdminDeviceToken.create({
        phone,
        fcmTokens: [fcmToken],
      });
    } else {
      if (!adminTokenDoc.fcmTokens.includes(fcmToken)) {
        adminTokenDoc.fcmTokens.push(fcmToken);
        await adminTokenDoc.save();
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error registering admin token:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

