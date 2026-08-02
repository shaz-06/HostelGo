import React from "react";

export function AddressSearch({ query, onChange, onFocus }) {
  return (
    <div style={{ position: "relative", width: "100%", marginBottom: "16px" }}>
      <span style={{
        position: "absolute",
        left: "14px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "18px",
        color: "#94a3b8"
      }}>
        🔍
      </span>
      <input
        type="text"
        placeholder="Search for area, street name..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        style={{
          width: "100%",
          padding: "14px 14px 14px 44px",
          borderRadius: "16px",
          border: "1.5px solid #cbd5e1",
          outline: "none",
          fontSize: "14px",
          boxSizing: "border-box",
          fontFamily: "'Outfit', 'Inter', sans-serif",
          fontWeight: "600",
          color: "#0f172a",
          backgroundColor: "#f8fafc"
        }}
      />
    </div>
  );
}
