const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const AddressRequest = require("../models/AddressRequest");

// Helper to hash tokens
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Rate Limiters
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: "Too many address requests created. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: "Too many submissions from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

// Lazy Expiry check helper
const checkAndExpireRequest = async (request) => {
  if (request.status === "pending" && request.expiresAt < new Date()) {
    request.status = "expired";
    await request.save();
    // Log lifecycle event
    console.log(`[AddressRequest] Request ${request.requestId} expired (lazy checked)`);
    if (global.io) {
      const payload = {
        requestId: request.requestId,
        status: "expired",
        timestamp: new Date().toISOString()
      };
      global.io.to(`address-request-${request.requestId}`).emit("address-request-expired", payload);
      global.io.to(`user_${request.requester}`).emit("address-request-expired", payload);
    }
  }
  return request;
};

// POST /api/address-request - Create a new request
router.post("/", authMiddleware, createLimiter, async (req, res) => {
  try {
    const { orderId } = req.body;
    const requesterId = req.user._id;
    const requesterName = req.user.name || "A friend";
    const requesterPhone = req.user.phone || "";

    // Generate unique short requestId and raw requestToken
    const requestId = crypto.randomBytes(4).toString("hex"); // 8 chars alphanumeric
    const rawToken = crypto.randomBytes(24).toString("hex"); // 48 chars hex
    const requestTokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newRequest = new AddressRequest({
      requestId,
      requestTokenHash,
      requester: requesterId,
      requesterSnapshot: {
        name: requesterName,
        phone: requesterPhone
      },
      orderId: orderId || null,
      status: "pending",
      expiresAt
    });

    await newRequest.save();

    console.log(`[AddressRequest] Created ${requestId} for user ${requesterId}`);

    // Build public shareable URL
    // We get the origin dynamically or use client URL from environment if configured
    const host = req.get("host");
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    // We assume the frontend is running on standard client port or same host, but let's build standard client URL
    const clientUrl = process.env.CLIENT_URL || `${protocol}://${host.split(":")[0]}:5173`;
    const shareUrl = `${clientUrl}/address/request/${requestId}?token=${rawToken}`;

    return res.status(201).json({
      success: true,
      requestId,
      shareUrl
    });
  } catch (error) {
    console.error("❌ Error creating address request:", error);
    return res.status(500).json({ success: false, message: "Failed to create address request" });
  }
});

// GET /api/address-request/:requestId - Fetch public details
router.get("/:requestId", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Security token is required" });
    }

    let request = await AddressRequest.findOne({ requestId: req.params.requestId });
    if (!request) {
      return res.status(404).json({ success: false, message: "Address request not found" });
    }

    // Lazy expiration check
    request = await checkAndExpireRequest(request);

    if (request.status === "expired") {
      return res.status(410).json({ success: false, message: "This address request has expired", status: "expired" });
    }

    if (request.status === "cancelled") {
      return res.status(410).json({ success: false, message: "This request has been cancelled", status: "cancelled" });
    }

    if (request.status === "completed") {
      return res.status(400).json({ success: false, message: "This request has already been completed", status: "completed" });
    }

    // Token verification
    if (!request.requestTokenHash || request.requestTokenHash !== hashToken(token)) {
      return res.status(403).json({ success: false, message: "Invalid security token" });
    }

    console.log(`[AddressRequest] Public details read for ${request.requestId}`);

    return res.json({
      success: true,
      requestId: request.requestId,
      requesterName: request.requesterSnapshot.name,
      status: request.status,
      expiresAt: request.expiresAt
    });
  } catch (error) {
    console.error("❌ Error retrieving address request:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve request details" });
  }
});

// POST /api/address-request/:requestId/submit - Recipient submits address details
router.post("/:requestId/submit", submitLimiter, async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Security token is required" });
    }

    const { fullName, phone, addressLine1, addressLine2, landmark, roomNumber, city, state, pincode, latitude, longitude } = req.body;

    // Validation
    if (!fullName || !phone || !addressLine1 || !city || !pincode) {
      return res.status(400).json({ success: false, message: "Full Name, Phone, Address, City and Pincode are required" });
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ success: false, message: "Map coordinates are required" });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "Invalid GPS coordinates" });
    }

    let request = await AddressRequest.findOne({ requestId: req.params.requestId });
    if (!request) {
      return res.status(404).json({ success: false, message: "Address request not found" });
    }

    // Lazy expiration check
    request = await checkAndExpireRequest(request);

    if (request.status === "expired") {
      return res.status(410).json({ success: false, message: "This request has expired" });
    }

    if (request.status === "cancelled") {
      return res.status(410).json({ success: false, message: "This request was cancelled by the requester" });
    }

    if (request.status === "completed") {
      return res.status(400).json({ success: false, message: "This request has already been completed" });
    }

    // Hash & Verify token
    if (!request.requestTokenHash || request.requestTokenHash !== hashToken(token)) {
      return res.status(403).json({ success: false, message: "Invalid security token" });
    }

    // Save submitted details
    request.submittedAddress = {
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      landmark: landmark || "",
      roomNumber: roomNumber || "",
      city,
      state: state || "",
      pincode,
      latitude: lat,
      longitude: lng,
      source: "shared-request"
    };

    request.recipientMetadata = {
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
      submittedAt: new Date()
    };

    request.status = "completed";
    request.completedAt = new Date();
    // One-time read invalidation
    request.requestTokenHash = null;

    await request.save();

    console.log(`[AddressRequest] Completed submission for ${request.requestId}`);

    // Emit Consistent Socket Payload
    if (global.io) {
      const payload = {
        requestId: request.requestId,
        status: "completed",
        address: {
          fullName: request.submittedAddress.fullName,
          phone: request.submittedAddress.phone,
          addressLine: `${request.submittedAddress.addressLine1}${request.submittedAddress.addressLine2 ? ', ' + request.submittedAddress.addressLine2 : ''}`,
          landmark: request.submittedAddress.landmark,
          roomNumber: request.submittedAddress.roomNumber,
          city: request.submittedAddress.city,
          pincode: request.submittedAddress.pincode,
          latitude: request.submittedAddress.latitude,
          longitude: request.submittedAddress.longitude,
          label: "Shared Address",
          isTemporary: true
        },
        timestamp: new Date().toISOString()
      };
      
      // Emit to request-specific room
      global.io.to(`address-request-${request.requestId}`).emit("address-request-completed", payload);
      // Emit to requester user-specific room
      global.io.to(`user_${request.requester}`).emit("address-request-completed", payload);
    }

    return res.json({ success: true, message: "Address submitted successfully" });
  } catch (error) {
    console.error("❌ Error submitting address request:", error);
    return res.status(500).json({ success: false, message: "Failed to submit address details" });
  }
});

// GET /api/address-request/:requestId/status - Fetch current status
router.get("/:requestId/status", async (req, res) => {
  try {
    let request = await AddressRequest.findOne({ requestId: req.params.requestId });
    if (!request) {
      return res.status(404).json({ success: false, message: "Address request not found" });
    }

    // Lazy expiration check
    request = await checkAndExpireRequest(request);

    const responseData = {
      success: true,
      requestId: request.requestId,
      status: request.status
    };

    if (request.status === "completed" && request.submittedAddress) {
      responseData.address = {
        fullName: request.submittedAddress.fullName,
        phone: request.submittedAddress.phone,
        addressLine: `${request.submittedAddress.addressLine1}${request.submittedAddress.addressLine2 ? ', ' + request.submittedAddress.addressLine2 : ''}`,
        landmark: request.submittedAddress.landmark,
        roomNumber: request.submittedAddress.roomNumber,
        city: request.submittedAddress.city,
        pincode: request.submittedAddress.pincode,
        latitude: request.submittedAddress.latitude,
        longitude: request.submittedAddress.longitude,
        label: "Shared Address",
        isTemporary: true
      };
    }

    return res.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching request status:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
});

// DELETE /api/address-request/:requestId - Cancel request (soft delete)
router.delete("/:requestId", authMiddleware, async (req, res) => {
  try {
    const request = await AddressRequest.findOne({
      requestId: req.params.requestId,
      requester: req.user._id
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found or unauthorized" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot cancel a request that is already ${request.status}` });
    }

    request.status = "cancelled";
    request.cancelledAt = new Date();
    request.requestTokenHash = null; // Invalidate security token
    await request.save();

    console.log(`[AddressRequest] Cancelled ${request.requestId}`);

    if (global.io) {
      const payload = {
        requestId: request.requestId,
        status: "cancelled",
        timestamp: new Date().toISOString()
      };
      global.io.to(`address-request-${request.requestId}`).emit("address-request-cancelled", payload);
      global.io.to(`user_${request.requester}`).emit("address-request-cancelled", payload);
    }

    return res.json({ success: true, message: "Address request cancelled successfully" });
  } catch (error) {
    console.error("❌ Error cancelling request:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel address request" });
  }
});

module.exports = router;
