import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AddressSelectorModal from "../components/common/AddressSelectorModal";
import SEO from "../components/common/SEO";
import BuyCoin from "../components/common/BuyCoin";

export default function ProfilePage({ defaultTab = "" }) {
  const navigate = useNavigate();
  const { user, isLoggedIn, token, logout, openLogin, refreshUser } = useContext(AuthContext);

  // States for API data
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [liveUser, setLiveUser] = useState(user);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [activeAddress, setActiveAddress] = useState(null);

  // Sync session & live profile details
  useEffect(() => {
    if (!token) return;
    if (refreshUser) {
      refreshUser().then((usr) => {
        if (usr) setLiveUser(usr);
      });
    }
  }, [token, refreshUser]);

  // Load orders count for stats on mount
  useEffect(() => {
    if (!token) return;
    fetch(window.API_BASE_URL + "/api/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading orders:", err));
  }, [token]);

  // Load active address preview
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

  // Get time of day greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const memberDateStr = liveUser?.createdAt
    ? new Date(liveUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "July 2026";

  const handleLogoutClick = () => {
    logout();
    navigate("/");
  };

  // Render stats section
  const renderStats = () => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      margin: "24px 0",
      padding: "20px",
      background: "white",
      borderRadius: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
      border: "1px solid #f1f5f9"
    }}>
      <div style={{ textAlign: "center", padding: "12px", borderRight: "1px solid #f1f5f9" }}>
        <h4 style={{ margin: 0, fontSize: "28px", fontWeight: "950", color: "#318616" }}>10K+</h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase" }}>Products Available</p>
      </div>
      <div style={{ textAlign: "center", padding: "12px" }}>
        <h4 style={{ margin: 0, fontSize: "28px", fontWeight: "950", color: "#318616" }}>25K+</h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase" }}>Happy Students</p>
      </div>
      <div style={{ textAlign: "center", padding: "12px", borderRight: "1px solid #f1f5f9", borderTop: "1px solid #f1f5f9" }}>
        <h4 style={{ margin: 0, fontSize: "28px", fontWeight: "950", color: "#318616" }}>15 min</h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase" }}>Avg Delivery</p>
      </div>
      <div style={{ textAlign: "center", padding: "12px", borderTop: "1px solid #f1f5f9" }}>
        <h4 style={{ margin: 0, fontSize: "28px", fontWeight: "950", color: "#318616" }}>4.9★</h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase" }}>Customer Rating</p>
      </div>
    </div>
  );

  return (
    <div className="page-with-bottom-nav" style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #F8FFF8 0%, #FFFFFF 50%, #FDFDFD 100%)", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <SEO title={isLoggedIn ? "My Profile" : "Login"} description="Manage your account profile, addresses, and settings on Buyto." />
      
      {/* Dynamic inline styles for micro-animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hover-lift {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(49, 134, 22, 0.08);
        }
        .hover-lift:active {
          transform: translateY(-1px);
        }
        .glow-btn {
          animation: buttonGlow 3s infinite alternate;
        }
        @keyframes buttonGlow {
          0% { box-shadow: 0 4px 12px rgba(49, 134, 22, 0.2); }
          100% { box-shadow: 0 4px 24px rgba(49, 134, 22, 0.4); }
        }
        .scale-hover {
          transition: transform 0.2s ease;
        }
        .scale-hover:hover {
          transform: scale(1.05);
        }
        .sparkle-icon {
          animation: sparkle 2s infinite ease-in-out;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .social-btn {
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          transform: scale(1.1) translateY(-2px);
        }
      `}} />

      {/* Glassmorphic Sticky Header */}
      <div style={{
        position: "sticky",
        top: 0,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(229, 231, 235, 0.5)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 999
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ border: "none", background: "transparent", fontSize: "24px", cursor: "pointer", color: "#374151" }}>←</button>
          <span style={{ fontSize: "18px", fontWeight: "900", color: "#111827" }}>My Account</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#318616" }}>Buyto Dashboard</span>
        </div>
      </div>

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px 100px 16px" }}>

        {/* LOGGED OUT VIEW */}
        {!isLoggedIn ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Premium Hero Section */}
            <div style={{
              background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
              borderRadius: "28px",
              padding: "24px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 30px rgba(49, 134, 22, 0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid rgba(255,255,255,0.4)"
            }}>
              {/* Dotted leaf overlay */}
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(#318616 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                opacity: 0.05,
                pointerEvents: "none"
              }} />
              
              <div style={{ zIndex: 1, flexGrow: 1, paddingRight: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "26px", fontWeight: "950", color: "#1B5E20", letterSpacing: "-0.5px" }}>
                  👋 Welcome to Buyto
                </h2>
                <div style={{ margin: "8px 0 16px 0", fontSize: "13px", color: "#2E7D32", fontWeight: "700", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>✓ Shop smarter.</span>
                  <span>✓ Earn BuyCoins rewards.</span>
                  <span>✓ Track every order in real-time.</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "800", color: "#b45309", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <span className="sparkle-icon">🪙</span> 20 BuyCoins Welcome Bonus
                </div>
              </div>

              {/* Mascot Waving Illustration */}
              <div style={{ zIndex: 1, width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", flexShrink: 0, border: "2px solid white" }}>
                <span style={{ fontSize: "52px" }}>🛒</span>
              </div>
            </div>

            {/* Feature Highlights Pills */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
              <span style={{ background: "#E8F5E9", color: "#2E7D32", padding: "6px 12px", borderRadius: "50px", fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap" }}>🚚 15 Min Delivery</span>
              <span style={{ background: "#FEF3C7", color: "#D97706", padding: "6px 12px", borderRadius: "50px", fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap" }}>🪙 BuyCoins</span>
              <span style={{ background: "#E0F2FE", color: "#0369A1", padding: "6px 12px", borderRadius: "50px", fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap" }}>📦 Live Tracking</span>
              <span style={{ background: "#F3E8FF", color: "#7E22CE", padding: "6px 12px", borderRadius: "50px", fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap" }}>🎓 Student Discounts</span>
            </div>

            {/* Better Login CTA */}
            <div
              onClick={openLogin}
              className="glow-btn"
              style={{
                background: "linear-gradient(135deg, #318616, #4ca728)",
                borderRadius: "24px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.1s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <h4 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "950", display: "flex", alignItems: "center", gap: "8px" }}>
                🔐 Login / Sign Up
              </h4>
              <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "12px", fontWeight: "700" }}>
                Continue with Phone Number
              </p>
              <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: "50px", color: "white", fontSize: "11px", fontWeight: "800" }}>
                🎁 Get 20 BuyCoins FREE
              </div>
            </div>

            {/* 2x3 Quick Actions Grid */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#64748B", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚡ Quick Actions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Orders", icon: "🛍", action: openLogin },
                  { label: "BuyCoins", icon: "🪙", action: openLogin },
                  { label: "Wishlist", icon: "❤️", action: openLogin },
                  { label: "Addresses", icon: "📍", action: openLogin },
                  { label: "Offers", icon: "🎁", action: openLogin },
                  { label: "Settings", icon: "⚙", action: () => navigate("/settings") }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={item.action}
                    className="hover-lift"
                    style={{
                      background: "white",
                      borderRadius: "18px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      cursor: "pointer",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{item.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: "850", color: "#374151" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Benefits Card */}
            <div style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid #e5e7eb"
            }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "900", color: "#1E293B" }}>Why create an account?</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569", fontWeight: "750" }}>
                <span>✓ Faster checkout</span>
                <span>✓ Track live orders in real-time</span>
                <span>✓ Exclusive student discounts</span>
                <span>✓ Earn BuyCoins rewards on every purchase</span>
              </div>
            </div>

          </div>
        ) : (
          /* LOGGED IN VIEW */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Personalized Hero Welcome Card */}
            <div style={{
              background: "linear-gradient(135deg, #318616 0%, #4ca728 50%, #f59e0b 100%)",
              borderRadius: "28px",
              padding: "24px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(49, 134, 22, 0.15)",
              color: "white"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "900"
                }}>
                  {(liveUser?.name || "US").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>
                    👋 {getGreeting()}, {liveUser?.name || "Customer"}
                  </h2>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: "2px 0 0 0", fontWeight: "700" }}>
                    Member since {memberDateStr}
                  </p>
                </div>
              </div>

              {/* Quick stats horizontal summary */}
              <div style={{ display: "flex", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "14px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: "800", textTransform: "uppercase" }}>BuyCoins</div>
                  <div style={{ fontSize: "18px", fontWeight: "950" }}>{liveUser?.buyCoins ?? 0} Coins</div>
                </div>
                <div style={{ width: "1px", background: "rgba(255,255,255,0.2)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: "800", textTransform: "uppercase" }}>Orders</div>
                  <div style={{ fontSize: "18px", fontWeight: "950" }}>{orders.length} Placed</div>
                </div>
              </div>
            </div>

            {/* Achievement progress section */}
            <div style={{
              background: "white",
              borderRadius: "20px",
              padding: "16px 20px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>
                <span>🏅 Your Progress</span>
                <span style={{ color: "#318616" }}>{orders.length} / 20 Orders</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ width: `${Math.min((orders.length / 20) * 100, 100)}%`, height: "100%", background: "#318616", borderRadius: "10px" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "750" }}>
                🎉 Next Milestone Reward: 50 Bonus BuyCoins!
              </span>
            </div>

            {/* 2x3 Quick Actions Grid for Logged In */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#64748B", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚡ Quick Actions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Orders", icon: "🛍", action: () => navigate("/orders") },
                  { label: "BuyCoins", icon: "🪙", action: () => navigate("/buycoins/transactions") },
                  { label: "Wishlist", icon: "❤️", action: () => navigate("/wishlist") },
                  { label: "Addresses", icon: "📍", action: () => setShowAddressModal(true) },
                  { label: "Offers", icon: "🎁", action: () => navigate("/cart") },
                  { label: "Settings", icon: "⚙", action: () => navigate("/settings") }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={item.action}
                    className="hover-lift"
                    style={{
                      background: "white",
                      borderRadius: "18px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      cursor: "pointer",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{item.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: "850", color: "#374151" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Log Out Button */}
            <button
              onClick={handleLogoutClick}
              style={{
                width: "100%",
                background: "#FEE2E2",
                color: "#991B1B",
                border: "none",
                borderRadius: "16px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: "900",
                cursor: "pointer"
              }}
            >
              Sign Out from Account
            </button>

          </div>
        )}

        {/* Alternate Background: Soft mint section for FAQ & Support */}
        <div style={{
          background: "#F0FDF4",
          borderRadius: "24px",
          padding: "20px",
          margin: "24px 0",
          border: "1.5px dashed #cbd5e1"
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#166534", margin: "0 0 14px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>📞 Support & Help</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "FAQs", icon: "❓", path: "/faq" },
              { label: "Contact Us", icon: "📞", path: "/contact" },
              { label: "Track Order", icon: "📦", path: isLoggedIn ? "/orders" : "/" },
              { label: "Help Center", icon: "💬", path: "/help" },
              { label: "Terms & Conditions", icon: "📄", path: "/terms" },
              { label: "Privacy Policy", icon: "🔒", path: "/privacy-policy" },
              { label: "Refund Policy", icon: "↩", path: "/refund-policy" }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.label === "Track Order" && !isLoggedIn) {
                    openLogin();
                  } else {
                    navigate(item.path);
                  }
                }}
                className="hover-lift"
                style={{
                  background: "white",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: "13.5px",
                  fontWeight: "800",
                  color: "#374151"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span style={{ color: "#9ca3af" }}>→</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alternating Background: Soft Cream section for Socials */}
        <div style={{
          background: "#FFFBEB",
          borderRadius: "24px",
          padding: "20px",
          margin: "24px 0",
          textAlign: "center"
        }}>
          <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#92400E", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>Follow Buyto</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <a href="https://www.instagram.com/letsbuyto/" target="_blank" rel="noreferrer" className="social-btn" style={{ textDecoration: "none", fontSize: "28px" }}>📸</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-btn" style={{ textDecoration: "none", fontSize: "28px" }}>▶️</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-btn" style={{ textDecoration: "none", fontSize: "28px" }}>🐦</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" style={{ textDecoration: "none", fontSize: "28px" }}>📘</a>
          </div>
        </div>

        {/* Statistics Section */}
        {renderStats()}

        {/* Better Footer */}
        <div style={{ textAlign: "center", marginTop: "40px", borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: "#94A3B8" }}>
            Made with ❤️ in Bengaluru
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: "700", color: "#CBD5E1" }}>
            Version 1.0 • © 2026 Buyto
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "12px", fontSize: "11px", fontWeight: "750" }}>
            <span onClick={() => navigate("/privacy-policy")} style={{ color: "#64748B", cursor: "pointer" }}>Privacy</span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span onClick={() => navigate("/terms")} style={{ color: "#64748B", cursor: "pointer" }}>Terms</span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span onClick={() => navigate("/help")} style={{ color: "#64748B", cursor: "pointer" }}>About</span>
          </div>
        </div>

      </div>

      {/* Floating BuyCoins Card (if logged out) */}
      {!isLoggedIn && (
        <div
          onClick={openLogin}
          className="scale-hover"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            background: "#FEF3C7",
            border: "1.5px solid #F59E0B",
            padding: "10px 16px",
            borderRadius: "50px",
            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.18)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            zIndex: 9999
          }}
        >
          <span style={{ fontSize: "18px" }}>🪙</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#B45309", textTransform: "uppercase" }}>Login now</span>
            <span style={{ fontSize: "11.5px", fontWeight: "900", color: "#78350F" }}>Earn 20 BuyCoins FREE</span>
          </div>
        </div>
      )}

      {/* Address Selector Modal */}
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