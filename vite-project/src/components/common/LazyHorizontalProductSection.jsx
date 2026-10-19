import React, { useState, useEffect } from "react";
import HorizontalProductSection from "../../HorizontalProductSection";
import LazySection from "./LazySection";
import { cachedFetch } from "../../utils/apiCache";

export default function LazyHorizontalProductSection({
  title,
  emoji,
  categoryQuery,
  limit = 6,
  onShowAll,
  openProduct,
  setSelectedProduct,
  addToCart,
  removeFromCart,
  cart,
  cartItems,
  windowWidth,
  getCartKey,
  containerId,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSectionData = () => {
    // Only fetch if we haven't already loaded data
    if (products.length > 0 || loading) return;

    setLoading(true);
    // Use the lightweight API: /api/products?category=...&limit=6
    const url = `${
      window.API_BASE_URL
    }/api/products?category=${encodeURIComponent(
      categoryQuery,
    )}&limit=${limit}`;

    cachedFetch(url)
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
        } else if (Array.isArray(res)) {
          // Fallback if the API returns an array directly
          setProducts(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load ${title} products:`, err);
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div
      id={containerId}
      style={{
        scrollMarginTop: "140px",
        transition: "all 0.5s ease",
        borderRadius: "16px",
      }}
    >
      <LazySection
        onIntersect={fetchSectionData}
        rootMargin="100px"
        minHeight="320px"
      >
        {(products.length > 0 || loading) && (
          <HorizontalProductSection
            title={title}
            emoji={emoji}
            products={products}
            onShowAll={onShowAll}
            openProduct={openProduct}
            setSelectedProduct={setSelectedProduct}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cart={cart}
            cartItems={cartItems}
            windowWidth={windowWidth}
            getCartKey={getCartKey}
            loading={loading}
          />
        )}
      </LazySection>
    </div>
  );
}
