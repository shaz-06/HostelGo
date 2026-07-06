import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const promoSlides = [
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
  },
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
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 3500); // auto-slide every 3.5 seconds
    return () => clearInterval(timer);
  }, []);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

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
      <div
        style={{
          position: "relative",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          aspectRatio: "3/1", // matching general banner landscape ratio
          width: "100%",
          background: "#f3f4f6"
        }}
      >
        {/* Slides Wrapper */}
        <div
          style={{
            display: "flex",
            width: `${promoSlides.length * 100}%`,
            height: "100%",
            transform: `translateX(-${(currentSlide * 100) / promoSlides.length}%)`,
            transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {promoSlides.map((slide, idx) => (
            <div
              key={idx}
              onClick={() => navigate(slide.link)}
              style={{
                width: `${100 / promoSlides.length}%`,
                flex: `0 0 ${100 / promoSlides.length}%`,
                height: "100%",
                position: "relative",
                cursor: "pointer",
                padding: "12px",
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111"
              }}
            >
              {/* Blurred Background Cover */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(16px) brightness(0.7)",
                  transform: "scale(1.2)",
                  zIndex: 1
                }}
              />
              <img
                src={slide.image}
                alt={slide.alt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  position: "relative",
                  zIndex: 2
                }}
              />
            </div>
          ))}
        </div>

        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.8)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 10,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          style={{
            position: "absolute",
            right: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.8)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 10,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Dots Indicators */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "6px",
            zIndex: 10
          }}
        >
          {promoSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              style={{
                width: idx === currentSlide ? "16px" : "6px",
                height: "6px",
                borderRadius: "999px",
                border: "none",
                padding: 0,
                background: idx === currentSlide ? "#318616" : "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
