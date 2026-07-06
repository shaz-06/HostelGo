import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AddressSelectorModal from "../components/common/AddressSelectorModal";
import BuyCoin from "../components/common/BuyCoin";

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
  const [activeAddress, setActiveAddress] = useState(null);

  const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.port !== "";

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

  // Load stats & core data on mount
  useEffect(() => {
    if (!token) return;
    // Load orders
    fetch(window.API_BASE_URL + "/api/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading orders for stats:", err));

    // Load wallet
    fetch(window.API_BASE_URL + "/api/buycoins/wallet", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWallet(data.wallet);
          setWalletTransactions(data.transactions || []);
        }
      })
      .catch(err => console.error("Error loading wallet for stats:", err));
  }, [token]);

  // Update active address preview
  useEffect(() => {
    const saved = localStorage.getItem("selectedAddress");
    if (saved) {
      try {
        setActiveAddress(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else if (liveUser?.addresses?.length > 0) {
      setActiveAddress(liveUser.addresses[0]);
    }
  }, [liveUser]);

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

  const memberDateStr = liveUser?.createdAt
    ? new Date(liveUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "June 2026";

  const earnedThisMonth = walletTransactions
    .filter(tx => {
      if (!tx.createdAt) return false;
      const txDate = new Date(tx.createdAt);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear() &&
        ["earn", "earned", "bonus", "admin", "refund"].includes(tx.type);
    })
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // UNAUTHENTICATED ONBOARDING VIEW
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
            onClick={openLogin}
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
              <span style={{ height: "28px", display: "flex", alignItems: "center" }}><BuyCoin size={28} /></span>
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
              <a href="https://www.instagram.com/letsbuyto/" target="_blank" rel="noreferrer" style={socialIconStyle}>🅾 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" style={socialIconStyle}>ⓕ Facebook</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" style={socialIconStyle}>📺▶️YouTube</a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" style={socialIconStyle}>𝕏Twitter𝕏</a>
            </div>
          </div>

          {/* Subtle footer */}
          <div style={footerStyle}>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#9ca3af" }}>
              Made with ❤️ by Buyto
            </p>
            <p style={{ margin: "2px 0 0 0", fontSize: "10px", fontWeight: "500", color: "#bdc3c7" }}>
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-with-bottom-nav" style={containerStyle}>
      <div style={cardWrapperStyle}>

        {/* Global style injections for premium interactions */}
        <style>{`
          .menu-row-hover {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .menu-row-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            border-color: rgba(49, 134, 22, 0.2) !important;
          }
          .menu-row-hover:active {
            transform: translateY(0px);
          }
          @keyframes coinSpin {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
          }
          .coin-spin {
            animation: coinSpin 3s infinite linear;
            display: inline-block;
          }
        `}</style>

        {/* Header */}
        <div style={headerStyle}>
          <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
          <h1 style={titleStyle}>My Account</h1>
        </div>

        {/* 1. BUYTO HERO CARD */}
        <div style={heroCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={avatarStyle}>
              {(liveUser?.name || "US").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "900", margin: 0, color: "white" }}>
                👋 Hello, {liveUser?.name || "Customer"}
              </h2>
              <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.9)", margin: "4px 0 0 0", fontWeight: "600" }}>
                Member Since {memberDateStr}
              </p>
            </div>
          </div>
        </div>

        {/* 4. BUYTO STATS ROW */}
        <div style={statsRowStyle}>
          <div style={statItemStyle}>
            <span style={{ fontSize: "18px", marginBottom: "4px" }}>📦</span>
            <span style={statValStyle}>{orders.length}</span>
            <span style={statLabelStyle}>Orders</span>
          </div>
          <div style={statItemStyle}>
            <span style={{ height: "18px", display: "flex", alignItems: "center", marginBottom: "4px" }}><BuyCoin size={18} /></span>
            <span style={statValStyle}>{liveUser?.buyCoins !== undefined ? liveUser.buyCoins : 0}</span>
            <span style={statLabelStyle}>Coins</span>
          </div>
          <div style={statItemStyle}>
            <span style={{ fontSize: "18px", marginBottom: "4px" }}>📍</span>
            <span style={statValStyle}>{liveUser?.addresses?.length || 0}</span>
            <span style={statLabelStyle}>Saved</span>
          </div>
        </div>

        {/* 6. ACTIVE ADDRESS PREVIEW */}
        <div
          onClick={() => setShowAddressModal(true)}
          style={addressPreviewCardStyle}
          className="menu-row-hover"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "22px" }}>📍</span>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#9ca3af", textTransform: "uppercase" }}>Delivering To</div>
              {activeAddress ? (
                <div style={{ marginTop: "2px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "850", color: "#1f2937" }}>
                    {activeAddress.apartment || "Saved Apartment"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginTop: "1px" }}>
                    Room {activeAddress.room || "N/A"} • Floor {activeAddress.floor || "N/A"} {activeAddress.landmark ? `• ${activeAddress.landmark}` : ""}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "13px", fontWeight: "750", color: "#4b5563", marginTop: "2px" }}>
                  No active address selected. Set up now.
                </div>
              )}
            </div>
          </div>
          <span style={{ color: "#318616", fontWeight: "800", fontSize: "12px" }}>Manage →</span>
        </div>

        {/* 2. UPGRADED BUYCOINS WALLET CARD */}
        <div style={buyCoinsWalletCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={walletTitleBadgeStyle}>
                <BuyCoin size={12} style={{ marginRight: "4px" }} /> BuyCoins Wallet
              </span>
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#78350f", marginTop: "12px" }}>
                {liveUser?.buyCoins !== undefined ? liveUser.buyCoins : 0} Coins Available
              </div>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0", fontWeight: "600" }}>
                Earn rewards on every order • Earned this month: {earnedThisMonth} Coins
              </p>
            </div>
            <span className="coin-spin" style={{ fontSize: "36px" }}><BuyCoin size={36} animate={true} /></span>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/buycoins/transactions")}
              style={walletOutlineBtnStyle}
            >
              View Transactions
            </button>
            <button
              onClick={() => navigate("/buycoins/rewards")}
              style={walletSolidBtnStyle}
            >
              Redeem Rewards
            </button>
          </div>
        </div>

        {/* 3. GROUPED SECTIONS & MENU ITEMS */}

        {/* Section: Orders */}
        <h3 style={groupHeaderStyle}>Orders</h3>
        <div style={groupContainerStyle}>
          <div
            onClick={() => setActiveSection(activeSection === "orders" ? "" : "orders")}
            style={groupRowStyle}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#318616" }}>📦</span>
              <span style={menuItemLabelStyle}>My Orders</span>
            </div>
            <span style={rowArrowStyle(activeSection === "orders")}>▶</span>
          </div>

          {/* Expanded orders */}
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
                            <span style={{ fontWeight: "750" }}>{prod.name} x{prod.quantity}</span>
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

          <div
            onClick={() => navigate("/help")}
            style={{ ...groupRowStyle, borderBottom: "none" }}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#318616" }}>🔄</span>
              <span style={menuItemLabelStyle}>Returns & Refunds</span>
            </div>
            <span style={{ color: "#9ca3af", fontWeight: "700" }}>→</span>
          </div>
        </div>

        {/* Section: Addresses */}
        <h3 style={groupHeaderStyle}>Addresses</h3>
        <div style={groupContainerStyle}>
          <div
            onClick={() => setShowAddressModal(true)}
            style={{ ...groupRowStyle, borderBottom: "none" }}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#318616" }}>📍</span>
              <span style={menuItemLabelStyle}>Saved Addresses</span>
            </div>
            <span style={{ color: "#9ca3af", fontWeight: "700" }}>→</span>
          </div>
        </div>

        {/* Section: Rewards */}
        <h3 style={groupHeaderStyle}>Rewards</h3>
        <div style={groupContainerStyle}>
          <div
            onClick={() => setActiveSection(activeSection === "wallet" ? "" : "wallet")}
            style={groupRowStyle}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ display: "flex", alignItems: "center" }}><BuyCoin size={18} /></span>
              <span style={menuItemLabelStyle}>BuyCoins Wallet</span>
            </div>
            <span style={rowArrowStyle(activeSection === "wallet")}>▶</span>
          </div>

          {/* Expanded Wallet */}
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

          <div
            onClick={() => setActiveSection(activeSection === "coupons" ? "" : "coupons")}
            style={{ ...groupRowStyle, borderBottom: "none" }}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#f59e0b" }}>🎁</span>
              <span style={menuItemLabelStyle}>Offers & Rewards</span>
            </div>
            <span style={rowArrowStyle(activeSection === "coupons")}>▶</span>
          </div>

          {/* Expanded coupons */}
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
        </div>

        {/* Section: Support */}
        <h3 style={groupHeaderStyle}>Support</h3>
        <div style={groupContainerStyle}>
          <div
            onClick={() => navigate("/help")}
            style={groupRowStyle}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#318616" }}>💬</span>
              <span style={menuItemLabelStyle}>Help & Support</span>
            </div>
            <span style={{ color: "#9ca3af", fontWeight: "700" }}>→</span>
          </div>
          <div
            onClick={() => navigate("/contact")}
            style={{ ...groupRowStyle, borderBottom: "none" }}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#318616" }}>📞</span>
              <span style={menuItemLabelStyle}>Contact Us</span>
            </div>
            <span style={{ color: "#9ca3af", fontWeight: "700" }}>→</span>
          </div>
        </div>

        {/* Section: Account */}
        <h3 style={groupHeaderStyle}>Account</h3>
        <div style={groupContainerStyle}>
          <div
            onClick={() => navigate("/settings")}
            style={groupRowStyle}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#318616" }}>⚙️</span>
              <span style={menuItemLabelStyle}>Settings</span>
            </div>
            <span style={{ color: "#9ca3af", fontWeight: "700" }}>→</span>
          </div>
          <div
            onClick={handleLogoutClick}
            style={{ ...groupRowStyle, borderBottom: "none" }}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#ef4444" }}>🚪</span>
              <span style={{ ...menuItemLabelStyle, color: "#ef4444" }}>Logout</span>
            </div>
            <span style={{ color: "#ef4444", fontWeight: "700" }}>→</span>
          </div>
        </div>



        {/* 8. BOTTOM BRANDING */}
        <div style={footerStyle}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#9ca3af" }}>
            Made with ❤️ by Buyto
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "10px", fontWeight: "500", color: "#bdc3c7" }}>
            Version 1.0.0
          </p>
        </div>

      </div>

      {/* Render Address selector modal */}
      {showAddressModal && (
        <AddressSelectorModal
          onClose={() => setShowAddressModal(false)}
          onSelectAddress={() => { }}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}

// PREMIUM STYLING DICTIONARY (MOBILE-FIRST)
const containerStyle = {
  minHeight: "100vh",
  background: "#f7f8fa",
  padding: "24px 16px 40px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box",
  overflowX: "hidden"
};

const cardWrapperStyle = {
  width: "100%",
  maxWidth: "500px",
  boxSizing: "border-box"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "16px"
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

// Authenticated styles
const heroCardStyle = {
  background: "linear-gradient(135deg, #318616 0%, #4ca728 50%, #f59e0b 100%)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(49, 134, 22, 0.15)",
  marginBottom: "16px",
  color: "white",
  position: "relative",
  overflow: "hidden"
};

const avatarStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "white",
  color: "#318616",
  fontWeight: "900",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "3px solid white",
  boxShadow: "0 0 15px rgba(76, 167, 40, 0.6)"
};

const statsRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "12px",
  marginBottom: "16px"
};

const statItemStyle = {
  background: "#f0fdf4",
  border: "1px solid #dcfce7",
  borderRadius: "18px",
  padding: "12px 8px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const statValStyle = {
  fontSize: "16px",
  fontWeight: "900",
  color: "#166534"
};

const statLabelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#318616",
  marginTop: "2px"
};

const addressPreviewCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "16px",
  marginBottom: "16px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};

const buyCoinsWalletCardStyle = {
  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(49, 134, 22, 0.08) 100%)",
  border: "1px solid rgba(245, 158, 11, 0.2)",
  borderRadius: "24px",
  padding: "20px",
  marginBottom: "20px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 30px rgba(245, 158, 11, 0.05)",
  position: "relative",
  overflow: "hidden"
};

const walletTitleBadgeStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#b45309",
  background: "#fef3c7",
  padding: "4px 10px",
  borderRadius: "20px",
  textTransform: "uppercase"
};

const walletOutlineBtnStyle = {
  flex: 1,
  background: "white",
  color: "#78350f",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "10px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
  textAlign: "center"
};

const walletSolidBtnStyle = {
  flex: 1,
  background: "linear-gradient(135deg, #f59e0b, #ffb81c)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)"
};

const groupHeaderStyle = {
  fontSize: "14px",
  fontWeight: "850",
  color: "#4b5563",
  margin: "24px 0 8px 0",
  paddingLeft: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const groupContainerStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
};

const groupRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#1f2937",
  cursor: "pointer",
  borderBottom: "1px solid #f3f4f6",
  boxSizing: "border-box"
};

const menuItemLabelStyle = {
  fontSize: "14.5px",
  fontWeight: "750",
  color: "#1f2937"
};

const rowArrowStyle = (isOpen) => ({
  fontSize: "10px",
  color: "#9ca3af",
  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
  transition: "transform 0.15s ease",
  display: "inline-block"
});

const expandedSectionStyle = {
  background: "#f9fafb",
  padding: "16px 20px",
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



const footerStyle = {
  textAlign: "center",
  marginTop: "32px",
  marginBottom: "16px"
};