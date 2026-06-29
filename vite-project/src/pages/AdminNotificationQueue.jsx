import React, { useEffect, useState } from "react";

export default function AdminNotificationQueue() {
  const [stats, setStats] = useState({ pending: 0, processing: 0, sent: 0, failed: 0 });
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/notifications/queue", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setQueue(data.queue);
      } else {
        setError(data.message || "Failed to load notification queue.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching notification queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 10 seconds for real-time dashboard updates
    const timer = setInterval(fetchQueue, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRetry = async (orderId) => {
    setActionLoading(orderId);
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/notifications/queue/retry/${orderId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh queue
        fetchQueue();
      } else {
        alert(data.message || "Failed to retry notification");
      }
    } catch (err) {
      console.error(err);
      alert("Error triggering retry");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", color: "#6B7280", fontWeight: "700" }}>
        Loading Notification Queue...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#F9FAFB", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", margin: 0 }}>
            📋 Notification Outbox Queue
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
            Monitor real-time push notification delivery statuses and trigger manual retries.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          style={{
            padding: "8px 16px",
            background: "#318616",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "13px"
          }}
        >
          🔄 Refresh Queue
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "16px", borderRadius: "8px", marginBottom: "20px", fontWeight: "700" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Summary Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#6B7280", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Pending</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#F59E0B", marginTop: "8px" }}>{stats.pending || 0}</div>
        </div>
        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#6B7280", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Processing</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#3B82F6", marginTop: "8px" }}>{stats.processing || 0}</div>
        </div>
        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#6B7280", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Sent Successfully</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#10B981", marginTop: "8px" }}>{stats.sent || 0}</div>
        </div>
        <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ color: "#6B7280", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Failed</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#EF4444", marginTop: "8px" }}>{stats.failed || 0}</div>
        </div>
      </div>

      {/* Main Outbox Table */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "#374151" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB" }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Total Amount</th>
              <th style={thStyle}>FCM Status</th>
              <th style={thStyle}>Retry Count</th>
              <th style={thStyle}>Last Attempt At</th>
              <th style={thStyle}>Sent At</th>
              <th style={thStyle}>FCM Message ID</th>
              <th style={thStyle}>Created At</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: "30px", textAlign: "center", color: "#9CA3AF", fontWeight: "700" }}>
                  No orders found in the outbox queue.
                </td>
              </tr>
            ) : (
              queue.map((item) => {
                const shortId = "BT" + String(item._id).slice(-6).toUpperCase();
                return (
                  <tr key={item._id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "14px 16px", fontWeight: "700", fontFamily: "monospace", color: "#111827" }}>
                      {shortId}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#111827" }}>
                      ₹{item.totalAmount}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={getBadgeStyle(item.adminNotificationStatus)}>
                        {item.adminNotificationStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#4B5563" }}>
                      {item.adminNotificationRetries || 0} / 5
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6B7280" }}>
                      {item.adminNotificationLastAttemptAt ? new Date(item.adminNotificationLastAttemptAt).toLocaleTimeString() : "-"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6B7280" }}>
                      {item.adminNotificationSentAt ? new Date(item.adminNotificationSentAt).toLocaleTimeString() : "-"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6B7280", fontFamily: "monospace", fontSize: "11px" }}>
                      {item.adminNotificationMessageId ? item.adminNotificationMessageId.substring(0, 15) + "..." : "-"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6B7280" }}>
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {(item.adminNotificationStatus === "failed" || item.adminNotificationStatus === "pending") && (
                        <button
                          onClick={() => handleRetry(item._id)}
                          disabled={actionLoading === item._id}
                          style={{
                            padding: "6px 12px",
                            background: actionLoading === item._id ? "#9CA3AF" : "#3B82F6",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "700",
                            cursor: actionLoading === item._id ? "not-allowed" : "pointer",
                            fontSize: "11px"
                          }}
                        >
                          {actionLoading === item._id ? "Retrying..." : "Retry ⚡"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  color: "#6B7280",
  fontWeight: "800",
  textTransform: "uppercase",
  fontSize: "11px"
};

const getBadgeStyle = (status) => {
  const base = {
    padding: "4px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    display: "inline-block"
  };

  switch (status) {
    case "sent":
      return { ...base, background: "#D1FAE5", color: "#065F46" };
    case "pending":
      return { ...base, background: "#FEF3C7", color: "#92400E" };
    case "processing":
      return { ...base, background: "#DBEAFE", color: "#1E40AF" };
    case "failed":
      return { ...base, background: "#FEE2E2", color: "#991B1B" };
    default:
      return { ...base, background: "#F3F4F6", color: "#374151" };
  }
};
