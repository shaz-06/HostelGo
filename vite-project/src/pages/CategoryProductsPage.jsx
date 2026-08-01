import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";
import { cachedFetch } from "../utils/apiCache";
import { apiFetch } from "../utils/apiClient";
import { usePerfLogger } from "../utils/perfLogger";
import SEO from "../components/common/SEO";

// Module-level cache to persist categories data across navigations
const categoryProductsCache = {};

const categoryRouteMap = {
  // Fresh & Grocery
  "fresh-vegetables": "The Veggie Store",
  "fresh-fruits": "The Fruit Store",
  "dairy-bread-eggs": "Dairy, Bread & Eggs",
  "dairy-bread-and-eggs": "Dairy, Bread & Eggs",
  "meat-seafood": "Meat and Seafood",
  "meat-and-seafood": "Meat and Seafood",
  "atta-rice-and-dal": "Atta, Rice and Dal",
  "atta-rice-dal": "Atta, Rice and Dal",
  "masalas": "Masalas",
  "oils-and-ghee": "Oil & Ghee",
  "oil-ghee": "Oil & Ghee",
  "cereals-breakfast": "Breakfast",
  "breakfast": "Breakfast",

  // Snacks & Drinks
  "cold-drinks-juices": "Beverages",
  "cold-drinks-and-juices": "Beverages",
  "chips-namkeens": "Snacks",
  "chips-and-namkeens": "Snacks",
  "ice-cream": "Ice-Cream",
  "ice-creams-frozen-desserts": "Ice-Cream",
  "ice-creams-and-desserts": "Ice-Cream",
  "chocolates": "Chocolates",
  "noodles-pasta-vermicelli": "Noodles & Pasta",
  "noodles-and-pasta": "Noodles & Pasta",
  "frozen-food": "Frozen Foods",
  "frozen-foods": "Frozen Foods",
  "sweet-corner": "Sweet Corner",
  "paan-corner": "Pan Centre",
  "pan-centre": "Pan Centre",
  "cake-corner": "Cake Corner",
  "biscuits-and-cakes": "Snacks",
  "tea-coffee-drinks": "Beverages",
  "tea-coffee": "Beverages",
  "sauces-and-spreads": "Premium Pickles",

  // Beauty & Wellness
  "bath-body": "Bath & Body",
  "bath-and-body": "Bath & Body",
  "hair-care": "Hair Care",
  "skin-care": "Skin Care",
  "skincare": "Skin Care",
  "makeup": "Makeups",
  "makeups": "Makeups",
  "oral-care": "Oral Care",
  "grooming": "Grooming",
  "baby-care": "Baby Care",
  "fragrances": "Perfumes",
  "perfumes": "Perfumes",
  "protein-supplements": "Proteins",
  "feminine-hygiene": "Female Hygiene",
  "sexual-wellness": "Sexual Wellness",
  "health-pharma": "Health & Pharmacy",
  "health-and-pharma": "Health & Pharmacy",

  // Household & Lifestyle
  "home-furnishing": "House Holds",
  "home-and-kitchen": "Kitchen & Cooking",
  "home-kitchen": "Kitchen & Cooking",
  "kitchen-dining": "Kitchen & Cooking",
  "cleaning-essentials": "Cleaning Essentials",
  "cleaners-repellents": "Cleaning Essentials",
  "clothing": "Clothing Section",
  "mobiles-electronics": "Mobiles & Electronics",
  "appliances": "Mobiles & Electronics",
  "electronics-appliances": "Mobiles & Electronics",
  "books-stationery": "Stationary",
  "stationery": "Stationary",
  "jewellery-accessories": "Grooming",

  // Electronics & Appliances
  "puja": "Pooja Essentials",
  "puja-store": "Pooja Essentials",
  "toys-games": "Toys and Games",
  "sports-fitness": "Sports Equipment",
  "pet-supplies": "Pet Shop",

  // Shop By Store
  "book-store": "Stationary",
  "the-noice-store": "The Noice Store",
  "health-hub": "Health Hub",
  "sports-and-fitness-store": "Sports Equipment",
  "instadrops-store": "Instadrops Store",
  "summer-store": "Summer Store",
  "gourmet-store": "Gourmet Store",
  "travel-store": "Travel Store"
};

function ProductCardSkeleton({ isMobile }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.65)",
        border: "1px solid rgba(0,0,0,0.05)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: isMobile ? "250px" : "310px",
        boxSizing: "border-box",
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
        background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
        animation: "shimmer 1.5s infinite",
        transform: "translateX(-100%)"
      }} />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
      {/* Image box skeleton */}
      <div style={{ width: "100%", height: isMobile ? "110px" : "150px", borderRadius: "14px", background: "rgba(0,0,0,0.05)" }} />
      {/* Text skeletons */}
      <div style={{ width: "70%", height: "14px", borderRadius: "4px", background: "rgba(0,0,0,0.05)", marginTop: "4px" }} />
      <div style={{ width: "40%", height: "11px", borderRadius: "4px", background: "rgba(0,0,0,0.05)" }} />
      {/* Footer area skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "45%" }}>
          <div style={{ width: "100%", height: "14px", borderRadius: "4px", background: "rgba(0,0,0,0.05)" }} />
          <div style={{ width: "60%", height: "10px", borderRadius: "4px", background: "rgba(0,0,0,0.05)" }} />
        </div>
        <div style={{ width: "70px", height: "32px", borderRadius: "10px", background: "rgba(49, 134, 22, 0.15)" }} />
      </div>
    </div>
  );
}

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

const normalize = (text) =>
  text?.toLowerCase().replace(/\s+/g, " ").trim() || "";

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

const categoryFilters = {
  "fresh-fruits": {
    "Type": ["Mangoes", "Bananas", "Apples", "Watermelons"],
    "Freshness": ["Organic", "Farm Fresh", "Seasonal"],
    "Price": ["Under ₹50", "₹50-₹100", "₹100+"],
    "Offers": ["10%+ OFF", "20%+ OFF"]
  },
  "fresh-vegetables": {
    "Type": ["Leafy", "Root", "Exotic"],
    "Freshness": ["Organic", "Farm Fresh"],
    "Price": ["Under ₹30", "₹30-₹80", "₹80+"]
  },
  "dairy-bread-eggs": {
    "Type": ["Milk", "Curd", "Cheese", "Butter", "Eggs", "Bread"],
    "Brand": ["Amul", "Nandini", "Britannia"],
    "Offers": ["Combo Packs", "Buy 1 Get 1"]
  },
  "dairy-bread-and-eggs": {
    "Type": ["Milk", "Curd", "Cheese", "Butter", "Eggs", "Bread"],
    "Brand": ["Amul", "Nandini", "Britannia"],
    "Offers": ["Combo Packs", "Buy 1 Get 1"]
  },
  "meat-seafood": {
    "Type": ["Chicken", "Mutton", "Fish", "Prawns"],
    "Cuts": ["Boneless", "Curry Cut", "Whole"],
    "Freshness": ["Fresh Today", "Premium"]
  },
  "meat-and-seafood": {
    "Type": ["Chicken", "Mutton", "Fish", "Prawns"],
    "Cuts": ["Boneless", "Curry Cut", "Whole"],
    "Freshness": ["Fresh Today", "Premium"]
  },
  "chips-namkeens": {
    "Type": ["Chips", "Biscuits", "Chocolates", "Namkeens"],
    "Brand": ["Lays", "Haldiram", "Cadbury"],
    "Offers": ["Combo Offers", "10%+ OFF"]
  },
  "chips-and-namkeens": {
    "Type": ["Chips", "Biscuits", "Chocolates", "Namkeens"],
    "Brand": ["Lays", "Haldiram", "Cadbury"],
    "Offers": ["Combo Offers", "10%+ OFF"]
  },
  "cold-drinks-juices": {
    "Type": ["Soft Drinks", "Juices", "Energy Drinks", "Water"],
    "Brand": ["Coca-Cola", "Pepsi", "Real", "Red Bull"]
  },
  "cold-drinks-and-juices": {
    "Type": ["Soft Drinks", "Juices", "Energy Drinks", "Water"],
    "Brand": ["Coca-Cola", "Pepsi", "Real", "Red Bull"]
  },
  "baby-care": {
    "Type": ["Diapers", "Wipes", "Baby Food", "Lotion"],
    "Brand": ["Pampers", "Huggies", "Johnson's"]
  },
  "bath-body": {
    "Type": ["Soap", "Shampoo", "Face Wash", "Body Wash"],
    "Brand": ["Dove", "Nivea", "Mamaearth"]
  },
  "bath-and-body": {
    "Type": ["Soap", "Shampoo", "Face Wash", "Body Wash"],
    "Brand": ["Dove", "Nivea", "Mamaearth"]
  }
};

const matchPrice = (priceVal, priceStr) => {
  const pVal = Number(priceVal) || 0;
  const matchUnder = priceStr.match(/Under\s*₹\s*(\d+)/i);
  if (matchUnder) {
    return pVal < parseInt(matchUnder[1], 10);
  }
  const matchRange = priceStr.match(/₹\s*(\d+)\s*-\s*₹\s*(\d+)/i);
  if (matchRange) {
    return pVal >= parseInt(matchRange[1], 10) && pVal <= parseInt(matchRange[2], 10);
  }
  const matchPlus = priceStr.match(/₹\s*(\d+)\s*\+/i);
  if (matchPlus) {
    return pVal >= parseInt(matchPlus[1], 10);
  }
  return true;
};

const matchOffer = (p, offerStr) => {
  const price = Number(p.price) || 0;
  const originalPrice = Number(p.originalPrice) || 0;
  if (!originalPrice || originalPrice <= price) return false;
  const discount = ((originalPrice - price) / originalPrice) * 100;
  const matchPct = offerStr.match(/(\d+)%\+\s*OFF/i);
  if (matchPct) {
    return discount >= parseInt(matchPct[1], 10);
  }
  if (offerStr.toLowerCase().includes("buy 1 get 1")) {
    const nameMatch = p.name && String(p.name).toLowerCase().includes("buy 1 get 1");
    const descMatch = p.description && String(p.description).toLowerCase().includes("bogo");
    const tagsMatch = p.tags && (Array.isArray(p.tags)
      ? p.tags.some(t => String(t).toLowerCase().includes("bogo"))
      : String(p.tags).toLowerCase().includes("bogo"));
    return nameMatch || descMatch || tagsMatch;
  }
  return true;
};

const matchType = (p, typeVal) => {
  const val = typeVal.toLowerCase();
  const nameMatch = p.name && String(p.name).toLowerCase().includes(val);
  const subCategoryMatch = p.subCategory && String(p.subCategory).toLowerCase().includes(val);
  const subcategoryMatch = p.subcategory && String(p.subcategory).toLowerCase().includes(val);
  const descMatch = p.description && String(p.description).toLowerCase().includes(val);
  const tagsMatch = p.tags && (Array.isArray(p.tags)
    ? p.tags.some(t => String(t).toLowerCase().includes(val))
    : String(p.tags).toLowerCase().includes(val));
  return nameMatch || subCategoryMatch || subcategoryMatch || descMatch || tagsMatch;
};

const matchBrand = (p, brandVal) => {
  const val = brandVal.toLowerCase();
  return (p.brand && String(p.brand).toLowerCase().includes(val)) ||
    (p.name && String(p.name).toLowerCase().includes(val));
};

const matchFreshness = (p, freshVal) => {
  const val = freshVal.toLowerCase();
  const nameMatch = p.name && String(p.name).toLowerCase().includes(val);
  const descMatch = p.description && String(p.description).toLowerCase().includes(val);
  const tagsMatch = p.tags && (Array.isArray(p.tags)
    ? p.tags.some(t => String(t).toLowerCase().includes(val))
    : String(p.tags).toLowerCase().includes(val));
  return nameMatch || descMatch || tagsMatch;
};

const matchCuts = (p, cutVal) => {
  const val = cutVal.toLowerCase();
  return (p.name && String(p.name).toLowerCase().includes(val)) ||
    (p.description && String(p.description).toLowerCase().includes(val));
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

  const [localProducts, setLocalProducts] = useState([]);
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination & Load More States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeSubcategory, setActiveSubcategory] = useState("Show All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isFilterBottomSheetOpen, setIsFilterBottomSheetOpen] = useState(false);
  const [activeMobileFilterSection, setActiveMobileFilterSection] = useState("All");

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Sync Categories with parent props
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    } else {
      cachedFetch(window.API_BASE_URL + "/api/categories")
        .then(data => {
          setLocalCategories(data || []);
        })
        .catch(err => {
          console.error("Error loading categories in CategoryProductsPage:", err);
        });
    }
  }, [categories]);

  // Helper fetch function
  const fetchCategoryData = async (categoryName, pageNum, isBackground = false, signal = null) => {
    try {
      if (!isBackground) {
        if (pageNum > 1) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
      }
      
      const url = `${window.API_BASE_URL}/api/products?category=${encodeURIComponent(categoryName)}&page=${pageNum}&limit=20`;
      const isBlocking = false;
      const res = await apiFetch(url, { signal, blocking: isBlocking, minDelay: 700 });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      
      const enriched = (data || []).map(p => ({
        ...p,
        _classifiedCategory: canonicalCategory(classifyProduct(p))
      }));

      setLocalProducts(prev => {
        const nextProducts = pageNum === 1 ? enriched : [...prev, ...enriched];
        // Cache data
        categoryProductsCache[slug] = {
          products: nextProducts,
          page: pageNum,
          hasMore: enriched.length === 20,
          fetchedAt: Date.now()
        };
        return nextProducts;
      });

      setHasMore(enriched.length === 20);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading category products:", err);
        setError("Failed to load products for this category.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Match the category
  const matchedCategory = useMemo(() => {
    if (!slug || localCategories.length === 0) return null;

    const categoryName = categoryRouteMap[slug];

    if (!categoryName) {
      console.warn(
        `Category slug "${slug}" not found inside route mapping.`
      );
      return null;
    }

    console.info("[Category Resolver]", {
      routeSlug: slug,
      backendCategory: categoryName,
    });

    const dbCategory = localCategories.find(c => c.name === categoryName);
    return dbCategory || { name: categoryName };
  }, [localCategories, slug]);

  // Main fetch hook based on current category slug
  useEffect(() => {
    if (!slug || localCategories.length === 0) return;

    if (!matchedCategory) {
      setLoading(false);
      return;
    }

    setPage(1);
    setHasMore(true);
    setError("");

    const controller = new AbortController();
    const signal = controller.signal;

    const categoryName = matchedCategory.name;

    if (categoryProductsCache[slug]) {
      const cached = categoryProductsCache[slug];
      setLocalProducts(cached.products);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setLoading(false);

      // Refresh in background if stale (> 30s)
      if (Date.now() - cached.fetchedAt > 30000) {
        fetchCategoryData(categoryName, 1, true, signal);
      }
    } else {
      setLocalProducts([]);
      setLoading(true);
      fetchCategoryData(categoryName, 1, false, signal);
    }

    return () => {
      controller.abort();
    };
  }, [slug, localCategories, matchedCategory]);

  // Load More function
  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    
    const categoryName = matchedCategory ? matchedCategory.name : slug;
    fetchCategoryData(categoryName, nextPage);
  };

  const observerTarget = useRef(null);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0] && entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, localCategories, slug]);

  // Get active subcategories list
  const subcategories = useMemo(() => {
    const key = getSubcategoryKey(slug);
    return CATEGORY_SUBCATEGORIES[key] || ["Show All"];
  }, [slug]);

  // Get active filters configuration based on category slug
  const activeFiltersConfig = useMemo(() => {
    const key = getSubcategoryKey(slug);
    return categoryFilters[key] || {};
  }, [slug]);

  // Reset active subcategory and filters when slug changes
  useEffect(() => {
    setActiveSubcategory("Show All");
    setSearchQuery("");
    setSelectedFilters({});
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

  // Filter category products based on dynamic subcategory, search query, and category specific checkbox filters
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

    // 4. Dynamic category-specific filters
    Object.entries(selectedFilters).forEach(([section, selectedOptions]) => {
      if (!selectedOptions || selectedOptions.length === 0) return;
      list = list.filter(p => {
        return selectedOptions.some(option => {
          const lowerSection = section.toLowerCase();
          if (lowerSection === "price") {
            return matchPrice(p.price, option);
          }
          if (lowerSection === "offers") {
            return matchOffer(p, option);
          }
          if (lowerSection === "type") {
            return matchType(p, option);
          }
          if (lowerSection === "brand") {
            return matchBrand(p, option);
          }
          if (lowerSection === "freshness") {
            return matchFreshness(p, option);
          }
          if (lowerSection === "cuts") {
            return matchCuts(p, option);
          }
          return true;
        });
      });
    });

    return list;
  }, [localProducts, matchedCategory, activeSubcategory, searchQuery, selectedFilters]);



  const handleCheckboxChange = (section, option) => {
    setSelectedFilters((prev) => {
      const current = prev[section] || [];
      const updated = current.includes(option)
        ? current.filter((x) => x !== option)
        : [...current, option];

      const newFilters = { ...prev, [section]: updated };
      if (newFilters[section].length === 0) {
        delete newFilters[section];
      }
      return newFilters;
    });
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  if (loading) {
    const isMobile = windowWidth < 768;
    return (
      <div style={{ padding: isMobile ? "10px" : "20px 0", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <div style={{ height: "32px", width: "200px", background: "rgba(0,0,0,0.05)", borderRadius: "8px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "shimmer 1.5s infinite" }} />
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {!isMobile && (
            <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: "36px", background: "rgba(0,0,0,0.05)", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "shimmer 1.5s infinite" }} />
                </div>
              ))}
            </div>
          )}
          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: isMobile ? "12px" : "20px"
          }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} isMobile={isMobile} />
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
    <div
      style={{
        fontFamily: "'Outfit', 'Inter', sans-serif",
        background: "#f7f8fa",
        minHeight: "80vh",
        padding: isMobile ? "12px" : "20px 0",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box"
      }}
    >
      <SEO title={matchedCategory ? matchedCategory.name : "Products"} description={matchedCategory ? `Shop top quality ${matchedCategory.name} online with fast 10-minute delivery on Buyto.` : "Browse categories on Buyto."} />
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
      </div>

      <div
        style={{
          display: "flex",
          gap: isMobile ? "12px" : "24px",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "stretch",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Left Sidebar Layout (Subcategories + Filters) */}
        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "220px" }}>
            {/* Subcategories list */}
            <aside
              style={{
                background: "white",
                borderRadius: "28px",
                padding: "16px 12px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                border: "1px solid #f3f4f6",
                maxHeight: "350px",
                overflowY: "auto",
                boxSizing: "border-box"
              }}
            >
              <span style={{ fontWeight: "800", fontSize: "14px", color: "#111827", paddingLeft: "14px", display: "block", marginBottom: "10px" }}>
                Subcategories
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {subcategories.map((sub) => {
                  const isActive = activeSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcategory(sub)}
                      style={{
                        textAlign: "left",
                        padding: "8px 14px",
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
                        if (!isActive) e.currentTarget.style.background = "#f7f8fa";
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

            {/* Dynamic Filter Sidebar */}
            {Object.keys(activeFiltersConfig).length > 0 && (
              <aside
                style={{
                  background: "white",
                  borderRadius: "28px",
                  padding: "20px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                  border: "1px solid #f3f4f6",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "800", fontSize: "14px", color: "#111827" }}>Filters</span>
                  {Object.keys(selectedFilters).length > 0 && (
                    <button
                      onClick={handleClearAll}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#318616",
                        fontSize: "11px",
                        fontWeight: "750",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {Object.entries(activeFiltersConfig).map(([section, options]) => (
                  <div key={section} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontWeight: "750", fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {section}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {options.map((opt) => {
                        const isChecked = (selectedFilters[section] || []).includes(opt);
                        return (
                          <label
                            key={opt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "13px",
                              fontWeight: isChecked ? "700" : "500",
                              color: isChecked ? "#318616" : "#4b5563",
                              cursor: "pointer",
                              userSelect: "none"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(section, opt)}
                              style={{
                                accentColor: "#318616",
                                width: "16px",
                                height: "16px",
                                cursor: "pointer"
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div style={{ height: "1px", background: "#f3f4f6", marginTop: "10px" }} />
                  </div>
                ))}
              </aside>
            )}
          </div>
        )}

        {/* Mobile Filter Chips Row */}
        {isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Subcategories Horizontal Bar */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                padding: "4px 0",
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

            {/* Filter Section Chips */}
            {Object.keys(activeFiltersConfig).length > 0 && (
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
                <button
                  onClick={() => {
                    setActiveMobileFilterSection("All");
                    setIsFilterBottomSheetOpen(true);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: "none",
                    background: "#1F2937",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>🔍 Filters</span>
                  {Object.keys(selectedFilters).length > 0 && (
                    <span style={{ background: "#318616", color: "white", borderRadius: "50%", width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                      {Object.values(selectedFilters).reduce((a, b) => a + b.length, 0)}
                    </span>
                  )}
                </button>

                {Object.keys(activeFiltersConfig).map((section) => {
                  const selectedCount = (selectedFilters[section] || []).length;
                  return (
                    <button
                      key={section}
                      onClick={() => {
                        setActiveMobileFilterSection(section);
                        setIsFilterBottomSheetOpen(true);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "20px",
                        border: "none",
                        background: selectedCount > 0 ? "#eefaf2" : "white",
                        color: selectedCount > 0 ? "#318616" : "#4b5563",
                        fontSize: "12px",
                        fontWeight: "750",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        border: selectedCount > 0 ? "1px solid #318616" : "1px solid #e5e7eb"
                      }}
                    >
                      {section} {selectedCount > 0 ? `(${selectedCount})` : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Main Product Grid */}
        <div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
            boxSizing: "border-box",
            paddingLeft: isMobile ? "4px" : "0",
            paddingRight: isMobile ? "4px" : "0"
          }}
        >
          {filteredCategoryProducts.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "white", borderRadius: "28px", border: "1px solid #f3f4f6", boxShadow: "0 8px 30px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📦</div>
              <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "600" }}>
                No matching products found in this category or subcategory.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: isMobile ? "12px" : "20px",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box"
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

              {/* Load More trigger and loading cards */}
              {hasMore && (
                <div
                  ref={observerTarget}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "repeat(2, minmax(0, 1fr))"
                      : "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: isMobile ? "12px" : "20px",
                    marginTop: "20px",
                    width: "100%",
                    minHeight: "50px"
                  }}
                >
                  {loadingMore &&
                    Array.from({ length: isMobile ? 2 : 4 }).map((_, idx) => (
                      <ProductCardSkeleton key={`more-skeleton-${idx}`} isMobile={isMobile} />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {isFilterBottomSheetOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end"
          }}
          onClick={() => setIsFilterBottomSheetOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
              padding: "20px",
              maxHeight: "80vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bottom Sheet Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "900", fontSize: "18px", color: "#1f2937" }}>
                {activeMobileFilterSection === "All" ? "Filter Products" : `${activeMobileFilterSection} Filters`}
              </span>
              <button
                onClick={() => setIsFilterBottomSheetOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", fontWeight: "bold", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>

            {/* Filter Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {Object.entries(activeFiltersConfig)
                .filter(([section]) => activeMobileFilterSection === "All" || activeMobileFilterSection === section)
                .map(([section, options]) => (
                  <div key={section} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontWeight: "800", fontSize: "14px", color: "#374151" }}>{section}</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                      {options.map((opt) => {
                        const isChecked = (selectedFilters[section] || []).includes(opt);
                        return (
                          <label
                            key={opt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              borderRadius: "12px",
                              border: isChecked ? "1px solid #318616" : "1px solid #e5e7eb",
                              background: isChecked ? "#eefaf2" : "white",
                              fontSize: "12px",
                              fontWeight: isChecked ? "700" : "500",
                              color: isChecked ? "#318616" : "#4b5563",
                              cursor: "pointer"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(section, opt)}
                              style={{ accentColor: "#318616", width: "16px", height: "16px" }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Actions Footer */}
            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button
                onClick={() => {
                  handleClearAll();
                  setIsFilterBottomSheetOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  background: "white",
                  color: "#4b5563",
                  fontWeight: "750",
                  cursor: "pointer"
                }}
              >
                Clear All
              </button>
              <button
                onClick={() => setIsFilterBottomSheetOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  background: "#318616",
                  color: "white",
                  fontWeight: "750",
                  cursor: "pointer"
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
