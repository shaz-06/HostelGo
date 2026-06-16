import React from "react";
import { useNavigate } from "react-router-dom";

// Scalable list of categories
const categoriesList = [
  {
    id: "fruits",
    name: "Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80",
    route: "/section/fruits",
    count: "15+ Items"
  },
  {
    id: "vegetables",
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=200&auto=format&fit=crop&q=80",
    route: "/section/veggies",
    count: "24+ Items"
  },
  {
    id: "dairy",
    name: "Dairy",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80",
    route: "/section/dairy",
    count: "30+ Items"
  },
  {
    id: "bakery",
    name: "Bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80",
    route: "/section/bread-store",
    count: "12+ Items"
  },
  {
    id: "snacks",
    name: "Snacks",
    image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=200&auto=format&fit=crop&q=80",
    route: "/section/snacks",
    count: "40+ Items"
  },
  {
    id: "beverages",
    name: "Beverages",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80",
    route: "/section/beverages",
    count: "25+ Items"
  },
  {
    id: "electronics",
    name: "Electronics",
    image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=200&auto=format&fit=crop&q=80",
    route: "/section/electronics",
    count: "10+ Items"
  },
  {
    id: "fashion",
    name: "Fashion",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=80",
    route: "/section/fashion",
    count: "18+ Items"
  },
  {
    id: "hostel-essentials",
    name: "Hostel Essentials",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80",
    route: "/section/hostel-essentials",
    count: "22+ Items"
  },
  {
    id: "beauty-personal-care",
    name: "Beauty & Personal Care",
    image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=200&auto=format&fit=crop&q=80",
    route: "/section/bath-body",
    count: "35+ Items"
  },
  {
    id: "emergency-items",
    name: "Emergency Items",
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=200&auto=format&fit=crop&q=80",
    route: "/section/emergency",
    count: "8+ Items"
  },
  {
    id: "daily-needs",
    name: "Daily Needs",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&auto=format&fit=crop&q=80",
    route: "/section/daily-needs",
    count: "50+ Items"
  }
];

export default function CategoriesPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        boxSizing: "border-box",
        paddingBottom: "80px",
      }}
    >
      {/* Sticky Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "white",
          borderBottom: "1px solid #f0f0f0",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          padding: "16px 20px",
          gap: "16px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#1f2937",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ←
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "800",
            color: "#1f2937",
          }}
        >
          All Categories
        </h1>
      </header>

      {/* Categories Grid Container */}
      <main style={{ padding: "20px" }}>
        <div
          style={{
            display: "grid",
            gap: "16px",
            // CSS custom responsive layout: 3 columns on mobile (< 768px), 4 columns on tablet/desktop
          }}
          className="categories-responsive-grid"
        >
          {categoriesList.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(category.route)}
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                border: "1px solid #f3f4f6",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
              }}
            >
              {/* Category Image */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid #f3f4f6",
                  background: "#fafaf9",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px",
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Category Text */}
              <span
                style={{
                  fontSize: "12px",
                  color: "#1f2937",
                  fontWeight: "750",
                  textAlign: "center",
                  lineHeight: "1.2",
                  marginBottom: "4px",
                }}
              >
                {category.name}
              </span>

              {/* Product count (optional/additional info) */}
              {category.count && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    fontWeight: "600",
                  }}
                >
                  {category.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Inline styles for responsive grid */}
      <style>{`
        .categories-responsive-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (min-width: 768px) {
          .categories-responsive-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
