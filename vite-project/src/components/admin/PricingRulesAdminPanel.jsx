import React, { useState, useEffect } from "react";

export default function PricingRulesAdminPanel({ isMobile }) {
  const [rules, setRules] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Enabled",
    startDate: "",
    startTime: "00:00",
    endDate: "",
    endTime: "23:59",
    timezone: "Asia/Kolkata",
    appliesTo: "Entire Store",
    targetValues: "",
    adjustmentType: "Percentage Increase",
    adjustmentValue: 10,
    priority: 50,
    badgeText: "🎉 Festival Price"
  });

  const fetchRulesAndAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("buyto_token");
      const [rulesRes, analyticsRes] = await Promise.all([
        fetch((window.API_BASE_URL || "") + "/api/pricing-rules", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch((window.API_BASE_URL || "") + "/api/pricing-rules/analytics", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      }
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics || []);
      }
    } catch (err) {
      console.error("Failed to load pricing rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndAnalytics();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      description: "",
      status: "Enabled",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "00:00",
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      appliesTo: "Entire Store",
      targetValues: "",
      adjustmentType: "Percentage Increase",
      adjustmentValue: 10,
      priority: 50,
      badgeText: "🎉 Festival Price"
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    const start = new Date(rule.startDate);
    const end = new Date(rule.endDate);

    setFormData({
      name: rule.name || "",
      description: rule.description || "",
      status: rule.status || "Enabled",
      startDate: start.toISOString().split("T")[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split("T")[0],
      endTime: end.toTimeString().slice(0, 5),
      timezone: rule.timezone || "Asia/Kolkata",
      appliesTo: rule.appliesTo || "Entire Store",
      targetValues: (rule.targetValues || []).join(", "),
      adjustmentType: rule.adjustmentType || "Percentage Increase",
      adjustmentValue: rule.adjustmentValue || 0,
      priority: rule.priority || 0,
      badgeText: rule.badgeText || "🎉 Festival Price"
    });
    setShowModal(true);
  };

  const handleDuplicate = (rule) => {
    setEditingRule(null);
    const start = new Date(rule.startDate);
    const end = new Date(rule.endDate);

    setFormData({
      name: `${rule.name} (Copy)`,
      description: rule.description || "",
      status: "Enabled",
      startDate: start.toISOString().split("T")[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split("T")[0],
      endTime: end.toTimeString().slice(0, 5),
      timezone: rule.timezone || "Asia/Kolkata",
      appliesTo: rule.appliesTo || "Entire Store",
      targetValues: (rule.targetValues || []).join(", "),
      adjustmentType: rule.adjustmentType || "Percentage Increase",
      adjustmentValue: rule.adjustmentValue || 0,
      priority: rule.priority || 0,
      badgeText: rule.badgeText || "🎉 Festival Price"
    });
    setShowModal(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("buyto_token");
      const fullStart = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const fullEnd = new Date(`${formData.endDate}T${formData.endTime}:00`);

      const payload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: fullStart,
        endDate: fullEnd,
        timezone: formData.timezone,
        appliesTo: formData.appliesTo,
        targetValues: formData.targetValues.split(",").map(s => s.trim()).filter(Boolean),
        adjustmentType: formData.adjustmentType,
        adjustmentValue: Number(formData.adjustmentValue),
        priority: Number(formData.priority),
        badgeText: formData.badgeText
      };

      const url = editingRule
        ? `${window.API_BASE_URL || ""}/api/pricing-rules/${editingRule._id}`
        : `${window.API_BASE_URL || ""}/api/pricing-rules`;
      
      const method = editingRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchRulesAndAnalytics();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save pricing rule");
      }
    } catch (err) {
      console.error("Error saving rule:", err);
      alert("Network error saving pricing rule");
    }
  };

  const handleToggleStatus = async (rule) => {
    const newStatus = rule.status === "Enabled" ? "Disabled" : "Enabled";
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(`${window.API_BASE_URL || ""}/api/pricing-rules/${rule._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchRulesAndAnalytics();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this pricing rule?")) return;
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(`${window.API_BASE_URL || ""}/api/pricing-rules/${ruleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRulesAndAnalytics();
      }
    } catch (err) {
      console.error("Error deleting rule:", err);
    }
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9",
    fontFamily: "'Outfit', 'Inter', sans-serif"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
              🏷️ Dynamic Pricing & Festival Campaign Rules
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px", margin: "4px 0 0", fontWeight: "500" }}>
              Schedule automated price adjustments across categories, brands, or products without altering base prices.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            style={{
              background: "#318616",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(49, 134, 22, 0.25)"
            }}
          >
            + Create Pricing Rule
          </button>
        </div>
      </div>

      {/* Rules Table Card */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>
          Active & Scheduled Campaigns
        </h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading pricing rules...</div>
        ) : rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: "600" }}>
            No pricing rules created yet. Click "+ Create Pricing Rule" to add one.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Rule Name</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Schedule</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Applies To</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Adjustment</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Priority</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const now = new Date();
                  const isLive = rule.status === "Enabled" && now >= new Date(rule.startDate) && now <= new Date(rule.endDate);
                  const isExpired = now > new Date(rule.endDate);

                  return (
                    <tr key={rule._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px", fontWeight: "800", color: "#0f172a" }}>
                        {rule.name}
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>{rule.badgeText}</div>
                      </td>
                      <td style={{ padding: "14px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "800",
                          background: isLive ? "#dcfce7" : isExpired ? "#f1f5f9" : "#fef3c7",
                          color: isLive ? "#166534" : isExpired ? "#64748b" : "#92400e"
                        }}>
                          {isLive ? "🟢 LIVE NOW" : isExpired ? "⏹ EXPIRED" : rule.status === "Enabled" ? "⏳ SCHEDULED" : "🔴 DISABLED"}
                        </span>
                      </td>
                      <td style={{ padding: "14px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>
                        <div>Start: {new Date(rule.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <div>End: {new Date(rule.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </td>
                      <td style={{ padding: "14px" }}>
                        <strong style={{ color: "#334155" }}>{rule.appliesTo}</strong>
                        {rule.targetValues && rule.targetValues.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            {rule.targetValues.slice(0, 2).join(", ")}{rule.targetValues.length > 2 ? ` +${rule.targetValues.length - 2} more` : ""}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px", fontWeight: "800", color: rule.adjustmentType.includes("Increase") ? "#dc2626" : "#16a34a" }}>
                        {rule.adjustmentType.includes("Percentage") ? (rule.adjustmentType.includes("Increase") ? `+${rule.adjustmentValue}%` : `-${rule.adjustmentValue}%`) : (rule.adjustmentType.includes("Increase") ? `+₹${rule.adjustmentValue}` : `-₹${rule.adjustmentValue}`)}
                      </td>
                      <td style={{ padding: "14px", fontWeight: "800" }}>{rule.priority}</td>
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleToggleStatus(rule)} style={actionBtnStyle}>
                            {rule.status === "Enabled" ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => handleOpenEditModal(rule)} style={actionBtnStyle}>Edit</button>
                          <button onClick={() => handleDuplicate(rule)} style={actionBtnStyle}>Duplicate</button>
                          <button onClick={() => handleDeleteRule(rule._id)} style={{ ...actionBtnStyle, color: "#dc2626" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Card */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>
          📊 Pricing Rule Impact Analytics
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
          {analytics.map(item => (
            <div key={item.ruleId} style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>{item.ruleName}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>Orders Impacted:</span>
                <strong style={{ color: "#0f172a" }}>{item.affectedOrders}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>Items Sold:</span>
                <strong style={{ color: "#0f172a" }}>{item.affectedItems}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>Incremental Revenue:</span>
                <strong style={{ color: item.additionalRevenue >= 0 ? "#16a34a" : "#dc2626" }}>
                  {item.additionalRevenue >= 0 ? `+₹${item.additionalRevenue}` : `-₹${Math.abs(item.additionalRevenue)}`}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      {showModal && (
        <div style={modalBackdropStyle} onClick={() => setShowModal(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", marginBottom: "16px" }}>
              {editingRule ? "Edit Pricing Rule" : "Create Pricing Rule"}
            </h3>
            <form onSubmit={handleSaveRule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festival Update"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Badge Text</label>
                <input
                  type="text"
                  placeholder="e.g. 🎉 Festival Price"
                  value={formData.badgeText}
                  onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Applies To *</label>
                  <select
                    value={formData.appliesTo}
                    onChange={e => setFormData({ ...formData, appliesTo: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Entire Store">Entire Store</option>
                    <option value="Category">Category</option>
                    <option value="Subcategory">Subcategory</option>
                    <option value="Brand">Brand</option>
                    <option value="Product">Product</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority (Higher Wins) *</label>
                  <input
                    type="number"
                    required
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {formData.appliesTo !== "Entire Store" && (
                <div>
                  <label style={labelStyle}>Target Values (Comma Separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sweets, Snacks"
                    value={formData.targetValues}
                    onChange={e => setFormData({ ...formData, targetValues: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Adjustment Type *</label>
                  <select
                    value={formData.adjustmentType}
                    onChange={e => setFormData({ ...formData, adjustmentType: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Percentage Increase">Percentage Increase (+%)</option>
                    <option value="Percentage Decrease">Percentage Decrease (-%)</option>
                    <option value="Fixed Increase">Fixed Increase (+₹)</option>
                    <option value="Fixed Decrease">Fixed Decrease (-₹)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Adjustment Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={formData.adjustmentValue}
                    onChange={e => setFormData({ ...formData, adjustmentValue: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ ...actionBtnStyle, padding: "10px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#318616",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    cursor: "pointer"
                  }}
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: "700",
  color: "#334155",
  cursor: "pointer"
};

const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999,
  padding: "16px"
};

const modalContentStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  maxWidth: "500px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  fontFamily: "'Outfit', sans-serif"
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "800",
  color: "#475569",
  marginBottom: "4px"
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  fontWeight: "600",
  boxSizing: "border-box"
};
