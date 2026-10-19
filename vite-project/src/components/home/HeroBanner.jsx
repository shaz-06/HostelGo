import React from "react";

function HeroBanner() {
  return (
    <div
      id="home-hero-banner"
      data-welcome-banner
      style={{
        height: "140px",
        textAlign: "center",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <img
        src="/images/offer-blue.webp"
        alt="Welcome Offers"
        fetchPriority="high"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
      />
      {/* Overlapping Tab */}
      <div
        style={{
          backgroundColor: "#FFF3C4",
          color: "#075E7A",
          padding: "6px 20px",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          fontSize: "11px",
          fontWeight: "850",
          letterSpacing: "1px",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "-1px", // overlap the border
          zIndex: 2,
        }}
      >
        ✦ OFFERS FOR YOU ✦
      </div>
    </div>
  );
}

export default HeroBanner;
