import React from "react";

import { getCategoryFromPathname } from "../../config/categoryConfig";
import { categoryThemes } from "../../config/themeConfig";
import { useLocation } from "react-router-dom";

export const CategoryStrip = React.memo(({ displayCats = [], selectedCategory, onCategoryClick, whiteText = false }) => {
  const scrollerRef = React.useRef(null);
  const itemRefs = React.useRef({});
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0, opacity: 0 });
  const [isReady, setIsReady] = React.useState(false);
  const [scrollWidth, setScrollWidth] = React.useState(0);
  const [isOverBanner, setIsOverBanner] = React.useState(true);

  const location = useLocation();
  const currentCategory = getCategoryFromPathname(location.pathname);
  const theme = categoryThemes[currentCategory] || categoryThemes.default;
  const isHomepage = currentCategory === "home";
  const isElectronicsPage = currentCategory === "electronics";

  React.useEffect(() => {
    let rafId = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const heroEl = document.getElementById("home-hero-banner");
        const stripEl = scrollerRef.current;
        if (heroEl && stripEl) {
          const heroRect = heroEl.getBoundingClientRect();
          const stripRect = stripEl.getBoundingClientRect();
          if (heroRect.bottom <= stripRect.bottom) {
            setIsOverBanner(false);
          } else {
            setIsOverBanner(true);
          }
        } else {
          setIsOverBanner(false);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    const timer = setTimeout(handleScroll, 100);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      clearTimeout(timer);
    };
  }, []);

  const updateIndicator = React.useCallback(() => {
    const activeItem = itemRefs.current[selectedCategory];
    if (scrollerRef.current) {
      setScrollWidth(scrollerRef.current.scrollWidth);
    }
    if (activeItem && scrollerRef.current) {
      const left = activeItem.offsetLeft;
      const width = activeItem.offsetWidth;

      setIndicatorStyle({
        left: left,
        width: width,
        opacity: 1
      });
      setIsReady(true);
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [selectedCategory]);

  React.useEffect(() => {
    updateIndicator();
  }, [selectedCategory, displayCats, updateIndicator]);

  React.useEffect(() => {
    if (!scrollerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        updateIndicator();
      }
    });
    resizeObserver.observe(scrollerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateIndicator]);

  if (!displayCats || displayCats.length === 0) return null;

  const maskImageStyle = `linear-gradient(to right, rgba(0,0,0,0) 0px, rgba(0,0,0,1) 60px, rgba(0,0,0,1) calc(100% - 60px), rgba(0,0,0,0) 100%)`;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      overflow: "hidden",
      background: (whiteText && !isElectronicsPage)
        ? "radial-gradient(ellipse 18% 70% at 7% 72%, rgba(220, 244, 252, 0.20) 0%, rgba(210, 240, 250, 0.10) 45%, transparent 100%), radial-gradient(ellipse 18% 70% at 22% 72%, rgba(220, 244, 252, 0.18) 0%, rgba(210, 240, 250, 0.08) 45%, transparent 100%), radial-gradient(ellipse 18% 70% at 38% 72%, rgba(220, 244, 252, 0.18) 0%, rgba(210, 240, 250, 0.08) 45%, transparent 100%), radial-gradient(ellipse 18% 70% at 54% 72%, rgba(220, 244, 252, 0.18) 0%, rgba(210, 240, 250, 0.08) 45%, transparent 100%), radial-gradient(ellipse 18% 70% at 70% 72%, rgba(220, 244, 252, 0.18) 0%, rgba(210, 240, 250, 0.08) 45%, transparent 100%), radial-gradient(ellipse 18% 70% at 86% 72%, rgba(220, 244, 252, 0.20) 0%, rgba(210, 240, 250, 0.10) 45%, transparent 100%)"
        : "transparent"
    }}>
      <div
        ref={scrollerRef}
        id="category-strip-container"
        className="hide-scrollbar"
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          padding: "4px 0 8px 0",
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
          userSelect: "none",
          WebkitOverflowScrolling: "touch",
          position: "relative",
          height: "62px"
        }}
      >
        <svg
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: scrollWidth || "100%",
            height: "62px",
            pointerEvents: "none",
            zIndex: 0,
            opacity: isReady ? indicatorStyle.opacity : 0,
            transition: "opacity 200ms ease, mask-image 300ms ease, -webkit-mask-image 300ms ease",
            overflow: "hidden",
            maskImage: maskImageStyle,
            WebkitMaskImage: maskImageStyle
          }}
        >
          <path
            d={`M 0 60 L ${indicatorStyle.left - 16} 60 C ${indicatorStyle.left - 6} 60, ${indicatorStyle.left - 10} 38, ${indicatorStyle.left} 38 L ${indicatorStyle.left + indicatorStyle.width} 38 C ${indicatorStyle.left + indicatorStyle.width + 10} 38, ${indicatorStyle.left + indicatorStyle.width + 6} 60, ${indicatorStyle.left + indicatorStyle.width + 16} 60 L ${scrollWidth || 2000} 60`}
            fill="none"
            stroke={
              (isHomepage || isOverBanner) ? "#FFFFFF" : theme.indicatorStroke
            } strokeWidth={2}
            style={{
              transition: isReady
                ? "d 300ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "none"
            }}
          />
        </svg>

        {displayCats.map((cat) => {
          return (
            <button
              typr="button"
              key={cat.name}
              ref={(el) => {
                if (el) {
                  itemRefs.current[cat.name] = el;
                }
              }}
              onClick={() => onCategoryClick(cat)}
              style={{
                width: "68px",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                cursor: "pointer",
                position: "relative",
                zIndex: 1
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  transition: "transform 0.2s ease",
                  transform: selectedCategory === cat.name ? "translateY(-8px)" : "none"
                }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: "80%",
                      height: "80%",
                      objectFit: "contain",
                      filter: whiteText ? "brightness(0) invert(1)" : "brightness(0)",
                      transition: "filter 350ms ease-in-out"
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span style={{ fontSize: "16px" }}>{cat.icon || "🛍️"}</span>
                )}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: whiteText ? "#FFFFFF" : "#374151",
                  textAlign: "center",
                  lineHeight: "1.2",
                  maxWidth: "64px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  marginTop: "2px"
                }}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default CategoryStrip;
