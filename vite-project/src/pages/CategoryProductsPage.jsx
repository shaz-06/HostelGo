import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";
import { cachedFetch } from "../utils/apiCache";
import { usePerfLogger } from "../utils/perfLogger";

const generateSlug = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const CATEGORY_SUBCATEGORIES = {
  "dairy-bread-eggs": [
    "Show All",
    "Milk",
    "Eggs",
    "Curd and Yogurts",
    "Fresh Bakery",
    "Butter",
    "Bread and Buns",
    "Cheese",
    "Batters & Chutneys",
    "Lassi & Buttermilk",
    "Milkshakes & More",
    "Indian Breads",
    "Dairy Alternatives",
    "Paneer and Tofu",
    "Top Deals"
  ],
  "meat-seafood": [
    "Show All",
    "Fresh Chicken",
    "Fresh Seafood",
    "Fresh Mutton",
    "Ready to Cook",
    "Meat Combos",
    "Frozen Food",
    "Plant Based Meat",
    "Eggs",
    "Cold Cuts"
  ],
  "atta-rice-dal": [
    "Show All",
    "Atta",
    "Rice",
    "Toor, Moong & Urad",
    "High Protein Atta",
    "Basmati Rice",
    "Besan, Sooji & Maida",
    "Rajma, Chola & Others",
    "Poha & Puffed Rice",
    "Premium Brands",
    "Soya Chunk & Badi",
    "Other Flours",
    "Millets & Daliya",
    "Ready to Cook Flour Mix",
    "Top Deals"
  ],
  "masalas": [
    "Show All",
    "Whole Spices",
    "Sugar & Jaggery",
    "Cold Grind",
    "Powdered Spices",
    "Salt",
    "Ready Masala",
    "Pickles & Chutney",
    "Herbs & Seasoning",
    "Paste & Puree",
    "Top Deals"
  ],
  "oils-ghee": [
    "Show All",
    "Mustard Oil",
    "Refined Sunflower",
    "Cow Ghee",
    "Olive & Canola",
    "Coconut Oil",
    "Other Oils",
    "Top Deals"
  ],
  "cereals-breakfast": [
    "Show All",
    "Oats & Muesli",
    "Flakes",
    "Granola",
    "Kids Cereals",
    "Breakfast Mixes",
    "Poha & Vermicelli",
    "Top Deals"
  ],
  "cold-drinks-juices": [
    "Show All",
    "Soft Drinks",
    "Fruit Juices",
    "Energy Drinks",
    "Coconut Water",
    "Soda & Mixers",
    "Ice Tea",
    "Top Deals"
  ],
  "ice-creams-desserts": [
    "Show All",
    "Tubs",
    "Cones & Cups",
    "Kulfi",
    "Gourmet Desserts",
    "Ice Cream Cakes",
    "Waffles",
    "Top Deals"
  ],
  "chips-namkeens": [
    "Show All",
    "Potato Chips",
    "Namkeen & Bhujia",
    "Nachos & Tortilla",
    "Puffs & Popcorn",
    "Healthy Snacks",
    "Top Deals"
  ],
  "chocolates": [
    "Show All",
    "Milk Chocolates",
    "Dark Chocolates",
    "Gift Packs",
    "Bars & Bites",
    "Wafer Chocolates",
    "Top Deals"
  ],
  "biscuits-cakes": [
    "Show All",
    "Cookies",
    "Cream Biscuits",
    "Digestive Biscuits",
    "Tea-time Biscuits",
    "Cakes & Muffins",
    "Rusk & Khari",
    "Top Deals"
  ],
  "tea-coffee-drinks": [
    "Show All",
    "Tea Leaves",
    "Green Tea",
    "Instant Coffee",
    "Filter Coffee",
    "Health Drinks",
    "Milk Additives",
    "Top Deals"
  ],
  "sauces-spreads": [
    "Show All",
    "Ketchup & Sauce",
    "Mayonnaise & Dips",
    "Jams & Honey",
    "Chocolate Spreads",
    "Salad Dressings",
    "Chinese Sauces",
    "Top Deals"
  ],
  "sweet-corner": [
    "Show All",
    "Traditional Sweets",
    "Gulab Jamun & Rasgulla",
    "Soan Papdi",
    "Halwa & Kheer",
    "Sugar-Free Sweets",
    "Top Deals"
  ],
  "bath-body": [
    "Show All",
    "Soaps",
    "Body Wash",
    "Hand Wash",
    "Body Lotion",
    "Deodorants",
    "Talcom Powder",
    "Top Deals"
  ],
  "hair-care": [
    "Show All",
    "Shampoo",
    "Conditioner",
    "Hair Oil",
    "Hair Serum",
    "Hair Color",
    "Styling Gel",
    "Top Deals"
  ],
  "skincare": [
    "Show All",
    "Face Wash",
    "Moisturizers",
    "Sunscreen",
    "Face Scrubs & Masks",
    "Lip Care",
    "Serums",
    "Top Deals"
  ],
  "health-pharma": [
    "Show All",
    "Pain Relief",
    "Digestive Care",
    "Bandages & Antiseptics",
    "Sexual Wellness",
    "Multivitamins",
    "Daily Wellness",
    "Top Deals"
  ],
  "home-kitchen": [
    "Show All",
    "Kitchenware",
    "Containers & Bottles",
    "Cleaning Tools",
    "Garbage Bags",
    "Tissues & Napkins",
    "Top Deals"
  ],
  "puja-store": [
    "Show All",
    "Agarbatti & Dhoop",
    "Puja Oil & Ghee",
    "Camphor (Kapoor)",
    "Puja Utensils",
    "Matchboxes",
    "Top Deals"
  ],
  "cleaners-repellents": [
    "Show All",
    "Floor Cleaners",
    "Toilet Cleaners",
    "Dishwashers",
    "Mosquito Repellents",
    "Air Freshners",
    "Top Deals"
  ],
  "electronics-appliances": [
    "Show All",
    "Earphones",
    "Cables & Chargers",
    "Power Banks",
    "Batteries",
    "Kitchen Appliances",
    "Top Deals"
  ]
};

const getSubcategoryKey = (slug) => {
  if (!slug) return "";
  const norm = slug.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  
  const map = {
    "dairy-bread-eggs": "dairy-bread-eggs",
    "dairy-bread-and-eggs": "dairy-bread-eggs",
    "meat-and-seafood": "meat-seafood",
    "meat-seafood": "meat-seafood",
    "atta-rice-and-dal": "atta-rice-dal",
    "atta-rice-dal": "atta-rice-dal",
    "cold-drinks-and-juices": "cold-drinks-juices",
    "cold-drinks-juices": "cold-drinks-juices",
    "ice-creams-and-desserts": "ice-creams-desserts",
    "ice-creams-desserts": "ice-creams-desserts",
    "chips-and-namkeens": "chips-namkeens",
    "chips-namkeens": "chips-namkeens",
    "biscuits-and-cakes": "biscuits-cakes",
    "biscuits-cakes": "biscuits-cakes",
    "tea-coffee-and-drinks": "tea-coffee-drinks",
    "tea-coffee-drinks": "tea-coffee-drinks",
    "sauces-and-spreads": "sauces-spreads",
    "sauces-spreads": "sauces-spreads",
    "bath-and-body": "bath-body",
    "bath-body": "bath-body",
    "health-and-pharma": "health-pharma",
    "health-pharma": "health-pharma",
    "home-and-kitchen": "home-kitchen",
    "home-kitchen": "home-kitchen",
    "cleaners-and-repellents": "cleaners-repellents",
    "cleaners-repellents": "cleaners-repellents",
  };
  return map[norm] || norm;
};

export default function CategoryProductsPage({
  products = [],
  categories = [],
  addToCart,
  removeFromCart,
  cart,
  cartItems,
  windowWidth,
  getCartKey,
  setSelectedProduct,
  loading: parentLoading = false
}) {
  usePerfLogger("CategoryProductsPage");
  const { slug } = useParams();
  const navigate = useNavigate();

  const [localProducts, setLocalProducts] = useState(products);
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(parentLoading);
  const [error, setError] = useState("");
  
  const [activeSubcategory, setActiveSubcategory] = useState("Show All");
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll to top on slug/subcategory change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Sync with parent props
  useEffect(() => {
    if (products && products.length > 0) {
      setLocalProducts(products);
    }
  }, [products]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Fetch if empty and parent is not loading
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!parentLoading && (!products || products.length === 0)) {
        try {
          setLoading(true);
          const [pData, cData] = await Promise.all([
            cachedFetch(window.API_BASE_URL + "/api/products"),
            cachedFetch(window.API_BASE_URL + "/api/categories")
          ]);
          const enrichedPData = (pData || []).map(p => ({
            ...p,
            _classifiedCategory: canonicalCategory(classifyProduct(p))
          }));
          setLocalProducts(enrichedPData);
          setLocalCategories(cData);
        } catch (err) {
          console.error("Error loading products/categories dynamically:", err);
          setError("Failed to connect to server");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFreshData();
  }, [products, categories, parentLoading]);

  // Match the category
  const matchedCategory = useMemo(() => {
    if (!slug) return null;
    let found = localCategories.find(c => {
      const cSlug = c.slug || generateSlug(c.name);
      return cSlug.toLowerCase() === slug.toLowerCase();
    });
    if (!found) {
      const slugNormalized = slug.replace(/-/g, ' ');
      const slugCanonical = canonicalCategory(slugNormalized);
      found = localCategories.find(c => canonicalCategory(c.name) === slugCanonical);
    }
    return found;
  }, [localCategories, slug]);

  // Get active subcategories list
  const subcategories = useMemo(() => {
    const key = getSubcategoryKey(slug);
    return CATEGORY_SUBCATEGORIES[key] || ["Show All"];
  }, [slug]);

  // Reset active subcategory when slug changes
  useEffect(() => {
    setActiveSubcategory("Show All");
    setSearchQuery("");
  }, [slug]);

  // Normalization helper for category matching
  const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, " ");
  };

  const getSubcategoryMatch = (productSub, targetSub) => {
    if (!productSub || !targetSub) return false;
    const normProd = normalizeName(productSub);
    const normTarget = normalizeName(targetSub);
    return normProd === normTarget || normProd.includes(normTarget) || normTarget.includes(normProd);
  };

  // Filter category products based on dynamic subcategory and search query
  const filteredCategoryProducts = useMemo(() => {
    if (!matchedCategory) return [];
    const targetCanonical = canonicalCategory(matchedCategory.name);

    // 1. Get all products belonging to this category
    let list = localProducts.filter(p => {
      const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
      return classified === targetCanonical || 
             canonicalCategory(p.category) === targetCanonical;
    });

    // 2. Filter by active left sidebar subcategory
    if (activeSubcategory !== "Show All") {
      if (activeSubcategory === "Top Deals") {
        list = list.filter(p => p.originalPrice > p.price);
      } else {
        list = list.filter(p => 
          getSubcategoryMatch(p.subCategory, activeSubcategory) || 
          getSubcategoryMatch(p.subcategory, activeSubcategory)
        );
      }
    }

    // 3. Filter by search query within this category
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return list;
  }, [localProducts, matchedCategory, activeSubcategory, searchQuery]);

  // SEO Dynamic Page Title
  useEffect(() => {
    if (matchedCategory) {
      document.title = `${matchedCategory.name} | Buyto`;
    }
  }, [matchedCategory]);

  if (loading || parentLoading) {
    return (
      <div style={{ padding: "20px 0", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <div style={{ height: "32px", width: "200px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "20px", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ display: "flex", gap: "20px" }}>
          {/* Sidebar Skeleton */}
          <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: "36px", background: "#e5e7eb", borderRadius: "8px", animation: "pulse 1.5s infinite ease-in-out" }} />
            ))}
          </div>
          {/* Grid Skeleton */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} style={{ background: "white", borderRadius: "16px", padding: "16px", height: "240px", border: "1px solid #f3f4f6", animation: "pulse 1.5s infinite ease-in-out" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!matchedCategory) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1f2937", margin: "0 0 8px 0" }}>Category not found</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0" }}>The category path "/category/{slug}" does not match any records.</p>
        <button
          onClick={() => navigate("/")}
          style={{ background: "#318616", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "750", cursor: "pointer" }}
        >
          Back to Shop Home
        </button>
      </div>
    );
  }

  const isMobile = windowWidth < 768;

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", background: "#f9fafb", minHeight: "80vh", padding: isMobile ? "10px" : "20px 0" }}>
      {/* Category header block */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1 style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: "900", color: "#1f2937", margin: 0 }}>
            {matchedCategory.icon && <span style={{ marginRight: "8px" }}>{matchedCategory.icon}</span>}
            {matchedCategory.name}
          </h1>
          <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>
            ({filteredCategoryProducts.length} items)
          </span>
        </div>

        {/* Category Local Search input */}
        <div style={{ position: "relative", width: isMobile ? "100%" : "260px" }}>
          <input
            type="text"
            placeholder={`Search in ${matchedCategory.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
              fontWeight: "600",
              outline: "none",
              background: "white",
              boxSizing: "border-box"
            }}
          />
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "14px" }}>🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        {/* Left Sidebar Subcategories - Sticky */}
        {!isMobile && (
          <aside
            style={{
              width: "220px",
              position: "sticky",
              top: "120px",
              background: "white",
              borderRadius: "16px",
              padding: "12px 8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              border: "1px solid #f3f4f6",
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {subcategories.map((sub) => {
                const isActive = activeSubcategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: isActive ? "#eefaf2" : "transparent",
                      color: isActive ? "#318616" : "#4b5563",
                      fontSize: "13px",
                      fontWeight: isActive ? "800" : "600",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{sub}</span>
                    {isActive && <span style={{ fontSize: "10px" }}>●</span>}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Mobile Horizontal Subcategory Bar */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              padding: "4px 0 12px 0",
              width: "100%",
              scrollbarWidth: "none"
            }}
            className="hide-scrollbar"
          >
            {subcategories.map((sub) => {
              const isActive = activeSubcategory === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: "none",
                    background: isActive ? "#318616" : "white",
                    color: isActive ? "white" : "#4b5563",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb"
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Product Grid */}
        <div style={{ flex: 1 }}>
          {filteredCategoryProducts.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "white", borderRadius: "16px", border: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📦</div>
              <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "600" }}>
                No matching products found in this category or subcategory.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile 
                  ? "repeat(2, 1fr)" 
                  : "repeat(auto-fill, minmax(180px, 1fr))",
                gap: isMobile ? "10px" : "20px",
              }}
            >
              {filteredCategoryProducts.map(p => (
                <ProductCard
                  key={p._id || p.id}
                  product={p}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  cart={cart}
                  cartItems={cartItems}
                  windowWidth={windowWidth}
                  getCartKey={getCartKey}
                  setSelectedProduct={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
