import React, { useMemo } from "react";
import ProductCard from "../ProductCard";
import SEO from "./common/SEO";
import MobileProductCard from "./mobile/MobileProductCard";

export default function SearchResultsView({
  searchQuery,
  filteredProducts = [],
  allProducts = [],
  isMobile = false,
  windowWidth,
  renderProductCard,
  addToCart,
  removeFromCart,
  cartItems,
  setSelectedProduct,
  setSearchQuery,
  openProduct,
  getCartKey
}) {
  const query = searchQuery ? searchQuery.trim() : "";

  // Compute multi-tier recommendations
  const recommendedProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    // 1. Exclude products already displayed in filteredProducts
    const filteredIds = new Set(filteredProducts.map(p => String(p._id || p.id)));
    const pool = allProducts.filter(p => !filteredIds.has(String(p._id || p.id)));

    if (pool.length === 0) return [];

    // Extract subcategories & categories from matched search results
    const matchedSubcategories = new Set(
      filteredProducts.map(p => p.subCategory || p.subcategory).filter(Boolean)
    );
    const matchedCategories = new Set(
      filteredProducts.map(p => p.category).filter(Boolean)
    );

    // Tier 1: Same Subcategory (e.g. Chocolate Milk, Milkshake)
    const tier1 = pool.filter(p => {
      const sub = p.subCategory || p.subcategory;
      return sub && matchedSubcategories.has(sub);
    });
    const tier1Ids = new Set(tier1.map(p => String(p._id || p.id)));

    // Tier 2: Same Category (e.g. Butter, Paneer, Cheese, Curd)
    const tier2 = pool.filter(p => {
      const id = String(p._id || p.id);
      return !tier1Ids.has(id) && p.category && matchedCategories.has(p.category);
    });
    const tier2Ids = new Set(tier2.map(p => String(p._id || p.id)));

    // Tier 3: Frequently Bought Together (e.g. Bread, Cornflakes, Biscuits, Coffee when searching Milk/Breakfast)
    const frequentlyBoughtKeywords = ["bread", "biscuit", "cookie", "cornflake", "cereal", "coffee", "tea", "jam", "butter", "egg"];
    const tier3 = pool.filter(p => {
      const id = String(p._id || p.id);
      if (tier1Ids.has(id) || tier2Ids.has(id)) return false;
      const nameLower = (p.name || "").toLowerCase();
      const catLower = (p.category || "").toLowerCase();
      return frequentlyBoughtKeywords.some(kw => nameLower.includes(kw) || catLower.includes(kw));
    });
    const tier3Ids = new Set(tier3.map(p => String(p._id || p.id)));

    // Tier 4: Trending / Featured Products
    const tier4 = pool.filter(p => {
      const id = String(p._id || p.id);
      return !tier1Ids.has(id) && !tier2Ids.has(id) && !tier3Ids.has(id) && p.isTrending;
    });
    const tier4Ids = new Set(tier4.map(p => String(p._id || p.id)));

    // Tier 5: Best Sellers / Catalog Fallback
    const tier5 = pool.filter(p => {
      const id = String(p._id || p.id);
      return !tier1Ids.has(id) && !tier2Ids.has(id) && !tier3Ids.has(id) && !tier4Ids.has(id);
    });

    // Concatenate all 5 tiers in exact priority sequence
    return [...tier1, ...tier2, ...tier3, ...tier4, ...tier5].slice(0, 18);
  }, [filteredProducts, allProducts]);

  const gridColumns = isMobile
    ? "repeat(2, 1fr)"
    : windowWidth < 1024
      ? "repeat(4, 1fr)"
      : "repeat(6, 1fr)";

  const suggestionsList = [
    "Fresh Fruits",
    "Organic Veggies",
    "Fresh Milk",
    "Bread & Eggs",
    "Ice Cream",
    "Chips & Snacks",
    "Cold Drinks"
  ];

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", width: "100%" }}>
      <SEO title={query ? `Search "${query}"` : "Search"} description={query ? `Search results for "${query}" on Buyto.` : "Search across thousands of daily essentials and groceries on Buyto."} />
      {/* SECTION 1: SEARCH RESULTS */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: "800", color: "#1f2937", margin: 0 }}>
            Search Results for "{query}"
          </h2>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#6b7280" }}>
            {filteredProducts.length} {filteredProducts.length === 1 ? "product found" : "products found"}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          /* ZERO-RESULT UI STATE */
          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "32px 20px", textAlign: "center", border: "1px solid #f1f5f9", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: "0 0 6px 0" }}>
              No products found for "{query}"
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0", fontWeight: "500" }}>
              We couldn't find exact matches. Try:
            </p>
            <div style={{ display: "inline-flex", flexDirection: "column", gap: "6px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: "600", marginBottom: "20px" }}>
              <span>• Checking for spelling errors</span>
              <span>• Using shorter or more general keywords</span>
              <span>• Exploring suggested categories below</span>
            </div>
            {setSearchQuery && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                {suggestionsList.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(sug)}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#334155",
                      cursor: "pointer"
                    }}
                  >
                    🔍 {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MATCHING SEARCH RESULTS GRID */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : gridColumns,
              gap: isMobile ? "10px" : "20px",
              justifyItems: isMobile ? "center" : "normal"
            }}
          >
            {filteredProducts.map((product) => {
              if (isMobile) {
                return (
                  <MobileProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    cartItems={cartItems}
                    setSelectedProduct={setSelectedProduct}
                    searchQuery={query}
                  />
                );
              }
              if (renderProductCard) return renderProductCard(product);
              return (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  openProduct={openProduct}
                  setSelectedProduct={setSelectedProduct}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  windowWidth={windowWidth}
                  getCartKey={getCartKey}
                  searchQuery={query}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: DIVIDER & RECOMMENDED FOR YOU */}
      {recommendedProducts.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          {/* Section Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ flexGrow: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "14px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ✨ Recommended For You
            </span>
            <div style={{ flexGrow: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Recommendations Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : gridColumns,
              gap: isMobile ? "10px" : "20px",
              justifyItems: isMobile ? "center" : "normal"
            }}
          >
            {recommendedProducts.map((product) => {
              if (isMobile) {
                return (
                  <MobileProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    cartItems={cartItems}
                    setSelectedProduct={setSelectedProduct}
                  />
                );
              }
              if (renderProductCard) return renderProductCard(product);
              return (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  openProduct={openProduct}
                  setSelectedProduct={setSelectedProduct}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  windowWidth={windowWidth}
                  getCartKey={getCartKey}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
