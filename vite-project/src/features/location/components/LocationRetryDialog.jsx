import React from "react";

export function LocationRetryDialog({ isOpen, onRetry, onSelectManually }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Dark backdrop */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)"
      }} />

      {/* Dialog box */}
      <div style={{
        position: "relative",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "28px",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)",
        textAlign: "center",
        border: "1px solid #f1f5f9"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "54px" }}>⚠️</span>
        </div>
        <h3 style={{ fontSize: "21px", fontWeight: "750", color: "#0f172a", marginBottom: "10px" }}>
          Unable to detect location
        </h3>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "28px" }}>
          We timed out or had trouble detecting your location automatically.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={onRetry}
            style={{
              backgroundColor: "#318616",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "750",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)"
            }}
          >
            Retry
          </button>
          <button
            onClick={onSelectManually}
            style={{
              backgroundColor: "transparent",
              color: "#318616",
              border: "1.5px solid #e2e8f0",
              borderRadius: "14px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "750",
              cursor: "pointer"
            }}
          >
            Select location manually
          </button>
        </div>
      </div>
    </div>
  );
}
