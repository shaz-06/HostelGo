import React from "react";
import { useNavigate } from "react-router-dom";

const trendingItems = [
  {
    title: "Atta Fest",
    offer: "FLAT 15% OFF",
    bg: "linear-gradient(135deg, #FFF8D6 0%, #FFF0B8 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783259120/9941b19b-02aa-49bb-b0e0-3f535408df84_T1LXCL506J_MN_15122025_iend15.png",
    route: "/category/atta-rice-and-dal"
  },
  {
    title: "Fruit Festival",
    offer: "FRESHLY PICKED",
    bg: "linear-gradient(135deg, #FFE7EA 0%, #FFD5D9 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783259296/feac5f4b-2040-40af-9c69-8099bdb70d87_T8FOQ65W90_MN_20112025_kwqbtb.jpg",
    route: "/category/fresh-fruits"
  },
  {
    title: "Dairy Coolers",
    offer: "UP TO 30% OFF",
    bg: "linear-gradient(135deg, #E8F1FF 0%, #D7E8FF 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243355/5b0984b8-303b-4a80-81b7-9656f1950b67_63aaae7c-1add-4357-8ae1-5a9662d6b240_jnbnil.png",
    route: "/category/dairy-bread-eggs"
  },
  {
    title: "Fresh Living",
    offer: "100% ORGANIC",
    bg: "linear-gradient(135deg, #FFF8D6 0%, #FFF0B8 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245595/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2_sbqlin.png",
    route: "/category/fresh-vegetables"
  },
  {
    title: "Skin Glow",
    offer: "MIN. 25% OFF",
    bg: "linear-gradient(135deg, #FFE7EA 0%, #FFD5D9 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243400/d6930a4e-6a3c-44c9-8b6b-86f63e20434a_0c08d4e2-6423-4a9e-ad4b-35b339a149b0_jgix4i.png",
    route: "/category/skin-care"
  },
  {
    title: "Coolers",
    offer: "SUPER SAVER DEALS",
    bg: "linear-gradient(135deg, #FFF2E1 0%, #FFE4BF 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243351/5bec1f84-4aa5-49ae-9c3d-9a0dcb9fe2ad_d990b4fc-4629-4cc6-bc7a-ace787fb378a_uftkev.png",
    route: "/category/mobiles-electronics"
  }
];

function TrendingThisWeek() {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = React.useState(3);
  const [transitionEnabled, setTransitionEnabled] = React.useState(true);
  const [itemsPerSlide, setItemsPerSlide] = React.useState(3);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const dragStartRef = React.useRef(0);
  const dragOffsetRef = React.useRef(0);
  const wasDraggedRef = React.useRef(false);
  const containerRef = React.useRef(null);

  // Clone 3 items at start and end for infinite looping visual safety
  const extendedItems = React.useMemo(() => {
    const clonedStart = trendingItems.slice(-3);
    const clonedEnd = trendingItems.slice(0, 3);
    return [...clonedStart, ...trendingItems, ...clonedEnd];
  }, []);

  // Determine items per slide based on width
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsPerSlide(1);
      } else if (width < 1024) {
        setItemsPerSlide(2);
      } else {
        setItemsPerSlide(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-sliding effect
  React.useEffect(() => {
    if (isHovered || isDragging || !transitionEnabled) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered, isDragging, transitionEnabled]);

  // Handle transition end for wrapping around
  const handleTransitionEnd = () => {
    if (currentIndex >= 9) {
      setTransitionEnabled(false);
      setCurrentIndex(3);
    } else if (currentIndex <= 2) {
      setTransitionEnabled(false);
      setCurrentIndex(8);
    }
  };

  // Re-enable transitions after reset jump
  React.useEffect(() => {
    if (!transitionEnabled) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [transitionEnabled]);

  // Touch & Mouse Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    setTransitionEnabled(false);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartRef.current = clientX;
    dragOffsetRef.current = 0;
    wasDraggedRef.current = false;
  };

  const handleDragMove = (e) => {
    if (!dragStartRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStartRef.current;
    dragOffsetRef.current = offset;

    if (Math.abs(offset) > 10) {
      wasDraggedRef.current = true;
    }

    if (containerRef.current) {
      containerRef.current.style.setProperty("--drag-offset", `${offset}px`);
    }
  };

  const handleDragEnd = () => {
    if (!dragStartRef.current) return;
    setIsDragging(false);
    setTransitionEnabled(true);

    const offset = dragOffsetRef.current;
    dragStartRef.current = 0;
    dragOffsetRef.current = 0;

    if (containerRef.current) {
      containerRef.current.style.setProperty("--drag-offset", "0px");
    }

    const threshold = 50; // pixels
    if (offset > threshold) {
      setCurrentIndex((prev) => prev - 1);
    } else if (offset < -threshold) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCardClick = (e, route) => {
    if (wasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate(route);
  };

  return (
    <div
      className="trending-this-week-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="trending-this-week-header">
        <div>
          <h2 className="trending-this-week-heading">Trending This Week</h2>
          <p className="trending-this-week-subheading">Top picks loved by students</p>
        </div>
        <button className="trending-view-all-btn" onClick={() => navigate("/categories")}>
          View All →
        </button>
      </div>

      <div className="trending-carousel-wrapper">
        <div
          ref={containerRef}
          className="trending-carousel-track"
          style={{
            transform: `translateX(calc(-1 * ${currentIndex} * (100% + 16px) / ${itemsPerSlide} + var(--drag-offset, 0px)))`,
            transition: transitionEnabled ? "transform 500ms ease-in-out" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {extendedItems.map((item, idx) => (
            <div
              key={idx}
              onClick={(e) => handleCardClick(e, item.route)}
              className="trending-promo-card group"
              style={{ background: item.bg }}
            >
              {/* Decorative elements */}
              <div className="trending-blob-top" />
              <div className="trending-blob-bottom" />

              {/* Left Info Column */}
              <div className="trending-promo-card-left">
                <span className="trending-promo-card-badge">🔥 Limited Time</span>
                <h3 className="trending-promo-card-title">{item.title}</h3>
                <p className="trending-promo-card-offer">{item.offer}</p>
              </div>

              {/* Floating Product Image */}
              <div className="trending-promo-card-image-wrapper">
                <img
                  src={item.image}
                  alt={item.title}
                  className="trending-promo-card-img"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="trending-carousel-dots">
        {trendingItems.map((_, idx) => {
          const isActive = (currentIndex - 3 + 6) % 6 === idx;
          return (
            <button
              key={idx}
              className={`trending-dot ${isActive ? "active" : ""}`}
              onClick={() => {
                setTransitionEnabled(true);
                setCurrentIndex(idx + 3);
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          );
        })}
      </div>

      <style>{`
        .trending-this-week-section {
          padding: 20px;
          font-family: 'Outfit', 'Inter', sans-serif;
          background: var(--bg-card);
          border-radius: 32px;
          margin-bottom: 16px;
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--border-color);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
        }

        .trending-this-week-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .trending-this-week-heading {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .trending-this-week-subheading {
          color: var(--text-secondary);
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .trending-view-all-btn {
          background: none;
          border: none;
          color: #318616;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s ease;
          outline: none;
          padding: 0;
        }

        .trending-view-all-btn:hover {
          transform: translateX(2px);
        }

        .trending-carousel-wrapper {
          overflow: hidden;
          width: 100%;
          padding: 8px 4px 16px 4px;
          position: relative;
        }

        .trending-carousel-track {
          display: flex;
          gap: 16px;
          width: 100%;
          will-change: transform;
          user-select: none;
          -webkit-user-drag: none;
        }

        .trending-promo-card {
          flex: 0 0 calc((100% - 32px) / 3);
          width: calc((100% - 32px) / 3);
          height: 170px;
          border-radius: 28px;
          padding: 20px;
          display: flex;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.02);
        }

        .trending-promo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
        }

        /* Decorative Background Elements */
        .trending-blob-top {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 128px;
          height: 128px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
          pointer-events: none;
        }

        .trending-blob-bottom {
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
          pointer-events: none;
        }

        .trending-promo-card-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          text-align: left;
          flex: 1;
          z-index: 2;
        }

        .trending-promo-card-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .trending-promo-card-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px 0;
          line-height: 1.1;
        }

        .trending-promo-card-offer {
          font-size: 16px;
          font-weight: 700;
          color: #F59E0B;
          margin: 0;
          letter-spacing: 0.3px;
        }

        /* Floating Image Container */
        .trending-promo-card-image-wrapper {
          position: absolute;
          right: 16px;
          bottom: 16px;
          width: 96px;
          height: 96px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: transform 300ms ease;
        }

        .trending-promo-card:hover .trending-promo-card-image-wrapper {
          transform: scale(1.05);
        }

        .trending-promo-card-img {
          width: 64px;
          height: 64px;
          object-fit: contain;
          pointer-events: none;
        }

        /* Pagination dots styling */
        .trending-carousel-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }

        .trending-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e5e7eb;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .trending-dot.active {
          background: #318616;
          width: 18px;
          border-radius: 3px;
        }

        @media (max-width: 1023px) {
          .trending-promo-card {
            flex: 0 0 calc((100% - 16px) / 2);
            width: calc((100% - 16px) / 2);
          }
        }

        @media (max-width: 767px) {
          .trending-this-week-section {
            padding: 16px;
            margin: 12px 16px;
            border-radius: 24px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          }

          .trending-this-week-heading {
            font-size: 20px;
          }

          .trending-this-week-subheading {
            font-size: 12px;
          }

          .trending-promo-card {
            flex: 0 0 100%;
            width: 100%;
            height: 150px;
            padding: 16px;
            border-radius: 24px;
          }

          .trending-promo-card-title {
            font-size: 20px;
          }

          .trending-promo-card-offer {
            font-size: 14px;
          }

          .trending-promo-card-image-wrapper {
            width: 80px;
            height: 80px;
            right: 12px;
            bottom: 12px;
          }

          .trending-promo-card-img {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </div>
  );
}

export default React.memo(TrendingThisWeek);
