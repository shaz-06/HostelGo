import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../common/Header";
import MobileCategoryScroller from "./MobileCategoryScroller";
import MobileBannerCarousel from "./MobileBannerCarousel";
import MobileProductCard from "./MobileProductCard";
import CategoryDiscovery from "../CategoryDiscovery";
import TrendingThisWeek from "../TrendingThisWeek";
import DynamicNewBanners from "../DynamicNewBanners";
import PromoBannerCarousel from "../PromoBannerCarousel";

function MobileHome({
  products,
  filteredProducts,
  searchQuery,
  setSearchQuery,
  addToCart,
  removeFromCart,
  cartItems,
  setSelectedProduct,
  userLocation,
  roomNumber,
  totalItems,
  isLoggedIn,
  onOpenAddressModal,
  displayCats = [],
  selectedCategory = "All",
  onCategoryClick = () => {},
  forceSearchTab = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [trendingHover, setTrendingHover] = useState(false);
  const [dealsHover, setDealsHover] = useState(false);
  const [fruitsHover, setFruitsHover] = useState(false);
  const [mosquitoesHover, setMosquitoesHover] = useState(false);
  const [wellnessHover, setWellnessHover] = useState(false);
  const [recommendedHover, setRecommendedHover] = useState(false);

  useEffect(() => {
    if (location.search.includes("scroll=categories")) {
      const el = document.getElementById("mobile-categories-anchor");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.search]);

  // Filter products by categories for standard sections
  const getCategoryMatch = (pCat, targetCat) => {
    if (!pCat || !targetCat) return false;
    return pCat.toLowerCase().includes(targetCat.toLowerCase());
  };

  const trendingProducts = products.filter((p) => p.isTrending);
  const fruitProducts = products.filter((p) => getCategoryMatch(p.category, "Fruit"));
  const veggieProducts = products.filter((p) => getCategoryMatch(p.category, "Veg"));
  const dairyProducts = products.filter((p) => getCategoryMatch(p.category, "Dairy") || getCategoryMatch(p.category, "Bread") || getCategoryMatch(p.category, "Egg"));
  const snackProducts = products.filter((p) => getCategoryMatch(p.category, "Snack"));
  const beverageProducts = products.filter((p) => getCategoryMatch(p.category, "Beverage") || getCategoryMatch(p.category, "Drink"));
  const groceryProducts = products.filter((p) => getCategoryMatch(p.category, "Atta") || getCategoryMatch(p.category, "Rice") || getCategoryMatch(p.category, "Dal"));

  const recommendedList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const excludeIds = new Set(groceryProducts.map((p) => p._id || p.id));
    const pool = products.filter((p) => !excludeIds.has(p._id || p.id));
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 16);
  }, [products, groceryProducts]);

  const trendingList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 16);
  }, [products]);

  const bestDealsList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const getDiscountPercent = (product) => {
      let price = product.price || 0;
      let originalPrice = product.originalPrice || price;
      if (product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        price = firstVariant.price || price;
        originalPrice = firstVariant.originalPrice || originalPrice;
      }
      if (originalPrice > price && originalPrice > 0) {
        return ((originalPrice - price) / originalPrice) * 100;
      }
      return 0;
    };
    const deals = products
      .map((p) => ({ product: p, discount: getDiscountPercent(p) }))
      .filter((item) => item.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .map((item) => item.product);
    if (deals.length === 0) {
      return [...products].sort(() => 0.5 - Math.random()).slice(0, 16);
    }
    return deals.slice(0, 16);
  }, [products]);

  // Popular search suggestions
  const suggestions = [
    "Fresh Fruits",
    "Organic Veggies",
    "Fresh Milk",
    "Bread & Eggs",
    "Ice Cream",
    "Potato Chips",
    "Cold Drinks"
  ];

  const renderProductSection = (title, items, route) => {
    if (!items || items.length === 0) return null;
    const isTrendingNearYou = title && title.toLowerCase().includes("trending near you");
    const isBestDeals = title && title.toLowerCase().includes("best deals");
    const isFruits = title && title.toLowerCase().includes("fresh fruits");
    const isMosquitoes = title && title.toLowerCase().includes("mosquito");
    const isSexualWellness = title && title.toLowerCase().includes("sexual wellness");
    const isRecommended = title && title.toLowerCase().includes("recommended");

    const containerStyle = isTrendingNearYou
      ? {
          marginTop: "24px",
          marginBottom: "16px",
          background: "#F5FCF4",
          border: "1px solid #E7F5E5",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: "0 8px 30px rgba(49,134,22,0.06)",
          position: "relative",
        }
      : isBestDeals
      ? {
          marginTop: "24px",
          marginBottom: "16px",
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,.35), transparent 30%), " +
            "radial-gradient(circle at bottom left, rgba(245,158,11,.08), transparent 35%), " +
            "linear-gradient(135deg, #FFF6D8 0%, #FFF3C4 40%, #FFEFB5 70%, #FFF6D8 100%)",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: "0 8px 30px rgba(245, 158, 11, 0.08)",
          position: "relative",
          animation: "gentle-shimmer 25s ease-in-out infinite",
        }
      : isFruits
      ? {
          marginTop: "24px",
          marginBottom: "16px",
          background: "#DDF8D4",
          border: "1px solid rgba(49, 134, 22, 0.12)",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: "0 8px 30px rgba(49, 134, 22, 0.06)",
          position: "relative",
        }
      : isMosquitoes
      ? {
          marginTop: "24px",
          marginBottom: "16px",
          background: "#F3ECFF",
          border: "1px solid rgba(147, 112, 219, 0.12)",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: "0 8px 30px rgba(147, 112, 219, 0.06)",
          position: "relative",
        }
      : isSexualWellness
      ? {
          marginTop: "24px",
          marginBottom: "16px",
          background: "#FCEFF5",
          border: "1px solid rgba(233, 167, 197, 0.15)",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: "0 8px 30px rgba(233, 167, 197, 0.08)",
          position: "relative",
        }
      : isRecommended
      ? {
          marginTop: "24px",
          marginBottom: "16px",
          background: "#FFF8D9",
          border: "1px solid rgba(245, 158, 11, 0.12)",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: "0 8px 30px rgba(245, 158, 11, 0.06)",
          position: "relative",
        }
      : {
          marginBottom: "16px",
          background: "white",
          paddingTop: "8px",
          position: "relative",
        };

    const headingStyle = {
      fontSize: "15px",
      fontWeight: "850",
      color: (isTrendingNearYou || isBestDeals || isFruits || isMosquitoes || isSexualWellness || isRecommended) ? "#1b4314" : "#1f2937",
      margin: 0,
      zIndex: 1,
      position: "relative",
    };

    const seeAllStyle = (isTrendingNearYou || isBestDeals || isFruits || isMosquitoes || isSexualWellness || isRecommended)
      ? {
          border: "none",
          background: "transparent",
          color: (isTrendingNearYou ? trendingHover : isBestDeals ? dealsHover : isFruits ? fruitsHover : isMosquitoes ? mosquitoesHover : isSexualWellness ? wellnessHover : recommendedHover) ? "#286F12" : "#318616",
          fontWeight: "600",
          fontSize: "12px",
          cursor: "pointer",
          transition: "color 0.2s",
          zIndex: 1,
          position: "relative",
        }
      : {
          border: "none",
          background: "transparent",
          color: "#2563eb",
          fontWeight: "800",
          fontSize: "12px",
          cursor: "pointer",
        };

    const sectionId = title.toLowerCase().includes("best deals") 
      ? "best-deals-today" 
      : title.toLowerCase().includes("fresh fruits") 
      ? "fresh-fruits" 
      : title.toLowerCase().includes("trending near you")
      ? "trending-near-you"
      : title.toLowerCase().includes("fresh vegetables")
      ? "fresh-vegetables"
      : title.toLowerCase().includes("dairy")
      ? "dairy-bread-eggs"
      : title.toLowerCase().includes("snacks")
      ? "snacks"
      : title.toLowerCase().includes("atta")
      ? "atta-rice-and-dal"
      : undefined;

    return (
      <div id={sectionId} style={{ ...containerStyle, transition: "all 0.5s ease" }}>
        {/* Dynamic Keyframes for Mobile */}
        <style>{`
          @keyframes float-ambient {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(4deg); }
          }
          @keyframes gentle-shimmer {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.015); }
          }
        `}</style>

        {/* Ambient background decorations for Best Deals */}
        {isBestDeals && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "28px", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "15%", left: "8%", fontSize: "20px", opacity: 0.03, animation: "float-ambient 8s ease-in-out infinite" }}>%</div>
            <div style={{ position: "absolute", bottom: "20%", right: "12%", fontSize: "28px", opacity: 0.04, animation: "float-ambient 12s ease-in-out infinite" }}>✨</div>
            <div style={{ position: "absolute", bottom: "10%", left: "30%", fontSize: "24px", opacity: 0.03, animation: "float-ambient 14s ease-in-out infinite" }}>🪙</div>
          </div>
        )}

        {/* Section Title & See All */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px",
            marginBottom: "8px",
            zIndex: 1,
            position: "relative",
          }}
        >
          <h3 style={headingStyle}>
            {title}
          </h3>
          <button
            onClick={() => navigate(route)}
            style={seeAllStyle}
            onMouseEnter={isTrendingNearYou ? () => setTrendingHover(true) : isBestDeals ? () => setDealsHover(true) : isFruits ? () => setFruitsHover(true) : isMosquitoes ? () => setMosquitoesHover(true) : isSexualWellness ? () => setWellnessHover(true) : isRecommended ? () => setRecommendedHover(true) : undefined}
            onMouseLeave={isTrendingNearYou ? () => setTrendingHover(false) : isBestDeals ? () => setDealsHover(false) : isFruits ? () => setFruitsHover(false) : isMosquitoes ? () => setMosquitoesHover(false) : isSexualWellness ? () => setWellnessHover(false) : isRecommended ? () => setRecommendedHover(false) : undefined}
          >
            See All &gt;
          </button>
        </div>

        {/* Horizontal Card Scrolling container */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            padding: "0 16px 12px 16px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            zIndex: 1,
            position: "relative",
          }}
          className="hide-scrollbar"
        >
          {items.slice(0, 10).map((prod) => (
            <MobileProductCard
              key={prod._id || prod.id}
              product={prod}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              cartItems={cartItems}
              setSelectedProduct={setSelectedProduct}
            />
          ))}
        </div>
      </div>
    );
  };

  const isSearchTab = forceSearchTab || location.search.includes("tab=search") || searchQuery.trim() !== "";

  return (
    <div style={{ background: "#f7f8fa", minHeight: "calc(100vh - 64px)", paddingBottom: "80px", boxSizing: "border-box" }}>

      {isSearchTab ? (
        /* SEARCH LAYOUT VIEW */
        <div style={{ padding: "12px 16px", fontFamily: "'Outfit', 'Inter', sans-serif" }}>

          {searchQuery.trim() === "" ? (
            /* Popular search suggestions list */
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#4b5563", marginBottom: "12px" }}>
                Popular Searches
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSearchQuery(sug)}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#4b5563",
                      cursor: "pointer",
                    }}
                  >
                    🔍 {sug}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Search Results product grid */
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1f2937", marginBottom: "12px" }}>
                Search Results ({filteredProducts.length})
              </h4>
              {filteredProducts.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>
                  No matches found for "{searchQuery}"
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)", // Compact 3 column grid to fit well
                    gap: "10px",
                    justifyItems: "center",
                  }}
                >
                  {filteredProducts.map((prod) => (
                    <MobileProductCard
                      key={prod._id || prod.id}
                      product={prod}
                      addToCart={addToCart}
                      removeFromCart={removeFromCart}
                      cartItems={cartItems}
                      setSelectedProduct={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD DEDICATED MOBILE HOME LAYOUT */
        <>
          {/* Trending This Week Section */}
          <TrendingThisWeek />

          {/* Large Rectangular Auto Banner Carousel */}
          <MobileBannerCarousel />

          {/* Category Discovery Section */}
          <div style={{ padding: "0 16px", background: "white", borderRadius: "24px", margin: "12px 16px", border: "1px solid #f3f4f6" }}>
            <CategoryDiscovery />
          </div>

          <PromoBannerCarousel />

          {/* Dynamic Staggered Row Banners */}
          <DynamicNewBanners />

          {/* Product Scrolling Sections (compact gaps) */}
          {renderProductSection("Top Picks For You", trendingProducts, "/section/trending")}
          {renderProductSection("Fresh Fruits", fruitProducts, "/section/fruits")}
          {renderProductSection("Fresh Vegetables", veggieProducts, "/section/veggies")}
          {renderProductSection("Dairy & Breakfast", dairyProducts, "/section/dairy")}
          {renderProductSection("Snacks & Drinks", [...snackProducts, ...beverageProducts], "/section/snacks")}
          {renderProductSection("Atta, Rice & Dal", groceryProducts, "/section/grocery")}

          {recommendedList.length > 0 && renderProductSection("✨ Recommended For You", recommendedList, "/section/recommended")}
          {trendingList.length > 0 && renderProductSection("🔥 Trending Near You", trendingList, "/section/trending")}
          {bestDealsList.length > 0 && renderProductSection("💸 Best Deals Today", bestDealsList, "/section/deals")}

          <div style={{
            background: "#FFFFFF",
            border: "1px solid rgba(49,134,22,.08)",
            borderRadius: "28px",
            padding: "28px 16px",
            boxShadow: "0 10px 30px rgba(49,134,22,.06)",
            margin: "40px 16px 24px 16px",
            textAlign: "center",
            fontFamily: "'Outfit', 'Inter', sans-serif",
            boxSizing: "border-box"
          }}>
            <style>{`
              .premium-footer-heading-mobile {
                font-size: 20px;
                font-weight: 850;
                color: #1E293B;
                margin: 0;
              }
              .premium-footer-subtitle-mobile {
                color: #64748B;
                font-size: 14px;
                margin: 6px 0 20px 0;
              }
              .premium-action-btn-mobile {
                background: #F8FFF5;
                border: 1px solid rgba(49,134,22,.10);
                border-radius: 999px;
                padding: 10px 18px;
                font-weight: 600;
                font-size: 13px;
                color: #318616;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                display: inline-flex;
                align-items: center;
                gap: 6px;
                outline: none;
                user-select: none;
              }
              .premium-action-btn-mobile:hover {
                background: #318616;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 12px 24px rgba(49,134,22,.18);
              }
              .premium-action-btn-mobile:active {
                transform: scale(0.95) translateY(0);
              }
            `}</style>
            <h2 className="premium-footer-heading-mobile">💚 Thank you for choosing Buyto</h2>
            <p className="premium-footer-subtitle-mobile">Built by Students, for Students.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
              <button
                className="premium-action-btn-mobile"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    const searchInput = document.getElementById('main-search-input');
                    if (searchInput) {
                      searchInput.focus();
                      searchInput.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
                      searchInput.style.boxShadow = '0 0 15px rgba(49, 134, 22, 0.6)';
                      searchInput.style.borderColor = '#318616';
                      setTimeout(() => {
                        searchInput.style.boxShadow = '';
                        searchInput.style.borderColor = '';
                      }, 800);
                    }
                    const catStrip = document.getElementById('category-strip-container');
                    if (catStrip) {
                      catStrip.style.transition = 'transform 0.4s ease';
                      catStrip.style.transform = 'scale(1.03)';
                      setTimeout(() => {
                        catStrip.style.transform = 'scale(1)';
                      }, 400);
                    }
                  }, 800);
                }}
              >
                <span>🛒</span> Continue Shopping
              </button>
              
              <button
                className="premium-action-btn-mobile"
                onClick={() => {
                  const el = document.getElementById('best-deals-today');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                      el.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.4)';
                      el.style.borderColor = 'rgba(245, 158, 11, 0.6)';
                      setTimeout(() => {
                        el.style.boxShadow = '';
                        el.style.borderColor = '';
                      }, 1000);
                    }, 800);
                  }
                }}
              >
                <span>🔥</span> Best Deals
              </button>

              <button
                className="premium-action-btn-mobile"
                onClick={() => {
                  const el = document.getElementById('fresh-fruits');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                      el.style.boxShadow = '0 0 30px rgba(49, 134, 22, 0.4)';
                      el.style.borderColor = 'rgba(49, 134, 22, 0.6)';
                      setTimeout(() => {
                        el.style.boxShadow = '';
                        el.style.borderColor = '';
                      }, 1000);
                    }, 800);
                  }
                }}
              >
                <span>🍎</span> Fresh Fruits
              </button>

              <button
                className="premium-action-btn-mobile"
                onClick={() => {
                  const showSurpriseToast = () => {
                    const toast = document.createElement("div");
                    toast.innerHTML = "✨ Today's Pick for You";
                    toast.style.position = "fixed";
                    toast.style.bottom = "100px";
                    toast.style.left = "50%";
                    toast.style.transform = "translateX(-50%) translateY(20px)";
                    toast.style.background = "rgba(17, 24, 39, 0.9)";
                    toast.style.color = "white";
                    toast.style.padding = "10px 20px";
                    toast.style.borderRadius = "50px";
                    toast.style.fontSize = "13px";
                    toast.style.fontWeight = "600";
                    toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
                    toast.style.zIndex = "9999";
                    toast.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                    toast.style.opacity = "0";
                    document.body.appendChild(toast);
                    
                    requestAnimationFrame(() => {
                      toast.style.transform = "translateX(-50%) translateY(0)";
                      toast.style.opacity = "1";
                    });
                    
                    setTimeout(() => {
                      toast.style.transform = "translateX(-50%) translateY(-20px)";
                      toast.style.opacity = "0";
                      setTimeout(() => {
                        toast.remove();
                      }, 300);
                    }, 2000);
                  };

                  const targetSections = [
                    { id: 'trending-near-you', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                    { id: 'fresh-fruits', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                    { id: 'best-deals-today', color: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.6)' },
                    { id: 'fresh-vegetables', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                    { id: 'dairy-bread-eggs', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                    { id: 'snacks', color: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.6)' }
                  ];
                  const available = targetSections.filter(s => document.getElementById(s.id));
                  if (available.length > 0) {
                    const randomSec = available[Math.floor(Math.random() * available.length)];
                    const el = document.getElementById(randomSec.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      showSurpriseToast();
                      setTimeout(() => {
                        el.style.boxShadow = `0 0 30px ${randomSec.color}`;
                        el.style.borderColor = randomSec.border;
                        setTimeout(() => {
                          el.style.boxShadow = '';
                          el.style.borderColor = '';
                        }, 1000);
                      }, 800);
                    }
                  }
                }}
              >
                <span>🎲</span> Surprise Me
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MobileHome;
