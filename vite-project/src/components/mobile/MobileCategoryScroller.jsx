import React from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    name: "Bakery & sweets",
    image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=150&auto=format&fit=crop&q=80",
    route: "/section/dairy"
  },
  {
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=150&auto=format&fit=crop&q=80",
    route: "/section/veggies"
  },
  {
    name: "Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=150&auto=format&fit=crop&q=80",
    route: "/section/fruits"
  },
  {
    name: "Ice creams",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&auto=format&fit=crop&q=80",
    route: "/section/ice-cream"
  },
  {
    name: "Snacks",
    image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=150&auto=format&fit=crop&q=80",
    route: "/section/snacks"
  },
  {
    name: "Cold Drinks",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80",
    route: "/section/beverages"
  },
  {
    name: "Atta & Dal",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    route: "/section/grocery"
  },
  {
    name: "Body & Care",
    image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150&auto=format&fit=crop&q=80",
    route: "/section/bath-body"
  }
];

import { useTheme } from "../../context/ThemeContext";

function MobileCategoryScroller({ setSelectedCategory }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleCategoryClick = (cat) => {
    if (cat.route) {
      navigate(cat.route);
    }
  };

  return (
    <div id="mobile-categories-anchor" style={{ padding: "16px 0 8px 0", background: isDark ? "var(--bg-card)" : "white", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: "800",
          color: isDark ? "var(--text-primary)" : "#1f2937",
          margin: "0 16px 12px 16px",
          letterSpacing: "-0.3px",
        }}
      >
        Categories
      </h2>
      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          padding: "0 16px 8px 16px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        className="hide-scrollbar"
      >
        {categories.map((cat, idx) => (
          <div
            key={idx}
            onClick={() => handleCategoryClick(cat)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
              cursor: "pointer",
              width: "76px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                overflow: "hidden",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f3f4f6",
                background: isDark ? "var(--bg-secondary)" : "#fafaf9",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={cat.image}
                alt={cat.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "11px",
                color: isDark ? "var(--text-secondary)" : "#4b5563",
                fontWeight: "600",
                textAlign: "center",
                marginTop: "6px",
                lineHeight: "1.2",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
            >
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MobileCategoryScroller;
