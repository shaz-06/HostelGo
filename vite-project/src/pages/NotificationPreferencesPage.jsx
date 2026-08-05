import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [preferences, setPreferences] = useState({
    promotionalWhatsApp: true,
    promotionalSMS: true
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // 'promotionalWhatsApp' or 'promotionalSMS'
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch current preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(window.API_BASE_URL + "/api/users/preferences", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPreferences({
            promotionalWhatsApp: data.preferences.promotionalWhatsApp !== false,
            promotionalSMS: data.preferences.promotionalSMS !== false
          });
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
        setToast({ type: "error", message: "Failed to load preferences from server." });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [token]);

  // Handle preference toggle action
  const handleToggle = async (key) => {
    if (savingKey) return; // Prevent concurrent requests / double clicks

    const oldVal = preferences[key];
    const newVal = !oldVal;

    // Optimistically update UI
    setPreferences(prev => ({ ...prev, [key]: newVal }));
    setSavingKey(key);
    setToast(null);

    try {
      const res = await fetch(window.API_BASE_URL + "/api/users/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: newVal })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPreferences({
          promotionalWhatsApp: data.preferences.promotionalWhatsApp !== false,
          promotionalSMS: data.preferences.promotionalSMS !== false
        });
        setToast({ type: "success", message: "Preferences updated successfully!" });
      } else {
        // Revert on failure
        setPreferences(prev => ({ ...prev, [key]: oldVal }));
        setToast({ type: "error", message: data.message || "Failed to update preferences." });
      }
    } catch (err) {
      console.error("Error updating preferences:", err);
      // Revert on network failure
      setPreferences(prev => ({ ...prev, [key]: oldVal }));
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSavingKey(null);
    }
  };

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loaderStyle}>🔄 Loading preferences...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <SEO title="Notification Preferences • Buyto" description="Manage your promotional WhatsApp and SMS preferences." />

      {/* Header Bar */}
      <div style={headerStyle}>
        {windowWidth >= 768 && (
          <button 
            onClick={() => navigate(-1)} 
            style={backButtonStyle}
            aria-label="Go Back"
          >
            ←
          </button>
        )}
        <h1 style={titleStyle}>Notification preferences</h1>
        <div style={{ width: "44px" }} /> {/* spacer to balance desktop back button */}
      </div>

      {/* Cards Wrapper */}
      <div style={cardsContainerStyle}>
        
        {/* Card 1: WhatsApp */}
        <div 
          onClick={() => handleToggle("promotionalWhatsApp")}
          style={cardStyle}
          role="button"
          tabIndex="0"
          aria-label={`Toggle Promotional WhatsApp Messages, currently ${preferences.promotionalWhatsApp ? "Enabled" : "Disabled"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle("promotionalWhatsApp");
            }
          }}
        >
          {/* Icon */}
          <div style={iconContainerStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12.012 2C6.485 2 2 6.485 2 12.012c0 1.83.497 3.542 1.365 5.012L2 22l5.122-1.325a9.98 9.98 0 0 0 4.89 1.28c5.527 0 10.012-4.485 10.012-10.012S17.538 2 12.012 2zm5.727 13.93c-.244.693-1.427 1.268-1.956 1.341-.478.068-.96.098-2.316-.45-1.745-.712-2.873-2.484-2.96-2.6a6.8 6.8 0 0 1-.365-.558c-1.39-1.854-1.283-3.293-1.283-3.293.078-.507.41-.75.546-.864.137-.112.293-.16.44-.16.146 0 .292.004.415.01.127.005.298-.048.468.36.176.425.605 1.478.659 1.585.053.107.09.23.017.375-.073.146-.11.25-.22.376-.11.127-.23.284-.33.38-.112.107-.228.225-.097.45.132.224.586.966 1.26 1.566.867.77 1.597 1.01 1.82 1.122.225.112.356.093.49-.063.13-.156.56-.654.711-.878.15-.224.3-.185.508-.107.205.078 1.302.615 1.527.727.224.112.375.166.43.263.053.098.053.566-.19 1.26z" fill="#25D366"/>
            </svg>
          </div>

          {/* Text Details */}
          <div style={infoStyle}>
            <h2 style={cardTitleStyle}>Promotional WhatsApp messages</h2>
            <p style={cardSubtitleStyle}>
              Receive WhatsApp updates about coupons, promotions and offers
            </p>
          </div>

          {/* Switch Toggle */}
          <div style={switchContainerStyle}>
            <div style={switchTrackStyle(preferences.promotionalWhatsApp)}>
              <div style={switchThumbStyle(preferences.promotionalWhatsApp, savingKey === "promotionalWhatsApp")} />
            </div>
          </div>
        </div>

        {/* Card 2: SMS */}
        <div 
          onClick={() => handleToggle("promotionalSMS")}
          style={cardStyle}
          role="button"
          tabIndex="0"
          aria-label={`Toggle Promotional SMS, currently ${preferences.promotionalSMS ? "Enabled" : "Disabled"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle("promotionalSMS");
            }
          }}
        >
          {/* Icon */}
          <div style={iconContainerStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" fill="var(--text-primary)"/>
            </svg>
          </div>

          {/* Text Details */}
          <div style={infoStyle}>
            <h2 style={cardTitleStyle}>Promotional SMS</h2>
            <p style={cardSubtitleStyle}>
              Receive SMS updates about coupons, promotions and offers
            </p>
          </div>

          {/* Switch Toggle */}
          <div style={switchContainerStyle}>
            <div style={switchTrackStyle(preferences.promotionalSMS)}>
              <div style={switchThumbStyle(preferences.promotionalSMS, savingKey === "promotionalSMS")} />
            </div>
          </div>
        </div>

      </div>

      {/* Toast Overlay */}
      {toast && (
        <div style={{
          ...toastOverlayStyle,
          backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444"
        }}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// CSS Variable Semantic Styles (Light/Dark themes out of the box)
const containerStyle = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column"
};

const loaderStyle = {
  textAlign: "center",
  padding: "80px 20px",
  fontSize: "16px",
  fontWeight: "700",
  color: "var(--text-secondary)"
};

const headerStyle = {
  background: "var(--bg-card)",
  height: "70px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  borderBottom: "1px solid var(--border-color)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
};

const backButtonStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "var(--bg-secondary)",
  border: "none",
  fontSize: "20px",
  fontWeight: "bold",
  color: "var(--text-primary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  outline: "none"
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "var(--text-primary)",
  margin: 0,
  textAlign: "center",
  flex: 1
};

const cardsContainerStyle = {
  padding: "20px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  maxWidth: "500px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box"
};

const cardStyle = {
  background: "var(--bg-card)",
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  border: "1px solid var(--border-color)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.015)",
  cursor: "pointer",
  transition: "transform 0.15s ease",
  outline: "none"
};

const iconContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  flexShrink: 0
};

const infoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  flex: 1
};

const cardTitleStyle = {
  fontSize: "15px",
  fontWeight: "800",
  color: "var(--text-primary)",
  margin: 0
};

const cardSubtitleStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "var(--text-secondary)",
  margin: 0,
  lineHeight: "1.4"
};

const switchContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
};

const switchTrackStyle = (isActive) => ({
  width: "48px",
  height: "26px",
  borderRadius: "15px",
  background: isActive ? "#10b981" : "var(--bg-secondary)",
  position: "relative",
  transition: "background 200ms cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: isActive ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "none"
});

const switchThumbStyle = (isActive, isLoading) => ({
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  background: "#ffffff",
  position: "absolute",
  top: "3px",
  left: isActive ? "25px" : "3px",
  transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: isLoading ? 0.7 : 1
});

const toastOverlayStyle = {
  position: "fixed",
  bottom: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  borderRadius: "12px",
  color: "#ffffff",
  fontWeight: "750",
  fontSize: "14px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  zIndex: 1000,
  animation: "fadeIn 0.2s ease"
};
