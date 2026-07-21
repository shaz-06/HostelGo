const express = require("express");
const router = express.Router();
const PricingRule = require("../models/PricingRule");
const Product = require("../models/Product");
const Order = require("../models/Order");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET /api/pricing-rules - Get all pricing rules (Admin)
router.get("/", adminMiddleware, async (req, res) => {
  try {
    const rules = await PricingRule.find({}).sort({ priority: -1, createdAt: -1 }).lean();
    return res.json({ success: true, rules });
  } catch (err) {
    console.error("Error fetching pricing rules:", err);
    return res.status(500).json({ success: false, message: "Failed to load pricing rules" });
  }
});

// POST /api/pricing-rules - Create new pricing rule (Admin)
router.post("/", adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      startDate,
      endDate,
      timezone,
      appliesTo,
      targetValues,
      adjustmentType,
      adjustmentValue,
      priority,
      badgeText
    } = req.body;

    if (!name || !startDate || !endDate || !appliesTo || !adjustmentType || adjustmentValue === undefined) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const newRule = new PricingRule({
      name,
      description: description || "",
      status: status || "Enabled",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone: timezone || "Asia/Kolkata",
      appliesTo,
      targetValues: Array.isArray(targetValues) ? targetValues : [targetValues].filter(Boolean),
      adjustmentType,
      adjustmentValue: Number(adjustmentValue),
      priority: Number(priority || 0),
      badgeText: badgeText || "🎉 Festival Price",
      createdBy: req.user?.name || "Admin"
    });

    await newRule.save();
    return res.status(201).json({ success: true, message: "Pricing rule created successfully", rule: newRule });
  } catch (err) {
    console.error("Error creating pricing rule:", err);
    return res.status(500).json({ success: false, message: "Failed to create pricing rule", error: err.message });
  }
});

// PUT /api/pricing-rules/:id - Update existing pricing rule (Admin)
router.put("/:id", adminMiddleware, async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Pricing rule not found" });
    }

    const {
      name,
      description,
      status,
      startDate,
      endDate,
      timezone,
      appliesTo,
      targetValues,
      adjustmentType,
      adjustmentValue,
      priority,
      badgeText
    } = req.body;

    if (name) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (status) rule.status = status;
    if (startDate) rule.startDate = new Date(startDate);
    if (endDate) rule.endDate = new Date(endDate);
    if (timezone) rule.timezone = timezone;
    if (appliesTo) rule.appliesTo = appliesTo;
    if (targetValues !== undefined) rule.targetValues = Array.isArray(targetValues) ? targetValues : [targetValues].filter(Boolean);
    if (adjustmentType) rule.adjustmentType = adjustmentType;
    if (adjustmentValue !== undefined) rule.adjustmentValue = Number(adjustmentValue);
    if (priority !== undefined) rule.priority = Number(priority);
    if (badgeText !== undefined) rule.badgeText = badgeText;

    await rule.save();
    return res.json({ success: true, message: "Pricing rule updated successfully", rule });
  } catch (err) {
    console.error("Error updating pricing rule:", err);
    return res.status(500).json({ success: false, message: "Failed to update pricing rule" });
  }
});

// DELETE /api/pricing-rules/:id - Delete pricing rule (Admin)
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const deleted = await PricingRule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Pricing rule not found" });
    }
    return res.json({ success: true, message: "Pricing rule deleted" });
  } catch (err) {
    console.error("Error deleting pricing rule:", err);
    return res.status(500).json({ success: false, message: "Failed to delete pricing rule" });
  }
});

// GET /api/pricing-rules/analytics - Rule analytics breakdown
router.get("/analytics", adminMiddleware, async (req, res) => {
  try {
    const rules = await PricingRule.find({}).lean();
    
    // Calculate live analytics per rule from historic orders
    const orders = await Order.find({ "products.pricingRuleId": { $exists: true, $ne: null } }).lean();

    const analyticsSummary = rules.map(rule => {
      const ruleOrders = orders.filter(o => o.products.some(p => String(p.pricingRuleId) === String(rule._id)));
      let affectedItems = 0;
      let extraRevenue = 0;

      ruleOrders.forEach(o => {
        o.products.forEach(p => {
          if (String(p.pricingRuleId) === String(rule._id)) {
            affectedItems += (p.quantity || 1);
            extraRevenue += (p.pricingAdjustment || 0) * (p.quantity || 1);
          }
        });
      });

      return {
        ruleId: rule._id,
        ruleName: rule.name,
        status: rule.status,
        affectedOrders: ruleOrders.length,
        affectedItems,
        additionalRevenue: extraRevenue
      };
    });

    return res.json({ success: true, analytics: analyticsSummary });
  } catch (err) {
    console.error("Error generating rule analytics:", err);
    return res.status(500).json({ success: false, message: "Failed to generate analytics" });
  }
});

module.exports = router;
