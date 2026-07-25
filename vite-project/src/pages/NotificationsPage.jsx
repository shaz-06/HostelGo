import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/common/SEO";

export default function NotificationsPage() {
  const { token, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(false);

  // Fetch notification history
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(window.API_BASE_URL + "/api/users/notifications", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to load notification history");
      const data = await res.json();
      
      let fetchedList = [];
      if (data && data.success && Array.isArray(data.notifications)) {
        fetchedList = data.notifications;
      } else if (Array.isArray(data)) {
        fetchedList = data;
      } else if (data && Array.isArray(data.notifications)) {
        fetchedList = data.notifications;
      }
      
      console.log("Notifications:", fetchedList);
      setNotifications(fetchedList);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/users/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  // Mark a single notification as read
  const handleMarkSingleRead = async (id) => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/users/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Trigger test notification
  const handleSendTestNotification = async () => {
    if (testing) return;
    try {
      setTesting(true);
      const res = await fetch(window.API_BASE_URL + "/api/users/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Reload notifications history after a small delay to catch the new test notification
        setTimeout(() => {
          fetchNotifications();
        }, 1500);
      } else {
        alert("Failed to send test notification. Make sure your local server is running and your account is active.");
      }
    } catch (err) {
      console.error("Failed to trigger test notification:", err);
    } finally {
      setTesting(false);
    }
  };

  const getNotificationIcon = (item) => {
    const type = item.data?.type || "";
    if (type === "ORDER") return "🛒";
    if (type === "PROMO") return "🔥";
    if (type === "TEST") return "⚡";
    return "🔔";
  };

  const getNotificationColor = (item) => {
    const type = item.data?.type || "";
    if (type === "ORDER") return "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"; // Sky Blue
    if (type === "PROMO") return "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"; // Gold/Amber
    if (type === "TEST") return "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)"; // Purple
    return "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)"; // Slate
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px", fontFamily: "'Outfit', sans-serif" }}>
      <SEO title={unreadCount > 0 ? `(${unreadCount}) Notifications` : "Notifications"} description="View your order alerts, delivery notifications, and special offers on Buyto." />
      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <button
            id="btn-back-to-home"
            onClick={() => window.history.back()}
            style={{
              background: "rgba(243, 244, 246, 0.8)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "18px",
              marginBottom: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: 0, tracking: "-0.5px" }}>
            Notification Center
          </h1>
        </div>

        {Array.isArray(notifications) && notifications.some(n => !n?.read) && (
          <button
            id="btn-mark-all-read"
            onClick={handleMarkAllRead}
            style={{
              background: "transparent",
              color: "#f59e0b",
              border: "1px solid #f59e0b",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Test Panel Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
          borderRadius: "24px",
          padding: "20px",
          color: "white",
          marginBottom: "28px",
          boxShadow: "0 12px 24px rgba(49, 16, 66, 0.2)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "700" }}>Test Push Notifications</h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "13px", opacity: 0.8, lineHeight: "1.4" }}>
            Tap the button to send a live Firebase Cloud Messaging test notification directly to this device.
          </p>
          <button
            id="btn-send-test-push"
            onClick={handleSendTestNotification}
            disabled={testing}
            style={{
              background: testing ? "#6b7280" : "#fbc607",
              color: "#111827",
              border: "none",
              borderRadius: "14px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: testing ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(251, 198, 7, 0.3)",
              transition: "all 0.2s ease"
            }}
          >
            {testing ? "Sending..." : "Send Test Notification ⚡"}
          </button>
        </div>
        {/* Glow effect decorative element */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "150px",
            height: "150px",
            background: "radial-gradient(circle, rgba(251,198,7,0.2) 0%, rgba(0,0,0,0) 70%)",
            borderRadius: "50%"
          }}
        />
      </div>

      {/* Notifications History List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid #f3f3f3", borderTop: "3px solid #fbc607", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "40px 16px", background: "#fef2f2", borderRadius: "16px", border: "1px solid #fee2e2" }}>
          <p style={{ color: "#ef4444", margin: 0, fontWeight: "600" }}>{error}</p>
          <button onClick={fetchNotifications} style={{ marginTop: "12px", background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Retry</button>
        </div>
      ) : !Array.isArray(notifications) || notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 16px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔔</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px", fontWeight: "700" }}>No Notifications Yet</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Your history is clear. Updates about order status, promos, and alerts will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <AnimatePresence>
            {notifications.map((item, index) => {
              if (!item) return null;
              const hasRead = !!item.read;
              const titleText = item.title || "Notification";
              const bodyText = item.body || item.message || "";
              let displayDate = "Just now";
              if (item.createdAt) {
                try {
                  const d = new Date(item.createdAt);
                  if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                } catch (e) {}
              }

              return (
                <motion.div
                  key={item._id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => !hasRead && handleMarkSingleRead(item._id)}
                  style={{
                    background: hasRead ? "#ffffff" : "#fffbeb",
                    border: hasRead ? "1px solid #f3f4f6" : "1px solid #fde68a",
                    borderRadius: "18px",
                    padding: "16px",
                    display: "flex",
                    gap: "16px",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: hasRead ? "0 2px 8px rgba(0,0,0,0.02)" : "0 4px 12px rgba(253, 230, 138, 0.15)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Visual Indicator Dot */}
                  {!hasRead && (
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        width: "8px",
                        height: "8px",
                        background: "#f59e0b",
                        borderRadius: "50%"
                      }}
                    />
                  )}

                  {/* Left Colored Icon Box */}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: getNotificationColor(item),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0
                    }}
                  >
                    {getNotificationIcon(item)}
                  </div>

                  {/* Right Text Contents */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: hasRead ? "600" : "700", color: "#111827" }}>
                        {titleText}
                      </h4>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {displayDate}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#4b5563", lineHeight: "1.4" }}>
                      {bodyText}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
