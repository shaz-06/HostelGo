const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Address = require("../models/Address");

// GET /api/addresses - Fetch all addresses ever saved by the logged-in user & shared addresses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    // Retrieve owned addresses
    const ownedAddresses = await Address.find({ userId })
      .sort({ isDefault: -1, lastUsedAt: -1, updatedAt: -1 })
      .lean();

    const owned = ownedAddresses.map(addr => ({
      ...addr,
      isShared: false
    }));

    // Retrieve active shared addresses
    const AddressShare = require("../models/AddressShare");
    const shares = await AddressShare.find({
      sharedWithUserId: userId,
      status: "accepted",
      expiresAt: { $gt: new Date() }
    })
      .populate("ownerId", "name")
      .populate("addressId")
      .lean();

    const shared = shares
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

    const combined = [...owned, ...shared];

    return res.json({ success: true, addresses: combined });
  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch addresses", error: error.message });
  }
});

// POST /api/addresses - Add new address
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { label, addressType, fullName, phone, addressLine, landmark, roomNumber, latitude, longitude, isDefault, serviceable, lastCheckedAt } = req.body;

    if (!fullName || !phone || !addressLine) {
      return res.status(400).json({ success: false, message: "Full Name, Phone, and Address Line are required" });
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ success: false, message: "Map coordinates (latitude and longitude) are required" });
    }

    // If this is set to default, unset other defaults first
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = new Address({
      userId,
      label: label || addressType || "Hostel",
      fullName,
      phone,
      addressLine,
      landmark: landmark || "",
      roomNumber: roomNumber || "",
      latitude: Number(latitude),
      longitude: Number(longitude),
      isDefault: !!isDefault,
      serviceable: serviceable !== undefined ? !!serviceable : true,
      lastCheckedAt: lastCheckedAt ? new Date(lastCheckedAt) : new Date(),
      lastUsedAt: new Date()
    });

    await newAddress.save();

    return res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    console.error("❌ Error creating address:", error);
    return res.status(500).json({ success: false, message: "Failed to create address", error: error.message });
  }
});

// PUT /api/addresses/:id - Edit address details
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { label, addressType, fullName, phone, addressLine, landmark, roomNumber, latitude, longitude, isDefault, serviceable, lastCheckedAt } = req.body;

    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) {
      // Check if this address exists at all in the database (which means it's shared/owned by someone else)
      const existsInDb = await Address.findById(req.params.id);
      if (existsInDb) {
        return res.status(403).json({ success: false, message: "Cannot edit a shared address" });
      }
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (latitude === null || longitude === null) {
      return res.status(400).json({ success: false, message: "Map coordinates cannot be empty" });
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    address.label = label || addressType || address.label;
    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.addressLine = addressLine || address.addressLine;
    address.landmark = landmark !== undefined ? landmark : address.landmark;
    address.roomNumber = roomNumber !== undefined ? roomNumber : address.roomNumber;
    if (latitude !== undefined) address.latitude = Number(latitude);
    if (longitude !== undefined) address.longitude = Number(longitude);
    address.isDefault = isDefault !== undefined ? !!isDefault : address.isDefault;
    if (serviceable !== undefined) address.serviceable = !!serviceable;
    if (lastCheckedAt !== undefined) address.lastCheckedAt = new Date(lastCheckedAt);

    await address.save();

    return res.json({ success: true, address });
  } catch (error) {
    console.error("❌ Error updating address:", error);
    return res.status(500).json({ success: false, message: "Failed to update address", error: error.message });
  }
});

// DELETE /api/addresses/:id - Delete or remove an address
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if it's a shared address link for the current user first
    const AddressShare = require("../models/AddressShare");
    const share = await AddressShare.findOne({
      addressId: req.params.id,
      sharedWithUserId: userId,
      status: "accepted"
    });

    if (share) {
      share.status = "removed";
      await share.save();
      return res.json({ success: true, message: "Shared address removed successfully" });
    }

    // If it's the user's own address, perform owner delete cascade
    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Cascade: Revoke all active shares and notify recipients
    const sharesToRevoke = await AddressShare.find({ addressId: req.params.id, status: "accepted" });
    for (const shareItem of sharesToRevoke) {
      shareItem.status = "revoked";
      await shareItem.save();

      // Create notification
      const notification = new Notification({
        userId: shareItem.sharedWithUserId,
        title: "Address Sharing Revoked",
        body: `The address "${address.label}" shared by ${req.user.name || "Owner"} is no longer available because it was deleted.`,
        data: { type: "address_share_revoked", shareId: shareItem._id }
      });
      await notification.save();

      // Emit socket notification
      global.io?.to(`user_${shareItem.sharedWithUserId}`).emit("address-share-revoked", {
        shareId: shareItem._id,
        ownerName: req.user.name || "Owner"
      });
    }

    await Address.deleteOne({ _id: req.params.id, userId });

    return res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting address:", error);
    return res.status(500).json({ success: false, message: "Failed to delete address", error: error.message });
  }
});

// POST /api/addresses/:id/default - Set an address as default
router.post("/:id/default", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Unset current defaults
    await Address.updateMany({ userId }, { isDefault: false });

    // Set this one as default
    address.isDefault = true;
    await address.save();

    return res.json({ success: true, address });
  } catch (error) {
    console.error("❌ Error setting default address:", error);
    return res.status(500).json({ success: false, message: "Failed to set default address", error: error.message });
  }
});

// POST /api/addresses/:id/use - Mark an address as used (update lastUsedAt)
router.post("/:id/use", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    address.lastUsedAt = new Date();
    await address.save();

    return res.json({ success: true, address });
  } catch (error) {
    console.error("❌ Error updating address lastUsedAt:", error);
    return res.status(500).json({ success: false, message: "Failed to update address usage", error: error.message });
  }
});

module.exports = router;
