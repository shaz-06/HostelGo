import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveUser, setLiveUser] = useState(user);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return (tab && ["orders", "coupons", "wallet"].includes(tab)) ? tab : "orders";
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [wallet, setWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["orders", "coupons", "wallet"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [window.location.search]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchLiveUser = async () => {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setLiveUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live profile:", err);
      }
    };

    const fetchCoupons = async () => {
      try {
        setCouponsLoading(true);
        const res = await fetch(window.API_BASE_URL + "/api/auth/coupons", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.coupons) {
            setCoupons(data.coupons);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user coupons:", err);
      } finally {
        setCouponsLoading(false);
      }
    };

    fetchLiveUser();
    fetchCoupons();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchWallet = async () => {
      try {
        setWalletLoading(true);
        const res = await fetch(window.API_BASE_URL + "/api/buycoins/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setWallet(data.wallet);
            setWalletTransactions(data.transactions);
          }
        }
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [token, activeTab]);

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(window.API_BASE_URL + "/api/orders/my-orders", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to fetch order history");
        const data = await res.json();
        setOrders(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Unable to load order history.");
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token]);

  const handleLogoutClick = () => {
    logout();
    navigate("/");
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "Order Placed": return "20%";
      case "Preparing": return "40%";
      case "Packed": return "55%";
      case "Rider Assigned": return "70%";
      case "Out for Delivery": return "85%";
      case "Delivered": return "100%";
      default: return "0%";
    }
  };

  const getProgressColor = (status) => {
    if (status === "Cancelled") return "#ef4444";
    return "#FF4D4F";
  };

  return (
    <div style={pageContainerStyle}>
      <div style={layoutGridStyle(windowWidth < 768)}>

        {/* User Card */}
        <aside style={userCardStyle(windowWidth < 768)}>
          <div style={avatarStyle}>
            {liveUser?.name?.substring(0, 2).toUpperCase() || "US"}
          </div>
          <h2 style={userNameStyle}>{liveUser?.name}</h2>
          <span style={roleBadgeStyle}>{liveUser?.role?.toUpperCase()}</span>

          <div style={infoGroupStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Email</span>
              <span style={infoValStyle}>{liveUser?.email}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Phone</span>
              <span style={infoValStyle}>{liveUser?.phone}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "24px" }}>
            {liveUser?.role === "admin" && (
              <button onClick={() => navigate("/admin")} style={adminPanelBtnStyle}>
                🛡️ Admin Dashboard
              </button>
            )}
            <button onClick={() => navigate("/")} style={homeBtnStyle}>
              🏪 Back to Store
            </button>
            <button
              onClick={() => navigate("/about")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              ℹ️ About Buyto
            </button>

            <button
              onClick={() => navigate("/contact")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              📞 Contact Us
            </button>

            <button
              onClick={() => navigate("/privacy-policy")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              🔒 Privacy Policy
            </button>

            <button
              onClick={() => navigate("/terms")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              📜 Terms & Conditions
            </button>

            <button
              onClick={() => navigate("/refund-policy")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              💸 Refund Policy
            </button>

            <button
              onClick={() => navigate("/shipping-policy")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              🚚 Shipping Policy
            </button>

            <button
              onClick={() => navigate("/faq")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              ❓ FAQ
            </button>

            <button onClick={handleLogoutClick} style={logoutBtnStyle}>
              🚪 Log Out
            </button>
          </div>
        </aside>

        {/* Order History */}
        <main style={ordersPanelStyle}>
          {/* Tabs Navigation */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px" }}>
            <button
              onClick={() => setActiveTab("orders")}
              style={{
                background: activeTab === "orders" ? "linear-gradient(135deg, #FF4D4F, #E03E40)" : "transparent",
                color: activeTab === "orders" ? "white" : "#64748b",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontWeight: "755",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: activeTab === "orders" ? "0 4px 12px rgba(255, 77, 79, 0.15)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              📦 My Orders
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              style={{
                background: activeTab === "coupons" ? "linear-gradient(135deg, #FF4D4F, #E03E40)" : "transparent",
                color: activeTab === "coupons" ? "white" : "#64748b",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontWeight: "755",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: activeTab === "coupons" ? "0 4px 12px rgba(255, 77, 79, 0.15)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              🎁 My Coupons
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              style={{
                background: activeTab === "wallet" ? "linear-gradient(135deg, #FF4D4F, #E03E40)" : "transparent",
                color: activeTab === "wallet" ? "white" : "#64748b",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontWeight: "755",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: activeTab === "wallet" ? "0 4px 12px rgba(255, 77, 79, 0.15)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              🪙 BuyCoins Wallet
            </button>
          </div>

          {activeTab === "orders" && (
            <>
              <h2 style={panelTitleStyle}>My Order History ⚡</h2>

              {loading ? (
                <div style={loadingStyle}>Loading order logs...</div>
              ) : error ? (
                <div style={errorStyle}>⚠️ {error}</div>
              ) : orders.length === 0 ? (
                <div style={emptyOrdersStyle}>
                  <span style={{ fontSize: "36px" }}>🛒</span>
                  <h3 style={{ margin: "12px 0 6px 0", color: "#0f172a" }}>No Orders Placed Yet</h3>
                  <p style={{ color: "#64748b", fontSize: "13px" }}>Your online and COD orders will appear here after purchase.</p>
                  <button onClick={() => navigate("/")} style={shopBtnStyle}>
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div style={ordersListStyle}>
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      style={orderCardStyle}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.06)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.03)";
                      }}
                    >
                      <div style={orderHeaderStyle}>
                        <div>
                          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "800" }}>ORDER ID: </span>
                          <span style={orderIdStyle}>{order._id.substring(order._id.length - 8)}</span>
                          <span style={orderDateStyle}>
                            • {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span style={payBadgeStyle(order.paymentStatus)}>
                            {order.paymentStatus}
                          </span>
                          <span style={statusBadgeStyle(order.orderStatus)}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Products ordered list */}
                      <div style={itemsListStyle}>
                        {order.products?.map((item, idx) => (
                          <div key={idx} style={itemRowStyle}>
                            <span style={{ color: "#0f172a", fontWeight: "700" }}>{item.name}</span>
                            <span style={{ color: "#64748b" }}>{item.weight}</span>
                            <span style={{ color: "#FF4D4F", fontWeight: "800" }}>x{item.quantity}</span>
                            <span style={{ color: "#0f172a", fontWeight: "750" }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary amount */}
                      <div style={summaryRowStyle}>
                        <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>
                          Method: {order.paymentMethod?.toUpperCase()}
                        </span>
                        <span style={{ color: "#0f172a", fontSize: "16px", fontWeight: "855" }}>
                          Paid Total: ₹{order.totalAmount}
                        </span>
                      </div>

                      {/* Visual tracker progress bar */}
                      {order.orderStatus !== "Cancelled" && (
                        <div style={trackerContainerStyle}>
                          <div style={trackerLabelsStyle}>
                            <span style={trackerLabelStyle("Order Placed", order.orderStatus)}>Placed</span>
                            <span style={trackerLabelStyle("Preparing", order.orderStatus)}>Preparing</span>
                            <span style={trackerLabelStyle("Packed", order.orderStatus)}>Packed</span>
                            <span style={trackerLabelStyle("Rider Assigned", order.orderStatus)}>Rider</span>
                            <span style={trackerLabelStyle("Out for Delivery", order.orderStatus)}>Dispatched</span>
                            <span style={trackerLabelStyle("Delivered", order.orderStatus)}>Delivered</span>
                          </div>
                          <div style={progressBarBgStyle}>
                            <div style={progressBarFillStyle(getProgressWidth(order.orderStatus), getProgressColor(order.orderStatus))} />
                          </div>
                        </div>
                      )}

                      {order.orderStatus === "Cancelled" && (
                        <div style={cancelledBannerStyle}>
                          ❌ This order was cancelled.
                        </div>
                      )}
                      {order.orderStatus !== "Cancelled" && (
                        <button onClick={() => navigate(`/track-order/${order._id}`)} style={trackBtnStyle}>
                          Track Live Order
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "coupons" && (
            <>
              <h2 style={panelTitleStyle}>My Coupons 🎁</h2>
              {couponsLoading ? (
                <div style={loadingStyle}>Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div style={emptyOrdersStyle}>
                  <span style={{ fontSize: "36px" }}>🎟️</span>
                  <h3 style={{ margin: "12px 0 6px 0", color: "#0f172a" }}>No Coupons Available</h3>
                  <p style={{ color: "#64748b", fontSize: "13px" }}>You will unlock an AGAIN15 coupon after your first order is delivered!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginTop: "16px" }}>
                  {coupons.map((coupon) => {
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

                    const expiryHoursLeft = Math.max(0, Math.round((new Date(coupon.expiryDate) - now) / (1000 * 60 * 60)));

                    return (
                      <div
                        key={coupon._id}
                        style={{
                          background: "white",
                          border: "1.5px solid #e2e8f0",
                          borderRadius: "20px",
                          padding: "20px",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <span style={{
                            fontFamily: "monospace",
                            fontWeight: "800",
                            fontSize: "14px",
                            color: "#FF4D4F",
                            background: "rgba(255, 77, 79, 0.08)",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}>
                            {coupon.couponCode}
                          </span>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "850",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            color: statusColor,
                            background: statusBg,
                            textTransform: "uppercase"
                          }}>
                            {statusLabel}
                          </span>
                        </div>

                        <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "850", color: "#0f172a" }}>
                          ₹{coupon.discountAmount} OFF
                        </h3>
                        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                          Minimum Order: ₹{coupon.minimumOrderValue || coupon.minOrderValue || 149}
                        </p>

                        <div style={{
                          borderTop: "1px dashed #e2e8f0",
                          paddingTop: "12px",
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "500",
                          display: "flex",
                          justifyContent: "space-between"
                        }}>
                          <span>Status:</span>
                          <span style={{ fontWeight: "700", color: isExpired || coupon.isUsed ? "#64748b" : "#e03e40" }}>
                            {coupon.isUsed ? "Redeemed" : isExpired ? "Expired" : `Expires in ${expiryHoursLeft} Hours`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "wallet" && (
            <>
              <h2 style={panelTitleStyle}>BuyCoins Wallet 🪙</h2>
              <div style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 10px 25px rgba(245, 158, 11, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
                marginTop: "16px",
                border: "1.5px solid #fbbf24"
              }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#b45309", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Current Balance
                  </span>
                  <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#78350f", margin: "4px 0 0 0" }}>
                    {wallet ? wallet.availableCoins : (liveUser?.buyCoins || 0)} Coins
                  </h1>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#b45309", marginTop: "2px", display: "inline-block" }}>
                    Current Value: ₹{wallet ? wallet.availableCoins : (liveUser?.buyCoins || 0)}
                  </span>
                </div>
                <span style={{ fontSize: "56px" }}>🪙</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{
                  background: "white",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Lifetime Earned</span>
                  <span style={{ fontSize: "24px", fontWeight: "900", color: "#10b981" }}>
                    {wallet ? wallet.lifetimeEarned : (liveUser?.buyCoinsLifetimeEarned || 0)} Coins
                  </span>
                </div>

                <div style={{
                  background: "white",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Redeemed Coins</span>
                  <span style={{ fontSize: "24px", fontWeight: "900", color: "#FF4D4F" }}>
                    {wallet ? wallet.lifetimeRedeemed : (liveUser?.buyCoinsRedeemed || 0)} Coins
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "32px", marginBottom: "16px" }}>
                Recent Activity ⚡
              </h3>

              {walletLoading ? (
                <div style={{ color: "#64748b", fontSize: "13px", padding: "12px 0" }}>Loading activity...</div>
              ) : walletTransactions.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "13px", padding: "12px 0", fontStyle: "italic" }}>
                  No recent BuyCoins activity.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {walletTransactions.map((tx) => {
                    const isPositive = ["earn", "bonus"].includes(tx.type);
                    let displayDesc = "";
                    if (tx.type === "earn") {
                      displayDesc = `Order #${tx.orderId ? tx.orderId.substring(tx.orderId.length - 6).toUpperCase() : "N/A"}`;
                    } else if (tx.type === "bonus") {
                      displayDesc = tx.source === "first_order_bonus" ? "First Order Bonus" : "Manual Adjustment Bonus";
                    } else if (tx.type === "redeem") {
                      displayDesc = `Redeemed on Order #${tx.orderId ? tx.orderId.substring(tx.orderId.length - 6).toUpperCase() : "N/A"}`;
                    } else if (tx.type === "expire") {
                      displayDesc = "Expired";
                    }

                    return (
                      <div
                        key={tx._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 18px",
                          borderRadius: "16px",
                          background: "#f8fafc",
                          border: "1px solid #f1f5f9"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "750", color: "#1f2937" }}>
                            {displayDesc}
                          </span>
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: "900",
                            color: isPositive ? "#10b981" : "#ef4444"
                          }}
                        >
                          {isPositive ? "+" : "-"}{tx.coins}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}

// STYLES
const pageContainerStyle = {
  minHeight: "100vh",
  background: "transparent",
  color: "#0f172a",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "40px 24px",
  boxSizing: "border-box",
};

const layoutGridStyle = (isMobile) => ({
  maxWidth: "960px",
  margin: "0 auto",
  display: isMobile ? "flex" : "grid",
  flexDirection: isMobile ? "column" : "row",
  gridTemplateColumns: isMobile ? "none" : "300px 1fr",
  gap: "32px",
  alignItems: "start",
  width: "100%",
});

const userCardStyle = (isMobile) => ({
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "28px",
  padding: "32px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: isMobile ? "100%" : "300px",
});

const avatarStyle = {
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #FF4D4F 0%, #E03E40 100%)",
  color: "white",
  fontWeight: "800",
  fontSize: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
  boxShadow: "0 8px 24px rgba(255, 77, 79, 0.15)",
};

const userNameStyle = {
  fontSize: "20px",
  fontWeight: "850",
  margin: "0 0 6px 0",
  color: "#0f172a",
  textAlign: "center",
};

const roleBadgeStyle = {
  fontSize: "10px",
  fontWeight: "750",
  padding: "3px 8px",
  borderRadius: "6px",
  background: "rgba(255, 77, 79, 0.1)",
  color: "#FF4D4F",
  marginBottom: "24px",
  letterSpacing: "0.5px",
};

const infoGroupStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  borderTop: "1px solid #f1f5f9",
  paddingTop: "20px",
};

const infoRowStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const infoLabelStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const infoValStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#334155",
};

const adminPanelBtnStyle = {
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  height: "44px",
  fontSize: "13px",
  fontWeight: "750",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
};

const homeBtnStyle = {
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  borderRadius: "12px",
  height: "44px",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const logoutBtnStyle = {
  background: "transparent",
  border: "1.5px solid rgba(239, 68, 68, 0.5)",
  color: "#ef4444",
  borderRadius: "12px",
  height: "44px",
  fontSize: "13px",
  fontWeight: "750",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const ordersPanelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const panelTitleStyle = {
  fontSize: "22px",
  fontWeight: "850",
  color: "#0f172a",
  margin: 0,
  letterSpacing: "-0.5px",
};

const loadingStyle = {
  color: "#64748b",
  fontSize: "14px",
  textAlign: "center",
  padding: "40px",
};

const errorStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#ef4444",
  borderRadius: "12px",
  padding: "12px",
  fontSize: "14px",
  fontWeight: "600",
};

const emptyOrdersStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "40px",
  textAlign: "center",
  boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
};

const shopBtnStyle = {
  marginTop: "16px",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  height: "38px",
  padding: "0 20px",
  fontWeight: "750",
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
};

const ordersListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const orderCardStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const orderHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "12px",
  borderBottom: "1px solid #f1f5f9",
  marginBottom: "12px",
};

const orderIdStyle = {
  fontFamily: "monospace",
  fontWeight: "800",
  color: "#FF4D4F",
  fontSize: "13px",
};

const orderDateStyle = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "600",
};

const payBadgeStyle = (status) => ({
  fontSize: "10px",
  fontWeight: "800",
  padding: "4px 8px",
  borderRadius: "6px",
  textTransform: "uppercase",
  background:
    status === "Paid"
      ? "#e6fffa"
      : status === "Pending"
        ? "#fffbeb"
        : "#fef2f2",
  color:
    status === "Paid"
      ? "#0d9488"
      : status === "Pending"
        ? "#d97706"
        : "#dc2626",
});

const statusBadgeStyle = (status) => ({
  fontSize: "10px",
  fontWeight: "800",
  padding: "4px 8px",
  borderRadius: "6px",
  background:
    status === "Delivered"
      ? "#ecfdf5"
      : status === "Cancelled"
        ? "#fef2f2"
        : "rgba(255, 77, 79, 0.1)",
  color:
    status === "Delivered"
      ? "#10b981"
      : status === "Cancelled"
        ? "#dc2626"
        : "#FF4D4F",
});

const itemsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "12px",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "13px",
  borderBottom: "1px solid #f8fafc",
  paddingBottom: "6px",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "8px",
  borderTop: "1px solid #f1f5f9",
  marginBottom: "16px",
};

const trackerContainerStyle = {
  padding: "4px 8px",
};

const trackerLabelsStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "10px",
  fontWeight: "700",
  color: "#94a3b8",
  marginBottom: "6px",
};

const trackerLabelStyle = (label, currentStatus) => {
  const statuses = ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Out for Delivery", "Delivered"];
  const currentIdx = statuses.indexOf(currentStatus);
  const labelIdx = statuses.indexOf(label);

  const isCompleted = labelIdx <= currentIdx;
  return {
    color: isCompleted ? "#3b82f6" : "#cbd5e1",
    fontWeight: isCompleted ? "800" : "600",
  };
};

const progressBarBgStyle = {
  width: "100%",
  height: "5px",
  background: "#f1f5f9",
  borderRadius: "3px",
  overflow: "hidden",
};

const progressBarFillStyle = (width, color) => ({
  width: width,
  height: "100%",
  background: "linear-gradient(90deg, #3b82f6, #10b981)",
  borderRadius: "3px",
  transition: "width 0.4s ease",
});

const cancelledBannerStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  borderRadius: "10px",
  color: "#dc2626",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center",
};

const trackBtnStyle = {
  width: "100%",
  marginTop: "14px",
  height: "42px",
  border: "none",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  fontSize: "13px",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
};