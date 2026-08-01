const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const AddressShare = require("../models/AddressShare");
const Address = require("../models/Address");
const User = require("../models/User");
const Notification = require("../models/Notification");

// POST /api/address-share/request - Request address by phone number
router.post("/request", authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Indian mobile formats: optionally start with +91, 91, or 0, followed by 10 digits
    const phoneRegex = /^(?:\+91|91|0)?[6789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: "Invalid Indian phone number format" });
    }

    // Extract the last 10 digits to query the DB robustly
    const tenDigitPhone = phone.replace(/\D/g, "").slice(-10);
    const receiver = await User.findOne({ phone: new RegExp(tenDigitPhone + "$") });

    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(receiver._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Cannot request address from yourself" });
    }

    // Check if receiver has saved addresses
    const addressCount = await Address.countDocuments({ userId: receiver._id });
    if (addressCount === 0) {
      return res.status(400).json({ success: false, message: "User has no saved addresses" });
    }

    // Check for existing pending request
    const existing = await AddressShare.findOne({
      ownerId: receiver._id,
      sharedWithUserId: req.user._id,
      status: "pending",
      expiresAt: { $gt: new Date() }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Request already sent and is still pending" });
    }

    // Create the share request
    const newShare = new AddressShare({
      ownerId: receiver._id,
      sharedWithUserId: req.user._id,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
    });

    await newShare.save();

    // Create in-app Notification for receiver
    const notification = new Notification({
      userId: receiver._id,
      title: "New Address Request",
      body: `${req.user.name || "A user"} wants to use one of your saved delivery addresses.`,
      data: {
        type: "address_share_request",
        requestId: newShare._id,
        senderName: req.user.name || "A user"
      }
    });
    await notification.save();

    // Emit socket event to receiver
    global.io?.to(`user_${receiver._id}`).emit("address-share-request", {
      requestId: newShare._id,
      senderName: req.user.name || "A user"
    });

    return res.status(201).json({ success: true, message: "Request sent successfully", request: newShare });
  } catch (error) {
    console.error("❌ Error requesting address share:", error);
    return res.status(500).json({ success: false, message: "Failed to send request", error: error.message });
  }
});

// GET /api/address-share/requests - List all incoming and outgoing requests
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await AddressShare.find({
      $or: [{ ownerId: userId }, { sharedWithUserId: userId }]
    })
      .populate("ownerId", "name phone")
      .populate("sharedWithUserId", "name phone")
      .populate("addressId")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, requests });
  } catch (error) {
    console.error("❌ Error fetching share requests:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
});

// POST /api/address-share/respond - Accept or reject a request
router.post("/respond", authMiddleware, async (req, res) => {
  try {
    const { requestId, action, addressId } = req.body;
    if (!requestId || !action) {
      return res.status(400).json({ success: false, message: "Request ID and action are required" });
    }

    const share = await AddressShare.findById(requestId);
    if (!share) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (String(share.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized to respond to this request" });
    }

    if (share.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request is already ${share.status}` });
    }

    if (action === "reject") {
      share.status = "rejected";
      await share.save();

      // Notify sender
      const notification = new Notification({
        userId: share.sharedWithUserId,
        title: "Address Request Declined",
        body: `Your address request to ${req.user.name || "User"} was declined.`,
        data: { type: "address_share_rejected", requestId }
      });
      await notification.save();

      global.io?.to(`user_${share.sharedWithUserId}`).emit("address-share-rejected", {
        requestId,
        ownerName: req.user.name || "User"
      });

      return res.json({ success: true, message: "Request declined successfully" });
    }

    if (action === "accept") {
      if (!addressId) {
        return res.status(400).json({ success: false, message: "Address ID is required to accept" });
      }

      // Verify the address belongs to current user
      const address = await Address.findOne({ _id: addressId, userId: req.user._id });
      if (!address) {
        return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
      }

      share.status = "accepted";
      share.addressId = addressId;
      // Clear or extend expiry for active shares
      share.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year extension for active shares
      await share.save();

      // Notify sender
      const notification = new Notification({
        userId: share.sharedWithUserId,
        title: "Address Request Accepted",
        body: `🎉 ${req.user.name || "User"} shared "${address.label}" with you.`,
        data: { type: "address_share_accepted", requestId, addressId }
      });
      await notification.save();

      global.io?.to(`user_${share.sharedWithUserId}`).emit("address-share-accepted", {
        requestId,
        addressId,
        ownerName: req.user.name || "User",
        addressLabel: address.label
      });

      return res.json({ success: true, message: "Address shared successfully", share });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("❌ Error responding to share request:", error);
    return res.status(500).json({ success: false, message: "Failed to respond to request" });
  }
});

// DELETE /api/address-share/:id - Revoke or remove a shared address
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const share = await AddressShare.findById(req.params.id);
    if (!share) {
      return res.status(404).json({ success: false, message: "Share link not found" });
    }

    const currentUserId = String(req.user._id);

    if (currentUserId === String(share.ownerId)) {
      // Owner revoking access
      share.status = "revoked";
      await share.save();

      // Notify recipient
      const notification = new Notification({
        userId: share.sharedWithUserId,
        title: "Address Sharing Revoked",
        body: `${req.user.name || "The owner"} has stopped sharing their address.`,
        data: { type: "address_share_revoked", shareId: share._id }
      });
      await notification.save();

      global.io?.to(`user_${share.sharedWithUserId}`).emit("address-share-revoked", {
        shareId: share._id,
        ownerName: req.user.name || "Owner"
      });

      return res.json({ success: true, message: "Sharing revoked successfully" });
    } else if (currentUserId === String(share.sharedWithUserId)) {
      // Recipient removing it from their list
      if (share.status === "pending") {
        // Just cancel the pending request
        share.status = "removed";
      } else {
        share.status = "removed";
      }
      await share.save();
      return res.json({ success: true, message: "Shared address removed successfully" });
    }

    return res.status(403).json({ success: false, message: "Unauthorized to modify this share" });
  } catch (error) {
    console.error("❌ Error deleting/revoking share link:", error);
    return res.status(500).json({ success: false, message: "Failed to remove share link" });
  }
});

// GET /api/address-share/shared - Fetch all active shared addresses WITH me
router.get("/shared", authMiddleware, async (req, res) => {
  try {
    const shares = await AddressShare.find({
      sharedWithUserId: req.user._id,
      status: "accepted",
      expiresAt: { $gt: new Date() }
    })
      .populate("ownerId", "name")
      .populate("addressId")
      .lean();

    // Map to address format with meta information
    const addresses = shares
      .filter(s => s.addressId)
      .map(s => ({
        ...s.addressId,
        _id: s.addressId._id,
        shareId: s._id,
        isShared: true,
        sharedBy: {
          id: s.ownerId._id,
          name: s.ownerId.name || "User"
        }
      }));

    return res.json({ success: true, addresses });
  } catch (error) {
    console.error("❌ Error fetching shared addresses:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch shared addresses" });
  }
});

// GET /api/address-share/shared-by-me - Fetch active addresses shared BY me
router.get("/shared-by-me", authMiddleware, async (req, res) => {
  try {
    const shares = await AddressShare.find({
      ownerId: req.user._id,
      status: "accepted"
    })
      .populate("sharedWithUserId", "name phone")
      .populate("addressId")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, shares });
  } catch (error) {
    console.error("❌ Error fetching shared-by-me:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch active shares" });
  }
});

module.exports = router;
