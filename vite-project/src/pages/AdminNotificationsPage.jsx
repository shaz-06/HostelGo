import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  const pageContainer = {
    minHeight: "100vh",
    background: "#F9FAFB",
    color: "#111827",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    padding: isMobile ? "16px 12px" : "24px 32px",
    boxSizing: "border-box",
    overflowX: "hidden",
  };

  const header = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: isMobile ? "12px" : "0",
    paddingBottom: "20px",
    borderBottom: "1.5px solid #E5E7EB",
    marginBottom: "24px",
  };

  const contentGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "250px 1fr",
    gap: "28px",
    alignItems: "start",
  };

  const mainPanel = {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden"
  };

  const dashboardDetailsGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr",
    gap: "24px",
    alignItems: "start"
  };

  // Composer fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("General");
  const [image, setImage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [recipientOption, setRecipientOption] = useState("all"); // V1 All Users only

  // Status & analytics states
  const [userCount, setUserCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState("");

  const templates = [
    {
      name: "⚡ Flash Sale",
      title: "Flash Sale 🚀",
      message: "Get up to 50% OFF on Snacks today. Limited time offer.",
      type: "Offer",
      image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d",
      ctaText: "Shop Now",
      ctaLink: "/category/Snacks"
    },
    {
      name: "🎁 BuyCoins Reward",
      title: "Rewards Credited! 🪙",
      message: "We've added bonus BuyCoins to your wallet. Claim them now!",
      type: "BuyCoins",
      image: "",
      ctaText: "Claim Reward",
      ctaLink: "/buycoins/rewards"
    },
    {
      name: "🚚 Free Delivery",
      title: "Free Delivery Weekend! ⚡",
      message: "Enjoy free delivery on all orders this weekend. No minimum value.",
      type: "Announcement",
      image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6",
      ctaText: "Shop Now",
      ctaLink: "/offers"
    },
    {
      name: "🎉 Festival Offer",
      title: "Festival Special Deals 🌸",
      message: "Celebrate the festive season with up to 40% off top items.",
      type: "Offer",
      image: "",
      ctaText: "View Offer",
      ctaLink: "/offers"
    },
    {
      name: "📢 Announcement",
      title: "System Update 📢",
      message: "We've updated our service hours to serve you better.",
      type: "Announcement",
      image: "",
      ctaText: "View Details",
      ctaLink: "/help"
    }
  ];

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setType(tpl.type);
    setImage(tpl.image);
    setCtaText(tpl.ctaText);
    setCtaLink(tpl.ctaLink);
    showToast(`Template "${tpl.name}" applied successfully!`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("buyto_token");
      
      // Fetch users count
      const countRes = await fetch(window.API_BASE_URL + "/api/admin/users/count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (countRes.ok) {
        const countData = await countRes.json();
        setUserCount(countData.count);
      }

      // Fetch history
      const historyRes = await fetch(window.API_BASE_URL + "/api/admin/notifications/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch initial notifications dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSendTest = async () => {
    if (!title || !message) {
      alert("Title and message are required for test preview");
      return;
    }
    try {
      setTesting(true);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/notifications/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, type, image, ctaText, ctaLink })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("⚡ Test notification sent successfully to admin device!");
      } else {
        alert(data.message || "Failed to send test notification");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending test notification");
    } finally {
      setTesting(false);
    }
  };

  const triggerSubmit = (e) => {
    e.preventDefault();
    if (!title || !message) {
      alert("Title and message are required");
      return;
    }
    if (message.length > 200) {
      alert("Message exceeds maximum length of 200 characters");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSendBroadcast = async () => {
    try {
      setSending(true);
      setShowConfirmModal(false);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, type, image, ctaText, ctaLink })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Notification sent to ${data.deliveredCount} devices!`);
        // Reset form
        setTitle("");
        setMessage("");
        setImage("");
        setCtaText("");
        setCtaLink("");
        // Reload history
        fetchInitialData();
      } else {
        alert(data.message || "Failed to send notification broadcast");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending campaign notification");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <span style={{ color: "#6B7280", fontWeight: "600", fontSize: "16px" }}>Initializing Notification System...</span>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={toastStyle}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "20px", fontWeight: "800", color: "#111827" }}>
              Confirm Campaign Dispatch 📢
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#4B5563", lineHeight: "1.5", fontWeight: "600" }}>
              Are you sure you want to send this notification campaign to all <strong>{userCount}</strong> registered users?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowConfirmModal(false)} style={cancelBtnStyle}>
                Cancel
              </button>
              <button onClick={handleSendBroadcast} style={confirmBtnStyle}>
                Send Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate("/admin")} style={backBtnStyle}>
            ← Dashboard
          </button>
          <h1 style={titleStyle}>Push Notification System</h1>
          <span style={badgeStyle}>{userCount} Registered Users</span>
        </div>
      </header>

      <div style={contentGrid}>
        {/* Sidebar Navigation */}
        <nav style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={avatarStyle}>AD</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#111827", fontWeight: "800", fontSize: "14px" }}>Admin Control</span>
              <span style={{ color: "#6B7280", fontSize: "12px", fontWeight: "600" }}>Administrator</span>
            </div>
          </div>
          
          <div style={navGroupStyle}>
            <button onClick={() => navigate("/admin")} style={navLinkStyle}>
              📊 Dashboard
            </button>
            <button onClick={() => navigate("/admin/notifications")} style={activeNavLinkStyle}>
              📢 Notifications
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

        {/* Composer Panel */}
        <main style={mainPanel}>
          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}

          {/* Quick Templates Strip */}
          <div style={cardLayoutStyle}>
            <h3 style={{ ...cardTitleStyle, marginBottom: "8px" }}>⚡ Quick Templates</h3>
            <p style={{ color: "#6B7280", fontSize: "12px", margin: "0 0 14px 0", fontWeight: "600" }}>
              One-click pre-fills for common quick-commerce campaigns.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {templates.map((tpl, idx) => (
                <button key={idx} onClick={() => applyTemplate(tpl)} style={templateBtnStyle}>
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <div style={dashboardDetailsGrid}>
            {/* Form */}
            <div style={cardLayoutStyle}>
              <h3 style={cardTitleStyle}>Notification Composer</h3>
              <form onSubmit={triggerSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Sale 🚀"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <label style={labelStyle}>Message *</label>
                    <span style={{ fontSize: "11px", color: message.length > 200 ? "#EF4444" : "#6B7280", fontWeight: "700" }}>
                      {message.length} / 200 chars
                    </span>
                  </div>
                  <textarea
                    required
                    rows="3"
                    placeholder="e.g. Get up to 50% OFF on Snacks today. Limited time offer."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={message.length > 200 ? { ...textareaStyle, borderColor: "#EF4444" } : textareaStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={labelStyle}>Notification Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
                      <option value="General">General</option>
                      <option value="Offer">Offer</option>
                      <option value="BuyCoins">BuyCoins</option>
                      <option value="Order Update">Order Update</option>
                      <option value="Announcement">Announcement</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={labelStyle}>Optional Image URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://example.com/image.jpg"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={labelStyle}>CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Shop Now"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={labelStyle}>CTA Link</label>
                    <input
                      type="text"
                      placeholder="e.g. /category/snacks"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0" }}>
                  <label style={labelStyle}>Recipients</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={radioContainerStyle(recipientOption === "all")}>
                      <input
                        type="radio"
                        name="recipients"
                        checked={recipientOption === "all"}
                        onChange={() => setRecipientOption("all")}
                        style={{ marginRight: "8px" }}
                      />
                      <span>○ All Users</span>
                    </label>

                    <label style={{ ...radioContainerStyle(false), opacity: 0.5, cursor: "not-allowed" }}>
                      <input type="radio" name="recipients" disabled style={{ marginRight: "8px" }} />
                      <span>○ Selected Users (V2)</span>
                    </label>

                    <label style={{ ...radioContainerStyle(false), opacity: 0.5, cursor: "not-allowed" }}>
                      <input type="radio" name="recipients" disabled style={{ marginRight: "8px" }} />
                      <span>○ Users With BuyCoins (V2)</span>
                    </label>

                    <label style={{ ...radioContainerStyle(false), opacity: 0.5, cursor: "not-allowed" }}>
                      <input type="radio" name="recipients" disabled style={{ marginRight: "8px" }} />
                      <span>○ Users With Orders (V2)</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={testing || sending}
                    style={{
                      ...actionBtnStyle,
                      background: "#FFFFFF",
                      color: "#374151",
                      border: "1.5px solid #E5E7EB"
                    }}
                  >
                    {testing ? "Testing..." : "Send Test Notification"}
                  </button>
                  <button
                    type="submit"
                    disabled={sending || testing || message.length > 200}
                    style={{
                      ...actionBtnStyle,
                      background: sending || testing || message.length > 200 ? "#9CA3AF" : "#318616",
                      color: "white",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
                    }}
                  >
                    {sending ? "Sending..." : "Send Notification"}
                  </button>
                </div>
              </form>
            </div>

            {/* Campaign Logs History */}
            <div style={cardLayoutStyle}>
              <h3 style={cardTitleStyle}>Recent Notifications</h3>
              <p style={{ color: "#6B7280", fontSize: "12px", margin: "4px 0 16px 0", fontWeight: "600" }}>
                History of all promotional campaigns broadcast to users.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Recipients</th>
                      <th style={thStyle}>Delivered</th>
                      <th style={thStyle}>Failed</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={emptyTdStyle}>No campaign records found.</td>
                      </tr>
                    ) : (
                      history.map((camp) => (
                        <tr key={camp._id} style={trStyle}>
                          <td style={{ ...tdTextStyle, fontWeight: "700" }}>{camp.title}</td>
                          <td>
                            <span style={typeBadgeStyle(camp.type)}>
                              {camp.type}
                            </span>
                          </td>
                          <td style={{ ...tdTextStyle, textAlign: "center" }}>{camp.recipientCount}</td>
                          <td style={{ ...tdTextStyle, color: "#318616", fontWeight: "700", textAlign: "center" }}>
                            {camp.deliveredCount}
                          </td>
                          <td style={{ ...tdTextStyle, color: camp.failedCount > 0 ? "#EF4444" : "#6B7280", fontWeight: "700", textAlign: "center" }}>
                            {camp.failedCount}
                          </td>
                          <td style={{ ...tdTextStyle, color: "#6B7280" }}>
                            {new Date(camp.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// UI STYLING CONSTANTS (Matching dashboard styles)
const loadingContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const spinnerStyle = {
  width: "50px",
  height: "50px",
  border: "4px solid rgba(49, 134, 22, 0.1)",
  borderTop: "4px solid #318616",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

const pageContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  color: "#111827",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "24px 32px",
  boxSizing: "border-box",
  position: "relative"
};

const toastStyle = {
  position: "fixed",
  top: "32px",
  right: "32px",
  background: "#318616",
  color: "white",
  padding: "16px 28px",
  borderRadius: "16px",
  fontWeight: "800",
  fontSize: "15px",
  boxShadow: "0 10px 30px rgba(49, 134, 22, 0.25)",
  zIndex: 99999,
  animation: "fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "20px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "24px"
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
  fontSize: "24px",
  fontWeight: "850",
  letterSpacing: "-0.5px",
  margin: 0
};

const badgeStyle = {
  background: "#FFF1F0",
  color: "#FF4D4F",
  border: "1px solid rgba(255, 77, 79, 0.15)",
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase"
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "250px 1fr",
  gap: "28px",
  alignItems: "start"
};

const sidebarStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)"
};

const sidebarHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "16px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "16px"
};

const avatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #318616 0%, #6fbf3a 100%)",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const navGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const activeNavLinkStyle = {
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "800",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
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
  transition: "all 0.15s ease"
};

const mainPanelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px"
};

const cardLayoutStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)"
};

const cardTitleStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 16px 0"
};

const templateBtnStyle = {
  background: "#F3F4F6",
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#374151",
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const dashboardDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1fr",
  gap: "24px",
  alignItems: "start"
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#4B5563"
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid #E5E7EB",
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  outline: "none"
};

const textareaStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid #E5E7EB",
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  outline: "none",
  resize: "vertical",
  fontFamily: "inherit"
};

const selectStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid #E5E7EB",
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  outline: "none",
  background: "white"
};

const radioContainerStyle = (active) => ({
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: "12px",
  border: active ? "1.5px solid #318616" : "1.5px solid #E5E7EB",
  background: active ? "#F0FDF4" : "#FFFFFF",
  fontSize: "14px",
  fontWeight: "700",
  color: active ? "#318616" : "#374151",
  cursor: "pointer",
  transition: "all 0.15s ease"
});

const actionBtnStyle = {
  padding: "14px",
  borderRadius: "14px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  transition: "all 0.15s ease"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px"
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  color: "#6B7280",
  fontWeight: "800",
  borderBottom: "1.5px solid #E5E7EB"
};

const trStyle = {
  borderBottom: "1px solid #F3F4F6",
  transition: "background 0.15s ease"
};

const tdTextStyle = {
  padding: "16px",
  fontWeight: "600",
  color: "#111827"
};

const typeBadgeStyle = (type) => {
  let bg = "#F3F4F6";
  let color = "#4B5563";
  if (type === "Offer") { bg = "#FEF3C7"; color = "#D97706"; }
  if (type === "BuyCoins") { bg = "#ECFDF5"; color = "#059669"; }
  if (type === "Order Update") { bg = "#E0F2FE"; color = "#0284C7"; }
  if (type === "Announcement") { bg = "#F3E8FF"; color = "#7C3AED"; }
  return {
    fontSize: "11px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "6px",
    background: bg,
    color: color
  };
};

const emptyTdStyle = {
  padding: "40px",
  textAlign: "center",
  color: "#6B7280",
  fontWeight: "600"
};

const errorBannerStyle = {
  background: "#FEE2E2",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#B91C1C",
  borderRadius: "14px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "750"
};

// Modal Styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100000
};

const modalContentStyle = {
  background: "#FFFFFF",
  borderRadius: "24px",
  padding: "32px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  animation: "scaleUp 0.2s ease-out"
};

const cancelBtnStyle = {
  background: "#F3F4F6",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: "750",
  color: "#4B5563",
  cursor: "pointer"
};

const confirmBtnStyle = {
  background: "#318616",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  cursor: "pointer"
};
