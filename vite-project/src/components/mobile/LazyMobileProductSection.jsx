import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import MobileProductCard from "./MobileProductCard";
import { useTheme } from "../../context/ThemeContext";
import { cachedFetch } from "../../utils/apiCache";

export default function LazyMobileProductSection({
  title,
  subtitle,
  categoryQuery,
  limit = 6,
  route,
  addToCart,
  removeFromCart,
  cartItems,
  setSelectedProduct,
  bestsellers = false
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isIntersected, setIsIntersected] = useState(false);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const fetchTriggered = useRef(false);

  useEffect(() => {
    if (isIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);

          if (!fetchTriggered.current) {
            fetchTriggered.current = true;
            fetchData();
          }

          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { rootMargin: "100px", threshold: 0 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, [isIntersected, categoryQuery]);

  const fetchData = () => {
    if (products.length > 0 || loading) return;
    setLoading(true);

    let url = `${window.API_BASE_URL}/api/products?limit=${limit}`;
    if (categoryQuery && categoryQuery !== "trending" && categoryQuery !== "recommended") {
      url += `&category=${encodeURIComponent(categoryQuery)}`;
    }

    if (bestsellers) {
      url = `${window.API_BASE_URL}/api/products/bestsellers`;
    }

    cachedFetch(url)
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
        } else if (res.products && Array.isArray(res.products)) {
          setProducts(res.products);
        } else if (Array.isArray(res)) {
          setProducts(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load ${title}:`, err);
        setLoading(false);
      });
  };

  const isTrendingNearYou = title && title.toLowerCase().includes("trending near you");
  const isBestDeals = title && title.toLowerCase().includes("best deals");
  const isFruits = title && title.toLowerCase().includes("fresh fruits");
  const isMosquitoes = title && title.toLowerCase().includes("mosquito");
  const isSexualWellness = title && title.toLowerCase().includes("sexual wellness");
  const isRecommended = title && title.toLowerCase().includes("recommended");

  const containerStyle = isTrendingNearYou
    ? {
      marginTop: "24px", marginBottom: "16px",
      background: isDark ? "linear-gradient(135deg, #181A20 0%, #152212 100%)" : "#F5FCF4",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E7F5E5",
      borderRadius: "28px", padding: "24px 16px",
      boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(49,134,22,0.06)",
      position: "relative",
    }
    : isBestDeals
      ? {
        marginTop: "24px", marginBottom: "16px",
        background: isDark ? "linear-gradient(135deg, #181A20 0%, #2e2412 100%)" : "radial-gradient(circle at top right, rgba(255,255,255,.35), transparent 30%), radial-gradient(circle at bottom left, rgba(245,158,11,.08), transparent 35%), linear-gradient(135deg, #FFF6D8 0%, #FFF3C4 40%, #FFEFB5 70%, #FFF6D8 100%)",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(245, 158, 11, 0.15)",
        borderRadius: "28px", padding: "24px 16px",
        boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(245, 158, 11, 0.08)",
        position: "relative",
      }
      : isFruits
        ? {
          marginTop: "24px", marginBottom: "16px",
          background: isDark ? "linear-gradient(135deg, #181A20 0%, #122110 100%)" : "#DDF8D4",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(49, 134, 22, 0.12)",
          borderRadius: "28px", padding: "24px 16px",
          boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(49, 134, 22, 0.06)",
          position: "relative",
        }
        : isMosquitoes
          ? {
            marginTop: "24px", marginBottom: "16px",
            background: isDark ? "linear-gradient(135deg, #181A20 0%, #191428 100%)" : "#F3ECFF",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #EBE3FF",
            borderRadius: "28px", padding: "24px 16px",
            boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(139, 92, 246, 0.08)",
            position: "relative",
          }
          : isSexualWellness
            ? {
              marginTop: "24px", marginBottom: "16px",
              background: isDark ? "linear-gradient(135deg, #181A20 0%, #281418 100%)" : "#FFF0F4",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #FFE4EB",
              borderRadius: "28px", padding: "24px 16px",
              boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(236, 72, 153, 0.08)",
              position: "relative",
            }
            : isRecommended
              ? {
                marginTop: "24px", marginBottom: "16px",
                background: isDark ? "linear-gradient(135deg, #181A20 0%, #152212 100%)" : "#F5FCF4",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E7F5E5",
                borderRadius: "28px", padding: "24px 16px",
                boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(49,134,22,0.06)",
                position: "relative",
              }
              : {
                background: isDark ? "var(--bg-card)" : "white",
                borderRadius: "24px",
                padding: "20px 16px",
                margin: "12px 16px",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.03)",
                border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f9fafb",
                position: "relative",
              };

  const renderSkeleton = () => (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ width: "150px", height: "24px", background: isDark ? "var(--bg-secondary)" : "#f3f4f6", borderRadius: "8px" }} />
          {subtitle && <div style={{ width: "100px", height: "14px", background: isDark ? "var(--bg-secondary)" : "#f3f4f6", borderRadius: "4px", marginTop: "8px" }} />}
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px", overflowX: "auto" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: "120px", height: "210px", flexShrink: 0, background: isDark ? "var(--bg-secondary)" : "#f9fafb", borderRadius: "12px" }} />
        ))}
      </div>
    </div>
  );

  return (
    <div ref={sectionRef} style={{ minHeight: "275px", contentVisibility: "auto", containIntrinsicSize: "auto 275px" }}>
      {!isIntersected ? renderSkeleton() : (
        <div style={containerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: "800", color: isDark ? "#fff" : "#1f2937", margin: 0 }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: isDark ? "#9ca3af" : "#6b7280", fontWeight: "500" }}>
                  {subtitle}
                </p>
              )}
            </div>
            {route && products.length > 0 && (
              <button
                onClick={() => navigate(route)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isDark ? "#4ade80" : "#318616",
                  fontSize: "14px",
                  fontWeight: "600",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                See all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          <div className="hide-scrollbar" style={{ display: "flex", overflowX: "auto", gap: "12px", paddingBottom: "8px" }}>
            {loading && products.length === 0 ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: "120px", height: "210px", flexShrink: 0, background: isDark ? "var(--bg-secondary)" : "#f9fafb", borderRadius: "12px" }} />
              ))
            ) : (
              products.map((product) => (
                <MobileProductCard
                  key={product._id || product.id}
                  product={product}
                  cartItems={cartItems}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  onClick={() => setSelectedProduct(product)}
                  isDark={isDark}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
