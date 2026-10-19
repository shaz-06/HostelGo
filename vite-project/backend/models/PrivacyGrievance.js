const mongoose = require("mongoose");

const privacyGrievanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    grievanceType: {
      type: String,
      required: true,
      enum: [
        "privacy-concern",
        "data-correction",
        "data-deletion",
        "consent",
        "unauthorised-use",
        "security",
        "other",
      ],
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "resolved",
        "closed",
      ],
      default: "submitted",
      index: true,
    },

    adminResponse: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PrivacyGrievance",
  privacyGrievanceSchema
);