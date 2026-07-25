import React, { useState } from "react";

export default function OfflineScreen({ onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (navigator.onLine) {
        onRetry();
      } else {
        alert("⚠️ Still offline. Please check your network connection and try again.");
      }
    }, 1000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #F3FBF2 0%, #E8F5E9 100%)",
      zIndex: 999999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      textAlign: "center",
      overflowY: "auto"
    }}>
      {/* Header Logo */}
      <div style={{ position: "absolute", top: "24px", left: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#318616", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "16px", color: "white" }}>🛒</span>
        </div>
        <span style={{ fontSize: "20px", fontWeight: "900", color: "#318616", letterSpacing: "-0.5px" }}>Buyto</span>
      </div>

      <div style={{ maxWidth: "440px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Mascot Image */}
        <div style={{
          width: "260px",
          height: "260px",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(49, 134, 22, 0.12)",
          marginBottom: "32px",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "4px solid white"
        }}>
          <img 
            src="/no_internet_mascot.png" 
            alt="No Internet Mascot" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: "32px", fontWeight: "950", color: "#1B5E20", margin: "0 0 12px 0", lineHeight: "1.1", letterSpacing: "-1px" }}>
          Ooooops!<br />No Internet !
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: "15px", color: "#2E7D32", fontWeight: "600", margin: "0 0 32px 0", lineHeight: "1.5" }}>
          Looks like you're offline.<br />
          Please check your Wi-Fi or mobile data connection.
        </p>

        {/* Quick Help Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "32px", justifyContent: "center" }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
            flex: 1
          }}>
            <span style={{ fontSize: "20px" }}>📶</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" }}>Turn on</div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155" }}>Wi-Fi</div>
            </div>
          </div>

          <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "800" }}>or</span>

          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
            flex: 1
          }}>
            <span style={{ fontSize: "20px" }}>📶</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" }}>Enable</div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155" }}>Mobile Data</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          style={{
            background: "#318616",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "16px 36px",
            fontSize: "15px",
            fontWeight: "900",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(49, 134, 22, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            opacity: retrying ? 0.8 : 1
          }}
          onMouseEnter={(e) => { if (!retrying) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { if (!retrying) e.currentTarget.style.transform = "none"; }}
        >
          <span>🔄</span> {retrying ? "Checking..." : "Retry Connection"}
        </button>

        {/* Friendly Bottom Tip */}
        <div style={{
          marginTop: "40px",
          background: "rgba(255,255,255,0.5)",
          borderRadius: "12px",
          padding: "10px 16px",
          fontSize: "12px",
          color: "#2E7D32",
          fontWeight: "700"
        }}>
          💡 You're not alone! Check your connection and try again. 💚
        </div>

      </div>
    </div>
  );
}
