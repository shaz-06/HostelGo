import React from "react";
import { openLocationSettings } from "../../../services/location/locationService";

export function AddressBanner({ isGpsOff }) {
  if (!isGpsOff) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      backgroundColor: "#fff1f2",
      borderRadius: "16px",
      border: "1px solid #fecdd3",
      marginBottom: "16px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
        <span style={{ fontSize: "20px" }}>📍</span>
        <div>
          <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "750", color: "#9f1239" }}>
            Device location not enabled
          </h4>
          <p style={{ margin: 0, fontSize: "11px", color: "#be123c", fontWeight: "600" }}>
            Enable for a better delivery experience
          </p>
        </div>
      </div>
      <button
        onClick={openLocationSettings}
        style={{
          backgroundColor: "#318616",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "11px",
          fontWeight: "800",
          cursor: "pointer"
        }}
      >
        Enable
      </button>
    </div>
  );
}
