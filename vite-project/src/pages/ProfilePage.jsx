import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AddressSelectorModal from "../components/common/AddressSelectorModal";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, token, logout, openLogin } = useContext(AuthContext);

  // States for API data
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [liveUser, setLiveUser] = useState(user);

  // UI state triggers
  const [activeSection, setActiveSection] = useState(""); // "orders" | "addresses" | "wallet" | "coupons" | ""
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Sync session & live profile details
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
    fetchLiveUser();
  }, [token]);

  // Load orders when active section is orders
  useEffect(() => {
    if (!token || activeSection !== "orders") return;
    const fetchMyOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await fetch(window.API_BASE_URL + "/api/orders/my-orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchMyOrders();
  }, [token, activeSection]);

  // Load wallet when active section is wallet
  useEffect(() => {
    if (!token || activeSection !== "wallet") return;
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
  }, [token, activeSection]);

  // Load coupons when active section is coupons
  useEffect(() => {
    if (!token || activeSection !== "coupons") return;
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
        console.error("Failed to fetch coupons:", err);
      } finally {
        setCouponsLoading(false);
      }
    };
    fetchCoupons();
  }, [token, activeSection]);

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

  // 1. UNAUTHENTICATED ONBOARDING VIEW
  if (!isLoggedIn) {
    return (
      <div className="page-with-bottom-nav" style={containerStyle}>
        <div style={cardWrapperStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
            <h1 style={titleStyle}>My Account</h1>
          </div>

          {/* Welcome Card */}
          <div style={welcomeCardStyle}>
            {/* Pattern Background overlay */}
            <div style={patternOverlayStyle}></div>
            <h2 style={welcomeTitleStyle}>Hello 👋</h2>
            <p style={welcomeSubtitleStyle}>
              Get exclusive offers, BuyCoins rewards, faster checkout and order tracking.
            </p>
            <div style={highlightBadgeStyle}>
              🎁 Login now and get 20 BuyCoins Welcome Reward
            </div>
          </div>

          <button 
            onClick={() => {
              console.log("Login button clicked");
              openLogin();
            }}
            style={primaryBtnStyle}
          >
            <span style={{ fontSize: "16px", fontWeight: "900" }}>Login / Sign Up</span>
            <span style={{ display: "block", fontSize: "11px", fontWeight: "600", opacity: 0.9, marginTop: "2px" }}>
              Continue with Phone Number →
            </span>
          </button>

          {/* Explore Buyto */}
          <h3 style={sectionTitleStyle}>Explore Buyto</h3>
          <div style={exploreGridStyle}>
            <div style={exploreCardStyle}>
              <span style={{ fontSize: "28px" }}>🎁</span>
              <span style={exploreCardTextStyle}>Exclusive Offers</span>
            </div>
            <div style={exploreCardStyle}>
              <span style={{ fontSize: "28px" }}>🪙</span>
              <span style={exploreCardTextStyle}>BuyCoins Rewards</span>
            </div>
            <div style={exploreCardStyle}>
              <span style={{ fontSize: "28px" }}>📦</span>
              <span style={exploreCardTextStyle}>Order Tracking</span>
            </div>
            <div style={exploreCardStyle}>
              <span style={{ fontSize: "28px" }}>⚡</span>
              <span style={exploreCardTextStyle}>Faster Checkout</span>
            </div>
          </div>

          {/* Legal Section */}
          <div style={legalGroupStyle}>
            {[
              { label: "FAQs", path: "/faq" },
              { label: "Terms & Conditions", path: "/terms" },
              { label: "Privacy Policy", path: "/privacy-policy" },
              { label: "Refund Policy", path: "/refund-policy" },
              { label: "Shipping Policy", path: "/shipping-policy" },
              { label: "Contact Us", path: "/contact" }
            ].map((item, idx, arr) => (
              <div 
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  ...legalRowStyle,
                  borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f3f4f6"
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: "#9ca3af" }}>→</span>
              </div>
            ))}
          </div>

          {/* Follow Buyto */}
          <div style={followContainerStyle}>
            <p style={followTitleStyle}>Follow Buyto</p>
            <div style={socialGridStyle}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" style={socialIconStyle}>📸</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" style={socialIconStyle}>📘</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" style={socialIconStyle}>📺</a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" style={socialIconStyle}>🐦</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED USER PROFILE VIEW
  return (
    <div className="page-with-bottom-nav" style={containerStyle}>
      <div style={cardWrapperStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
          <h1 style={titleStyle}>My Account</h1>
        </div>

        {/* User Card Summary */}
        <div style={userCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={avatarStyle}>
              {(liveUser?.name || "US").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={userNameStyle}>{liveUser?.name || "Customer"}</h2>
              <p style={userPhoneStyle}>{liveUser?.phone || "N/A"}</p>
            </div>
          </div>

          {/* BuyCoins Balance Card */}
          <div 
            onClick={() => setActiveSection(activeSection === "wallet" ? "" : "wallet")}
            style={buyCoinsCardStyle}
          >
            <div>
              <div style={buyCoinsCardLabelStyle}>BuyCoins Balance</div>
              <div style={buyCoinsCardValueStyle}>
                {liveUser?.buyCoins !== undefined ? liveUser.buyCoins : 0} Coins
              </div>
            </div>
            <span style={{ fontSize: "28px" }}>🪙</span>
          </div>
        </div>

        {/* Display Items List */}
        <div style={menuContainerStyle}>
          {/* My Orders */}
          <div 
            onClick={() => setActiveSection(activeSection === "orders" ? "" : "orders")}
            style={menuItemStyle(activeSection === "orders")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>📦</span>
              <span>My Orders</span>
            </div>
            <span style={menuItemArrowStyle(activeSection === "orders")}>▶</span>
          </div>

          {/* My Orders Expanded Content */}
          {activeSection === "orders" && (
            <div style={expandedSectionStyle}>
              {ordersLoading ? (
                <div style={loadingTextStyle}>Loading orders...</div>
              ) : orders.length === 0 ? (
                <div style={emptyTextStyle}>No orders placed yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {orders.map((order) => (
                    <div key={order._id} style={orderItemCardStyle}>
                      <div style={orderHeaderStyle}>
                        <div>
                          <span style={orderIdStyle}>#{order._id.substring(order._id.length - 8)}</span>
                          <span style={orderDateStyle}> • {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span style={orderStatusStyle(order.orderStatus)}>{order.orderStatus}</span>
                      </div>
                      <div style={{ marginTop: "10px", borderBottom: "1px dashed #f1f5f9", paddingBottom: "10px" }}>
                        {order.products?.map((prod, idx) => (
                          <div key={idx} style={orderProductRowStyle}>
                            <span style={{ fontWeight: "700" }}>{prod.name} x{prod.quantity}</span>
                            <span>₹{prod.price * prod.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div style={orderFooterStyle}>
                        <span>Total Paid: ₹{order.totalAmount}</span>
                        {order.orderStatus !== "Cancelled" && (
                          <button 
                            onClick={() => navigate(`/track-order/${order._id}`)} 
                            style={trackBtnStyle}
                          >
                            Track Live Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Addresses */}
          <div 
            onClick={() => setShowAddressModal(true)}
            style={menuItemStyle(false)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>📍</span>
              <span>Saved Addresses</span>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </div>

          {/* BuyCoins Wallet */}
          <div 
            onClick={() => setActiveSection(activeSection === "wallet" ? "" : "wallet")}
            style={menuItemStyle(activeSection === "wallet")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>🪙</span>
              <span>BuyCoins Wallet</span>
            </div>
            <span style={menuItemArrowStyle(activeSection === "wallet")}>▶</span>
          </div>

          {/* Wallet Expanded Content */}
          {activeSection === "wallet" && (
            <div style={expandedSectionStyle}>
              {walletLoading ? (
                <div style={loadingTextStyle}>Loading transactions...</div>
              ) : (
                <div>
                  <div style={walletStatsRowStyle}>
                    <div style={walletStatsCardStyle}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Lifetime Earned</span>
                      <span style={{ fontSize: "18px", fontWeight: "900", color: "#10b981" }}>
                        {wallet ? wallet.lifetimeEarned : 0} Coins
                      </span>
                    </div>
                    <div style={walletStatsCardStyle}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Coins Spent</span>
                      <span style={{ fontSize: "18px", fontWeight: "900", color: "#ef4444" }}>
                        {wallet ? wallet.lifetimeRedeemed : 0} Coins
                      </span>
                    </div>
                  </div>
                  <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#1f2937", marginBottom: "12px" }}>Recent Activity</h4>
                  {walletTransactions.length === 0 ? (
                    <div style={emptyTextStyle}>No transaction logs found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {walletTransactions.map((tx) => {
                        const isPositive = ["earn", "earned", "bonus", "admin", "refund"].includes(tx.type);
                        return (
                          <div key={tx._id} style={txRowStyle}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "750" }}>{tx.description || tx.type.toUpperCase()}</div>
                              <div style={{ fontSize: "10px", color: "#9ca3af" }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                            </div>
                            <span style={{ fontWeight: "900", color: isPositive ? "#10b981" : "#ef4444" }}>
                              {isPositive ? "+" : "-"}{tx.amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Offers & Rewards */}
          <div 
            onClick={() => setActiveSection(activeSection === "coupons" ? "" : "coupons")}
            style={menuItemStyle(activeSection === "coupons")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>🎁</span>
              <span>Offers & Rewards</span>
            </div>
            <span style={menuItemArrowStyle(activeSection === "coupons")}>▶</span>
          </div>

          {/* Coupons Expanded Content */}
          {activeSection === "coupons" && (
            <div style={expandedSectionStyle}>
              {couponsLoading ? (
                <div style={loadingTextStyle}>Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div style={emptyTextStyle}>No active coupons currently.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {coupons.map((coupon) => (
                    <div key={coupon._id} style={couponCardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={couponCodeStyle}>{coupon.couponCode}</span>
                        <span style={couponStatusStyle(coupon.isUsed)}>{coupon.isUsed ? "USED" : "ACTIVE"}</span>
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", marginTop: "8px" }}>₹{coupon.discountAmount} OFF</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Min order: ₹{coupon.minimumOrderValue || 149}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Help & Support */}
          <div 
            onClick={() => navigate("/help")}
            style={menuItemStyle(false)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>☎</span>
              <span>Help & Support</span>
            </div>
            <span style={{ color: "#9ca3af" }}>→</span>
          </div>

          {/* Logout */}
          <div 
            onClick={handleLogoutClick}
            style={{ ...menuItemStyle(false), borderBottom: "none", color: "#ef4444" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>🚪</span>
              <span>Logout</span>
            </div>
            <span style={{ color: "#ef4444" }}>→</span>
          </div>
        </div>

        {/* Temporary/Dev OTP Test Screen route link */}
        <button
          onClick={() => navigate("/otp-test")}
          style={otpTestBtnStyle}
        >
          🧪 Run OTP Test Screen
        </button>

      </div>

      {/* Render Address modal dynamically if click trigger is active */}
      {showAddressModal && (
        <AddressSelectorModal 
          onClose={() => setShowAddressModal(false)}
          onSelectAddress={() => {}}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}

// STYLE OBJECTS
const containerStyle = {
  minHeight: "100vh",
  background: "#f7f8fa",
  padding: "24px 16px 40px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box"
};

const cardWrapperStyle = {
  width: "100%",
  maxWidth: "500px"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "20px"
};

const backBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#1f2937",
  padding: "4px 0",
  fontWeight: "800"
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "900",
  color: "#1f2937",
  margin: 0,
  letterSpacing: "-0.5px"
};

const welcomeCardStyle = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
  marginBottom: "20px",
  border: "1px solid #e5e7eb",
  position: "relative",
  overflow: "hidden"
};

const patternOverlayStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  width: "140px",
  height: "100%",
  opacity: 0.08,
  backgroundImage: "radial-gradient(#318616 1.5px, transparent 1.5px)",
  backgroundSize: "12px 12px",
  pointerEvents: "none"
};

const welcomeTitleStyle = {
  fontSize: "26px",
  fontWeight: "900",
  color: "#111827",
  margin: "0 0 8px 0",
  letterSpacing: "-0.5px"
};

const welcomeSubtitleStyle = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "0 0 20px 0",
  lineHeight: "1.6",
  fontWeight: "600"
};

const highlightBadgeStyle = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "14px",
  padding: "12px 16px",
  fontSize: "12.5px",
  color: "#166534",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const primaryBtnStyle = {
  width: "100%",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "18px",
  padding: "16px",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(49, 134, 22, 0.18)",
  marginBottom: "28px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.1s ease"
};

const sectionTitleStyle = {
  fontSize: "15px",
  fontWeight: "850",
  color: "#1f2937",
  marginBottom: "14px",
  paddingLeft: "4px"
};

const exploreGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "28px"
};

const exploreCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.01)"
};

const exploreCardTextStyle = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#374151"
};

const legalGroupStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  marginBottom: "28px"
};

const legalRowStyle = {
  padding: "18px 20px",
  fontSize: "14px",
  fontWeight: "750",
  color: "#4b5563",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const followContainerStyle = {
  textAlign: "center",
  marginBottom: "32px"
};

const followTitleStyle = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "750",
  marginBottom: "14px"
};

const socialGridStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "20px"
};

const socialIconStyle = {
  fontSize: "26px",
  textDecoration: "none"
};

// Authenticated Styles
const userCardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
  marginBottom: "20px"
};

const avatarStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #318616 0%, #286f12 100%)",
  color: "white",
  fontWeight: "850",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
};

const userNameStyle = {
  fontSize: "18px",
  fontWeight: "900",
  margin: 0,
  color: "#111827"
};

const userPhoneStyle = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "2px 0 0 0",
  fontWeight: "600"
};

const buyCoinsCardStyle = {
  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
  border: "1.5px solid #fde68a",
  borderRadius: "18px",
  padding: "14px 18px",
  marginTop: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(251, 191, 36, 0.05)"
};

const buyCoinsCardLabelStyle = {
  fontSize: "10px",
  fontWeight: "800",
  color: "#b45309",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const buyCoinsCardValueStyle = {
  fontSize: "18px",
  fontWeight: "900",
  color: "#78350f",
  marginTop: "2px"
};

const menuContainerStyle = {
  background: "#ffffff",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
  marginBottom: "20px"
};

const menuItemStyle = (isOpen) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#1f2937",
  cursor: "pointer",
  borderBottom: "1px solid #f3f4f6",
  background: isOpen ? "#f9fafb" : "transparent"
});

const menuItemArrowStyle = (isOpen) => ({
  fontSize: "10px",
  color: "#9ca3af",
  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
  transition: "transform 0.15s ease"
});

const expandedSectionStyle = {
  background: "#f9fafb",
  padding: "16px 24px",
  borderBottom: "1px solid #f3f4f6"
};

const loadingTextStyle = {
  fontSize: "13px",
  color: "#6b7280",
  textAlign: "center",
  padding: "12px 0"
};

const emptyTextStyle = {
  fontSize: "13px",
  color: "#9ca3af",
  textAlign: "center",
  padding: "12px 0",
  fontStyle: "italic"
};

const orderItemCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.01)"
};

const orderHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "12px"
};

const orderIdStyle = {
  fontWeight: "800",
  color: "#318616",
  fontFamily: "monospace"
};

const orderDateStyle = {
  color: "#6b7280"
};

const orderStatusStyle = (status) => ({
  fontWeight: "800",
  textTransform: "uppercase",
  fontSize: "10px",
  padding: "2px 8px",
  borderRadius: "6px",
  background: status === "Delivered" ? "#d1fae5" : status === "Cancelled" ? "#fee2e2" : "#fef3c7",
  color: status === "Delivered" ? "#065f46" : status === "Cancelled" ? "#991b1b" : "#92400e"
});

const orderProductRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  marginTop: "6px"
};

const orderFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: "800",
  marginTop: "10px"
};

const trackBtnStyle = {
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "11px",
  fontWeight: "850",
  cursor: "pointer"
};

const walletStatsRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "16px"
};

const walletStatsCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const txRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#ffffff",
  border: "1px solid #e5e7eb"
};

const couponCardStyle = {
  background: "#ffffff",
  border: "1.5px dashed #318616",
  borderRadius: "16px",
  padding: "14px"
};

const couponCodeStyle = {
  fontFamily: "monospace",
  fontSize: "12px",
  fontWeight: "850",
  color: "#318616",
  background: "rgba(49, 134, 22, 0.08)",
  padding: "2px 6px",
  borderRadius: "4px"
};

const couponStatusStyle = (isUsed) => ({
  fontSize: "9px",
  fontWeight: "800",
  color: isUsed ? "#9ca3af" : "#10b981"
});

const otpTestBtnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "1.5px solid #fbbf24",
  background: "#fffbeb",
  color: "#d97706",
  fontWeight: "850",
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.03)",
  marginTop: "12px"
};