import React, { useState, useEffect, useRef } from "react";

import banner1 from "../../images/Screenshot 2026-07-05 at 17.14.11.png";
import banner2 from "../../images/Screenshot 2026-07-05 at 17.14.25.png";
import banner3 from "../../images/Screenshot 2026-07-05 at 17.18.11.png";
import banner4 from "../../images/Screenshot 2026-07-05 at 17.18.20.png";
import banner5 from "../../images/Screenshot 2026-07-05 at 17.24.14.png";
import banner6 from "../../images/Screenshot 2026-07-05 at 17.24.21.png";
import banner7 from "../../images/Screenshot 2026-07-05 at 17.25.42.png";
import banner8 from "../../images/Screenshot 2026-07-05 at 17.25.48.png";
import banner9 from "../../images/Screenshot 2026-07-05 at 17.26.34.png";
import banner10 from "../../images/Screenshot 2026-07-05 at 17.26.42.png";

const bannerSlides = [
  [banner1, banner2],
  [banner3, banner4],
  [banner5, banner6],
  [banner7, banner8],
  [banner9, banner10],
];

// Append first slide to the end for seamless looping
const slidesWithClone = [...bannerSlides, bannerSlides[0]];

function MobileBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const timeoutRef = useRef(null);
  const minSwipeDistance = 50;
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const slideCount = bannerSlides.length; // 5 original slides

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitionEnabled(true);
      setCurrentSlide((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Handle snapping back to start when reaching the cloned slide (index 5)
  useEffect(() => {
    if (currentSlide === slideCount) {
      timeoutRef.current = setTimeout(() => {
        setTransitionEnabled(false);
        setCurrentSlide(0);
      }, 500); // Wait for the 500ms sliding transition to finish
    }
  }, [currentSlide, slideCount]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setTransitionEnabled(true);
      setCurrentSlide((prev) => prev + 1);
    } else if (isRightSwipe) {
      setTransitionEnabled(true);
      if (currentSlide === 0) {
        // Snap instantly to the cloned last slide, then slide left to slide index 4
        setTransitionEnabled(false);
        setCurrentSlide(slideCount);
        setTimeout(() => {
          setTransitionEnabled(true);
          setCurrentSlide(slideCount - 1);
        }, 30);
      } else {
        setCurrentSlide((prev) => prev - 1);
      }
    }
  };

  const handleDotClick = (idx) => {
    setTransitionEnabled(true);
    setCurrentSlide(idx);
  };

  // Map the current index to the dots (cloned index 5 behaves like dot index 0)
  const activeDotIndex = currentSlide === slideCount ? 0 : currentSlide;

  return (
    <div className="hero-banner-section">
      <style>{`
        .hero-banner-section {
          padding: 0 16px;
          margin: 24px 0;
          font-family: 'Outfit', 'Inter', sans-serif;
          box-sizing: border-box;
          width: 100%;
        }
        .hero-banner-container {
          width: 100%;
          overflow: hidden;
          border-radius: 20px;
          position: relative;
          box-sizing: border-box;
          cursor: grab;
        }
        .hero-banner-track {
          display: flex;
        }
        .hero-banner-slide {
          display: flex;
          gap: 16px;
          box-sizing: border-box;
          padding: 0 2px;
        }
        .hero-banner-card {
          flex: 1;
          aspect-ratio: 16 / 7;
          border-radius: 20px;
          overflow: hidden;
          background: #f8f8f8;
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          transition: transform 0.3s ease;
          box-sizing: border-box;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }
        @media (max-width: 1024px) {
          .hero-banner-card {
            height: 170px;
          }
        }
        @media (max-width: 640px) {
          .hero-banner-card {
            height: 140px;
            border-radius: 12px;
            padding: 6px;
          }
          .hero-banner-container {
            border-radius: 12px;
          }
        }
        .hero-banner-card:hover {
          transform: translateY(-4px);
        }
        .hero-banner-card img {
          width: auto;
          height: 135%;
          max-width: 90%;
          object-fit: contain;
          object-position: center;
          display: block;
        }
      `}</style>

      {/* Outer Slider Container */}
      <div
        className="hero-banner-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding Track */}
        <div
          className="hero-banner-track"
          style={{
            width: `${slidesWithClone.length * 100}%`,
            transform: `translateX(-${(currentSlide * 100) / slidesWithClone.length}%)`,
            transition: transitionEnabled ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
          }}
        >
          {slidesWithClone.map((slidePair, slideIdx) => (
            <div
              key={slideIdx}
              className="hero-banner-slide"
              style={{
                width: `${100 / slidesWithClone.length}%`,
              }}
            >
              {slidePair.map((img, imgIdx) => (
                <div key={imgIdx} className="hero-banner-card">
                  <img
                    src={img}
                    alt={`banner-${slideIdx * 2 + imgIdx + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
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
        {bannerSlides.map((_, idx) => (
          <div
            key={idx}
            onClick={() => handleDotClick(idx)}
            style={{
              width: idx === activeDotIndex ? "10px" : "6px",
              height: "6px",
              borderRadius: "50%",
              background: idx === activeDotIndex ? "#4b5563" : "#d1d5db",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(MobileBannerCarousel);
