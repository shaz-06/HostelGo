import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../header/Header";
import MobileCategoryScroller from "./MobileCategoryScroller";
import MobileBannerCarousel from "./MobileBannerCarousel";
import MobileProductCard from "./MobileProductCard";
const CategoryDiscovery = React.lazy(() => import("../CategoryDiscovery"));
const TrendingThisWeek = React.lazy(() => import("../TrendingThisWeek"));
const BestsellersSection = React.lazy(() => import("../home/Bestsellers"));
const DynamicNewBanners = React.lazy(() => import("../DynamicNewBanners"));
const PromoBannerCarousel = React.lazy(() => import("../PromoBannerCarousel"));
const OffersBottomDrawer = React.lazy(() => import("../common/OffersBottomDrawer"));
import { useTheme } from "../../context/ThemeContext";
import ProgressiveSection from "../common/ProgressiveSection";
import LazyMobileProductSection from "./LazyMobileProductSection";
import BackToTop from "../common/BackToTop";
import HeroBanner from "../home/HeroBanner";
import Offers from "../home/Offers";

const DeliveryIllustration = "https://img.icons8.com/?size=100&id=uTI4SjCIkNJp&format=png&color=000000";
const SearchResultsView = React.lazy(() => import("../SearchResultsView"));

function MobileProductCardSkeleton({ isDark }) {
  return (
    <div
      style={{
        background: isDark ? "var(--bg-card)" : "white",
        borderRadius: "12px",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "120px",
        height: "210px",
        boxSizing: "border-box",
        flexShrink: 0,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f0f0f0",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0) 100%)",
        animation: "shimmer 1.5s infinite",
        transform: "translateX(-100%)"
      }} />
      <div>
        <div style={{ width: "100%", height: "75px", background: isDark ? "var(--bg-secondary)" : "#f9fafb", borderRadius: "8px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
          <div style={{ width: "60%", height: "10px", borderRadius: "4px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }} />
          <div style={{ width: "40%", height: "12px", borderRadius: "4px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }} />
        </div>
        <div style={{ width: "80%", height: "24px", borderRadius: "4px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", marginTop: "12px" }} />
      </div>
      <div style={{ width: "100%", height: "26px", borderRadius: "6px", background: isDark ? "rgba(49, 134, 22, 0.2)" : "rgba(49, 134, 22, 0.1)" }} />
    </div>
  );
}

const EMPTY_ARRAY = [];
const NOOP = () => { };

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
  displayCats = EMPTY_ARRAY,
  selectedCategory = "All",
  onCategoryClick = NOOP,
  forceSearchTab = false,
  loading = false,
  apiError = null,
  onRefreshProducts = NOOP,
  bestsellers
}) {
  const [activeTab, setActiveTab] = useState(forceSearchTab ? "search" : "home");
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

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = React.useRef(0);
  const isPullingRef = React.useRef(false);

  const handleTouchStart = React.useCallback((e) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    } else {
      isPullingRef.current = false;
    }
  }, []);

  const handleTouchMove = React.useCallback((e) => {
    if (!isPullingRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;

    if (diff > 0 && window.scrollY === 0) {
      const damped = Math.min(80, diff * 0.45);
      setPullDistance(damped);

      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, [isRefreshing]);

  const handleTouchEnd = React.useCallback(async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= 55) {
      setIsRefreshing(true);
      setPullDistance(55);

      if (onRefreshProducts) {
        await onRefreshProducts();
      }

      setIsRefreshing(false);
      setPullDistance(0);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefreshProducts]);

  useEffect(() => {
    if (location.search.includes("scroll=categories")) {
      const el = document.getElementById("mobile-categories-anchor");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.search]);

  const cartQuantities = useMemo(() => {
    const map = new Map();
    if (Array.isArray(cartItems)) {
      cartItems.forEach(item => {
        map.set(String(item._id || item.id), item.quantity);
      });
    }
    return map;
  }, [cartItems]);

  // Filter products by categories for standard sections
  const getCategoryMatch = React.useCallback((pCat, targetCat) => {
    if (!pCat || !targetCat) return false;
    return pCat.toLowerCase().includes(targetCat.toLowerCase());
  }, []);


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
          <HeroBanner />

          {/* Offers Cards Bar */}
          <Offers openOffer={openOffer} />

          {apiError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                borderRadius: "16px",
                padding: "16px",
                color: "#991b1b",
                margin: "12px 16px",
                textAlign: "left",
                fontFamily: "'Outfit', 'Inter', sans-serif"
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span> Connection Error
              </h3>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", opacity: 0.9 }}>
                {apiError}
              </p>
            </div>
          )}

          {/* Bestsellers Section */}
          <React.Suspense fallback={<div style={{ minHeight: "250px" }} />}>
            <BestsellersSection initialData={bestsellers} />
          </React.Suspense>

          {/* Trending This Week Section */}
          <React.Suspense fallback={<div style={{ minHeight: "300px" }} />}>
            <TrendingThisWeek />
          </React.Suspense>

          {/* Large Rectangular Auto Banner Carousel */}
          <MobileBannerCarousel />

          {/* Category Discovery Section */}
          <ProgressiveSection fallback={<div style={{ minHeight: "350px" }} />} minHeight="350px">
            <div style={{ padding: "0 16px", background: "white", borderRadius: "24px", margin: "12px 16px", border: "1px solid #f3f4f6" }}>
              <React.Suspense fallback={<div style={{ minHeight: "350px" }} />}>
                <CategoryDiscovery />
              </React.Suspense>
            </div>
          </ProgressiveSection>

          <ProgressiveSection fallback={<div style={{ minHeight: "160px" }} />} minHeight="160px">
            <React.Suspense fallback={<div style={{ minHeight: "160px" }} />}>
              <PromoBannerCarousel />
            </React.Suspense>
          </ProgressiveSection>

          <ProgressiveSection fallback={<div style={{ minHeight: "150px" }} />} minHeight="150px">
            <React.Suspense fallback={<div style={{ minHeight: "150px" }} />}>
              <DynamicNewBanners />
            </React.Suspense>
          </ProgressiveSection>

          {/* Product Scrolling Sections (compact gaps) */}
          <LazyMobileProductSection
            title="Top Picks For You"
            route="/section/trending"
            categoryQuery="trending"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="Fresh Fruits"
            route="/section/fruits"
            categoryQuery="The Fruit Store"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="Fresh Vegetables"
            route="/section/veggies"
            categoryQuery="The Veggie Store"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="Dairy & Breakfast"
            route="/section/dairy"
            categoryQuery="Dairy, Bread & Eggs"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="Snacks & Drinks"
            route="/section/snacks"
            categoryQuery="Chips and Namkeens"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="Atta, Rice & Dal"
            route="/section/grocery"
            categoryQuery="Atta, Rice and Dal"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="✨ Recommended For You"
            route="/section/recommended"
            categoryQuery="recommended"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="🔥 Trending Near You"
            route="/section/trending"
            categoryQuery="trending"
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <LazyMobileProductSection
            title="💸 Best Deals Today"
            route="/section/deals"
            categoryQuery=""
            bestsellers={true}
            limit={6}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cartItems={cartItems}
            setSelectedProduct={setSelectedProduct}
          />

          <ProgressiveSection fallback={<div style={{ minHeight: "150px" }} />} minHeight="150px">
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
          </ProgressiveSection>
          {isDrawerOpen && (
            <React.Suspense fallback={null}>
              <OffersBottomDrawer
                offerId={selectedOffer}
                onClose={closeOffer}
              />
            </React.Suspense>
          )}
          <BackToTop />
        </>
      )}
    </div>
  );
}

export default React.memo(MobileHome);
