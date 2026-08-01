import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const promoSlides = [
  {
    image: "/images/furbaby_feasts_banner.png",
    alt: "Fur-baby Feasts - Up to 50% Off",
    link: "/category/pet-supplies"
  },
  {
    image: "/images/tea_time_bakes_banner.png",
    alt: "Tea Time Bakes - Up to 50% Off",
    link: "/category/bakery"
  },
  {
    image: "/images/protein_powerup_banner.png",
    alt: "Protein Power-up - Up to 50% Off",
    link: "/category/protein-and-supplements"
  },
  {
    image: "/images/gentle_baby_must_haves_banner.png",
    alt: "Gentle Baby Must-Haves - Up to 40% Off",
    link: "/category/baby-care"
  }
];

function PromoBannerCarousel() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  };

  return (
    <div
      style={{
        padding: "0 16px",
        marginBottom: "24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        position: "relative",
        width: "100%",
        boxSizing: "border-box"
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
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 10,
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "white")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
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
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 10,
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "white")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Pagination Dots Indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 10
          }}
        >
          {promoSlides.map((_, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              style={{
                width: idx === currentSlide ? "20px" : "8px",
                height: "8px",
                borderRadius: "999px",
                background: idx === currentSlide ? "#318616" : "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(PromoBannerCarousel);
