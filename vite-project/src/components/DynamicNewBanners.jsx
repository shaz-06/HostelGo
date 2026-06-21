import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const leftBanners = [
  {
    image: "/images/dabur_red_toothpaste_banner.png",
    alt: "Dabur Red Toothpaste",
    link: "/category/oral-care"
  },
  {
    image: "/images/school_breaks_banner.png",
    alt: "School Breaks Must-Haves",
    link: "/category/books-and-stationery"
  },
  {
    image: "/images/dabur_hair_care_banner.png",
    alt: "Dabur Hair Care",
    link: "/category/hair-care"
  }
];

const rightBanners = [
  {
    image: "/images/appliances_banner.png",
    alt: "Home Appliances",
    link: "/category/appliances"
  },
  {
    image: "/images/monsoon_home_essentials_banner.png",
    alt: "Monsoon Home Essentials",
    link: "/category/cleaning-essentials"
  }
];

export default function DynamicNewBanners() {
  const navigate = useNavigate();
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(0);

  useEffect(() => {
    let toggle = true;
    const timer = setInterval(() => {
      if (toggle) {
        setLeftIdx((prev) => (prev + 1) % leftBanners.length);
      } else {
        setRightIdx((prev) => (prev + 1) % rightBanners.length);
      }
      toggle = !toggle;
    }, 3500); // alternating slides every 3.5s
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        padding: "0 16px",
        marginBottom: "16px",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}
    >
      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        {/* Left Dynamic Banner */}
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            aspectRatio: "1.65/1",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center"
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${leftBanners.length * 100}%`,
              height: "100%",
              transform: `translateX(-${(leftIdx * 100) / leftBanners.length}%)`,
              transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {leftBanners.map((slide, idx) => (
              <div
                key={idx}
                onClick={() => navigate(slide.link)}
                style={{
                  width: `${100 / leftBanners.length}%`,
                  height: "100%",
                  position: "relative",
                  cursor: "pointer"
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Dots Left */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "5px",
              zIndex: 10
            }}
          >
            {leftBanners.map((_, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setLeftIdx(idx);
                }}
                style={{
                  width: idx === leftIdx ? "12px" : "5px",
                  height: "5px",
                  borderRadius: "999px",
                  background: idx === leftIdx ? "#318616" : "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Dynamic Banner */}
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            aspectRatio: "1.65/1",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center"
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${rightBanners.length * 100}%`,
              height: "100%",
              transform: `translateX(-${(rightIdx * 100) / rightBanners.length}%)`,
              transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {rightBanners.map((slide, idx) => (
              <div
                key={idx}
                onClick={() => navigate(slide.link)}
                style={{
                  width: `${100 / rightBanners.length}%`,
                  height: "100%",
                  position: "relative",
                  cursor: "pointer"
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Dots Right */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "5px",
              zIndex: 10
            }}
          >
            {rightBanners.map((_, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setRightIdx(idx);
                }}
                style={{
                  width: idx === rightIdx ? "12px" : "5px",
                  height: "5px",
                  borderRadius: "999px",
                  background: idx === rightIdx ? "#318616" : "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
