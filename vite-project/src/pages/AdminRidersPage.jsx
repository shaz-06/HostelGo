import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function AdminRidersPage() {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  const page = {
    minHeight: "100vh",
    background: "#F9FAFB",
    color: "#111827",
    fontFamily: "'Outfit','Inter',sans-serif",
    padding: isMobile ? "16px 12px" : "24px 32px",
    boxSizing: "border-box",
    overflowX: "hidden"
  };

  const header = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: isMobile ? "12px" : "18px",
    paddingBottom: 20,
    borderBottom: "1.5px solid #E5E7EB",
    marginBottom: 24 
  };

  const [riders, setRiders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/riders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load riders");
      setRiders(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const toggleSuspend = async (rider) => {
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}/suspend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isSuspended: !rider.isSuspended })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update rider");
      setRiders((prev) => prev.map((item) => (item._id === data._id ? { ...item, ...data } : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const onlineCount = riders.filter((rider) => rider.isOnline && !rider.isSuspended).length;
  const totalDeliveries = riders.reduce((sum, rider) => sum + (rider.totalDeliveries || 0), 0);
  const totalEarnings = riders.reduce((sum, rider) => sum + (rider.totalEarnings || 0), 0);

  if (loading) {
    return <div style={loadingStyle}>Loading rider fleet...</div>;
  }

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <button onClick={() => navigate("/admin")} style={backBtnStyle}>← Dashboard</button>
          <h1 style={titleStyle}>Riders Management</h1>
        </div>
        <button onClick={fetchRiders} style={refreshBtnStyle}>Refresh Riders</button>
      </header>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      <section style={statsGridStyle}>
        <Stat label="Total Riders" value={riders.length} accent="#FF4D4F" />
        <Stat label="Online Riders" value={onlineCount} accent="#22C55E" />
        <Stat label="Completed Deliveries" value={totalDeliveries} accent="#3B82F6" />
        <Stat label="Rider Earnings" value={money(totalEarnings)} accent="#10B981" />
      </section>

      <main style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Rider</th>
              <th style={thStyle}>Vehicle</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Active</th>
              <th style={thStyle}>Deliveries</th>
              <th style={thStyle}>Earnings</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr key={rider._id} style={trStyle}>
                <td style={tdStyle}>
                  <strong style={{ color: "#111827", fontSize: "14px", fontWeight: "800" }}>{rider.name}</strong>
                  <span style={subTextStyle}>{rider.phone} • {rider.email}</span>
                </td>
                <td style={tdStyle}>{rider.vehicleType || "Not set"}</td>
                <td style={tdStyle}>
                  <span style={statusBadgeStyle(rider)}>{rider.isSuspended ? "Suspended" : rider.isOnline ? "Online" : "Offline"}</span>
                </td>
                <td style={tdStyle}>{rider.activeOrders || 0}</td>
                <td style={tdStyle}>{rider.totalDeliveries || 0}</td>
                <td style={tdStyle}>{money(rider.totalEarnings)}</td>
                <td style={tdStyle}>
                  <button onClick={() => toggleSuspend(rider)} style={actionBtnStyle(rider.isSuspended)}>
                    {rider.isSuspended ? "Restore ✅" : "Suspend 🚫"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {riders.length === 0 && <div style={emptyStyle}>No riders registered yet.</div>}
      </main>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <article style={{ ...statStyle, borderTop: `4px solid ${accent}` }}>
      <span style={statLabelStyle}>{label}</span>
      <strong style={statValueStyle}>{value}</strong>
    </article>
  );
}

const loadingStyle = { 
  minHeight: "100vh", 
  background: "#F9FAFB", 
  color: "#6B7280", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  fontFamily: "'Outfit','Inter',sans-serif", 
  fontWeight: 800 
};

const pageStyle = { 
  minHeight: "100vh", 
  background: "#F9FAFB", 
  color: "#111827", 
  fontFamily: "'Outfit','Inter',sans-serif", 
  padding: "24px 32px", 
  boxSizing: "border-box" 
};

const headerStyle = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center", 
  gap: 18, 
  paddingBottom: 20, 
  borderBottom: "1.5px solid #E5E7EB", 
  marginBottom: 24 
};

const backBtnStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #E5E7EB", 
  borderRadius: "12px", 
  color: "#374151", 
  fontSize: "13px", 
  fontWeight: "700", 
  padding: "8px 14px", 
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
  transition: "all 0.15s ease" 
};

const titleStyle = { 
  fontSize: 26, 
  fontWeight: "850", 
  margin: "14px 0 0", 
  letterSpacing: "-0.5px" 
};

const refreshBtnStyle = { 
  background: "#FF4D4F", 
  border: "none", 
  borderRadius: "12px", 
  color: "white", 
  fontSize: "13px", 
  fontWeight: "800", 
  padding: "10px 16px", 
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
  transition: "all 0.15s ease" 
};

const errorStyle = { 
  background: "#FEE2E2", 
  border: "1px solid rgba(239, 68, 68, 0.2)", 
  color: "#B91C1C", 
  borderRadius: "14px", 
  padding: "12px 16px", 
  fontSize: "14px", 
  fontWeight: "750",
  marginBottom: 18 
};

const statsGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", 
  gap: 16, 
  marginBottom: 22 
};

const statStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #E5E7EB", 
  borderRadius: 20, 
  padding: 18, 
  display: "flex", 
  flexDirection: "column", 
  gap: 6,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)" 
};

const statLabelStyle = { 
  color: "#6B7280", 
  fontSize: 12, 
  fontWeight: "800", 
  textTransform: "uppercase",
  letterSpacing: "0.5px" 
};

const statValueStyle = { 
  color: "#111827", 
  fontSize: 26,
  fontWeight: "900" 
};

const tableWrapStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #E5E7EB", 
  borderRadius: 24, 
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
  overflowX: "auto" 
};

const tableStyle = { 
  width: "100%", 
  borderCollapse: "collapse", 
  minWidth: 820 
};

const thStyle = { 
  textAlign: "left", 
  padding: "14px 16px", 
  color: "#6B7280", 
  fontSize: 11, 
  textTransform: "uppercase", 
  borderBottom: "1.5px solid #E5E7EB",
  fontWeight: "800" 
};

const trStyle = { 
  borderBottom: "1px solid #F3F4F6",
  transition: "background 0.15s ease" 
};

const tdStyle = { 
  padding: "16px", 
  color: "#374151", 
  fontSize: 13, 
  fontWeight: 700 
};

const subTextStyle = { 
  display: "block", 
  color: "#6B7280", 
  marginTop: 4, 
  fontSize: 12,
  fontWeight: 500 
};

const statusBadgeStyle = (rider) => ({ 
  color: rider.isSuspended ? "#EF4444" : rider.isOnline ? "#10B981" : "#6B7280", 
  background: rider.isSuspended ? "#FEF2F2" : rider.isOnline ? "#F0FDF4" : "#F3F4F6", 
  border: `1.5px solid ${
    rider.isSuspended ? "rgba(239, 68, 68, 0.15)" : rider.isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(107, 114, 128, 0.15)"
  }`,
  borderRadius: 999, 
  padding: "5px 12px", 
  fontWeight: 800,
  fontSize: "11px",
  textTransform: "uppercase",
  display: "inline-block" 
});

const actionBtnStyle = (suspended) => ({ 
  border: "none", 
  borderRadius: 10, 
  padding: "8px 14px", 
  cursor: "pointer", 
  fontWeight: "800", 
  background: suspended ? "#10B981" : "#EF4444", 
  color: "white",
  boxShadow: `0 4px 10px ${suspended ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
  transition: "all 0.15s ease",
  fontSize: "12px"
});

const emptyStyle = { 
  padding: 28, 
  color: "#9CA3AF", 
  textAlign: "center", 
  fontWeight: 700 
};