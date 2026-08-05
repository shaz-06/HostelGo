import React, { useState, useEffect } from "react";

export default function ReferralsAdminPanel() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Config states
  const [config, setConfig] = useState({
    referralEnabled: true,
    referralMinOrder: 199,
    referrerReward: 75,
    referredUserReward: 50,
    referralExpiryDays: 90
  });

  // History & Stats states
  const [referrals, setReferrals] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalReferrals: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    expired: 0,
    conversionRate: 0,
    totalRewardsIssued: 0
  });
  const [topReferrers, setTopReferrers] = useState([]);

  // Search/Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reconciliation states
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationReport, setReconciliationReport] = useState(null);

  // Config Form validation limits preview
  const [previewActive, setPreviewActive] = useState(false);

  // Fetch campaign config
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/config/referral`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch referrals list & analytics
  const fetchReferrals = async (targetPage = 1) => {
    try {
      const query = `page=${targetPage}&limit=10&search=${encodeURIComponent(search)}&status=${statusFilter}`;
      const res = await fetch(`${window.API_BASE_URL}/api/admin/referrals?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReferrals(data.referrals);
        setAnalytics(data.analytics);
        setTopReferrers(data.topReferrers);
        setTotalPages(data.pagination.totalPages);
        setPage(data.pagination.page);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load referrals list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchReferrals(1);
  }, [search, statusFilter]);

  // Handle configuration update
  const handleConfigUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (config.referralMinOrder <= 0) {
      setError("Min order value must be greater than zero");
      return;
    }
    if (config.referrerReward < 0 || config.referredUserReward < 0) {
      setError("Reward amounts cannot be negative");
      return;
    }

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/config/referral`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setSuccess("Referral campaign configuration updated successfully!");
        setPreviewActive(false);
      } else {
        setError(data.message || "Failed to update configuration");
      }
    } catch (err) {
      console.error(err);
      setError("Server error updating configuration");
    }
  };

  // Handle database reconciliation trigger
  const handleReconcile = async () => {
    if (!window.confirm("Are you sure you want to run the reconciliation? This will check all users and sync their stats counters to match the source of truth.")) return;
    setReconciling(true);
    setReconciliationReport(null);
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/referrals/reconcile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReconciliationReport(data);
        fetchReferrals(1);
      } else {
        alert("Reconciliation failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error executing reconciliation");
    } finally {
      setReconciling(false);
    }
  };

  if (loading) {
    return <div style={containerStyle}>🔄 Loading referral settings...</div>;
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>👥 Referral Campaign Management</h2>

      {/* Stats Analytics Grid */}
      <div style={analyticsGridStyle}>
        <div style={analyticsCardStyle}>
          <span style={cardValStyle}>{analytics.totalReferrals}</span>
          <span style={cardLabelStyle}>Total Referrals</span>
        </div>
        <div style={analyticsCardStyle}>
          <span style={{ ...cardValStyle, color: "#eab308" }}>{analytics.pending}</span>
          <span style={cardLabelStyle}>Pending</span>
        </div>
        <div style={analyticsCardStyle}>
          <span style={{ ...cardValStyle, color: "#16a34a" }}>{analytics.completed}</span>
          <span style={cardLabelStyle}>Completed</span>
        </div>
        <div style={analyticsCardStyle}>
          <span style={{ ...cardValStyle, color: "#3b82f6" }}>₹{analytics.totalRewardsIssued}</span>
          <span style={cardLabelStyle}>Rewards Issued</span>
        </div>
        <div style={analyticsCardStyle}>
          <span style={{ ...cardValStyle, color: "#6b7280" }}>{analytics.conversionRate}%</span>
          <span style={cardLabelStyle}>Conversion Rate</span>
        </div>
      </div>

      <div style={twoColumnLayout}>
        {/* Left Col: Config Form & Reconciliation */}
        <div style={leftColStyle}>
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Campaign Settings</h3>
            {error && <div style={errorStyle}>⚠️ {error}</div>}
            {success && <div style={successStyle}>✅ {success}</div>}

            <form onSubmit={handleConfigUpdate} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Referral Campaign Status</label>
                <select 
                  value={config.referralEnabled ? "true" : "false"}
                  onChange={(e) => setConfig({ ...config, referralEnabled: e.target.value === "true" })}
                  style={inputStyle}
                >
                  <option value="true">Active (Opt-in Allowed)</option>
                  <option value="false">Inactive (Disabled)</option>
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Minimum Qualifying Order (₹)</label>
                <input 
                  type="number"
                  value={config.referralMinOrder}
                  onChange={(e) => setConfig({ ...config, referralMinOrder: Number(e.target.value) })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Referrer Wallet Reward (₹)</label>
                <input 
                  type="number"
                  value={config.referrerReward}
                  onChange={(e) => setConfig({ ...config, referrerReward: Number(e.target.value) })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Referred User Wallet Reward (₹)</label>
                <input 
                  type="number"
                  value={config.referredUserReward}
                  onChange={(e) => setConfig({ ...config, referredUserReward: Number(e.target.value) })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Referral Validity Period (Days)</label>
                <input 
                  type="number"
                  value={config.referralExpiryDays}
                  onChange={(e) => setConfig({ ...config, referralExpiryDays: Number(e.target.value) })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={btnRowStyle}>
                <button type="button" onClick={() => setPreviewActive(!previewActive)} style={secondaryBtnStyle}>
                  {previewActive ? "Hide Preview" : "Preview Campaign"}
                </button>
                <button type="submit" style={primaryBtnStyle}>Save Configuration</button>
              </div>
            </form>

            {/* Live Campaign Preview Block */}
            {previewActive && (
              <div style={previewBlockStyle}>
                <h4 style={previewTitleStyle}>Live Link Sharing Preview</h4>
                <div style={previewBoxStyle}>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5" }}>
                    "Join Buyto and get <strong>₹{config.referredUserReward}</strong> in your Buyto Wallet after your first delivered order of <strong>₹{config.referralMinOrder}</strong> or more. Use my referral code during signup. I'll earn <strong>₹{config.referrerReward}</strong> too!"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Reconciliation Utilities */}
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Database Reconciliation & Repair</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px 0", lineHeight: "1.4" }}>
              Manually run a verification audit. This compares all cached user statistics against the Referral collection source-of-truth and automatically repairs any inconsistencies.
            </p>
            <button 
              onClick={handleReconcile} 
              disabled={reconciling} 
              style={reconciling ? disabledBtnStyle : reconciliationBtnStyle}
            >
              {reconciling ? "Executing Repair..." : "Audit & Reconcile Database"}
            </button>

            {reconciliationReport && (
              <div style={reportBlockStyle}>
                <h4 style={previewTitleStyle}>Audit Run Report</h4>
                <p style={{ fontSize: "12.5px", margin: "6px 0" }}>
                  Repaired records count: <strong>{reconciliationReport.repairedUsersCount}</strong>
                </p>
                {reconciliationReport.repairsReport.length > 0 && (
                  <div style={logBoxStyle}>
                    {reconciliationReport.repairsReport.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "11px", borderBottom: "1px solid #e5e7eb", padding: "6px 0" }}>
                        User: {item.name} ({item.email}) - stats synced successfully.
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: History Records List */}
        <div style={rightColStyle}>
          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Top Referrers</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name / Email</th>
                  <th style={thStyle}>Referrals</th>
                  <th style={thStyle}>Wallet Earning</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={emptyTdStyle}>No active referrers listed.</td>
                  </tr>
                ) : (
                  topReferrers.map((ref, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>
                        <div>{ref.name}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{ref.email}</div>
                      </td>
                      <td style={tdStyle}>{ref.successfulReferrals}</td>
                      <td style={tdStyle}>₹{ref.referralWalletEarned}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={panelCardStyle}>
            <h3 style={panelTitleStyle}>Referral History</h3>
            
            <div style={searchRowStyle}>
              <input 
                type="text" 
                placeholder="Search name, email, or code..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: 1, padding: "10px 14px" }}
              />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...inputStyle, width: "130px", padding: "10px 14px" }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Referrer</th>
                  <th style={thStyle}>Friend Referred</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={emptyTdStyle}>No referral records matched your query.</td>
                  </tr>
                ) : (
                  referrals.map((item, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>
                        <div>{item.referrer?.name}</div>
                        <div style={{ fontSize: "10.5px", color: "#6b7280" }}>{item.referrer?.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{item.referredUser?.name}</div>
                        <div style={{ fontSize: "10.5px", color: "#6b7280" }}>{item.referredUser?.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(item.status)}>{item.status}</span>
                      </td>
                      <td style={tdStyle}>{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={paginationRowStyle}>
                <button 
                  onClick={() => fetchReferrals(page - 1)} 
                  disabled={page <= 1}
                  style={page <= 1 ? disabledNavBtnStyle : navBtnStyle}
                >
                  Previous
                </button>
                <span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span>
                <button 
                  onClick={() => fetchReferrals(page + 1)} 
                  disabled={page >= totalPages}
                  style={page >= totalPages ? disabledNavBtnStyle : navBtnStyle}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Styling Declarations
const containerStyle = {
  padding: "24px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "850",
  color: "#111827",
  margin: "0 0 20px 0"
};

const analyticsGridStyle = {
  display: "flex",
  gap: "16px",
  marginBottom: "24px"
};

const analyticsCardStyle = {
  flex: 1,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
};

const cardValStyle = {
  fontSize: "24px",
  fontWeight: "850",
  color: "#111827"
};

const cardLabelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const twoColumnLayout = {
  display: "flex",
  gap: "24px"
};

const leftColStyle = {
  flex: 2,
  display: "flex",
  flexDirection: "column",
  gap: "24px"
};

const rightColStyle = {
  flex: 3,
  display: "flex",
  flexDirection: "column",
  gap: "24px"
};

const panelCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.015)"
};

const panelTitleStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 20px 0"
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px"
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#374151"
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
  color: "#1f2937",
  backgroundColor: "#f9fafb"
};

const btnRowStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "8px"
};

const primaryBtnStyle = {
  background: "#16a34a",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none",
  flex: 1
};

const secondaryBtnStyle = {
  background: "#f3f4f6",
  color: "#1f2937",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none"
};

const previewBlockStyle = {
  marginTop: "20px",
  background: "#fef8e8",
  border: "1px dashed #eab308",
  borderRadius: "16px",
  padding: "16px"
};

const previewTitleStyle = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#854d0e",
  margin: "0 0 8px 0"
};

const previewBoxStyle = {
  color: "#854d0e"
};

const reconciliationBtnStyle = {
  background: "#3b82f6",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none",
  width: "100%",
  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)"
};

const disabledBtnStyle = {
  background: "#9ca3af",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "not-allowed",
  outline: "none",
  width: "100%"
};

const reportBlockStyle = {
  marginTop: "16px",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "16px",
  padding: "16px"
};

const logBoxStyle = {
  maxHeight: "150px",
  overflowY: "auto",
  marginTop: "8px",
  borderTop: "1px solid #bbf7d0",
  paddingTop: "6px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13.5px"
};

const thStyle = {
  textAlign: "left",
  borderBottom: "2px solid #e5e7eb",
  padding: "12px 8px",
  color: "#4b5563",
  fontWeight: "700"
};

const trStyle = {
  borderBottom: "1px solid #f3f4f6"
};

const tdStyle = {
  padding: "14px 8px",
  verticalAlign: "middle"
};

const emptyTdStyle = {
  padding: "30px",
  textAlign: "center",
  color: "#6b7280"
};

const searchRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px"
};

const paginationRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px"
};

const navBtnStyle = {
  background: "none",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "12.5px",
  fontWeight: "700",
  cursor: "pointer",
  color: "#1f2937",
  outline: "none"
};

const disabledNavBtnStyle = {
  background: "none",
  border: "1px solid #f3f4f6",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "12.5px",
  fontWeight: "700",
  cursor: "not-allowed",
  color: "#9ca3af",
  outline: "none"
};

const badgeStyle = (status) => {
  let bg = "rgba(107, 114, 128, 0.1)";
  let co = "#6B7280";

  if (status === "COMPLETED") {
    bg = "rgba(22, 163, 74, 0.1)";
    co = "#16A34A";
  } else if (status === "PENDING") {
    bg = "rgba(234, 179, 8, 0.1)";
    co = "#CA8A04";
  } else if (status === "CANCELLED" || status === "EXPIRED") {
    bg = "rgba(239, 68, 68, 0.1)";
    co = "#EF4444";
  }

  return {
    padding: "3px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "750",
    backgroundColor: bg,
    color: co
  };
};

const errorStyle = {
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
  padding: "10px 14px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "14px",
  border: "1px solid #fee2e2"
};

const successStyle = {
  backgroundColor: "#f0fdf4",
  color: "#166534",
  padding: "10px 14px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "14px",
  border: "1px solid #dcfce7"
};
