import React from "react";
import riderIllustration from "../../assets/buyto-rider-illustration.png";

export default function BuytoRiderAvatar({ isWaiting = false, size = 64, className = "" }) {
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", // soft green background
    border: "1.5px solid #bbf7d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0 4px 8px rgba(49, 134, 22, 0.08)",
    animation: isWaiting ? "buyto-scooter-pulse 1.6s infinite ease-in-out" : "none",
    overflow: "hidden",
    flexShrink: 0
  };

  return (
    <div style={containerStyle} className={`buyto-rider-avatar-container ${className}`}>
      <img
        src={riderIllustration}
        alt="Buyto Rider"
        style={{
          width: "90%",
          height: "90%",
          objectFit: "contain"
        }}
      />
      
      {/* Golden 'B' Helmet Emblem/Badge */}
      <div style={{
        position: "absolute",
        bottom: "0px",
        right: "0px",
        background: "#318616",
        border: "1px solid #ffffff",
        borderRadius: "50%",
        width: `${size * 0.28}px`,
        height: `${size * 0.28}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.16}px`,
        fontWeight: "900",
        color: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
      }}>
        B
      </div>

      <style>{`
        @keyframes buyto-scooter-pulse {
          0% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.06); opacity: 0.75; }
          100% { transform: scale(1); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
