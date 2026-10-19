const express = require("express");
const router = express.Router();

const PrivacyGrievance = require("../models/PrivacyGrievance");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/privacy-grievances
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      grievanceType,
      name,
      contact,
      description,
    } = req.body;

    // Validate required fields
    if (
      !grievanceType ||
      !name?.trim() ||
      !contact?.trim() ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "All required grievance fields must be provided.",
      });
    }

    // Create grievance
    const grievance = await PrivacyGrievance.create({
      userId: req.user._id,
      grievanceType,
      name: name.trim(),
      contact: contact.trim(),
      description: description.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Privacy grievance submitted successfully.",
      grievanceId: grievance._id,
    });
  } catch (error) {
    console.error(
      "❌ Privacy Grievance: Failed to submit grievance:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to submit privacy grievance.",
    });
  }
});

module.exports = router;