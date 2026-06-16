import React, { useState, useEffect } from "react";

const slides = [
  {
    bg: "#edeefd", // Light lavender
    titlePrefix: "Buy your ",
    titleHighlight: "essentials",
    badge: "Up to 50%",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80",
    brandLogo: "Buyto Instant",
  },
  {
    bg: "#eefaf2", // Soft green
    titlePrefix: "Fresh ",
    titleHighlight: "organic food",
    badge: "100% Clean",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80",
    brandLogo: "Farm Sourced",
  },
  {
    bg: "#fff1f2", // Soft pink
    titlePrefix: "Tasty ",
    titleHighlight: "snacks & treats",
    badge: "Flat 20%",
    image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=400&auto=format&fit=crop&q=80",
    brandLogo: "Quick Bite",
  },
  {
    bg: "#fffbeb", // Soft yellow
    titlePrefix: "Summer ",
    titleHighlight: "ice creams",
    badge: "Cool Deals",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80",
    brandLogo: "Sweet Deals",
  },
  {
    bg: "#f0f7ff", // Soft blue
    titlePrefix: "Dairy & ",
    titleHighlight: "breakfast",
    badge: "Fresh Daily",
    image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=400&auto=format&fit=crop&q=80",
    brandLogo: "Buyto Fresh",
  }
];

function MobileBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: "0 16px", marginBottom: "20px", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Banner Card */}
      <div
        style={{
          background: slides[currentSlide].bg,
          borderRadius: "20px",
          height: "140px",
          width: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          transition: "background 0.5s ease",
          boxSizing: "border-box",
          padding: "16px",
        }}
      >
        {/* Left Side Info */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 2 }}>
          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "900",
                color: "#1f2937",
                margin: 0,
                lineHeight: "1.2",
              }}
            >
              {slides[currentSlide].titlePrefix}
              <span style={{ color: "#ef4444" }}>{slides[currentSlide].titleHighlight}</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color: "#059669",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {slides[currentSlide].brandLogo}
            </span>
          </div>
        </div>

        {/* Center/Right Artwork */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={slides[currentSlide].image}
            alt="promo artwork"
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: "12px",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        {/* Green Discount Badge */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#84cc16", // Lime green
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "800",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: "1.1",
            boxShadow: "0 2px 6px rgba(132,204,22,0.3)",
          }}
        >
          {slides[currentSlide].badge.split(" ").map((word, wIdx) => (
            <span key={wIdx}>{word}</span>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginTop: "10px",
        }}
      >
        {slides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            style={{
              width: idx === currentSlide ? "10px" : "6px",
              height: "6px",
              borderRadius: "50%",
              background: idx === currentSlide ? "#4b5563" : "#d1d5db",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default MobileBannerCarousel;
