import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Resolve default marker icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("overview"); // "overview", "rewards", "buycoins", "delivery" or "categories"
  const [buyCoinsAnalytics, setBuyCoinsAnalytics] = useState(null);
  const [buyCoinsTransactions, setBuyCoinsTransactions] = useState([]);
  const [bcAnalyticsLoading, setBcAnalyticsLoading] = useState(false);
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustCoins, setAdjustCoins] = useState("");
  const [adjustType, setAdjustType] = useState("earn"); // "earn", "redeem", "bonus"
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const toggleLateNight = async () => {
    try {
      const token = localStorage.getItem("buyto_token");
      const nextValue = !deliverySettings?.lateNightDeliveryEnabled;
      const res = await fetch(window.API_BASE_URL + "/api/admin/delivery-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          lateNightDeliveryEnabled: nextValue
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDeliverySettings(data.settings);
        }
      } else {
        alert("Failed to update late night delivery toggle");
      }
    } catch (err) {
      console.error(err);
      alert("Error toggling late night delivery");
    }
  };

  const toggleRainy = async () => {
    try {
      const token = localStorage.getItem("buyto_token");
      const nextValue = !deliverySettings?.rainyDeliveryEnabled;
      const res = await fetch(window.API_BASE_URL + "/api/admin/delivery-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rainyDeliveryEnabled: nextValue
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDeliverySettings(data.settings);
        }
      } else {
        alert("Failed to update rainy delivery toggle");
      }
    } catch (err) {
      console.error(err);
      alert("Error toggling rainy delivery");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("buyto_token");

        // Fetch analytics
        const analyticsRes = await fetch(window.API_BASE_URL + "/api/admin/analytics", {
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
        const ordersRes = await fetch(window.API_BASE_URL + "/api/admin/orders", {
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

        // Fetch delivery settings
        const settingsRes = await fetch(window.API_BASE_URL + "/api/admin/delivery-settings", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setDeliverySettings(settingsData);
        }

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

  const fetchBuyCoinsData = async () => {
    try {
      setBcAnalyticsLoading(true);
      const token = localStorage.getItem("buyto_token");
      const [analyticsRes, txRes] = await Promise.all([
        fetch(window.API_BASE_URL + "/api/buycoins/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(window.API_BASE_URL + "/api/buycoins/admin/transactions", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (analyticsRes.ok && txRes.ok) {
        const analyticsData = await analyticsRes.json();
        const txData = await txRes.json();
        if (analyticsData.success && txData.success) {
          setBuyCoinsAnalytics(analyticsData);
          setBuyCoinsTransactions(txData.transactions);
        }
      }
    } catch (err) {
      console.error("Failed to load BuyCoins admin metrics:", err);
    } finally {
      setBcAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "buycoins") {
      fetchBuyCoinsData();
    }
  }, [activeView]);

  const handleAdjustCoins = async (e) => {
    e.preventDefault();
    if (!adjustEmail || !adjustCoins || !adjustReason) {
      alert("All fields are required");
      return;
    }
    
    try {
      setIsAdjusting(true);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/buycoins/admin/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: adjustEmail,
          coins: Number(adjustCoins),
          type: adjustType,
          reason: adjustReason
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Coins adjusted successfully!");
        setAdjustEmail("");
        setAdjustCoins("");
        setAdjustReason("");
        fetchBuyCoinsData();
      } else {
        alert(data.message || "Failed to adjust coins");
      }
    } catch (err) {
      console.error(err);
      alert("Error adjusting coins");
    } finally {
      setIsAdjusting(false);
    }
  };

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
            <button onClick={() => setActiveView("overview")} style={activeView === "overview" ? activeNavLinkStyle : navLinkStyle}>
              📊 Dashboard Overview
            </button>
            <button onClick={() => setActiveView("rewards")} style={activeView === "rewards" ? activeNavLinkStyle : navLinkStyle}>
              🎁 Customer Rewards
            </button>
            <button onClick={() => setActiveView("buycoins")} style={activeView === "buycoins" ? activeNavLinkStyle : navLinkStyle}>
              💰 BuyCoins Management
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
            <button onClick={() => navigate("/admin/support")} style={navLinkStyle}>
              💬 Customer Support
            </button>
            <button onClick={() => setActiveView("delivery")} style={activeView === "delivery" ? activeNavLinkStyle : navLinkStyle}>
              📍 Delivery Services
            </button>
            <button onClick={() => setActiveView("categories")} style={activeView === "categories" ? activeNavLinkStyle : navLinkStyle}>
              🗂️ Navigation Categories
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                ...navLinkStyle,
                marginTop: "12px",
                borderTop: "1px solid #E5E7EB",
                borderRadius: "0",
                paddingTop: "12px",
                color: "#318616",
                fontWeight: "800"
              }}
            >
              🏪 Open Customer App
            </button>
          </div>
        </nav>

        {/* Dashboard Panels */}
        <main style={mainPanelStyle}>
          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}

          {activeView === "overview" && (
            <>
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

              {/* Delivery Settings Card */}
              <div style={cardLayoutStyle}>
                <h3 style={cardTitleStyle}>Delivery Settings</h3>
                <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "4px", lineHeight: "1.5", fontWeight: 500 }}>
                  Manage delivery surcharges dynamically.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                  {/* Late Night Delivery Toggle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>🌙 Late Night Delivery</div>
                      <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                        Apply ₹30 surcharge for orders placed after 10 PM
                      </div>
                    </div>
                    <div
                      onClick={toggleLateNight}
                      style={{
                        width: "50px",
                        height: "26px",
                        background: deliverySettings?.lateNightDeliveryEnabled ? "#318616" : "#E5E7EB",
                        borderRadius: "999px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          background: "white",
                          borderRadius: "50%",
                          position: "absolute",
                          top: "3px",
                          left: deliverySettings?.lateNightDeliveryEnabled ? "27px" : "3px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                          transition: "left 0.2s ease"
                        }}
                      />
                    </div>
                  </div>

                  {/* Rainy Delivery Toggle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>🌧️ Rainy Delivery</div>
                      <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                        Apply ₹30 surcharge during rainy conditions
                      </div>
                    </div>
                    <div
                      onClick={toggleRainy}
                      style={{
                        width: "50px",
                        height: "26px",
                        background: deliverySettings?.rainyDeliveryEnabled ? "#318616" : "#E5E7EB",
                        borderRadius: "999px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          background: "white",
                          borderRadius: "50%",
                          position: "absolute",
                          top: "3px",
                          left: deliverySettings?.rainyDeliveryEnabled ? "27px" : "3px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                          transition: "left 0.2s ease"
                        }}
                      />
                    </div>
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
        </>
      )}

        {activeView === "rewards" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Rewards Statistics Cards */}
            <div style={statsGridStyle}>
              {/* Total Coupons Generated */}
              <div style={statCardStyle("#3b82f6")}>
                <div style={statIconStyle("🎟️", "#eff6ff", "#3b82f6")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>Coupons Issued</span>
                  <span style={statValStyle}>{analytics?.totalCouponsGenerated || 0}</span>
                </div>
              </div>

              {/* Total Coupons Redeemed */}
              <div style={statCardStyle("#10b981")}>
                <div style={statIconStyle("🎁", "#ecfdf5", "#10b981")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>Coupons Redeemed</span>
                  <span style={statValStyle}>{analytics?.totalCouponsRedeemed || 0}</span>
                </div>
              </div>

              {/* Total BuyCoins Issued */}
              <div style={statCardStyle("#fbbf24")}>
                <div style={statIconStyle("🪙", "#fffbeb", "#d97706")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>BuyCoins Issued</span>
                  <span style={statValStyle}>{analytics?.totalBuyCoinsIssued || 0}</span>
                </div>
              </div>

              {/* Total BuyCoins Redeemed */}
              <div style={statCardStyle("#ef4444")}>
                <div style={statIconStyle("🪙", "#fef2f2", "#dc2626")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>BuyCoins Redeemed</span>
                  <span style={statValStyle}>{analytics?.totalBuyCoinsRedeemed || 0}</span>
                </div>
              </div>
            </div>

            {/* Activity Lists Grid */}
            <div style={dashboardDetailsGridStyle}>
              {/* Recent Coupon Activity */}
              <div style={cardLayoutStyle}>
                <div style={cardHeaderStyle}>
                  <h3 style={cardTitleStyle}>Recent Coupon Activity</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>User</th>
                        <th style={thStyle}>Code</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Generated Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!analytics?.recentCoupons || analytics.recentCoupons.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={emptyTdStyle}>No coupon activity recorded.</td>
                        </tr>
                      ) : (
                        analytics.recentCoupons.map((coupon) => {
                          const now = new Date();
                          const isExpired = new Date(coupon.expiryDate) < now;
                          let statusLabel = "Available";
                          let statusColor = "#10b981";
                          let statusBg = "rgba(16, 185, 129, 0.1)";

                          if (coupon.isUsed) {
                            statusLabel = "Used";
                            statusColor = "#64748b";
                            statusBg = "#e2e8f0";
                          } else if (isExpired) {
                            statusLabel = "Expired";
                            statusColor = "#ef4444";
                            statusBg = "rgba(239, 68, 68, 0.1)";
                          }

                          return (
                            <tr key={coupon._id} style={trStyle}>
                              <td style={tdCustomerStyle}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: "800", color: "#111827" }}>{coupon.userId?.name || "Guest"}</span>
                                  <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>{coupon.userId?.phone || ""}</span>
                                </div>
                              </td>
                              <td>
                                  <span style={{ fontFamily: "monospace", fontWeight: "800", color: "#FF4D4F" }}>{coupon.couponCode}</span>
                              </td>
                              <td>
                                <span style={{
                                  fontSize: "10px",
                                  fontWeight: "855",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  color: statusColor,
                                  background: statusBg,
                                  textTransform: "uppercase"
                                }}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>
                                {new Date(coupon.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent BuyCoin Activity */}
              <div style={cardLayoutStyle}>
                <div style={cardHeaderStyle}>
                  <h3 style={cardTitleStyle}>Recent BuyCoin Activity</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>User</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Coins</th>
                        <th style={thStyle}>Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!analytics?.recentBuyCoinOrders || analytics.recentBuyCoinOrders.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={emptyTdStyle}>No BuyCoin activity recorded.</td>
                        </tr>
                      ) : (
                        analytics.recentBuyCoinOrders.map((order) => {
                          const isRedemption = order.buyCoinsRedeemed > 0;
                          const coinAmt = isRedemption ? order.buyCoinsRedeemed : Math.floor(order.totalAmount / 100);
                          return (
                            <tr key={order._id} style={trStyle}>
                              <td style={tdCustomerStyle}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: "800", color: "#111827" }}>{order.user?.name || "Guest"}</span>
                                  <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>{order.user?.phone || ""}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  fontSize: "10px",
                                  fontWeight: "855",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  color: isRedemption ? "#dc2626" : "#16a34a",
                                  background: isRedemption ? "#fef2f2" : "#f0fdf4",
                                  textTransform: "uppercase"
                                }}>
                                  {isRedemption ? "Redeemed" : "Earned"}
                                </span>
                              </td>
                              <td style={{ fontWeight: "800", color: isRedemption ? "#dc2626" : "#16a34a" }}>
                                {isRedemption ? "-" : "+"}{coinAmt} 🪙
                              </td>
                              <td style={{ fontSize: "12px", color: "#6B7280", fontWeight: "700" }}>
                                ₹{order.totalAmount}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "buycoins" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "850", color: "#0f172a", margin: 0 }}>💰 BuyCoins Loyalty Management</h2>

            {/* BuyCoins Analytics Metrics */}
            <div style={statsGridStyle}>
              {/* Total Coins Issued */}
              <div style={statCardStyle("#fbbf24")}>
                <div style={statIconStyle("🪙", "#fffbeb", "#d97706")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>Total Coins Issued</span>
                  <span style={statValStyle}>{buyCoinsAnalytics?.totalIssued || 0}</span>
                </div>
              </div>

              {/* Total Coins Redeemed */}
              <div style={statCardStyle("#ef4444")}>
                <div style={statIconStyle("🛒", "#fef2f2", "#dc2626")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>Total Coins Redeemed</span>
                  <span style={statValStyle}>{buyCoinsAnalytics?.totalRedeemed || 0}</span>
                </div>
              </div>

              {/* Active Wallets */}
              <div style={statCardStyle("#10b981")}>
                <div style={statIconStyle("💼", "#ecfdf5", "#10b981")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>Active Wallets</span>
                  <span style={statValStyle}>{buyCoinsAnalytics?.activeWallets || 0}</span>
                </div>
              </div>

              {/* Coins Expiring Soon */}
              <div style={statCardStyle("#f59e0b")}>
                <div style={statIconStyle("⏳", "#fef3c7", "#d97706")} />
                <div style={statContentStyle}>
                  <span style={statLabelStyle}>Expiring (30 days)</span>
                  <span style={statValStyle}>{buyCoinsAnalytics?.coinsExpiringSoon || 0}</span>
                </div>
              </div>
            </div>

            {/* Grid layout for Adjust Form and Top Customers */}
            <div style={dashboardDetailsGridStyle}>
              {/* Adjust Coins Form */}
              <div style={cardLayoutStyle}>
                <h3 style={cardTitleStyle}>Adjust Customer Coins</h3>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                  Add or deduct loyalty coins for any registered customer.
                </p>
                <form onSubmit={handleAdjustCoins} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "755", color: "#4b5563" }}>Customer Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. customer@example.com"
                      value={adjustEmail}
                      onChange={(e) => setAdjustEmail(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "755", color: "#4b5563" }}>Coins Amount</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 15"
                        value={adjustCoins}
                        onChange={(e) => setAdjustCoins(e.target.value)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          fontWeight: "600"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "755", color: "#4b5563" }}>Adjustment Type</label>
                      <select
                        value={adjustType}
                        onChange={(e) => setAdjustType(e.target.value)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          fontWeight: "650",
                          background: "white"
                        }}
                      >
                        <option value="earn">Add Coins (Earn)</option>
                        <option value="bonus">Add Coins (Bonus)</option>
                        <option value="redeem">Deduct Coins (Redeem)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "755", color: "#4b5563" }}>Reason / Note</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Compensation for delayed order"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAdjusting}
                    style={{
                      background: "linear-gradient(135deg, #318616 0%, #286f12 100%)",
                      color: "white",
                      border: "none",
                      padding: "12px",
                      borderRadius: "12px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: isAdjusting ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
                      marginTop: "10px"
                    }}
                  >
                    {isAdjusting ? "Processing..." : "Apply Adjustment ⚡"}
                  </button>
                </form>
              </div>

              {/* Top Customers Panel */}
              <div style={cardLayoutStyle}>
                <h3 style={cardTitleStyle}>Top Customer Wallets</h3>
                <div style={{ overflowX: "auto", marginTop: "16px" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Customer Email</th>
                        <th style={thStyle}>Available</th>
                        <th style={thStyle}>Lifetime Earned</th>
                        <th style={thStyle}>Lifetime Redeemed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!buyCoinsAnalytics?.topWallets || buyCoinsAnalytics.topWallets.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={emptyTdStyle}>No active wallets recorded.</td>
                        </tr>
                      ) : (
                        buyCoinsAnalytics.topWallets.map((w) => (
                          <tr key={w._id} style={trStyle}>
                            <td style={{ ...tdCustomerStyle, fontWeight: "700" }}>{w.email}</td>
                            <td style={{ fontWeight: "800", color: "#318616" }}>{w.availableCoins} 🪙</td>
                            <td style={{ fontWeight: "600", color: "#6b7280" }}>{w.lifetimeEarned}</td>
                            <td style={{ fontWeight: "600", color: "#ef4444" }}>{w.lifetimeRedeemed}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transactions Log Section */}
            <div style={cardLayoutStyle}>
              <h3 style={cardTitleStyle}>Loyalty Transactions History</h3>
              <div style={{ overflowX: "auto", marginTop: "16px" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date & Time</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Source / Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyCoinsTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={emptyTdStyle}>No loyalty transactions recorded yet.</td>
                      </tr>
                    ) : (
                      buyCoinsTransactions.map((tx) => {
                        const isPositive = ["earn", "bonus"].includes(tx.type);
                        return (
                          <tr key={tx._id} style={trStyle}>
                            <td style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                            <td style={{ fontWeight: "700", color: "#1f2937" }}>
                              {tx.userId?.name || "Guest User"}
                              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500" }}>{tx.email}</div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: "10px",
                                fontWeight: "850",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                color: tx.type === "redeem" ? "#dc2626" : tx.type === "expire" ? "#64748b" : "#16a34a",
                                background: tx.type === "redeem" ? "#fef2f2" : tx.type === "expire" ? "#e2e8f0" : "#f0fdf4",
                                textTransform: "uppercase"
                              }}>
                                {tx.type}
                              </span>
                            </td>
                            <td style={{ fontWeight: "800", color: isPositive ? "#16a34a" : "#dc2626" }}>
                              {isPositive ? "+" : "-"}{tx.coins}
                            </td>
                            <td style={{ fontSize: "12px", color: "#4b5563", fontWeight: "500" }}>
                              {tx.source}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === "delivery" && <DeliveryServicesPanel />}
        {activeView === "categories" && <CategoriesPanel />}
      </main>
    </div>
  </div>
  );
}


// Leaflet Map helper components
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

function MapViewChange({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

function DeliveryServicesPanel() {
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState({
    activeZonesCount: 0,
    totalRadiusCoverage: 0,
    notifyRequestsCount: 0,
    serviceableOrdersToday: 0
  });
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState(13.628);
  const [formLng, setFormLng] = useState(74.693);
  const [formRadius, setFormRadius] = useState(3);
  const [formActive, setFormActive] = useState(true);
  const [editingZoneId, setEditingZoneId] = useState(null);

  const [mapCenter, setMapCenter] = useState([13.628, 74.693]);

  const token = localStorage.getItem("buyto_token");

  const loadData = async () => {
    try {
      setLoading(true);
      const [zonesRes, statsRes, waitlistRes] = await Promise.all([
        fetch(window.API_BASE_URL + "/api/admin/delivery-zones", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(window.API_BASE_URL + "/api/admin/delivery-summary-stats", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(window.API_BASE_URL + "/api/admin/unserviceable-requests", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        setZones(zonesData);
        if (zonesData.length > 0) {
          setMapCenter([zonesData[0].latitude, zonesData[0].longitude]);
          setFormLat(zonesData[0].latitude);
          setFormLng(zonesData[0].longitude);
        }
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (waitlistRes.ok) {
        setWaitlist(await waitlistRes.json());
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading delivery panel data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMapClick = async (coords) => {
    setFormLat(coords[0]);
    setFormLng(coords[1]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`);
      if (res.ok) {
        const data = await res.json();
        setFormAddress(data.display_name || `${coords[0]}, ${coords[1]}`);
      }
    } catch (e) {
      setFormAddress(`${coords[0]}, ${coords[1]}`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formAddress || formLat === undefined || formLng === undefined) {
      alert("Please enter all required fields");
      return;
    }

    const payload = {
      name: formName,
      address: formAddress,
      latitude: Number(formLat),
      longitude: Number(formLng),
      radiusKm: Number(formRadius),
      active: formActive
    };

    try {
      const url = editingZoneId 
        ? `${window.API_BASE_URL}/api/admin/delivery-zones/${editingZoneId}`
        : `${window.API_BASE_URL}/api/admin/delivery-zones`;
      const method = editingZoneId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormName("");
        setFormAddress("");
        setEditingZoneId(null);
        loadData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save delivery zone");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving delivery zone");
    }
  };

  const handleEdit = (zone) => {
    setEditingZoneId(zone._id);
    setFormName(zone.name);
    setFormAddress(zone.address);
    setFormLat(zone.latitude);
    setFormLng(zone.longitude);
    setFormRadius(zone.radiusKm);
    setFormActive(zone.active);
    setMapCenter([zone.latitude, zone.longitude]);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/delivery-zones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Failed to delete zone");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (zone) => {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/delivery-zones/${zone._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !zone.active })
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Failed to toggle status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        Loading Delivery Services Panel...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Delivery Summary Metrics */}
      <div style={statsGridStyle}>
        <div style={statCardStyle("#3b82f6")}>
          <div style={statIconStyle("📍", "#eff6ff", "#3b82f6")} />
          <div style={statContentStyle}>
            <span style={statLabelStyle}>Active Zones</span>
            <span style={statValStyle}>{stats.activeZonesCount}</span>
          </div>
        </div>

        <div style={statCardStyle("#10b981")}>
          <div style={statIconStyle("📏", "#ecfdf5", "#10b981")} />
          <div style={statContentStyle}>
            <span style={statLabelStyle}>Total Radius Coverage</span>
            <span style={statValStyle}>{stats.totalRadiusCoverage} KM</span>
          </div>
        </div>

        <div style={statCardStyle("#fbbf24")}>
          <div style={statIconStyle("📩", "#fffbeb", "#d97706")} />
          <div style={statContentStyle}>
            <span style={statLabelStyle}>Notify Me Requests</span>
            <span style={statValStyle}>{stats.notifyRequestsCount}</span>
          </div>
        </div>

        <div style={statCardStyle("#8b5cf6")}>
          <div style={statIconStyle("✅", "#f5f3ff", "#7c3aed")} />
          <div style={statContentStyle}>
            <span style={statLabelStyle}>Serviceable Orders Today</span>
            <span style={statValStyle}>{stats.serviceableOrdersToday}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "start" }}>
        {/* Left Side: Map and Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Map Container */}
          <div style={cardLayoutStyle}>
            <h3 style={cardTitleStyle}>📍 Zone Area Visualizer</h3>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 12px 0" }}>
              Click on the map to drop a marker and define a service center location.
            </p>
            <div style={{ height: "320px", borderRadius: "16px", overflow: "hidden", border: "1px solid #E5E7EB", position: "relative", zIndex: 1 }}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                <MapViewChange center={mapCenter} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                <MapClickHandler onMapClick={handleMapClick} />
                <Marker position={[formLat, formLng]} draggable={true} eventHandlers={{
                  dragend: async (e) => {
                    const pos = e.target.getLatLng();
                    handleMapClick([pos.lat, pos.lng]);
                  }
                }} />
                {/* Real-time Radius Circle visualization */}
                <Circle center={[formLat, formLng]} radius={formRadius * 1000} pathOptions={{ color: "#FF4D4F", fillColor: "#FF4D4F", fillOpacity: 0.2 }} />
                {/* Circles for other active zones */}
                {zones.filter(z => z.active && z._id !== editingZoneId).map(zone => (
                  <Circle key={zone._id} center={[zone.latitude, zone.longitude]} radius={zone.radiusKm * 1000} pathOptions={{ color: "#10B981", fillColor: "#10B981", fillOpacity: 0.1 }} />
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Form */}
          <div style={cardLayoutStyle}>
            <h3 style={cardTitleStyle}>{editingZoneId ? "✏️ Edit Delivery Location" : "➕ Add Delivery Location"}</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Location Name *</label>
                <input type="text" placeholder="e.g. Kundapura Central Hub" value={formName} onChange={(e) => setFormName(e.target.value)} style={inputStyle} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Address *</label>
                <input type="text" placeholder="Coordinates resolved address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} style={inputStyle} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Latitude</label>
                  <input type="number" step="any" value={formLat} onChange={(e) => setFormLat(Number(e.target.value))} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Longitude</label>
                  <input type="number" step="any" value={formLng} onChange={(e) => setFormLng(Number(e.target.value))} style={inputStyle} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Radius (KM) *</label>
                  <input type="number" step="any" min="0.1" value={formRadius} onChange={(e) => setFormRadius(Number(e.target.value))} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Status</label>
                  <select value={formActive ? "true" : "false"} onChange={(e) => setFormActive(e.target.value === "true")} style={inputStyle}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="submit" style={{ ...quickBtnStyle, background: "#318616", color: "white", flex: 1, padding: "12px", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                  {editingZoneId ? "Update Zone" : "Create Zone"}
                </button>
                {editingZoneId && (
                  <button type="button" onClick={() => {
                    setEditingZoneId(null);
                    setFormName("");
                    setFormAddress("");
                  }} style={{ ...quickBtnStyle, flex: 1, padding: "12px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Zone Management & Waitlist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Zones Table */}
          <div style={cardLayoutStyle}>
            <h3 style={cardTitleStyle}>📍 Managed Delivery Zones</h3>
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Radius</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={emptyTdStyle}>No delivery zones created.</td>
                    </tr>
                  ) : (
                    zones.map(zone => (
                      <tr key={zone._id} style={trStyle}>
                        <td style={{ fontWeight: "700", fontSize: "13px" }}>{zone.name}</td>
                        <td style={{ fontSize: "13px" }}>{zone.radiusKm} KM</td>
                        <td>
                          <button onClick={() => handleToggleActive(zone)} style={{
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                            background: zone.active ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
                            color: zone.active ? "#10B981" : "#6B7280"
                          }}>
                            {zone.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => handleEdit(zone)} style={{ border: "none", background: "transparent", color: "#3b82f6", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                            <button onClick={() => handleDelete(zone._id)} style={{ border: "none", background: "transparent", color: "#ef4444", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waitlist requests Table */}
          <div style={cardLayoutStyle}>
            <h3 style={cardTitleStyle}>📩 Waitlist Requests</h3>
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={emptyTdStyle}>No waitlist entries yet.</td>
                    </tr>
                  ) : (
                    waitlist.map(req => (
                      <tr key={req._id} style={trStyle}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "800", color: "#111827", fontSize: "13px" }}>{req.name}</span>
                            <span style={{ fontSize: "11px", color: "#6B7280" }}>{req.email}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: "12px" }}>{req.phone}</td>
                        <td style={{ fontSize: "12px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={req.address}>{req.address}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(0);
  const [image, setImage] = useState("");
  const [icon, setIcon] = useState("");
  const [showInHeader, setShowInHeader] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const token = localStorage.getItem("buyto_token");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(window.API_BASE_URL + "/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) {
      alert("Name is required");
      return;
    }

    const body = {
      name,
      priority: Number(priority),
      image,
      icon,
      showInHeader
    };

    try {
      const url = editingCategoryId
        ? `${window.API_BASE_URL}/api/admin/categories/${editingCategoryId}`
        : `${window.API_BASE_URL}/api/admin/categories`;
      const method = editingCategoryId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(editingCategoryId ? "Category updated successfully" : "Category created successfully");
        resetForm();
        loadCategories();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save category");
      }
    } catch (err) {
      console.error("Error saving category:", err);
      alert("Error saving category");
    }
  };

  const handleEdit = (category) => {
    setEditingCategoryId(category._id);
    setName(category.name || "");
    setPriority(category.priority || 0);
    setImage(category.image || "");
    setIcon(category.icon || "");
    setShowInHeader(category.showInHeader !== undefined ? category.showInHeader : true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Category deleted successfully");
        loadCategories();
      } else {
        alert("Failed to delete category");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Error deleting category");
    }
  };

  const handleToggleShow = async (category) => {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/categories/${category._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ showInHeader: !category.showInHeader })
      });
      if (res.ok) {
        loadCategories();
      } else {
        alert("Failed to update visibility");
      }
    } catch (err) {
      console.error("Error toggling visibility:", err);
    }
  };

  const resetForm = () => {
    setEditingCategoryId(null);
    setName("");
    setPriority(0);
    setImage("");
    setIcon("");
    setShowInHeader(true);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        Loading Categories...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "28px", alignItems: "start" }}>
      {/* Left side: Form */}
      <div style={cardLayoutStyle}>
        <h3 style={cardTitleStyle}>{editingCategoryId ? "✏️ Edit Navigation Category" : "➕ Add Navigation Category"}</h3>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Category Name *</label>
            <input type="text" placeholder="e.g. Fresh Items" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Icon / Emoji (Optional)</label>
            <input type="text" placeholder="e.g. 🥬" value={icon} onChange={(e) => setIcon(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Image URL (Optional)</label>
            <input type="text" placeholder="e.g. https://example.com/fresh.png" value={image} onChange={(e) => setImage(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>Priority Order (Higher = first)</label>
            <input type="number" placeholder="e.g. 100" value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
            <input
              type="checkbox"
              id="showInHeader"
              checked={showInHeader}
              onChange={(e) => setShowInHeader(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#318616" }}
            />
            <label htmlFor="showInHeader" style={{ fontSize: "13px", fontWeight: "700", color: "#374151", cursor: "pointer" }}>
              Show in Header Navigation Bar
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button
              type="submit"
              style={{
                flex: 1,
                background: "#318616",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                fontWeight: "750",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              {editingCategoryId ? "Update Category" : "Create Category"}
            </button>
            {editingCategoryId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: "750",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right side: List */}
      <div style={cardLayoutStyle}>
        <h3 style={cardTitleStyle}>🗂️ Navigation Categories</h3>
        <p style={{ color: "#6b7280", fontSize: "12px", margin: "4px 0 16px 0" }}>
          Active and core categories displayed in the storefront's navigation bar.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Header Vis.</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" style={emptyTdStyle}>No categories found.</td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat._id} style={trStyle}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "20px" }}>{cat.icon || "📦"}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "800", color: "#111827" }}>{cat.name}</span>
                          {cat.image && <span style={{ fontSize: "10px", color: "#6B7280", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "150px", whiteSpace: "nowrap" }}>{cat.image}</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: "700" }}>{cat.priority || 0}</td>
                    <td>
                      <button
                        onClick={() => handleToggleShow(cat)}
                        style={{
                          background: cat.showInHeader ? "#E8F5E9" : "#FFEBEE",
                          color: cat.showInHeader ? "#2E7D32" : "#C62828",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        {cat.showInHeader ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(cat)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1.5px solid #E5E7EB",
  fontSize: "14px",
  fontWeight: "500",
  outline: "none",
  boxSizing: "border-box"
};

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