const mongoose = require("mongoose");

const pricingRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Enabled", "Disabled"],
    default: "Enabled",
    index: true
  },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  timezone: { type: String, default: "Asia/Kolkata" },
  appliesTo: {
    type: String,
    enum: ["Entire Store", "Category", "Subcategory", "Brand", "Product"],
    required: true,
    index: true
  },
  targetValues: [{ type: String }], // Holds category names, subcategory names, brand names, or product IDs
  adjustmentType: {
    type: String,
    enum: ["Percentage Increase", "Percentage Decrease", "Fixed Increase", "Fixed Decrease"],
    required: true
  },
  adjustmentValue: { type: Number, required: true, min: 0 },
  priority: { type: Number, default: 0, index: true }, // Higher number wins conflicts
  createdBy: { type: String, default: "Admin" },
  badgeText: { type: String, default: "🎉 Festival Price" },
  analytics: {
    affectedOrdersCount: { type: Number, default: 0 },
    affectedItemsCount: { type: Number, default: 0 },
    totalAdjustedRevenue: { type: Number, default: 0 } // Incremental/Decremental revenue compared to base
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("PricingRule", pricingRuleSchema);
