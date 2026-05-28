import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("buyto_token");

        // Fetch analytics
        const analyticsRes = await fetch("http://localhost:8000/api/admin/analytics", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!analyticsRes.ok) {
          const status = analyticsRes.status;
          let errMsg = "Failed to load analytics";
          try {
            const errData = await analyticsRes.json();
            errMsg = errData.message || errMsg;
          } catch (e) {}
          console.error("=== [FRONTEND ANALYTICS FETCH ERROR] ===");
          console.error("Status Code:", status);
          console.error("Response Message:", errMsg);
          throw new Error(errMsg);
        }
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);

        // Fetch recent orders
        const ordersRes = await fetch("http://localhost:8000/api/admin/orders", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!ordersRes.ok) {
          const status = ordersRes.status;
          let errMsg = "Failed to load orders";
          try {
            const errData = await ordersRes.json();
            errMsg = errData.message || errMsg;
          } catch (e) {}
          console.error("=== [FRONTEND ORDERS FETCH ERROR] ===");
          console.error("Status Code:", status);
          console.error("Response Message:", errMsg);
          throw new Error(errMsg);
        }
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.slice(0, 5)); // Keep latest 5 orders

        setLoading(false);
      } catch (err) {
        console.error("=== [FRONTEND DASHBOARD NETWORK ERROR] ===");
        console.error("Network / Load Error:", err.message);
        setError(err.message || "Something went wrong loading dashboard details.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <span style={{ color: "#6B7280", fontWeight: "600", fontSize: "16px" }}>Analyzing Buyto Metrics...</span>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      {/* Top Navbar */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <h1 style={titleStyle}>Buyto Admin Dashboard</h1>
          <span style={badgeStyle}>Instant Mode</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={storefrontBtnStyle}>
            🏪 Live Storefront
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div style={contentGridStyle}>
        {/* Navigation Sidebar */}
        <nav style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={avatarStyle}>AD</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#111827", fontWeight: "800", fontSize: "14px" }}>Admin Control</span>
              <span style={{ color: "#6B7280", fontSize: "12px", fontWeight: "600" }}>Administrator</span>
            </div>
          </div>
          
          <div style={navGroupStyle}>
            <button onClick={() => navigate("/admin")} style={activeNavLinkStyle}>
              📊 Dashboard
            </button>
            <button onClick={() => navigate("/admin/orders")} style={navLinkStyle}>
              📦 Orders Lifecycle
            </button>
            <button onClick={() => navigate("/admin/products")} style={navLinkStyle}>
              🍎 Inventory Catalog
            </button>
            <button onClick={() => navigate("/admin/riders")} style={navLinkStyle}>
              🛵 Riders Management
            </button>
          </div>
        </nav>

        {/* Dashboard Panels */}
        <main style={mainPanelStyle}>
          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}

          {/* Aggregated Analytics Metric Cards */}
          <div style={statsGridStyle}>
            {/* Sales Card */}
            <div style={statCardStyle("#FF4D4F")}>
              <div style={statIconStyle("💰", "#FFF1F0", "#FF4D4F")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Total Sales</span>
                <span style={statValStyle}>₹{analytics?.totalSales || 0}</span>
              </div>
            </div>

            {/* Today Orders */}
            <div style={statCardStyle("#22C55E")}>
              <div style={statIconStyle("⚡", "#F0FDF4", "#22C55E")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Orders Today</span>
                <span style={statValStyle}>{analytics?.ordersToday || 0}</span>
              </div>
            </div>

            {/* Pending Orders */}
            <div style={statCardStyle("#F59E0B")}>
              <div style={statIconStyle("⏳", "#FEF3C7", "#F59E0B")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Active Processing</span>
                <span style={statValStyle}>{analytics?.pendingOrders || 0}</span>
              </div>
            </div>

            {/* Total Products */}
            <div style={statCardStyle("#6366F1")}>
              <div style={statIconStyle("🛍️", "#EEF2FF", "#6366F1")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Catalog Products</span>
                <span style={statValStyle}>{analytics?.totalProducts || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div style={dashboardDetailsGridStyle}>
            {/* Recent Orders Section */}
            <div style={cardLayoutStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>Recent Transactions</h3>
                <button onClick={() => navigate("/admin/orders")} style={viewAllBtnStyle}>
                  View All Orders →
                </button>
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Order ID</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Payment</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={emptyTdStyle}>No recent orders recorded.</td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order._id} style={trStyle}>
                          <td style={tdIdStyle}>{order._id.substring(order._id.length - 8)}</td>
                          <td style={tdCustomerStyle}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: "800", color: "#111827" }}>{order.user?.name}</span>
                              <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>{order.user?.phone}</span>
                            </div>
                          </td>
                          <td style={tdAmountStyle}>₹{order.totalAmount}</td>
                          <td>
                            <span style={payBadgeStyle(order.paymentStatus)}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <span style={statusBadgeStyle(order.orderStatus)}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td style={tdDateStyle}>{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={cardLayoutStyle}>
                <h3 style={cardTitleStyle}>Store Operations</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <div style={storeInfoRowStyle}>
                    <span style={{ color: "#6B7280", fontWeight: 600 }}>Delivered Orders</span>
                    <span style={storeInfoValStyle(analytics?.deliveredOrders > 0 ? "#10B981" : "#6B7280")}>
                      {analytics?.deliveredOrders || 0}
                    </span>
                  </div>
                  <div style={storeInfoRowStyle}>
                    <span style={{ color: "#6B7280", fontWeight: 600 }}>Store Status</span>
                    <span style={storeInfoValStyle("#10B981")}>🟢 ONLINE</span>
                  </div>
                  <div style={storeInfoRowStyle}>
                    <span style={{ color: "#6B7280", fontWeight: 600 }}>System Mode</span>
                    <span style={{ color: "#FF4D4F", fontWeight: "800", fontSize: "13px" }}>Production Ready</span>
                  </div>
                </div>
              </div>

              <div style={cardLayoutStyle}>
                <h3 style={cardTitleStyle}>Quick Controls</h3>
                <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "4px", lineHeight: "1.5", fontWeight: 500 }}>
                  Directly modify products catalog stock, add variants, or update order dispatch details.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                  <button onClick={() => navigate("/admin/orders")} style={quickBtnStyle}>
                    📦 Dispatch Orders
                  </button>
                  <button onClick={() => navigate("/admin/products")} style={quickBtnStyle}>
                    🍎 Restock Products
                  </button>
                  <button onClick={() => navigate("/admin/riders")} style={quickBtnStyle}>
                    🛵 Manage Riders
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// STYLES
const loadingContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
};

const spinnerStyle = {
  width: "50px",
  height: "50px",
  border: "4px solid rgba(255, 77, 79, 0.1)",
  borderTop: "4px solid #FF4D4F",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const pageContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  color: "#111827",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "24px 32px",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "20px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "24px",
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  letterSpacing: "-0.5px",
  margin: 0,
};

const badgeStyle = {
  background: "#FFF1F0",
  color: "#FF4D4F",
  border: "1px solid rgba(255, 77, 79, 0.15)",
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase",
};

const storefrontBtnStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
  padding: "8px 16px",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
  transition: "all 0.15s ease",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "250px 1fr",
  gap: "28px",
  alignItems: "start",
};

const sidebarStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const sidebarHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "16px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "16px",
};

const avatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #FF4D4F 0%, #FF6B6B 100%)",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const navGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const activeNavLinkStyle = {
  background: "#FF4D4F",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "800",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
};

const navLinkStyle = {
  background: "transparent",
  color: "#4B5563",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "700",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const mainPanelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const errorBannerStyle = {
  background: "#FEE2E2",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#B91C1C",
  borderRadius: "14px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "750",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
};

const statCardStyle = (accentColor) => ({
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderTop: `4px solid ${accentColor}`,
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
  cursor: "default",
});

const statIconStyle = (emoji, bg, color) => ({
  fontSize: "24px",
  width: "50px",
  height: "50px",
  borderRadius: "14px",
  background: bg,
  color: color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const statContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const statLabelStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const statValStyle = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#111827",
};

const dashboardDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "24px",
};

const cardLayoutStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: "800",
  color: "#111827",
};

const viewAllBtnStyle = {
  background: "none",
  border: "none",
  color: "#FF4D4F",
  fontSize: "13px",
  fontWeight: "750",
  cursor: "pointer",
  padding: 0,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  color: "#374151",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "1.5px solid #E5E7EB",
  color: "#6B7280",
  fontWeight: "800",
  textTransform: "uppercase",
  fontSize: "11px",
};

const trStyle = {
  borderBottom: "1px solid #F3F4F6",
  transition: "background 0.15s ease",
};

const tdIdStyle = {
  padding: "14px 16px",
  fontWeight: "700",
  color: "#FF4D4F",
  fontFamily: "monospace",
};

const tdCustomerStyle = {
  padding: "14px 16px",
};

const tdAmountStyle = {
  padding: "14px 16px",
  fontWeight: "800",
  color: "#111827",
};

const emptyTdStyle = {
  padding: "30px",
  textAlign: "center",
  color: "#9CA3AF",
  fontWeight: "700",
};

const payBadgeStyle = (status) => ({
  display: "inline-block",
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase",
  background:
    status === "Paid"
      ? "#F0FDF4"
      : status === "Pending"
      ? "#FEF3C7"
      : "#FEF2F2",
  color:
    status === "Paid"
      ? "#10B981"
      : status === "Pending"
      ? "#F59E0B"
      : "#EF4444",
  border: `1.5px solid ${
    status === "Paid"
      ? "rgba(16, 185, 129, 0.15)"
      : status === "Pending"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)"
  }`,
});

const statusBadgeStyle = (status) => ({
  display: "inline-block",
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase",
  background:
    status === "Delivered"
      ? "#F0FDF4"
      : status === "Cancelled"
      ? "#FEF2F2"
      : "#EFF6FF",
  color:
    status === "Delivered"
      ? "#10B981"
      : status === "Cancelled"
      ? "#EF4444"
      : "#3B82F6",
  border: `1.5px solid ${
    status === "Delivered"
      ? "rgba(16, 185, 129, 0.15)"
      : status === "Cancelled"
      ? "rgba(239, 68, 68, 0.15)"
      : "rgba(59, 130, 246, 0.15)"
  }`,
});

const tdDateStyle = {
  padding: "14px 16px",
  color: "#6B7280",
  fontWeight: "600",
};

const storeInfoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  paddingBottom: "8px",
  borderBottom: "1.5px solid #F3F4F6",
};

const storeInfoValStyle = (color) => ({
  color: color,
  fontWeight: "800",
  fontSize: "13px",
});

const quickBtnStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
  padding: "10px 14px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  textAlign: "left",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
};
