import React from "react";

const DeliveryIllustration = "https://img.icons8.com/?size=100&id=uTI4SjCIkNJp&format=png&color=000000";

function Offers({ openOffer }) {
  return (
    <div
      style={{
        padding: "0 16px 16px 16px",
        background: "linear-gradient(135deg, #075E7A 0%, #087EA4 45%, #1295B8 100%)", // Solid Dark Azure gradient
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Card 1 - Discount */}
      <div
        className="offer-card-clickable"
        onClick={() => openOffer("discount")}
        style={{
          background: "linear-gradient(135deg, #096D8D 0%, #0992BE 45%, #1AB3DD 100%)",
          borderRadius: "16px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        {/* Left side: Discount Illustration */}
        <div
          style={{
            flexShrink: 0,
            width: "48px",
            height: "48px",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src="https://img.icons8.com/?size=100&id=mnqCs95ap07K&format=png&color=000000"
            alt="Discount Offer"
            style={{
              width: "46px",
              height: "46px",
              objectFit: "contain",
            }}
          />
        </div>
        {/* Right side: Texts */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", fontWeight: "850", color: "#FFFFFF", lineHeight: "1.2" }}>
            Enjoy FLAT ₹50 OFF
          </span>
          <span style={{ fontSize: "11px", fontWeight: "650", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px", lineHeight: "1.2" }}>
            On your first order above ₹249
          </span>
        </div>
      </div>

      {/* Card 2 - Free Delivery */}
      <div
        className="offer-card-clickable"
        onClick={() => openOffer("delivery")}
        style={{
          background: "linear-gradient(135deg, #096D8D 0%, #0992BE 45%, #1AB3DD 100%)",
          borderRadius: "16px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        {/* Left side: Delivery Rider Illustration */}
        <div
          style={{
            flexShrink: 0,
            width: "48px",
            height: "48px",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={DeliveryIllustration}
            alt="Free Delivery"
            style={{
              width: "46px",
              height: "46px",
              objectFit: "contain",
            }}
          />
        </div>
        {/* Right side: Texts */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", fontWeight: "850", color: "#FFFFFF", lineHeight: "1.2" }}>
            Enjoy FREE delivery
          </span>
          <span style={{ fontSize: "11px", fontWeight: "650", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px", lineHeight: "1.2" }}>
            On all your orders
          </span>
        </div>
      </div>

      {/* Custom Styles for active press effect */}
      <style>{`
        .offer-card-clickable {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }
        .offer-card-clickable:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

export default Offers;
