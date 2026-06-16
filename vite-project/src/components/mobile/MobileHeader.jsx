import React from "react";
import { useNavigate } from "react-router-dom";

function MobileHeader({ userLocation, roomNumber, totalItems }) {
  const navigate = useNavigate();
  const addressText = userLocation ? `${userLocation}${roomNumber ? `, Room ${roomNumber}` : ""}` : "No address specified";

  return (
    <header
      style={{
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: "50px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      {/* Left side: Location Icon and text */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", flex: 1 }}>
        <div style={{ fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#1f2937", lineHeight: "1.2" }}>Home</span>
          <span
            style={{
              fontSize: "10px",
              color: "#9ca3af",
              fontWeight: "600",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "220px",
              marginTop: "1px",
            }}
          >
            {addressText}
          </span>
        </div>
      </div>

      {/* Right side: Cart Icon with badge */}
      <div
        onClick={() => navigate("/cart")}
        style={{
          position: "relative",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {totalItems > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-4px",
              background: "#ef4444",
              color: "white",
              fontSize: "9px",
              fontWeight: "800",
              borderRadius: "50%",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 2px",
              boxSizing: "border-box",
              border: "1.5px solid white",
            }}
          >
            {totalItems}
          </span>
        )}
      </div>
    </header>
  );
}

export default MobileHeader;
