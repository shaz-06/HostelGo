import React, { useContext, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { LoaderContext } from "../../context/LoaderContext";
import { logoPath } from "../../config/branding";


const MESSAGES = [
  "⚡ Loading Your Buyto...",
  "🛒 Preparing your shopping experience...",
  "🥬 Fetching today's fresh products...",
  "📍 Finding nearby stores...",
  "🚚 Finding the fastest delivery partner...",
  "💚 Applying your BuyCoins...",
  "🎁 Checking today's offers...",
  "✨ Almost ready...",
];

const HIDE_LAYOUT_ROUTES = [
  "/login",
  "/signup",
  "/admin",
  "/admin-login",
  "/admin-verify",
  "/rider",
  "/payment",
  "/details",
  "/track-order",
];

export default function BuytoLoader({ mode = "fullscreen" }) {
  const { pathname } = useLocation();

  const {
    showLoader,
    isOffline,
    errorState,
    loaderTimeStage,
    handleRetry,
    handleGoHome,
    isNavigating,
  } = useContext(LoaderContext);

  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 767px)");
    const handleChange = (e) => setIsMobile(e.matches);

    setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const showLayout = useMemo(
    () => !HIDE_LAYOUT_ROUTES.some(route => pathname.startsWith(route)),
    [pathname]
  );

  const hasHeader = showLayout;
  const hasBottomNav = showLayout;

  const ADMIN_ROUTE_PREFIXES = ["/admin", "/admin-login", "/admin-verify"];
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Rotate messages
  useEffect(() => {
    if ((mode !== "inline" && !showLoader) || errorState) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setFade(true);
      }, 300); // matching CSS fade duration
    }, 2500);

    return () => clearInterval(interval);
  }, [showLoader, errorState, mode]);

  if (isAdminRoute) return null;
  if (mode !== "inline" && (!showLoader || isNavigating) && !errorState) return null;

  const isInline = mode === "inline";

  const computedOverlayStyle = isInline ? {
    position: "relative",
    width: "100%",
    minHeight: "calc(100vh - 70px - env(safe-area-inset-bottom, 0px))",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  } : {
    position: "fixed",
    top: (isMobile && hasHeader) ? "var(--header-height, 60px)" : "0",
    bottom: (isMobile && hasBottomNav) ? "calc(var(--bottom-nav-height, 70px) + env(safe-area-inset-bottom, 0px))" : "0",
    left: isMobile ? "50%" : "0",
    transform: isMobile ? "translateX(-50%)" : "none",
    maxWidth: isMobile ? "480px" : "100%",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999, // below 1000 of Bottom Navigation / Header
    padding: "20px",
    backdropFilter: "blur(4px)",
    pointerEvents: "none",
    right: isMobile ? "auto" : "0",
    boxSizing: "border-box",
  };

  return (
    <div style={computedOverlayStyle}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 4px 12px rgba(49, 134, 22, 0.2)); }
            100% { transform: scale(1); opacity: 0.95; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .loader-logo {
            animation: pulse 2s infinite ease-in-out;
          }
          .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #318616;
            margin: 0 4px;
            animation: bounce 0.6s infinite alternate;
          }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
          
          .message-transition {
            transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
            opacity: 0;
            transform: translateY(4px);
          }
          .message-fade-in {
            opacity: 1;
            transform: translateY(0);
          }
        `
      }} />

      <div style={cardStyle}>
        {errorState ? (
          // Connection Error / Offline View
          <div style={errorContainerStyle}>
            <div style={errorIconStyle}>
              {errorState.type === "offline" ? "📶" : "⚠️"}
            </div>
            <h2 style={errorTitleStyle}>
              {errorState.type === "offline"
                ? "You're offline"
                : "Connection Trouble"}
            </h2>
            <p style={errorDescriptionStyle}>
              {errorState.type === "offline"
                ? "Check your connection and we'll be ready when you are."
                : "We're having trouble connecting to Buyto. Please check your internet connection and try again."}
            </p>
            <div style={buttonGroupStyle}>
              <button onClick={handleRetry} style={retryButtonStyle}>
                Retry Connection
              </button>
              <button onClick={handleGoHome} style={homeButtonStyle}>
                Go to Home
              </button>
            </div>
          </div>
        ) : (
          // Active Loading View
          <div style={loadingContainerStyle}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "180px", marginBottom: "16px" }}>
              <img
                src={logoPath}
                alt="Buyto Logo"
                className="loader-logo"
                style={{ height: "64px", width: "auto", marginBottom: "24px", objectFit: "contain" }}
              />
              <div style={bouncingDotsStyle}>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>

            <div
              className={`message-transition ${fade ? "message-fade-in" : ""}`}
              style={messageStyle}
            >
              {MESSAGES[messageIndex]}
            </div>

            {/* Time stage subtexts */}
            {loaderTimeStage >= 1 && (
              <div style={subtextStyle}>
                {loaderTimeStage === 1
                  ? "This is taking a little longer than usual..."
                  : "Still connecting to Buyto server..."}
              </div>
            )}

            <div style={footerStyle}>Please wait a moment...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styling system
const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "40px 32px",
  maxWidth: "400px",
  width: "100%",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
  textAlign: "center",
  border: "1px solid #f1f5f9",
  pointerEvents: "auto",
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const logoStyle = {
  height: "76px",
  width: "auto",
  marginBottom: "24px",
  objectFit: "contain",
};

const bouncingDotsStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "24px",
};

const messageStyle = {
  fontSize: "17px",
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: "12px",
  height: "24px",
};

const subtextStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginTop: "8px",
  fontWeight: "500",
};

const footerStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "32px",
};

const errorContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const errorIconStyle = {
  fontSize: "48px",
  marginBottom: "16px",
};

const errorTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#1e293b",
  marginBottom: "12px",
};

const errorDescriptionStyle = {
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "1.5",
  marginBottom: "28px",
  fontWeight: "500",
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  gap: "12px",
};

const retryButtonStyle = {
  backgroundColor: "#318616",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)",
  transition: "transform 0.2s",
};

const homeButtonStyle = {
  backgroundColor: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
};
