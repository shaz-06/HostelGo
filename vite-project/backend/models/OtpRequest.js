const mongoose = require("mongoose");

const OtpRequestSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  requestId: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Expire document after 10 minutes (TTL)
  }
});

module.exports = mongoose.model("OtpRequest", OtpRequestSchema);
