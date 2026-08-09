import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../common/Header";
import MobileCategoryScroller from "./MobileCategoryScroller";
import MobileBannerCarousel from "./MobileBannerCarousel";
import MobileProductCard from "./MobileProductCard";
import CategoryDiscovery from "../CategoryDiscovery";
import TrendingThisWeek from "../TrendingThisWeek";
import BestsellersSection from "../BestsellersSection";
import DynamicNewBanners from "../DynamicNewBanners";
import PromoBannerCarousel from "../PromoBannerCarousel";
import OffersBottomDrawer from "../common/OffersBottomDrawer";
import { useTheme } from "../../context/ThemeContext";

const DeliveryIllustration = "https://img.icons8.com/?size=100&id=uTI4SjCIkNJp&format=png&color=000000";
const SearchResultsView = React.lazy(() => import("../SearchResultsView"));

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
  onCategoryClick = () => { },
  forceSearchTab = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [trendingHover, setTrendingHover] = useState(false);
  const [dealsHover, setDealsHover] = useState(false);
  const [fruitsHover, setFruitsHover] = useState(false);
  const [mosquitoesHover, setMosquitoesHover] = useState(false);
  const [wellnessHover, setWellnessHover] = useState(false);
  const [recommendedHover, setRecommendedHover] = useState(false);

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openOffer = React.useCallback((offerId) => {
    console.log("[MobileHome] openOffer called with:", offerId);
    setSelectedOffer(offerId);
    setIsDrawerOpen(true);
  }, []);

  const closeOffer = React.useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (location.search.includes("scroll=categories")) {
      const el = document.getElementById("mobile-categories-anchor");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.search]);

  // Filter products by categories for standard sections
  const getCategoryMatch = React.useCallback((pCat, targetCat) => {
    if (!pCat || !targetCat) return false;
    return pCat.toLowerCase().includes(targetCat.toLowerCase());
  }, []);

  const trendingProducts = useMemo(() => products.filter((p) => p.isTrending), [products]);
  const fruitProducts = useMemo(() => products.filter((p) => getCategoryMatch(p.category, "Fruit")), [products, getCategoryMatch]);
  const veggieProducts = useMemo(() => products.filter((p) => getCategoryMatch(p.category, "Veg")), [products, getCategoryMatch]);
  const dairyProducts = useMemo(() => products.filter((p) => getCategoryMatch(p.category, "Dairy") || getCategoryMatch(p.category, "Bread") || getCategoryMatch(p.category, "Egg")), [products, getCategoryMatch]);
  const snackProducts = useMemo(() => products.filter((p) => getCategoryMatch(p.category, "Snack")), [products, getCategoryMatch]);
  const beverageProducts = useMemo(() => products.filter((p) => getCategoryMatch(p.category, "Beverage") || getCategoryMatch(p.category, "Drink")), [products, getCategoryMatch]);
  const groceryProducts = useMemo(() => products.filter((p) => getCategoryMatch(p.category, "Atta") || getCategoryMatch(p.category, "Rice") || getCategoryMatch(p.category, "Dal")), [products, getCategoryMatch]);


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
        background: isDark ? "linear-gradient(135deg, #181A20 0%, #152212 100%)" : "#F5FCF4",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E7F5E5",
        borderRadius: "28px",
        padding: "24px 16px",
        boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(49,134,22,0.06)",
        position: "relative",
      }
      : isBestDeals
        ? {
          marginTop: "24px",
          marginBottom: "16px",
          background: isDark
            ? "linear-gradient(135deg, #181A20 0%, #2e2412 100%)"
            : "radial-gradient(circle at top right, rgba(255,255,255,.35), transparent 30%), " +
            "radial-gradient(circle at bottom left, rgba(245,158,11,.08), transparent 35%), " +
            "linear-gradient(135deg, #FFF6D8 0%, #FFF3C4 40%, #FFEFB5 70%, #FFF6D8 100%)",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(245, 158, 11, 0.15)",
          borderRadius: "28px",
          padding: "24px 16px",
          boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(245, 158, 11, 0.08)",
          position: "relative",
          animation: isDark ? undefined : "gentle-shimmer 25s ease-in-out infinite",
        }
        : isFruits
          ? {
            marginTop: "24px",
            marginBottom: "16px",
            background: isDark ? "linear-gradient(135deg, #181A20 0%, #122110 100%)" : "#DDF8D4",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(49, 134, 22, 0.12)",
            borderRadius: "28px",
            padding: "24px 16px",
            boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(49, 134, 22, 0.06)",
            position: "relative",
          }
          : isMosquitoes
            ? {
              marginTop: "24px",
              marginBottom: "16px",
              background: isDark ? "linear-gradient(135deg, #181A20 0%, #191428 100%)" : "#F3ECFF",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(147, 112, 219, 0.12)",
              borderRadius: "28px",
              padding: "24px 16px",
              boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(147, 112, 219, 0.06)",
              position: "relative",
            }
            : isSexualWellness
              ? {
                marginTop: "24px",
                marginBottom: "16px",
                background: isDark ? "linear-gradient(135deg, #181A20 0%, #281420 100%)" : "#FCEFF5",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(233, 167, 197, 0.15)",
                borderRadius: "28px",
                padding: "24px 16px",
                boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(233, 167, 197, 0.08)",
                position: "relative",
              }
              : isRecommended
                ? {
                  marginTop: "24px",
                  marginBottom: "16px",
                  background: isDark ? "linear-gradient(135deg, #181A20 0%, #2c2612 100%)" : "#FFF8D9",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(245, 158, 11, 0.12)",
                  borderRadius: "28px",
                  padding: "24px 16px",
                  boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(245, 158, 11, 0.06)",
                  position: "relative",
                }
                : {
                  marginBottom: "16px",
                  background: isDark ? "var(--bg-card)" : "white",
                  paddingTop: "8px",
                  position: "relative",
                  borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : undefined
                };

    const headingStyle = {
      fontSize: "15px",
      fontWeight: "850",
      color: isDark ? "#F5F5F5" : ((isTrendingNearYou || isBestDeals || isFruits || isMosquitoes || isSexualWellness || isRecommended) ? "#1b4314" : "#1f2937"),
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
        color: isDark ? "#318616" : "#2563eb",
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
    <div style={{ background: isDark ? "var(--bg-primary)" : "#f7f8fa", minHeight: "calc(100vh - 64px)", paddingBottom: "80px", boxSizing: "border-box" }}>

      {isSearchTab ? (
        /* SEARCH LAYOUT VIEW */
        <div style={{ padding: "12px 16px", fontFamily: "'Outfit', 'Inter', sans-serif" }}>

          {searchQuery.trim() === "" ? (
            /* Popular search suggestions list */
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: isDark ? "var(--text-secondary)" : "#4b5563", marginBottom: "12px" }}>
                Popular Searches
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSearchQuery(sug)}
                    style={{
                      background: isDark ? "var(--bg-card)" : "white",
                      border: isDark ? "1px solid var(--border-color)" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDark ? "var(--text-primary)" : "#4b5563",
                      cursor: "pointer",
                    }}
                  >
                    🔍 {sug}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <React.Suspense fallback={null}>
              <SearchResultsView
                searchQuery={searchQuery}
                filteredProducts={filteredProducts}
                allProducts={products}
                isMobile={true}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cartItems={cartItems}
                setSelectedProduct={setSelectedProduct}
                setSearchQuery={setSearchQuery}
              />
            </React.Suspense>
          )}
        </div>
      ) : (
        /* STANDARD DEDICATED MOBILE HOME LAYOUT */
        <>
          {/* Dark Gold Welcome Header */}
          <div id="home-hero-banner" data-welcome-banner style={{
            height: "140px",
            backgroundImage: "url('/images/welcome-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            textAlign: "center",
            fontFamily: "'Outfit', 'Inter', sans-serif",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            boxSizing: "border-box"
          }}>
            {/* Overlapping Tab */}
            <div style={{
              backgroundColor: "#ffc200",
              color: "#1e293b",
              padding: "6px 20px",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              fontSize: "11px",
              fontWeight: "850",
              letterSpacing: "1px",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "-1px", // overlap the border
              zIndex: 2
            }}>
              ✦ OFFERS FOR YOU ✦
            </div>
          </div>

          {/* Offers Cards Bar */}
          <div style={{
            padding: "0 16px 16px 16px",
            backgroundColor: "#ffc200", // Solid bright gold/yellow container matching the screenshot exactly
            fontFamily: "'Outfit', 'Inter', sans-serif",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            boxSizing: "border-box",
            position: "relative",
            zIndex: 1
          }}>
            {/* Card 1 - Discount */}
            <div
              className="offer-card-clickable"
              onClick={() => openOffer("discount")}
              style={{
                backgroundColor: "#ffecbc", // Pale gold/cream card background matching the screenshot
                borderRadius: "16px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}
            >
              {/* Left side: Discount Illustration */}
              <div style={{
                flexShrink: 0,
                width: "48px",
                height: "48px",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                <img
                  src="https://img.icons8.com/?size=100&id=mnqCs95ap07K&format=png&color=000000"
                  alt="Discount Offer"
                  style={{
                    width: "46px",
                    height: "46px",
                    objectFit: "contain"
                  }}
                />
              </div>
              {/* Right side: Texts */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: "850", color: "#2d1d00", lineHeight: "1.2" }}>
                  Enjoy FLAT ₹50 OFF
                </span>
                <span style={{ fontSize: "11px", fontWeight: "650", color: "#7c6847", marginTop: "2px", lineHeight: "1.2" }}>
                  On your first order above ₹249
                </span>
              </div>
            </div>

            {/* Card 2 - Free Delivery */}
            <div
              className="offer-card-clickable"
              onClick={() => openOffer("delivery")}
              style={{
                backgroundColor: "#ffecbc", // Pale gold/cream card background matching the screenshot
                borderRadius: "16px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}
            >
              {/* Left side: Delivery Rider Illustration */}
              <div style={{
                flexShrink: 0,
                width: "48px",
                height: "48px",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                <img
                  src={DeliveryIllustration}
                  alt="Free Delivery"
                  style={{
                    width: "46px",
                    height: "46px",
                    objectFit: "contain"
                  }}
                />
              </div>
              {/* Right side: Texts */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: "850", color: "#2d1d00", lineHeight: "1.2" }}>
                  Enjoy FREE delivery
                </span>
                <span style={{ fontSize: "11px", fontWeight: "650", color: "#7c6847", marginTop: "2px", lineHeight: "1.2" }}>
                  On all your orders
                </span>
              </div>
            </div>

            {/* Custom Styles for active press effect */}
            <style>{`
              .offer-card-clickable {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none;
              }
              .offer-card-clickable:active {
                transform: scale(0.98);
              }
            `}</style>
          </div>

          {/* Bestsellers Section */}
          <BestsellersSection />

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
            background: isDark ? "var(--bg-card)" : "#FFFFFF",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(49,134,22,.08)",
            borderRadius: "28px",
            padding: "28px 16px",
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.25)" : "0 10px 30px rgba(49,134,22,.06)",
            margin: "40px 16px 24px 16px",
            textAlign: "center",
            fontFamily: "'Outfit', 'Inter', sans-serif",
            boxSizing: "border-box"
          }}>
            <style>{`
              .premium-footer-heading-mobile {
                font-size: 20px;
                font-weight: 850;
                color: ${isDark ? "#FFFFFF" : "#1E293B"};
                margin: 0;
              }
              .premium-footer-subtitle-mobile {
                color: ${isDark ? "#AEB3BF" : "#64748B"};
                font-size: 14px;
                margin: 6px 0 20px 0;
              }
              .premium-action-btn-mobile {
                background: ${isDark ? "#242730" : "#F8FFF5"};
                border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(49,134,22,.10)"};
                border-radius: 999px;
                padding: 10px 18px;
                font-weight: 600;
                font-size: 13px;
                color: ${isDark ? "#FFFFFF" : "#318616"};
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
            <h2 className="premium-footer-heading-mobile" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <img src="https://img.icons8.com/?size=100&id=49fnBL9r0HmF&format=png&color=318616" alt="Thank You" style={{ width: "24px", height: "24px", objectFit: "contain" }} /> Thank you for choosing Buyto
            </h2>
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
                <img src="https://img.icons8.com/?size=100&id=2TlXnKX7oZXI&format=png&color=318616" alt="Continue Shopping" style={{ width: "18px", height: "18px", objectFit: "contain" }} /> Continue Shopping
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
                <img src="https://img.icons8.com/?size=100&id=pHehIn4Wlp05&format=png&color=318616" alt="Best Deals" style={{ width: "18px", height: "18px", objectFit: "contain" }} /> Best Deals
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
                <img src="https://img.icons8.com/?size=100&id=tgmqacLfjsi4&format=png&color=318616" alt="Fresh Fruits" style={{ width: "18px", height: "18px", objectFit: "contain" }} /> Fresh Fruits
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
                <img src="https://img.icons8.com/?size=100&id=EJGyTkY9EhhZ&format=png&color=318616" alt="Surprise Me" style={{ width: "18px", height: "18px", objectFit: "contain" }} /> Surprise Me
              </button>
            </div>
          </div>
          {isDrawerOpen && (
            <OffersBottomDrawer
              offerId={selectedOffer}
              onClose={closeOffer}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MobileHome;
