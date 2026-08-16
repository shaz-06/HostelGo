import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../ProductCard";
import HorizontalProductSection from "../HorizontalProductSection";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";
import { cachedFetch } from "../utils/apiCache";
import { apiFetch } from "../utils/apiClient";
import { usePerfLogger } from "../utils/perfLogger";
import SEO from "../components/common/SEO";

// Module-level cache to persist categories data across navigations
const categoryProductsCache = {};

const getCategorySlug = (cat) => {
  if (!cat) return "";
  return cat.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

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
  "oils-and-ghee": "Oils and Ghee",
  "oil-ghee": "Oils and Ghee",
  "cereals-breakfast": "Cereals & Breakfast",
  "breakfast": "Cereals & Breakfast",

  // Snacks & Drinks
  "cold-drinks-juices": "Beverages",
  "cold-drinks-and-juices": "Beverages",
  "chips-namkeens": "Chips and Namkeens",
  "chips-and-namkeens": "Chips and Namkeens",
  "snacks": "Snacks",
  "ice-cream": "Ice Creams & Desserts",
  "ice-creams-frozen-desserts": "Ice Creams & Desserts",
  "ice-creams-and-desserts": "Ice Creams & Desserts",
  "chocolates": "Chocolates",
  "noodles-pasta-vermicelli": "Noodles & Pasta",
  "noodles-and-pasta": "Noodles & Pasta",
  "frozen-food": "Frozen Foods",
  "frozen-foods": "Frozen Foods",
  "sweet-corner": "Sweet Corner",
  "paan-corner": "Pan Centre",
  "pan-centre": "Pan Centre",
  "cake-corner": "Cake Corner",
  "biscuits-and-cakes": "Biscuits and Cakes",
  "tea-coffee-drinks": "Tea, Coffee & Drinks",
  "tea-coffee": "Tea, Coffee & Drinks",
  "sauces-and-spreads": "Sauces and Spreads",
  "premium-pickles": "Premium Pickles",

  // Beauty & Wellness
  "bath-body": "Bath and Body",
  "bath-and-body": "Bath and Body",
  "hair-care": "Hair Care",
  "skin-care": "Skincare",
  "skincare": "Skincare",
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
  "health-pharma": "Health and Pharma",
  "health-and-pharma": "Health and Pharma",

  // Household & Lifestyle
  "home-furnishing": "House Holds",
  "home-and-kitchen": "Home and Kitchen",
  "home-kitchen": "Home and Kitchen",
  "kitchen-dining": "Home and Kitchen",
  "cleaning-essentials": "Cleaners & Repellents",
  "cleaners-repellents": "Cleaners & Repellents",
  "clothing": "Clothing Section",
  "mobiles-electronics": "Electronics & Appliances",
  "appliances": "Electronics & Appliances",
  "electronics-appliances": "Electronics & Appliances",
  "books-stationery": "Stationary",
  "stationery": "Stationary",
  "jewellery-accessories": "Grooming",

  // Electronics & Appliances
  "puja": "Puja Store",
  "puja-store": "Puja Store",
  "toys-games": "Toys and Games",
  "sports-fitness": "Sports Equipment",
  "pet-supplies": "Pet Shop",
  "hostel-essentials": "Hostel Essentials",

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
  const isMobile = windowWidth < 768;

  const [localProducts, setLocalProducts] = useState([]);
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Match the category
  const matchedCategory = useMemo(() => {
    if (!slug) return null;
    if (slug === "electronics") {
      return { name: "Electronics & Appliances", slug: "electronics", icon: "🎧" };
    }
    if (slug === "beauty") {
      return { name: "Beauty", slug: "beauty", icon: "💄" };
    }
    if (slug === "pharmacy") {
      return { name: "Pharmacy", slug: "pharmacy", icon: "💊" };
    }
    if (slug === "decor") {
      return { name: "Decor", slug: "decor", icon: "🏠" };
    }
    if (slug === "kids") {
      return { name: "Kids", slug: "kids", icon: "🧸" };
    }
    if (localCategories.length === 0) return null;

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

  // Dynamic subcategories state
  const [subcategories, setSubcategories] = useState(["Show All"]);
  const [hasLoadedSubcategories, setHasLoadedSubcategories] = useState(false);

  // Get active filters configuration based on category slug
  const activeFiltersConfig = useMemo(() => {
    const key = getSubcategoryKey(slug);
    return categoryFilters[key] || {};
  }, [slug]);

  // Pagination & Load More States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawSubParam = searchParams.get("sub");

  const activeSubcategory = useMemo(() => {
    if (!rawSubParam || rawSubParam === "Show All") return "Show All";
    const found = subcategories.find(
      s => s.toLowerCase() === rawSubParam.toLowerCase()
    );
    return found || "Show All";
  }, [rawSubParam, subcategories]);

  // Validate subcategory and remove parameter if invalid
  useEffect(() => {
    if (hasLoadedSubcategories && rawSubParam) {
      const found = subcategories.find(
        s => s.toLowerCase() === rawSubParam.toLowerCase() && s !== "Show All"
      );
      if (!found) {
        searchParams.delete("sub");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [hasLoadedSubcategories, rawSubParam, subcategories, searchParams, setSearchParams]);

  const setActiveSubcategory = (sub) => {
    if (sub === "Show All") {
      searchParams.delete("sub");
    } else {
      searchParams.set("sub", sub);
    }
    setSearchParams(searchParams);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isFilterBottomSheetOpen, setIsFilterBottomSheetOpen] = useState(false);
  const [activeMobileFilterSection, setActiveMobileFilterSection] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const activeItemRef = useRef(null);

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Scroll active sidebar category into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
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

  // Fetch unique subcategories from backend when category changes
  useEffect(() => {
    if (!matchedCategory) {
      setSubcategories(["Show All"]);
      setHasLoadedSubcategories(false);
      return;
    }
    if (slug === "fresh-vegetables" || slug === "fresh-fruits") {
      setSubcategories([
        "Show All",
        "Fresh Vegetables",
        "Fresh Fruits",
        "Exotics",
        "Flowers and Leaves",
        "Frozen Veggie",
        "Hydroponic"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "dairy-bread-eggs" || slug === "dairy-bread-and-eggs") {
      setSubcategories([
        "Show All",
        "Milk",
        "Bread & Pav",
        "Eggs",
        "Curd & Yogurt",
        "Cheese & Butter",
        "Batter",
        "Paneer",
        "Lassi & Milkshakes"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "oils-and-ghee" || slug === "oil-ghee") {
      setSubcategories([
        "Show All",
        "Oil",
        "Ghee",
        "Salt, Sugar & Jaggery",
        "Tea, Coffee"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "chips-namkeens" || slug === "chips-and-namkeens") {
      setSubcategories([
        "Show All",
        "Chips",
        "Bhujiya & Mixtures",
        "Namkeens",
        "Nacjos",
        "Popcorn",
        "Papads"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "cold-drinks-juices" || slug === "cold-drinks-and-juices") {
      setSubcategories([
        "Show All",
        "Soft Drinks",
        "Fruit Juices",
        "Zero Sugar",
        "Energy Drinks",
        "Hydration",
        "Soda",
        "Water & Ice Cubes",
        "Cold Coffee"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "ice-cream" || slug === "ice-creams-frozen-desserts" || slug === "ice-creams-and-desserts") {
      setSubcategories([
        "Show All",
        "Tubs",
        "Sticks",
        "Cones",
        "Cakes",
        "Gourmet"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "meat-seafood" || slug === "meat-and-seafood") {
      setSubcategories([
        "Show All",
        "Chicken",
        "Fish",
        "Mutton",
        "Eggs"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "chocolates") {
      setSubcategories([
        "Show All",
        "Chocolates",
        "Chocolates Packs",
        "Chocolate Gift Pack",
        "Energy Bars"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "noodles-pasta-vermicelli" || slug === "noodles-and-pasta") {
      setSubcategories([
        "Show All",
        "Noodles",
        "Pasta",
        "Soup"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "paan-corner") {
      setSubcategories([
        "Show All",
        "Lighters",
        "No Smoking"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "bath-body" || slug === "bath-and-body") {
      setSubcategories([
        "Show All",
        "Bathing Soaps",
        "Shower Gel & Scrubs",
        "Handwash",
        "Bath Accessories",
        "Shampoo",
        "Conditioner",
        "Body Lotions & Oils",
        "Roll ons"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "hair-care" || slug === "hair") {
      setSubcategories([
        "Show All",
        "Shampoo",
        "Conditioner",
        "Hair color",
        "Hair Oils",
        "Hair Serums",
        "Hair Accessories"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "skin-care" || slug === "skincare") {
      setSubcategories([
        "Show All",
        "Sunscreen",
        "Face Cleaning",
        "Face Serum",
        "Lip & Eye",
        "Face Masks",
        "Men's Grooming",
        "Women's Grooming"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "makeup" || slug === "makeups") {
      setSubcategories([
        "Show All",
        "Lipsticks",
        "Foundations & Compact",
        "Blushes",
        "Eyeliners",
        "Nail Paints",
        "Accessories"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "feminine-hygiene") {
      setSubcategories([
        "Show All",
        "Sanitary Pads",
        "Tampons & Menstrual Cups",
        "Hair Removal",
        "Mom Hygiene"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    if (slug === "baby-care") {
      setSubcategories([
        "Show All",
        "Diaper & Wipes",
        "Baby Foods",
        "Baby Shampoo & Soaps",
        "Skin & Hair Care",
        "Feeding Essentials",
        "Baby Oral Care"
      ]);
      setHasLoadedSubcategories(true);
      return;
    }
    setHasLoadedSubcategories(false);
    const categoryName = matchedCategory.name;
    const url = `${window.API_BASE_URL}/api/subcategories?category=${encodeURIComponent(categoryName)}`;
    cachedFetch(url)
      .then(data => {
        const list = data?.subcategories || [];
        setSubcategories(["Show All", ...list]);
        setHasLoadedSubcategories(true);
      })
      .catch(err => {
        console.error("Error fetching subcategories:", err);
        setSubcategories(["Show All"]);
        setHasLoadedSubcategories(true);
      });
  }, [matchedCategory, slug]);

  // Helper fetch function supporting subcategory
  const fetchCategoryData = async (categoryName, pageNum, subCat, isBackground = false, signal = null) => {
    try {
      if (!isBackground) {
        if (pageNum > 1) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
      }

      let url = `${window.API_BASE_URL}/api/products?page=${pageNum}&limit=20`;
      if (categoryName === "Decor") {
        url = `${window.API_BASE_URL}/api/products?subCategory=${encodeURIComponent("Bouquet & Plants")}&page=${pageNum}&limit=50`;
      } else if (categoryName === "Beauty" || categoryName === "Kids") {
        url = `${window.API_BASE_URL}/api/products?page=${pageNum}&limit=300`;
      } else {
        const queryCat = categoryName === "Pharmacy" ? "Health and Pharma" : categoryName;
        url += `&category=${encodeURIComponent(queryCat)}`;
      }
      if (subCat && subCat !== "Show All") {
        url += `&subCategory=${encodeURIComponent(subCat)}`;
      }

      console.log("=== [FETCH CATEGORY DATA] ===", { categoryName, url });
      const isBlocking = false;
      const res = await apiFetch(url, { signal, blocking: isBlocking, minDelay: 700 });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      console.log("=== [FETCH CATEGORY DATA RESPONSE] ===", { length: data?.length });

      const enriched = (data || []).map(p => ({
        ...p,
        _classifiedCategory: canonicalCategory(classifyProduct(p))
      }));

      const cacheKey = `${slug}_${subCat || "Show All"}`;

      setLocalProducts(prev => {
        const nextProducts = pageNum === 1 ? enriched : [...prev, ...enriched];
        // Cache data
        categoryProductsCache[cacheKey] = {
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

  // Main fetch hook based on current category slug and active subcategory
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
    const cacheKey = `${slug}_${activeSubcategory}`;

    if (categoryProductsCache[cacheKey]) {
      const cached = categoryProductsCache[cacheKey];
      setLocalProducts(cached.products);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setLoading(false);

      // Refresh in background if stale (> 30s)
      if (Date.now() - cached.fetchedAt > 30000) {
        fetchCategoryData(categoryName, 1, activeSubcategory, true, signal);
      }
    } else {
      setLocalProducts([]);
      setLoading(true);
      fetchCategoryData(categoryName, 1, activeSubcategory, false, signal);
    }

    return () => {
      controller.abort();
    };
  }, [slug, localCategories, matchedCategory, activeSubcategory]);

  // Load More function
  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);

    const categoryName = matchedCategory ? matchedCategory.name : slug;
    fetchCategoryData(categoryName, nextPage, activeSubcategory);
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



  // Reset active subcategory and filters when slug changes
  useEffect(() => {
    searchParams.delete("sub");
    setSearchParams(searchParams, { replace: true });
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

  const subcategoryImageMap = useMemo(() => {
    const mapping = {};
    if (slug === "fresh-vegetables" || slug === "fresh-fruits") {
      mapping["Show All"] = "https://images.unsplash.com/photo-1610832958506-ee5633619141?w=100";
      mapping["Fresh Vegetables"] = "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=100";
      mapping["Fresh Fruits"] = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100";
      mapping["Exotics"] = "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100";
      mapping["Flowers and Leaves"] = "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=100";
      mapping["Frozen Veggie"] = "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100";
      mapping["Hydroponic"] = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=100";
      return mapping;
    }
    if (slug === "dairy-bread-eggs" || slug === "dairy-bread-and-eggs") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=100";
      mapping["Milk"] = "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100";
      mapping["Bread & Pav"] = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100";
      mapping["Eggs"] = "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=100";
      mapping["Curd & Yogurt"] = "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100";
      mapping["Cheese & Butter"] = "https://images.unsplash.com/photo-1486299267070-8382e214434b?w=100";
      mapping["Batter"] = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100";
      mapping["Paneer"] = "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=100";
      mapping["Lassi & Milkshakes"] = "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=100";
      return mapping;
    }
    if (slug === "oils-and-ghee" || slug === "oil-ghee") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100";
      mapping["Oil"] = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100";
      mapping["Ghee"] = "https://images.unsplash.com/photo-1589733901241-5de9086e4213?w=100";
      mapping["Salt, Sugar & Jaggery"] = "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=100";
      mapping["Tea, Coffee"] = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=100";
      return mapping;
    }
    if (slug === "chips-namkeens" || slug === "chips-and-namkeens") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100";
      mapping["Chips"] = "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100";
      mapping["Bhujiya & Mixtures"] = "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=100";
      mapping["Namkeens"] = "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=100";
      mapping["Nacjos"] = "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=100";
      mapping["Popcorn"] = "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=100";
      mapping["Papads"] = "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100";
      return mapping;
    }
    if (slug === "cold-drinks-juices" || slug === "cold-drinks-and-juices") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100";
      mapping["Soft Drinks"] = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100";
      mapping["Fruit Juices"] = "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100";
      mapping["Zero Sugar"] = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100";
      mapping["Energy Drinks"] = "https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?w=100";
      mapping["Hydration"] = "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=100";
      mapping["Soda"] = "https://images.unsplash.com/photo-1551630592-707a8e8b7c72?w=100";
      mapping["Water & Ice Cubes"] = "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100";
      mapping["Cold Coffee"] = "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100";
      return mapping;
    }
    if (slug === "ice-cream" || slug === "ice-creams-frozen-desserts" || slug === "ice-creams-and-desserts") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1560008511-11c63416e52d?w=100";
      mapping["Tubs"] = "https://images.unsplash.com/photo-1560008511-11c63416e52d?w=100";
      mapping["Sticks"] = "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=100";
      mapping["Cones"] = "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=100";
      mapping["Cakes"] = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100";
      mapping["Gourmet"] = "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=100";
      return mapping;
    }
    if (slug === "meat-seafood" || slug === "meat-and-seafood") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1587593817642-5799b159bc11?w=100";
      mapping["Chicken"] = "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100";
      mapping["Fish"] = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100";
      mapping["Mutton"] = "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=100";
      mapping["Eggs"] = "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=100";
      return mapping;
    }
    if (slug === "chocolates") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1549007994-cb92ca817bc6?w=100";
      mapping["Chocolates"] = "https://images.unsplash.com/photo-1549007994-cb92ca817bc6?w=100";
      mapping["Chocolates Packs"] = "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=100";
      mapping["Chocolate Gift Pack"] = "https://images.unsplash.com/photo-1548848221-0c2eaadfc706?w=100";
      mapping["Energy Bars"] = "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=100";
      return mapping;
    }
    if (slug === "noodles-pasta-vermicelli" || slug === "noodles-and-pasta") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100";
      mapping["Noodles"] = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100";
      mapping["Pasta"] = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100";
      mapping["Soup"] = "https://images.unsplash.com/photo-1547592180-85f173990554?w=100";
      return mapping;
    }
    if (slug === "paan-corner") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=100";
      mapping["Lighters"] = "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=100";
      mapping["No Smoking"] = "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?w=100";
      return mapping;
    }
    if (slug === "bath-body" || slug === "bath-and-body") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1546554137-f86b9593a222?w=100";
      mapping["Bathing Soaps"] = "https://images.unsplash.com/photo-1607006342446-267794270b20?w=100";
      mapping["Shower Gel & Scrubs"] = "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=100";
      mapping["Handwash"] = "https://images.unsplash.com/photo-1603064752734-4c48fee5f9cd?w=100";
      mapping["Bath Accessories"] = "https://images.unsplash.com/photo-1546554137-f86b9593a222?w=100";
      mapping["Shampoo"] = "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=100";
      mapping["Conditioner"] = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=100";
      mapping["Body Lotions & Oils"] = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100";
      mapping["Roll ons"] = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100";
      return mapping;
    }
    if (slug === "hair-care" || slug === "hair") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=100";
      mapping["Shampoo"] = "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=100";
      mapping["Conditioner"] = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=100";
      mapping["Hair color"] = "https://images.unsplash.com/photo-1605497746444-ac9dbd324ce9?w=100";
      mapping["Hair Oils"] = "https://images.unsplash.com/photo-1626015276681-2b44a3070027?w=100";
      mapping["Hair Serums"] = "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=100";
      mapping["Hair Accessories"] = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100";
      return mapping;
    }
    if (slug === "skin-care" || slug === "skincare") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100";
      mapping["Sunscreen"] = "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=100";
      mapping["Face Cleaning"] = "https://images.unsplash.com/photo-1556228720-1243a789d262?w=100";
      mapping["Face Serum"] = "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=100";
      mapping["Lip & Eye"] = "https://images.unsplash.com/photo-1617897903246-719242758050?w=100";
      mapping["Face Masks"] = "https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=100";
      mapping["Men's Grooming"] = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100";
      mapping["Women's Grooming"] = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100";
      return mapping;
    }
    if (slug === "makeup" || slug === "makeups") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100";
      mapping["Lipsticks"] = "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=100";
      mapping["Foundations & Compact"] = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100";
      mapping["Blushes"] = "https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=100";
      mapping["Eyeliners"] = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100";
      mapping["Nail Paints"] = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=100";
      mapping["Accessories"] = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100";
      return mapping;
    }
    if (slug === "feminine-hygiene") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100";
      mapping["Sanitary Pads"] = "https://images.unsplash.com/photo-1546554137-f86b9593a222?w=100";
      mapping["Tampons & Menstrual Cups"] = "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100";
      mapping["Hair Removal"] = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100";
      mapping["Mom Hygiene"] = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100";
      return mapping;
    }
    if (slug === "baby-care") {
      mapping["Show All"] = matchedCategory?.image || matchedCategory?.icon || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100";
      mapping["Diaper & Wipes"] = "https://images.unsplash.com/photo-1610389021262-d278ab6a30d5?w=100";
      mapping["Baby Foods"] = "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=100";
      mapping["Baby Shampoo & Soaps"] = "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=100";
      mapping["Skin & Hair Care"] = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100";
      mapping["Feeding Essentials"] = "https://images.unsplash.com/photo-1522850959076-58d7c04db404?w=100";
      mapping["Baby Oral Care"] = "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=100";
      return mapping;
    }
    subcategories.forEach((subName) => {
      if (subName === "Show All") {
        mapping[subName] = matchedCategory?.image || matchedCategory?.icon;
        return;
      }
      const firstProd = localProducts.find(p =>
        getSubcategoryMatch(p.subCategory, subName) ||
        getSubcategoryMatch(p.subcategory, subName)
      );
      if (firstProd?.image) {
        mapping[subName] = firstProd.image;
      } else {
        mapping[subName] = matchedCategory?.image || matchedCategory?.icon;
      }
    });
    return mapping;
  }, [subcategories, localProducts, matchedCategory, slug]);

  // Filter category products based on dynamic subcategory, search query, and category specific checkbox filters
  const filteredCategoryProducts = useMemo(() => {
    if (!matchedCategory) return [];
    const targetCanonical = canonicalCategory(matchedCategory.name);

    // 1. Get all products belonging to this category
    let list = [];
    if (slug === "fresh-vegetables" || slug === "fresh-fruits") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Fresh Vegetables" || classified === "Fresh Fruits" ||
          canonicalCategory(p.category) === "Fresh Vegetables" || canonicalCategory(p.category) === "Fresh Fruits" ||
          canonicalCategory(p.category) === "The Veggie Store" || canonicalCategory(p.category) === "The Fruit Store";
      });
    } else if (slug === "oils-and-ghee" || slug === "oil-ghee") {
      list = localProducts.filter(p => {
        const cat = (p.category || "").toLowerCase();
        const sub = (p.subCategory || p.subcategory || "").toLowerCase();
        return cat.includes("oil") || cat.includes("ghee") || cat.includes("masala") || cat.includes("tea") || cat.includes("coffee") || cat.includes("drink") ||
          sub.includes("oil") || sub.includes("ghee") || sub.includes("masala") || sub.includes("salt") || sub.includes("sugar") || sub.includes("jaggery") || sub.includes("tea") || sub.includes("coffee");
      });
    } else if (slug === "chips-namkeens" || slug === "chips-and-namkeens") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Chips and Namkeens" || canonicalCategory(p.category) === "Chips and Namkeens";
      });
    } else if (slug === "cold-drinks-juices" || slug === "cold-drinks-and-juices") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Beverages" || canonicalCategory(p.category) === "Beverages";
      });
    } else if (slug === "ice-cream" || slug === "ice-creams-frozen-desserts" || slug === "ice-creams-and-desserts") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Ice Creams & Desserts" || canonicalCategory(p.category) === "Ice Creams & Desserts";
      });
    } else if (slug === "meat-seafood" || slug === "meat-and-seafood") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Meat and Seafood" || canonicalCategory(p.category) === "Meat and Seafood";
      });
    } else if (slug === "chocolates") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Chocolates" || canonicalCategory(p.category) === "Chocolates";
      });
    } else if (slug === "noodles-pasta-vermicelli" || slug === "noodles-and-pasta") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Noodles & Pasta" || canonicalCategory(p.category) === "Noodles & Pasta";
      });
    } else if (slug === "paan-corner") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Pan Centre" || canonicalCategory(p.category) === "Pan Centre";
      });
    } else if (slug === "bath-body" || slug === "bath-and-body") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Bath and Body" || canonicalCategory(p.category) === "Bath and Body";
      });
    } else if (slug === "hair-care" || slug === "hair") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Hair Care" || canonicalCategory(p.category) === "Hair Care";
      });
    } else if (slug === "skin-care" || slug === "skincare") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Skincare" || canonicalCategory(p.category) === "Skincare";
      });
    } else if (slug === "makeup" || slug === "makeups") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Makeups" || canonicalCategory(p.category) === "Makeups";
      });
    } else if (slug === "feminine-hygiene") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Female Hygiene" || canonicalCategory(p.category) === "Female Hygiene";
      });
    } else if (slug === "baby-care") {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === "Baby Care" || canonicalCategory(p.category) === "Baby Care";
      });
    } else {
      list = localProducts.filter(p => {
        const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
        return classified === targetCanonical ||
          canonicalCategory(p.category) === targetCanonical;
      });
    }

    // 2. Filter by active left sidebar subcategory
    if (activeSubcategory !== "Show All") {
      if (slug === "fresh-vegetables" || slug === "fresh-fruits") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("exotic")) return "exotic";
          if (sub.includes("pooja") || sub.includes("festive") || sub.includes("bouquet") || sub.includes("plants")) return "flower-leaf";
          if (sub.includes("frozen")) return "frozen";
          if (sub.includes("hydroponic")) return "hydroponic";
          if (sub.includes("fresh vegetables") || sub.includes("leafy") || sub.includes("seasonings") || sub.includes("certified organics")) return "fresh-veg";
          if (sub.includes("fresh fruits") || sub.includes("mango") || sub.includes("seasonal")) return "fresh-fruit";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const isHydroponic = (prod) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === "hydroponic";
          if (hasTag(prod, "hydroponic") || hasTag(prod, "hydroponically")) return true;
          const name = (prod.name || "").toLowerCase();
          return name.includes("hydroponic") || name.includes("hydroponically");
        };

        const isFrozen = (prod) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === "frozen";
          if (hasTag(prod, "frozen")) return true;
          const name = (prod.name || "").toLowerCase();
          return name.includes("frozen");
        };

        const isFlowerOrLeaf = (prod) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === "flower-leaf";
          if (hasTag(prod, "pooja") || hasTag(prod, "festive") || hasTag(prod, "flowers") || hasTag(prod, "garland") || hasTag(prod, "leaves")) return true;
          const name = (prod.name || "").toLowerCase();
          if (["flower", "gajra", "garland", "patta", "tulsi", "neem", "durva", "festive"].some(k => name.includes(k))) return true;
          if (name.includes("leaf") && (name.includes("betel") || name.includes("banana") || name.includes("mango") || name.includes("curry") || name.includes("neem") || name.includes("bel"))) return true;
          return false;
        };

        const isExotic = (prod) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === "exotic";
          if (hasTag(prod, "exotic") || hasTag(prod, "exotics")) return true;
          const name = (prod.name || "").toLowerCase();
          if (name.includes("exotic")) return true;
          if (["avocado", "kiwi", "blueberries", "blackberry", "raspberries", "strawberry", "berries", "berry", "dragonfruit", "passionfruit", "asparagus", "broccoli", "mushroom", "zucchini"].some(k => name.includes(k))) {
            return true;
          }
          return false;
        };

        const matchesType = (prod, store) => {
          const cat = (prod.category || "").toLowerCase();
          if (store === "veggies") return cat.includes("veggie");
          if (store === "fruits") return cat.includes("fruit");
          return false;
        };

        if (activeSubcategory === "Fresh Vegetables") {
          list = list.filter(p => matchesType(p, "veggies") && !isHydroponic(p) && !isFrozen(p) && !isFlowerOrLeaf(p) && !isExotic(p));
        } else if (activeSubcategory === "Fresh Fruits") {
          list = list.filter(p => matchesType(p, "fruits") && !isFrozen(p) && !isFlowerOrLeaf(p) && !isExotic(p));
        } else if (activeSubcategory === "Exotics") {
          list = list.filter(p => isExotic(p));
        } else if (activeSubcategory === "Flowers and Leaves") {
          list = list.filter(p => isFlowerOrLeaf(p));
        } else if (activeSubcategory === "Frozen Veggie") {
          list = list.filter(p => isFrozen(p));
        } else if (activeSubcategory === "Hydroponic") {
          list = list.filter(p => isHydroponic(p));
        }
      } else if (slug === "dairy-bread-eggs" || slug === "dairy-bread-and-eggs") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("milkshake") || sub.includes("lassi") || sub.includes("buttermilk")) return "lassi-milkshakes";
          if (sub.includes("paneer") || sub.includes("tofu")) return "paneer";
          if (sub.includes("batter") || sub.includes("chutney")) return "batter";
          if (sub.includes("cheese") || sub.includes("butter") || sub.includes("spread")) return "cheese-butter";
          if (sub.includes("curd") || sub.includes("yogurt") || sub.includes("shrikhand")) return "curd-yogurt";
          if (sub.includes("egg")) return "eggs";
          if (sub.includes("bread") || sub.includes("pav") || sub.includes("bun") || sub.includes("toast")) return "bread-pav";
          if (sub.includes("milk") || sub.includes("dairy")) return "milk";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchDairySub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "lassi-milkshakes") return name.includes("lassi") || name.includes("milkshake") || name.includes("buttermilk") || name.includes("shakes");
          if (subKey === "paneer") return name.includes("paneer") || name.includes("tofu");
          if (subKey === "batter") return name.includes("batter") || name.includes("idli") || name.includes("dosa");
          if (subKey === "cheese-butter") return name.includes("cheese") || name.includes("butter") || name.includes("slice") || name.includes("spread");
          if (subKey === "curd-yogurt") return name.includes("curd") || name.includes("yogurt") || name.includes("yoghurt") || name.includes("dahi");
          if (subKey === "eggs") return name.includes("egg");
          if (subKey === "bread-pav") return name.includes("bread") || name.includes("pav") || name.includes("bun") || name.includes("roti") || name.includes("toast") || name.includes("pav") || name.includes("rusk");
          if (subKey === "milk") return name.includes("milk") || name.includes("cow") || name.includes("buffalo") || name.includes("tetra");
          return false;
        };

        if (activeSubcategory === "Milk") {
          list = list.filter(p => matchDairySub(p, "milk"));
        } else if (activeSubcategory === "Bread & Pav") {
          list = list.filter(p => matchDairySub(p, "bread-pav"));
        } else if (activeSubcategory === "Eggs") {
          list = list.filter(p => matchDairySub(p, "eggs"));
        } else if (activeSubcategory === "Curd & Yogurt") {
          list = list.filter(p => matchDairySub(p, "curd-yogurt"));
        } else if (activeSubcategory === "Cheese & Butter") {
          list = list.filter(p => matchDairySub(p, "cheese-butter"));
        } else if (activeSubcategory === "Batter") {
          list = list.filter(p => matchDairySub(p, "batter"));
        } else if (activeSubcategory === "Paneer") {
          list = list.filter(p => matchDairySub(p, "paneer"));
        } else if (activeSubcategory === "Lassi & Milkshakes") {
          list = list.filter(p => matchDairySub(p, "lassi-milkshakes"));
        }
      } else if (slug === "oils-and-ghee" || slug === "oil-ghee") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("tea") || sub.includes("coffee") || sub.includes("beverage")) return "tea-coffee";
          if (sub.includes("salt") || sub.includes("sugar") || sub.includes("jaggery")) return "salt-sugar-jaggery";
          if (sub.includes("ghee")) return "ghee";
          if (sub.includes("oil")) return "oil";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchOilSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "tea-coffee") return name.includes("tea") || name.includes("coffee") || name.includes("greentea") || name.includes("bru") || name.includes("nescafe") || name.includes("tata tea") || name.includes("red label");
          if (subKey === "salt-sugar-jaggery") return name.includes("salt") || name.includes("sugar") || name.includes("jaggery") || name.includes("gud");
          if (subKey === "ghee") return name.includes("ghee");
          if (subKey === "oil") return name.includes("oil") || name.includes("mustard") || name.includes("sunflower") || name.includes("olive") || name.includes("coconut oil") || name.includes("groundnut");
          return false;
        };

        if (activeSubcategory === "Oil") {
          list = list.filter(p => matchOilSub(p, "oil"));
        } else if (activeSubcategory === "Ghee") {
          list = list.filter(p => matchOilSub(p, "ghee"));
        } else if (activeSubcategory === "Salt, Sugar & Jaggery") {
          list = list.filter(p => matchOilSub(p, "salt-sugar-jaggery"));
        } else if (activeSubcategory === "Tea, Coffee") {
          list = list.filter(p => matchOilSub(p, "tea-coffee"));
        }
      } else if (slug === "chips-namkeens" || slug === "chips-and-namkeens") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("papad")) return "papads";
          if (sub.includes("popcorn")) return "popcorn";
          if (sub.includes("nacho") || sub.includes("nacjo")) return "nachos";
          if (sub.includes("namkeen") || sub.includes("snack")) return "namkeens";
          if (sub.includes("bhujiya") || sub.includes("mixture") || sub.includes("sev")) return "bhujiya-mixtures";
          if (sub.includes("chip") || sub.includes("crisps") || sub.includes("wafer")) return "chips";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchChipsSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "papads") return name.includes("papad") || name.includes("pappadum");
          if (subKey === "popcorn") return name.includes("popcorn") || name.includes("pop corn");
          if (subKey === "nachos") return name.includes("nacho") || name.includes("nacjo") || name.includes("tortilla");
          if (subKey === "namkeens") return name.includes("namkeen") || name.includes("snack") || name.includes("gathiya") || name.includes("dal moth") || name.includes("chanachur");
          if (subKey === "bhujiya-mixtures") return name.includes("bhujiya") || name.includes("mixture") || name.includes("sev");
          if (subKey === "chips") return name.includes("chip") || name.includes("crisp") || name.includes("wafer") || name.includes("lay's") || name.includes("lays") || name.includes("bingo") || name.includes("kurkure");
          return false;
        };

        if (activeSubcategory === "Chips") {
          list = list.filter(p => matchChipsSub(p, "chips"));
        } else if (activeSubcategory === "Bhujiya & Mixtures") {
          list = list.filter(p => matchChipsSub(p, "bhujiya-mixtures"));
        } else if (activeSubcategory === "Namkeens") {
          list = list.filter(p => matchChipsSub(p, "namkeens"));
        } else if (activeSubcategory === "Nacjos") {
          list = list.filter(p => matchChipsSub(p, "nachos"));
        } else if (activeSubcategory === "Popcorn") {
          list = list.filter(p => matchChipsSub(p, "popcorn"));
        } else if (activeSubcategory === "Papads") {
          list = list.filter(p => matchChipsSub(p, "papads"));
        }
      } else if (slug === "cold-drinks-juices" || slug === "cold-drinks-and-juices") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("coffee") || sub.includes("cafe")) return "cold-coffee";
          if (sub.includes("ice") || sub.includes("cube") || sub.includes("water") || sub.includes("aqua")) return "water-ice";
          if (sub.includes("soda") || sub.includes("tonic")) return "soda";
          if (sub.includes("hydration") || sub.includes("electrolyte") || sub.includes("coconut") || sub.includes("ors") || sub.includes("sport")) return "hydration";
          if (sub.includes("energy") || sub.includes("red bull") || sub.includes("monster")) return "energy-drinks";
          if (sub.includes("zero") || sub.includes("sugar free") || sub.includes("diet") || sub.includes("lite") || sub.includes("no sugar")) return "zero-sugar";
          if (sub.includes("juice") || sub.includes("nectar") || sub.includes("pulp")) return "fruit-juices";
          if (sub.includes("soft") || sub.includes("cola") || sub.includes("carbonated") || sub.includes("drink")) return "soft-drinks";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchDrinksSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "cold-coffee") return name.includes("coffee") || name.includes("frappe") || name.includes("cappuccino") || name.includes("latte") || name.includes("nescafe") || name.includes("amul kool");
          if (subKey === "water-ice") return name.includes("water") || name.includes("ice cube") || name.includes("bisleri") || name.includes("aquafina") || name.includes("kinley") || name.includes("vedica") || name.includes("himalayan");
          if (subKey === "soda") return name.includes("soda") || name.includes("schweppes") || name.includes("tonic") || name.includes("ginger ale");
          if (subKey === "hydration") return name.includes("hydration") || name.includes("coconut") || name.includes("nariyal") || name.includes("electrolyte") || name.includes("gatorade") || name.includes("ors") || name.includes("glucon");
          if (subKey === "energy-drinks") return name.includes("energy") || name.includes("red bull") || name.includes("redbull") || name.includes("monster") || name.includes("sting");
          if (subKey === "zero-sugar") return name.includes("zero") || name.includes("diet") || name.includes("sugar free") || name.includes("no sugar") || name.includes("sugar-free") || name.includes("coke zero") || name.includes("diet coke");
          if (subKey === "fruit-juices") return name.includes("juice") || name.includes("real") || name.includes("tropicana") || name.includes("b-natural") || name.includes("paper boat");
          if (subKey === "soft-drinks") return name.includes("coke") || name.includes("pepsi") || name.includes("sprite") || name.includes("fanta") || name.includes("thumbs up") || name.includes("thums up") || name.includes("limca") || name.includes("mountain dew") || name.includes("7up") || name.includes("drink") || name.includes("cola");
          return false;
        };

        if (activeSubcategory === "Soft Drinks") {
          list = list.filter(p => matchDrinksSub(p, "soft-drinks"));
        } else if (activeSubcategory === "Fruit Juices") {
          list = list.filter(p => matchDrinksSub(p, "fruit-juices"));
        } else if (activeSubcategory === "Zero Sugar") {
          list = list.filter(p => matchDrinksSub(p, "zero-sugar"));
        } else if (activeSubcategory === "Energy Drinks") {
          list = list.filter(p => matchDrinksSub(p, "energy-drinks"));
        } else if (activeSubcategory === "Hydration") {
          list = list.filter(p => matchDrinksSub(p, "hydration"));
        } else if (activeSubcategory === "Soda") {
          list = list.filter(p => matchDrinksSub(p, "soda"));
        } else if (activeSubcategory === "Water & Ice Cubes") {
          list = list.filter(p => matchDrinksSub(p, "water-ice"));
        } else if (activeSubcategory === "Cold Coffee") {
          list = list.filter(p => matchDrinksSub(p, "cold-coffee"));
        }
      } else if (slug === "ice-cream" || slug === "ice-creams-frozen-desserts" || slug === "ice-creams-and-desserts") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("gourmet") || sub.includes("premium") || sub.includes("artisan") || sub.includes("belgian")) return "gourmet";
          if (sub.includes("cake") || sub.includes("dessert") || sub.includes("party")) return "cakes";
          if (sub.includes("cone") || sub.includes("cornetto")) return "cones";
          if (sub.includes("stick") || sub.includes("bar") || sub.includes("kulfi")) return "sticks";
          if (sub.includes("tub") || sub.includes("pack") || sub.includes("family")) return "tubs";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchIceCreamSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "gourmet") return name.includes("gourmet") || name.includes("premium") || name.includes("artisan") || name.includes("belgian") || name.includes("london dairy") || name.includes("haagen") || name.includes("movenpick");
          if (subKey === "cakes") return name.includes("cake") || name.includes("slice") || name.includes("gateau") || name.includes("pastry");
          if (subKey === "cones") return name.includes("cone") || name.includes("cornetto") || name.includes("waffle");
          if (subKey === "sticks") return name.includes("stick") || name.includes("bar") || name.includes("kulfi") || name.includes("pop") || name.includes("lollipop") || name.includes("chocobar");
          if (subKey === "tubs") return name.includes("tub") || name.includes("family pack") || name.includes("cup") || name.includes("scoop") || name.includes("brick");
          return false;
        };

        if (activeSubcategory === "Tubs") {
          list = list.filter(p => matchIceCreamSub(p, "tubs"));
        } else if (activeSubcategory === "Sticks") {
          list = list.filter(p => matchIceCreamSub(p, "sticks"));
        } else if (activeSubcategory === "Cones") {
          list = list.filter(p => matchIceCreamSub(p, "cones"));
        } else if (activeSubcategory === "Cakes") {
          list = list.filter(p => matchIceCreamSub(p, "cakes"));
        } else if (activeSubcategory === "Gourmet") {
          list = list.filter(p => matchIceCreamSub(p, "gourmet"));
        }
      } else if (slug === "meat-seafood" || slug === "meat-and-seafood") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("egg")) return "eggs";
          if (sub.includes("mutton") || sub.includes("lamb") || sub.includes("goat")) return "mutton";
          if (sub.includes("fish") || sub.includes("seafood") || sub.includes("prawn") || sub.includes("crab")) return "fish";
          if (sub.includes("chicken") || sub.includes("poultry")) return "chicken";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchMeatSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "eggs") return name.includes("egg");
          if (subKey === "mutton") return name.includes("mutton") || name.includes("lamb") || name.includes("goat") || name.includes("keema") || name.includes("curry cut");
          if (subKey === "fish") return name.includes("fish") || name.includes("seafood") || name.includes("prawn") || name.includes("shrimp") || name.includes("crab") || name.includes("salmon") || name.includes("surmai") || name.includes("pomfret");
          if (subKey === "chicken") return name.includes("chicken") || name.includes("breast") || name.includes("lollipop") || name.includes("wings");
          return false;
        };

        if (activeSubcategory === "Chicken") {
          list = list.filter(p => matchMeatSub(p, "chicken"));
        } else if (activeSubcategory === "Fish") {
          list = list.filter(p => matchMeatSub(p, "fish"));
        } else if (activeSubcategory === "Mutton") {
          list = list.filter(p => matchMeatSub(p, "mutton"));
        } else if (activeSubcategory === "Eggs") {
          list = list.filter(p => matchMeatSub(p, "eggs"));
        }
      } else if (slug === "chocolates") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("energy") || sub.includes("bar") || sub.includes("granola") || sub.includes("protein")) return "energy-bars";
          if (sub.includes("gift") || sub.includes("box") || sub.includes("celebration")) return "gift-pack";
          if (sub.includes("pack") || sub.includes("multi") || sub.includes("bag")) return "packs";
          if (sub.includes("chocolate") || sub.includes("cadbury") || sub.includes("nestle") || sub.includes("dairy milk")) return "chocolates";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchChocSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "energy-bars") return name.includes("energy bar") || name.includes("protein bar") || name.includes("granola bar") || name.includes("snicker") || name.includes("yoga bar") || name.includes("yogabar") || name.includes("bar");
          if (subKey === "gift-pack") return name.includes("gift") || name.includes("box") || name.includes("celebrations") || name.includes("assorted") || name.includes("hamper");
          if (subKey === "packs") return name.includes("pack") || name.includes("share bag") || name.includes("multi") || name.includes("home pack") || name.includes("bites");
          if (subKey === "chocolates") return name.includes("chocolate") || name.includes("dairy milk") || name.includes("silk") || name.includes("kitkat") || name.includes("kit kat") || name.includes("munch") || name.includes("milkybar") || name.includes("milky bar") || name.includes("ferrero") || name.includes("mars") || name.includes("twix") || name.includes("toblerone") || name.includes("dark");
          return false;
        };

        if (activeSubcategory === "Chocolates") {
          list = list.filter(p => matchChocSub(p, "chocolates"));
        } else if (activeSubcategory === "Chocolates Packs") {
          list = list.filter(p => matchChocSub(p, "packs"));
        } else if (activeSubcategory === "Chocolate Gift Pack") {
          list = list.filter(p => matchChocSub(p, "gift-pack"));
        } else if (activeSubcategory === "Energy Bars") {
          list = list.filter(p => matchChocSub(p, "energy-bars"));
        }
      } else if (slug === "noodles-pasta-vermicelli" || slug === "noodles-and-pasta") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("soup") || sub.includes("shorba") || sub.includes("broth")) return "soup";
          if (sub.includes("pasta") || sub.includes("macaroni") || sub.includes("spaghetti") || sub.includes("vermicelli")) return "pasta";
          if (sub.includes("noodle") || sub.includes("ramen") || sub.includes("chowmein") || sub.includes("maggi")) return "noodles";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchNoodleSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "soup") return name.includes("soup") || name.includes("shorba") || name.includes("knorr") || name.includes("ching's secret") || name.includes("chings");
          if (subKey === "pasta") return name.includes("pasta") || name.includes("macaroni") || name.includes("spaghetti") || name.includes("vermicelli") || name.includes("seviyan") || name.includes("penne") || name.includes("fusilli");
          if (subKey === "noodles") return name.includes("noodle") || name.includes("ramen") || name.includes("maggi") || name.includes("yippee") || name.includes("wai wai") || name.includes("koka") || name.includes("chowmein");
          return false;
        };

        if (activeSubcategory === "Noodles") {
          list = list.filter(p => matchNoodleSub(p, "noodles"));
        } else if (activeSubcategory === "Pasta") {
          list = list.filter(p => matchNoodleSub(p, "pasta"));
        } else if (activeSubcategory === "Soup") {
          list = list.filter(p => matchNoodleSub(p, "soup"));
        }
      } else if (slug === "paan-corner") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("no smoking") || sub.includes("smoke") || sub.includes("nicotine") || sub.includes("gum") || sub.includes("lozenge")) return "no-smoking";
          if (sub.includes("lighter") || sub.includes("matchbox") || sub.includes("flint")) return "lighters";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchPaanSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "no-smoking") return name.includes("no smoking") || name.includes("nicotine") || name.includes("nicotex") || name.includes("gum") || name.includes("lozenge") || name.includes("smoking cessation");
          if (subKey === "lighters") return name.includes("lighter") || name.includes("matchbox") || name.includes("lighter fuel") || name.includes("zippo") || name.includes("cricket");
          return false;
        };

        if (activeSubcategory === "Lighters") {
          list = list.filter(p => matchPaanSub(p, "lighters"));
        } else if (activeSubcategory === "No Smoking") {
          list = list.filter(p => matchPaanSub(p, "no-smoking"));
        }
      } else if (slug === "bath-body" || slug === "bath-and-body") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("roll on") || sub.includes("roll-on") || sub.includes("deo") || sub.includes("deodorant")) return "roll-ons";
          if (sub.includes("lotion") || sub.includes("oil") || sub.includes("cream")) return "lotions-oils";
          if (sub.includes("conditioner")) return "conditioner";
          if (sub.includes("shampoo")) return "shampoo";
          if (sub.includes("accessory") || sub.includes("loofah") || sub.includes("scrubber") || sub.includes("sponge")) return "accessories";
          if (sub.includes("handwash") || sub.includes("hand wash") || sub.includes("hand sanitiser") || sub.includes("sanitizer")) return "handwash";
          if (sub.includes("shower gel") || sub.includes("scrub") || sub.includes("body wash")) return "gel-scrubs";
          if (sub.includes("soap") || sub.includes("bathing bar")) return "soaps";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchBathSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "roll-ons") return name.includes("roll on") || name.includes("roll-on") || name.includes("deodorant") || name.includes("deo") || name.includes("nivea roll");
          if (subKey === "lotions-oils") return name.includes("lotion") || name.includes("body oil") || name.includes("massage oil") || name.includes("moisturizer") || name.includes("vaseline") || name.includes("nivea body");
          if (subKey === "conditioner") return name.includes("conditioner") || name.includes("hair conditioner");
          if (subKey === "shampoo") return name.includes("shampoo") || name.includes("head & shoulders") || name.includes("pantene") || name.includes("dove shampoo");
          if (subKey === "accessories") return name.includes("loofah") || name.includes("scrubber") || name.includes("pumice") || name.includes("bath accessory") || name.includes("sponge");
          if (subKey === "handwash") return name.includes("handwash") || name.includes("hand wash") || name.includes("dettol") || name.includes("lifebuoy") || name.includes("savlon");
          if (subKey === "gel-scrubs") return name.includes("shower gel") || name.includes("body wash") || name.includes("scrub") || name.includes("exfoliator") || name.includes("fiama");
          if (subKey === "soaps") return name.includes("soap") || name.includes("bathing bar") || name.includes("lux") || name.includes("dove") || name.includes("pears") || name.includes("santoor");
          return false;
        };

        if (activeSubcategory === "Bathing Soaps") {
          list = list.filter(p => matchBathSub(p, "soaps"));
        } else if (activeSubcategory === "Shower Gel & Scrubs") {
          list = list.filter(p => matchBathSub(p, "gel-scrubs"));
        } else if (activeSubcategory === "Handwash") {
          list = list.filter(p => matchBathSub(p, "handwash"));
        } else if (activeSubcategory === "Bath Accessories") {
          list = list.filter(p => matchBathSub(p, "accessories"));
        } else if (activeSubcategory === "Shampoo") {
          list = list.filter(p => matchBathSub(p, "shampoo"));
        } else if (activeSubcategory === "Conditioner") {
          list = list.filter(p => matchBathSub(p, "conditioner"));
        } else if (activeSubcategory === "Body Lotions & Oils") {
          list = list.filter(p => matchBathSub(p, "lotions-oils"));
        } else if (activeSubcategory === "Roll ons") {
          list = list.filter(p => matchBathSub(p, "roll-ons"));
        }
      } else if (slug === "hair-care" || slug === "hair") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("accessory") || sub.includes("clip") || sub.includes("band") || sub.includes("brush") || sub.includes("comb")) return "accessories";
          if (sub.includes("serum") || sub.includes("gel") || sub.includes("wax") || sub.includes("spray")) return "serums";
          if (sub.includes("oil")) return "oils";
          if (sub.includes("color") || sub.includes("colour") || sub.includes("dye") || sub.includes("henna") || sub.includes("mehendi")) return "color";
          if (sub.includes("conditioner")) return "conditioner";
          if (sub.includes("shampoo")) return "shampoo";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchHairSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "accessories") return name.includes("clip") || name.includes("rubber band") || name.includes("comb") || name.includes("hair brush") || name.includes("hair band") || name.includes("scrunchie");
          if (subKey === "serums") return name.includes("serum") || name.includes("hair gel") || name.includes("hair wax") || name.includes("hair spray") || name.includes("livon") || name.includes("streax");
          if (subKey === "oils") return name.includes("hair oil") || name.includes("coconut oil") || name.includes("almond oil") || name.includes("amla oil") || name.includes("oil") || name.includes("bajaj") || name.includes("parachute") || name.includes("dabur amla");
          if (subKey === "color") return name.includes("color") || name.includes("colour") || name.includes("dye") || name.includes("henna") || name.includes("mehendi") || name.includes("loreal") || name.includes("garnier") || name.includes("godrej");
          if (subKey === "conditioner") return name.includes("conditioner") || name.includes("hair conditioner");
          if (subKey === "shampoo") return name.includes("shampoo") || name.includes("head & shoulders") || name.includes("pantene") || name.includes("dove shampoo");
          return false;
        };

        if (activeSubcategory === "Shampoo") {
          list = list.filter(p => matchHairSub(p, "shampoo"));
        } else if (activeSubcategory === "Conditioner" || activeSubcategory === "Conditoner") {
          list = list.filter(p => matchHairSub(p, "conditioner"));
        } else if (activeSubcategory === "Hair color") {
          list = list.filter(p => matchHairSub(p, "color"));
        } else if (activeSubcategory === "Hair Oils") {
          list = list.filter(p => matchHairSub(p, "oils"));
        } else if (activeSubcategory === "Hair Serums") {
          list = list.filter(p => matchHairSub(p, "serums"));
        } else if (activeSubcategory === "Hair Accessories") {
          list = list.filter(p => matchHairSub(p, "accessories"));
        }
      } else if (slug === "skin-care" || slug === "skincare") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("women") || sub.includes("female") || sub.includes("epilator") || sub.includes("wax") || sub.includes("razor women")) return "women-grooming";
          if (sub.includes("men") || sub.includes("shave") || sub.includes("beard") || sub.includes("razor men") || sub.includes("aftershave")) return "men-grooming";
          if (sub.includes("mask") || sub.includes("peel") || sub.includes("sheet")) return "masks";
          if (sub.includes("lip") || sub.includes("eye") || sub.includes("balm") || sub.includes("under eye")) return "lip-eye";
          if (sub.includes("serum") || sub.includes("essence") || sub.includes("ampoule")) return "serums";
          if (sub.includes("clean") || sub.includes("wash") || sub.includes("scrub") || sub.includes("cleanser") || sub.includes("toner") || sub.includes("makeup remover")) return "cleaning";
          if (sub.includes("sunscreen") || sub.includes("sun block") || sub.includes("spf")) return "sunscreen";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchSkinSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "women-grooming") return name.includes("women") || name.includes("female") || name.includes("epilator") || name.includes("wax strip") || name.includes("hair removal cream") || name.includes("razor for women");
          if (subKey === "men-grooming") return name.includes("men") || name.includes("shaving") || name.includes("beard") || name.includes("razor for men") || name.includes("aftershave") || name.includes("foam") || name.includes("gel");
          if (subKey === "masks") return name.includes("mask") || name.includes("peel off") || name.includes("sheet mask") || name.includes("clay mask");
          if (subKey === "lip-eye") return name.includes("lip") || name.includes("eye") || name.includes("balm") || name.includes("under eye") || name.includes("kajal") || name.includes("mascara");
          if (subKey === "serums") return name.includes("serum") || name.includes("essence") || name.includes("salicylic") || name.includes("niacinamide") || name.includes("vitamin c");
          if (subKey === "cleaning") return name.includes("clean") || name.includes("wash") || name.includes("scrub") || name.includes("cleanser") || name.includes("toner") || name.includes("makeup remover") || name.includes("facewash") || name.includes("face wash");
          if (subKey === "sunscreen") return name.includes("sunscreen") || name.includes("sun block") || name.includes("spf") || name.includes("sunscreen lotion");
          return false;
        };

        if (activeSubcategory === "Sunscreen") {
          list = list.filter(p => matchSkinSub(p, "sunscreen"));
        } else if (activeSubcategory === "Face Cleaning") {
          list = list.filter(p => matchSkinSub(p, "cleaning"));
        } else if (activeSubcategory === "Face Serum") {
          list = list.filter(p => matchSkinSub(p, "serums"));
        } else if (activeSubcategory === "Lip & Eye") {
          list = list.filter(p => matchSkinSub(p, "lip-eye"));
        } else if (activeSubcategory === "Face Masks") {
          list = list.filter(p => matchSkinSub(p, "masks"));
        } else if (activeSubcategory === "Men's Grooming") {
          list = list.filter(p => matchSkinSub(p, "men-grooming"));
        } else if (activeSubcategory === "Women's Grooming") {
          list = list.filter(p => matchSkinSub(p, "women-grooming"));
        }
      } else if (slug === "makeup" || slug === "makeups") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("accessory") || sub.includes("brush") || sub.includes("blender") || sub.includes("sponge") || sub.includes("curler")) return "accessories";
          if (sub.includes("nail") || sub.includes("polish") || sub.includes("paint") || sub.includes("remover")) return "nail-paints";
          if (sub.includes("eye") || sub.includes("liner") || sub.includes("kajal") || sub.includes("mascara") || sub.includes("shadow")) return "eyeliners";
          if (sub.includes("blush") || sub.includes("highlighter") || sub.includes("bronzer")) return "blushes";
          if (sub.includes("foundation") || sub.includes("compact") || sub.includes("concealer") || sub.includes("bb cream") || sub.includes("cc cream") || sub.includes("powder")) return "foundation";
          if (sub.includes("lip") || sub.includes("lipstick") || sub.includes("gloss") || sub.includes("liner")) return "lipsticks";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchMakeupSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "accessories") return name.includes("brush") || name.includes("blender") || name.includes("sponge") || name.includes("curler") || name.includes("makeup tool");
          if (subKey === "nail-paints") return name.includes("nail") || name.includes("polish") || name.includes("paint") || name.includes("remover");
          if (subKey === "eyeliners") return name.includes("eye") || name.includes("liner") || name.includes("kajal") || name.includes("mascara") || name.includes("shadow");
          if (subKey === "blushes") return name.includes("blush") || name.includes("highlighter") || name.includes("bronzer");
          if (subKey === "foundation") return name.includes("foundation") || name.includes("compact") || name.includes("concealer") || name.includes("bb cream") || name.includes("cc cream") || name.includes("powder");
          if (subKey === "lipsticks") return name.includes("lip") || name.includes("lipstick") || name.includes("gloss") || name.includes("liquid lipstick");
          return false;
        };

        if (activeSubcategory === "Lipsticks") {
          list = list.filter(p => matchMakeupSub(p, "lipsticks"));
        } else if (activeSubcategory === "Foundations & Compact") {
          list = list.filter(p => matchMakeupSub(p, "foundation"));
        } else if (activeSubcategory === "Blushes") {
          list = list.filter(p => matchMakeupSub(p, "blushes"));
        } else if (activeSubcategory === "Eyeliners") {
          list = list.filter(p => matchMakeupSub(p, "eyeliners"));
        } else if (activeSubcategory === "Nail Paints") {
          list = list.filter(p => matchMakeupSub(p, "nail-paints"));
        } else if (activeSubcategory === "Accessories") {
          list = list.filter(p => matchMakeupSub(p, "accessories"));
        }
      } else if (slug === "feminine-hygiene") {
        const getStructuredClassification = (prod) => {
          const sub = (prod.subCategory || prod.subcategory || "").toLowerCase();
          if (sub.includes("mom") || sub.includes("mother") || sub.includes("pregnancy") || sub.includes("maternity")) return "mom-hygiene";
          if (sub.includes("removal") || sub.includes("shave") || sub.includes("wax") || sub.includes("razor") || sub.includes("hair")) return "hair-removal";
          if (sub.includes("tampon") || sub.includes("cup") || sub.includes("menstrual")) return "tampons-cups";
          if (sub.includes("pad") || sub.includes("napkin") || sub.includes("sanitary")) return "pads";
          return null;
        };

        const hasTag = (prod, tag) => {
          if (!prod.tags) return false;
          if (Array.isArray(prod.tags)) return prod.tags.some(t => String(t).toLowerCase() === tag);
          return String(prod.tags).toLowerCase().includes(tag);
        };

        const matchHygieneSub = (prod, subKey) => {
          const sc = getStructuredClassification(prod);
          if (sc !== null) return sc === subKey;
          if (hasTag(prod, subKey)) return true;
          const name = (prod.name || "").toLowerCase();
          if (subKey === "mom-hygiene") return name.includes("mom") || name.includes("mother") || name.includes("pregnancy") || name.includes("maternity") || name.includes("moms");
          if (subKey === "hair-removal") return name.includes("removal") || name.includes("wax") || name.includes("razor") || name.includes("hair") || name.includes("epilator") || name.includes("shaving");
          if (subKey === "tampons-cups") return name.includes("tampon") || name.includes("cup") || name.includes("menstrual");
          if (subKey === "pads") return name.includes("pad") || name.includes("napkin") || name.includes("whisper") || name.includes("stayfree") || name.includes("sofy");
          return false;
        };

        if (activeSubcategory === "Sanitary Pads") {
          list = list.filter(p => matchHygieneSub(p, "pads"));
        } else if (activeSubcategory === "Tampons & Menstrual Cups") {
          list = list.filter(p => matchHygieneSub(p, "tampons-cups"));
        } else if (activeSubcategory === "Hair Removal") {
          list = list.filter(p => matchHygieneSub(p, "hair-removal"));
        } else if (activeSubcategory === "Mom Hygiene") {
          list = list.filter(p => matchHygieneSub(p, "mom-hygiene"));
        }
      } else {
        if (activeSubcategory === "Top Deals") {
          list = list.filter(p => p.originalPrice > p.price);
        } else {
          list = list.filter(p =>
            getSubcategoryMatch(p.subCategory, activeSubcategory) ||
            getSubcategoryMatch(p.subcategory, activeSubcategory)
          );
        }
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

    // 5. Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      list.sort((a, b) => {
        const discountA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discountB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discountB - discountA;
      });
    }

    return list;
  }, [localProducts, matchedCategory, activeSubcategory, searchQuery, selectedFilters, sortBy]);



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
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "350px",
        width: "100%",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: "#6b7280"
      }}>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .local-spinner {
            animation: spin 1s linear infinite;
            border: 3px solid rgba(49, 134, 22, 0.1);
            border-top: 3px solid #318616;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            margin-bottom: 12px;
          }
        `}} />
        <div className="local-spinner" />
        <span style={{ fontSize: "14px", fontWeight: "600" }}>Loading products...</span>
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

  if (slug === "kids") {
    // Dynamic grouping of toys and baby/kids products
    const playtimeProducts = localProducts.filter(p => {
      const cat = (p.category || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      return cat.includes("toy") || name.includes("toy") || name.includes("crab") || name.includes("xylophone");
    });

    const cuddlyProducts = localProducts.filter(p => {
      const name = (p.name || "").toLowerCase();
      return name.includes("teddy") || name.includes("plush") || name.includes("stuffed");
    });

    const rightCards = [
      {
        name: "Diapers, Wipes & More",
        discount: "Up to 60% OFF",
        route: "/category/baby-care",
        image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150"
      },
      {
        name: "Bath & Body Care",
        discount: "Up to 60% OFF",
        route: "/category/bath-body",
        image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150"
      },
      {
        name: "Feeding Essentials",
        discount: "Up to 60% OFF",
        route: "/category/baby-care",
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150"
      },
      {
        name: "Gifting & Accessories",
        discount: "Up to 60% OFF",
        route: "/category/toys-games",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150"
      }
    ];

    return (
      <div
        style={{
          fontFamily: "'Outfit', 'Inter', sans-serif",
          background: "transparent",
          minHeight: "80vh",
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <SEO title="Kids Tiny Tots Store" description="Order diapering, baby care, toys and gifting needs for kids on Buyto." />

        {/* Playful Blue Section - Attached directly below navigation bar */}
        <div
          style={{
            background: "linear-gradient(180deg, #DDF7FF 0%, #FAFDFC 100%)",
            width: "100%",
            boxSizing: "border-box",
            padding: isMobile ? "20px 16px 24px 16px" : "28px 40px 36px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div style={{ width: "100%", maxWidth: "720px" }}>

            {/* Playful TINY TOTS ZONE header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "950",
                  color: "#0284c7",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase"
                }}
              >
                TINY TOTS
              </div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "900",
                  color: "#0284c7",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                ZONE
              </h1>
            </div>

            {/* Left large card + 4 smaller cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 2fr",
                gap: "12px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {/* Left Top Deals Card */}
              <div
                onClick={() => navigate("/category/baby-care")}
                style={{
                  background: "#EBF8FF",
                  borderRadius: "16px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  border: "1.5px solid #bae6fd",
                  position: "relative",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div
                    style={{
                      background: "#0284c7",
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: "900",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      display: "inline-block",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px"
                    }}
                  >
                    TOP DEALS
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ textDecoration: "line-through", color: "#6b7280", fontSize: "12px" }}>₹195</span>
                    <span style={{ fontSize: "20px", fontWeight: "900", color: "#0284c7" }}>₹145</span>
                  </div>

                  <div style={{ fontSize: "14px", fontWeight: "750", color: "#1f2937", marginTop: "4px" }}>
                    Baby Soap
                  </div>
                </div>

                <img
                  src="https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150"
                  alt="Baby Soap Deal"
                  style={{
                    width: "100%",
                    height: isMobile ? "65px" : "85px",
                    objectFit: "contain",
                    marginTop: "12px"
                  }}
                />
              </div>

              {/* Right 2x2 grid of smaller cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px"
                }}
              >
                {rightCards.map((card) => (
                  <div
                    key={card.name}
                    onClick={() => navigate(card.route)}
                    style={{
                      background: "#EBF8FF",
                      borderRadius: "16px",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      boxSizing: "border-box",
                      aspectRatio: "1 / 1.15",
                      border: "1px solid #e0f2fe",
                      justifyContent: "space-between"
                    }}
                  >
                    <div
                      style={{
                        background: "#0f172a",
                        color: "#ffffff",
                        fontSize: "8px",
                        fontWeight: "800",
                        padding: "3px 6px",
                        alignSelf: "flex-start",
                        borderBottomRightRadius: "8px",
                        textTransform: "uppercase"
                      }}
                    >
                      Up to <span style={{ color: "#facc15" }}>60% OFF</span>
                    </div>

                    <div
                      style={{
                        fontSize: isMobile ? "11px" : "13px",
                        fontWeight: "750",
                        color: "#1f2937",
                        textAlign: "center",
                        padding: "4px 4px 0 4px",
                        lineHeight: "1.2"
                      }}
                    >
                      {card.name}
                    </div>

                    <img
                      src={card.image}
                      alt={card.name}
                      style={{
                        width: "100%",
                        height: isMobile ? "35px" : "50px",
                        objectFit: "contain",
                        marginBottom: "8px"
                      }}
                    />
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>

        {/* Product Carousel Sections Area - Starts below the promo section, white page background */}
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            margin: "0 auto",
            boxSizing: "border-box",
            padding: isMobile ? "16px 12px" : "24px 24px"
          }}
        >
          {/* Playtime Carousel */}
          {playtimeProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Happy playtime"
                products={playtimeProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}

          {/* Cuddly Friends Carousel */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Cuddly friends for little ones"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Happy playtime */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Happy playtime"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Diapering made easy */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Diapering made easy"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Feeding essentials */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Feeding essentials"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Body, Skin & face care */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Body, Skin & face care"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Hygiene is important */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Hygiene is important"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Toddler toys */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Toddler toys"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Fun with Brushing */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Fun with Brushing"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Toys */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Toys"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Activity Books for kids */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Activity Books for kids"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Best of baby feeding essentials */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Best of baby feeding essentials"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Shop diapers by size */}
          {cuddlyProducts.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <HorizontalProductSection
                title="Shop diapers by size"
                products={cuddlyProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
        </div>

      </div>
    );
  }

  if (slug === "decor") {
    // Dynamic grouping of plant/greenery decor products
    const plantProducts = localProducts.filter(p => {
      const name = (p.name || "").toLowerCase();
      return name.includes("plant") || name.includes("bamboo") || name.includes("lily") || name.includes("syngonium") || name.includes("palm") || name.includes("aglaonema");
    });

    return (
      <div
        style={{
          fontFamily: "'Outfit', 'Inter', sans-serif",
          background: "transparent",
          minHeight: "80vh",
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <SEO title="Decor Store" description="Reimagine your space with premium home decor and plants on Buyto." />

        {/* Decor Hero Banner - Warm/Beige attached directly below category navigation */}
        <div
          style={{
            background: "linear-gradient(135deg, #FAF6F0 0%, #F5EFEB 100%)",
            width: "100%",
            boxSizing: "border-box",
            padding: isMobile ? "24px 16px 28px 16px" : "36px 40px 42px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            borderBottom: "1px solid #E2E8F0"
          }}
        >
          <div style={{ width: "100%", maxWidth: "720px", position: "relative" }}>
            <h1
              style={{
                fontSize: isMobile ? "40px" : "54px",
                fontWeight: "900",
                color: "#ea580c", // Warm orange accent
                margin: 0,
                lineHeight: "0.95",
                textTransform: "uppercase",
                letterSpacing: "-0.02em"
              }}
            >
              REIMAGINE
            </h1>
            <div
              style={{
                fontSize: isMobile ? "22px" : "28px",
                fontStyle: "italic",
                color: "#475569", // Dark/neutral gray
                marginTop: "0px",
                lineHeight: "1.2",
                fontWeight: "600",
                fontFamily: "'Georgia', serif"
              }}
            >
              your space
            </div>

            {/* Seeded plant image reused as hero decoration */}
            <img
              src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150"
              alt="Home Decor Plant"
              style={{
                position: "absolute",
                right: "0px",
                bottom: "-15px",
                height: isMobile ? "95px" : "135px",
                objectFit: "contain"
              }}
            />
          </div>
        </div>

        {/* Decor Storefront Content - Starts below the hero section */}
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            margin: "0 auto",
            boxSizing: "border-box",
            padding: isMobile ? "16px 12px" : "24px 24px"
          }}
        >
          {/* First Product Section - Greenery */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Fuse greenery in your rooms"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Give every room a glow-up */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Give every room a glow-up"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Furnish with style */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Furnish with style"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Create your dream room */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Create your dream room"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Make your bedroom a beautiful escape */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Make your bedroom a beautiful escape"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Party time */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Party time"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Bring the heat of your kitchen */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Bring the heat of your kitchen"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Decorate your bathroom */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Decorate your bathroom"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Gentle towels */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Gentle towels"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Party-decorations */}
          {plantProducts.length > 0 && (
            <div>
              <HorizontalProductSection
                title="Party-decorations"
                products={plantProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}

          {/* See All Products Button */}
          <div
            onClick={() => navigate("/category/home-kitchen")}
            style={{
              background: "#FAF6F0",
              borderRadius: "16px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              marginTop: "20px",
              marginBottom: "28px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              transition: "transform 0.15s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150"
                alt="Mini Plant"
                style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "50%" }}
              />
              <span style={{ fontSize: "14px", fontWeight: "750", color: "#475569" }}>See all products</span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: "750", color: "#475569" }}>&gt;</span>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "pharmacy") {
    // Dynamic grouping of pharmacy products
    const pharmaProducts = localProducts.filter(p => {
      const cat = p.category?.toLowerCase() || "";
      const classified = (p._classifiedCategory || canonicalCategory(classifyProduct(p)) || "").toLowerCase();
      return cat.includes("pharma") || cat.includes("health") || classified.includes("pharma") || classified.includes("health") || classified.includes("sexual");
    });

    const featuredConcerns = [
      {
        title: "Hair & Skin Issues",
        route: "/category/skincare",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150",
        bg: "#FDF2F4"
      },
      {
        title: "Headache",
        route: "/category/health-pharma?sub=Pain%20Relief",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150",
        bg: "#F0F4FF"
      },
      {
        title: "Fever",
        route: "/category/health-pharma?sub=Pain%20Relief",
        image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150",
        bg: "#EBFDF5"
      }
    ];

    const pharmacyCategories = [
      { name: "Cough, Cold and Fever", subcategory: "Pain Relief", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150", bg: "#E6FAF5" },
      { name: "Stomach Care", subcategory: "Digestive Care", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150", bg: "#E6FAF5" },
      { name: "Pain Relief & First Aid", subcategory: "Pain Relief", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150", bg: "#E6FAF5" },
      { name: "Antibiotics", subcategory: "Pain Relief", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150", bg: "#E6FAF5" },
      { name: "Diabetes Care", subcategory: "Daily Wellness", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150", bg: "#E6FAF5" },
      { name: "Heart Care", subcategory: "Daily Wellness", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150", bg: "#E6FAF5" },
      { name: "Derma", route: "/category/skincare", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150", bg: "#E6FAF5" },
      { name: "Respiratory Care", subcategory: "Pain Relief", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150", bg: "#E6FAF5" },
      { name: "Eye, Ear & Oral Care", route: "/category/oral-care", image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=150", bg: "#E6FAF5" },
      { name: "Neuro Care", subcategory: "Daily Wellness", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150", bg: "#E6FAF5" },
      { name: "Sexual Wellness", route: "/category/sexual-wellness", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150", bg: "#E6FAF5" },
      { name: "Vitamins, mineral & ...", subcategory: "Multivitamins", image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=150", bg: "#E6FAF5" }
    ];

    return (
      <div
        style={{
          fontFamily: "'Outfit', 'Inter', sans-serif",
          background: "transparent",
          minHeight: "80vh",
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <SEO title="Pharmacy Store" description="Order medicines and healthcare needs online on Buyto." />

        {/* Pharmacy Hero Banner - Strong Teal/Blue attached directly below navigation */}
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #115e59 100%)",
            width: "100%",
            boxSizing: "border-box",
            padding: isMobile ? "20px 16px 24px 16px" : "28px 40px 36px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative"
          }}
        >
          <div style={{ width: "100%", maxWidth: "720px", position: "relative" }}>
            <h1
              style={{
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: "800",
                color: "#ffffff",
                margin: 0,
                lineHeight: "1.1",
                maxWidth: "60%"
              }}
            >
              Medicines and<br />insulins available
            </h1>

            <div style={{ display: "flex", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "6px" }}>
              <span
                style={{
                  background: "#FACC15",
                  color: "#0F172A",
                  fontSize: "9px",
                  fontWeight: "850",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  textTransform: "uppercase"
                }}
              >
                FREE
              </span>
              <span style={{ color: "#E0F2FE", fontSize: isMobile ? "12px" : "14px", fontWeight: "600" }}>
                Doctor consultation after ordering
              </span>
            </div>

            <button
              onClick={() => navigate("/category/health-pharma")}
              style={{
                marginTop: "18px",
                background: "#ffffff",
                color: "#0284c7",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "750",
                cursor: "pointer",
                fontSize: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}
            >
              Shop now
            </button>

            {/* Seeded product image reused as Hero illustration */}
            <img
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150"
              alt="Medicines and Insulins"
              style={{
                position: "absolute",
                right: "0px",
                bottom: "-10px",
                height: isMobile ? "90px" : "125px",
                objectFit: "contain",
                borderRadius: "12px"
              }}
            />
          </div>
        </div>

        {/* Offer Strip */}
        <div
          style={{
            background: "#0f2b30",
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 16px",
            textAlign: "center",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "700"
          }}
        >
          Flat 15% OFF on Diabetes medicines
        </div>

        {/* Storefront content area on white background */}
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            margin: "0 auto",
            boxSizing: "border-box",
            padding: isMobile ? "16px 12px" : "24px 24px"
          }}
        >
          {/* Featured Health Concerns Row */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: "16px",
              width: "100%",
              boxSizing: "border-box"
            }}
            className="hide-scrollbar"
          >
            {featuredConcerns.map((concern) => (
              <div
                key={concern.title}
                onClick={() => navigate(concern.route)}
                style={{
                  flexShrink: 0,
                  width: isMobile ? "115px" : "145px",
                  background: concern.bg,
                  borderRadius: "16px",
                  border: "1.5px solid #0284c7",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  aspectRatio: "1 / 1.25"
                }}
              >
                <span
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: "8px",
                    fontWeight: "800",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    alignSelf: "flex-start",
                    textTransform: "uppercase",
                    marginBottom: "4px"
                  }}
                >
                  Featured
                </span>
                <span
                  style={{
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "800",
                    color: "#1f2937",
                    lineHeight: "1.2"
                  }}
                >
                  {concern.title}
                </span>
                <img
                  src={concern.image}
                  alt={concern.title}
                  style={{
                    width: "100%",
                    height: isMobile ? "40px" : "55px",
                    objectFit: "contain",
                    marginTop: "auto"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Shop by Category Grid */}
          <div style={{ marginTop: "24px" }}>
            <h2
              style={{
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: "750",
                color: "#1f2937",
                margin: "0 0 16px 0"
              }}
            >
              Shop by category
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(4, minmax(0, 1fr))" : "repeat(auto-fill, minmax(130px, 1fr))",
                columnGap: isMobile ? "22px" : "20px",
                rowGap: isMobile ? "22px" : "28px"
              }}
            >
              {pharmacyCategories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => {
                    if (cat.route) {
                      navigate(cat.route);
                    } else {
                      navigate(`/category/health-pharma?sub=${encodeURIComponent(cat.subcategory)}`);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: isMobile ? "18px" : "20px",
                      background: cat.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      padding: "8px",
                      boxSizing: "border-box",
                      marginBottom: "6px"
                    }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: "600",
                      color: "#1f2937",
                      textAlign: "center",
                      lineHeight: "1.2",
                      wordBreak: "break-word",
                      padding: "0 2px",
                      minHeight: "34px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Essential Medicines Shelf */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Essential medicines"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Hair & Skin care */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Hair & Skin care"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Medical Devices */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Medical Devices"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Get rid of your ache */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Get rid of your ache"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Stomach Care */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Stomach Care"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Women's health */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Women's health"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
          {/* Cough and Cold */}
          {pharmaProducts.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <HorizontalProductSection
                title="Cough and Cold"
                products={pharmaProducts}
                openProduct={setSelectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                cartItems={cartItems}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (slug === "beauty") {
    // Dynamic grouping of beauty products
    const hairCareProducts = localProducts.filter(p => {
      const cat = p.category?.toLowerCase() || "";
      const classified = (p._classifiedCategory || canonicalCategory(classifyProduct(p)) || "").toLowerCase();
      return cat.includes("hair") || classified.includes("hair");
    });

    const skincareProducts = localProducts.filter(p => {
      const cat = p.category?.toLowerCase() || "";
      const classified = (p._classifiedCategory || canonicalCategory(classifyProduct(p)) || "").toLowerCase();
      return cat.includes("skin") || classified.includes("skin");
    });

    const bathBodyProducts = localProducts.filter(p => {
      const cat = p.category?.toLowerCase() || "";
      const classified = (p._classifiedCategory || canonicalCategory(classifyProduct(p)) || "").toLowerCase();
      return cat.includes("bath") || cat.includes("body") || classified.includes("bath") || classified.includes("body");
    });

    const promotionalCards = [
      {
        name: "Shringar Specials",
        discount: "Up to 90% OFF",
        route: "/category/makeup",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150",
        bg: "#FCF6EC"
      },
      {
        name: "Beauty Essentials",
        discount: "Up to 80% OFF",
        route: "/category/grooming",
        image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=150",
        bg: "#FDF2F4"
      },
      {
        name: "Skin & Hair Prep",
        discount: "Up to 90% OFF",
        route: "/category/skincare",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150",
        bg: "#EAF5EC"
      }
    ];

    const productSections = [
      {
        title: "Hair care essentials",
        subtitle: "Get shampoos, conditioners, oils & more",
        products: hairCareProducts
      },
      {
        title: "Skin care essentials",
        subtitle: "Get face washes, sunscreens, creams & more",
        products: skincareProducts
      },
      {
        title: "Nourish & repair your hair",
        subtitle: "Premium oils, serums, masks & more",
        products: hairCareProducts
      },
      {
        title: "Bath and body specials",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "UV filter sunscreens",
        subtitle: "Protect your skin from sunburns",
        products: bathBodyProducts
      },
      {
        title: "Protect, hydrate & glow",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Smell great",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Searching for best deals ?",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Trending nail paints",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Kajals & liners",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Skincare made easy",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Hairy essentials",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Hair care",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Salon at your home",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      },
      {
        title: "Last minute grooming needs",
        subtitle: "Get body milks, handwashes, soaps & more",
        products: bathBodyProducts
      }
    ];

    return (
      <div
        style={{
          fontFamily: "'Outfit', 'Inter', sans-serif",
          background: "transparent",
          minHeight: "80vh",
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <SEO title="Beauty Store" description="Browse premium beauty and personal care products on Buyto." />

        {/* ONE SINGLE BEAUTY PROMOTIONAL SECTION - FULL WIDTH ATTACHED DIRECTLY UNDER NAVIGATION */}
        <div
          style={{
            background: "linear-gradient(to bottom, #EEEAFB 0%, #FAF6FC 100%)",
            width: "100%",
            boxSizing: "border-box",
            padding: isMobile ? "16px 16px 24px 16px" : "24px 40px 32px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          {/* Constrain inner content width to keep cards and text compact on desktop */}
          <div style={{ width: "100%", maxWidth: "720px" }}>

            {/* Hero Content */}
            <div
              style={{
                position: "relative",
                marginBottom: "18px"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#5B21B6",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "4px"
                }}
              >
                BEAUTY PICKS FOR THAT
              </div>
              <h1
                style={{
                  fontSize: isMobile ? "28px" : "36px",
                  fontWeight: "800",
                  color: "#4C1D95",
                  margin: 0,
                  lineHeight: "1.1"
                }}
              >
                Teej-Ready Look
              </h1>

              {/* Decorative element */}
              <div
                style={{
                  position: "absolute",
                  right: "0px",
                  bottom: "0px",
                  fontSize: isMobile ? "44px" : "56px",
                  opacity: 0.85,
                  userSelect: "none"
                }}
              >
                💅🌸✨
              </div>
            </div>

            {/* 3 Promotional Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px"
              }}
            >
              {promotionalCards.map((card) => (
                <div
                  key={card.name}
                  onClick={() => navigate(card.route)}
                  style={{
                    background: card.bg,
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    aspectRatio: "1 / 1.15",
                    transition: "transform 0.15s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {/* Discount Tag */}
                  <div
                    style={{
                      background: "#1f2937",
                      color: "#ffffff",
                      fontSize: isMobile ? "8px" : "9px",
                      fontWeight: "800",
                      padding: "4px 8px",
                      borderBottomRightRadius: "8px",
                      alignSelf: "flex-start",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}
                  >
                    {card.discount}
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: "750",
                      color: "#1f2937",
                      textAlign: "center",
                      margin: "8px 4px 4px 4px",
                      lineHeight: "1.2"
                    }}
                  >
                    {card.name}
                  </div>

                  <img
                    src={card.image}
                    alt={card.name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: isMobile ? "45px" : "55px",
                      objectFit: "contain",
                      marginTop: "auto",
                      marginBottom: "8px"
                    }}
                  />
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Product Carousel Sections Area - Starts below the promo section, white page background */}
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            margin: "0 auto",
            boxSizing: "border-box",
            padding: isMobile ? "12px" : "20px 24px"
          }}
        >
          {productSections.map((section) => {
            if (!section.products || section.products.length === 0) return null;
            return (
              <div key={section.title} style={{ marginBottom: "12px" }}>
                <HorizontalProductSection
                  title={section.title}
                  subtitle={section.subtitle}
                  products={section.products}
                  openProduct={setSelectedProduct}
                  setSelectedProduct={setSelectedProduct}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  cart={cart}
                  windowWidth={windowWidth}
                  getCartKey={getCartKey}
                  cartItems={cartItems}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (slug === "electronics") {
    // Clean, reusable category images from existing categories and seeded products
    const kitchenImg = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150";
    const cleaningImg = "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150";
    const homeImg = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150";
    const extensionImg = "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=150";
    const boAtImg = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";
    const duracellImg = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=150";
    const groomingImg = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=150";
    const hairImg = "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150";
    const oralImg = "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=150";
    const healthImg = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150";

    const electronicsSections = [
      {
        title: "Top Deals",
        categories: [
          { name: "Top Deals", subcategory: "Top Deals", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=150", bg: "#FEF2F2" }
        ]
      },
      {
        title: "Home and kitchen",
        categories: [
          { name: "Irons & More", subcategory: "Irons & More", image: kitchenImg, bg: "#EFEBF9" },
          { name: "Fans, Coolers & Air Coolers", subcategory: "Fans & Coolers", image: homeImg, bg: "#EAF5FC" },
          { name: "Extension Boards & Multi Plugs", subcategory: "Extension Boards", image: extensionImg, bg: "#FAF0EC" },
          { name: "LED & Lamps", subcategory: "LED & Lamps", image: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=150", bg: "#FAF6E2" },
          { name: "Cookware", subcategory: "Cookware", image: kitchenImg, bg: "#EAF6F3" },
          { name: "Juicer, Frothers & More", subcategory: "Juicers & Frothers", image: kitchenImg, bg: "#FAF0F4" },
          { name: "Cleaning Gadgets", subcategory: "Cleaning Gadgets", image: cleaningImg, bg: "#EBF1FA" },
          { name: "Hand & Power Tools", subcategory: "Hand & Power Tools", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=150", bg: "#F0F0F0" },
        ]
      },
      {
        title: "Audio and gaming accessories",
        categories: [
          { name: "Earbuds and Headsets", subcategory: "Earphones", image: boAtImg, bg: "#E6FAF4" },
          { name: "Speakers & Soundbars", subcategory: "Speakers", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=150", bg: "#F4EBF9" },
          { name: "Smart Watches", subcategory: "Smart Watches", image: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=150", bg: "#E6FAF4" },
          { name: "Gaming Essentials", subcategory: "Gaming Accessories", image: "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=150", bg: "#FAF0F1" },
        ]
      },
      {
        title: "Grooming and wellness essentials",
        categories: [
          { name: "Trimmers", subcategory: "Trimmers", image: groomingImg, bg: "#E6FAF0" },
          { name: "Hairstyling Tools", subcategory: "Hairstyling Tools", image: hairImg, bg: "#EFEBF9" },
          { name: "Massagers & Weighing", subcategory: "Massagers & Weighing", image: healthImg, bg: "#FAF0EC" },
          { name: "Electric Toothbrush", subcategory: "Electric Toothbrush", image: oralImg, bg: "#EAF5FC" },
        ]
      },
      {
        title: "Mobile and computer accessories",
        categories: [
          { name: "Earphones", subcategory: "Earphones", image: boAtImg, bg: "#EBF0FA" },
          { name: "Cables & Chargers", subcategory: "Cables & Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#E6FAF0" },
          { name: "Power Banks", subcategory: "Power Banks", image: "https://images.unsplash.com/photo-1609592424109-dd2e1e0a2935?w=150", bg: "#F4EBF9" },
          { name: "Batteries", subcategory: "Batteries", image: duracellImg, bg: "#FAF0F0" }
        ]
      },
      {
        title: "Salon at your home",
        categories: [
          { name: "Hair & Styling", subcategory: "Hair Styling", image: hairImg, bg: "#EFEBF9" },
          { name: "Grooming & Shaving", subcategory: "Grooming", image: groomingImg, bg: "#E6FAF0" },
          { name: "Skincare Tools", subcategory: "Skincare Tools", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150", bg: "#FAF0EC" }
        ]
      },
      {
        title: "Trimmers of their Best",
        categories: [
          { name: "Beard Trimmers", subcategory: "Trimmers", image: groomingImg, bg: "#E6FAF0" },
          { name: "Multi-Grooming Kits", subcategory: "Grooming Kits", image: groomingImg, bg: "#FAF0EC" },
          { name: "Hair Clippers", subcategory: "Hair Clippers", image: hairImg, bg: "#EFEBF9" }
        ]
      },
      {
        title: "Premium gadgets",
        categories: [
          { name: "Smart Assistants", subcategory: "Smart Assistants", image: boAtImg, bg: "#EAF5FC" },
          { name: "Wireless Chargers", subcategory: "Wireless Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#FAF0EC" },
          { name: "Premium Audio", subcategory: "Speakers", image: boAtImg, bg: "#E6FAF4" }
        ]
      },
      {
        title: "Daily Essentials",
        categories: [
          { name: "Batteries", subcategory: "Batteries", image: duracellImg, bg: "#FAF0F0" },
          { name: "LED Bulbs", subcategory: "LED & Lamps", image: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=150", bg: "#FAF6E2" },
          { name: "Extension Cords", subcategory: "Extension Boards", image: extensionImg, bg: "#FAF0EC" }
        ]
      },
      {
        title: "Your Workspace",
        categories: [
          { name: "Study Lamps", subcategory: "LED & Lamps", image: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=150", bg: "#FAF6E2" },
          { name: "Extension Cords", subcategory: "Extension Boards", image: extensionImg, bg: "#EBF0FA" },
          { name: "Cables & Organizers", subcategory: "Cables & Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#E6FAF0" }
        ]
      },
      {
        title: "Best brands in audio & accessories",
        categories: [
          { name: "boAt", subcategory: "boAt", image: boAtImg, bg: "#FFF5F5" },
          { name: "noise", subcategory: "noise", image: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=150", bg: "#F0F7FF" },
          { name: "PORTRONICS", subcategory: "Portronics", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=150", bg: "#FAF6E2" }
        ]
      },
      {
        title: "Lighten up your space",
        categories: [
          { name: "LED Bulbs & Battens", subcategory: "LED & Lamps", image: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=150", bg: "#FAF6E2" },
          { name: "Study & Table Lamps", subcategory: "LED & Lamps", image: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=150", bg: "#FAF0EC" },
          { name: "Smart & Decorative Lights", subcategory: "LED & Lamps", image: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=150", bg: "#EAF5FC" }
        ]
      },
      {
        title: "Chargers & more",
        categories: [
          { name: "Fast Chargers", subcategory: "Cables & Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#FAF0EC" },
          { name: "Charging Cables", subcategory: "Cables & Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#E6FAF0" },
          { name: "Wireless Chargers", subcategory: "Wireless Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#FAF6E2" }
        ]
      },
      {
        title: "Running out of battery ?",
        categories: [
          { name: "Duracell Batteries", subcategory: "Batteries", image: duracellImg, bg: "#FEF2F2" },
          { name: "Power Banks", subcategory: "Power Banks", image: "https://images.unsplash.com/photo-1609592424109-dd2e1e0a2935?w=150", bg: "#F0F7FF" },
          { name: "Cables & Adapters", subcategory: "Cables & Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150", bg: "#FAF6E2" }
        ]
      },
      {
        title: "Blend it with !",
        categories: [
          { name: "Juicers & Frothers", subcategory: "Juicers & Frothers", image: kitchenImg, bg: "#FAF0F4" },
          { name: "Hand Blenders", subcategory: "Cookware", image: kitchenImg, bg: "#EAF6F3" },
          { name: "Mixers & Grinders", subcategory: "Cookware", image: kitchenImg, bg: "#EBF1FA" }
        ]
      },
      {
        title: "Get Massaged",
        categories: [
          { name: "Juicers & Frothers", subcategory: "Juicers & Frothers", image: kitchenImg, bg: "#FAF0F4" },
          { name: "Hand Blenders", subcategory: "Cookware", image: kitchenImg, bg: "#EAF6F3" },
          { name: "Mixers & Grinders", subcategory: "Cookware", image: kitchenImg, bg: "#EBF1FA" }
        ]
      }
    ];

    return (
      <div
        style={{
          fontFamily: "'Outfit', 'Inter', sans-serif",
          background: "transparent",
          minHeight: "80vh",
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          boxSizing: "border-box",
          padding: isMobile ? "12px" : "20px 24px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <SEO title="Electronics" description="Browse premium electronics and accessories on Buyto." />
        <div style={{ width: "100%" }}>
          {electronicsSections.map((section) => (
            <div key={section.title} style={{ marginBottom: "48px" }}>
              <h2
                style={{
                  fontSize: isMobile ? "20px" : "24px",
                  fontWeight: "700",
                  color: "#1f2937",
                  textAlign: "left",
                  margin: "0 0 14px 0",
                  fontFamily: "'Outfit', 'Inter', sans-serif"
                }}
              >
                {section.title}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  columnGap: "16px",
                  rowGap: "18px"
                }}
              >
                {section.categories.map((cat) => (
                  <div
                    key={cat.name}
                    onClick={() => navigate(`/category/electronics-appliances?sub=${encodeURIComponent(cat.subcategory)}`)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                      width: "100%"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 0.9",
                        borderRadius: "16px",
                        background: cat.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: "8px",
                        boxSizing: "border-box",
                        marginBottom: "6px"
                      }}
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain"
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: isMobile ? "12px" : "14px",
                        fontWeight: "600",
                        color: "#1f2937",
                        textAlign: "center",
                        lineHeight: "1.2",
                        wordBreak: "break-word",
                        padding: "0 2px",
                        minHeight: "34px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Outfit', 'Inter', sans-serif",
        background: "#f7f8fa",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "row",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box"
      }}
    >
      <SEO title={(slug === "fresh-vegetables" || slug === "fresh-fruits") ? "Vegetables & Fruits" : (slug === "oils-and-ghee" || slug === "oil-ghee") ? "Oil, Ghee, Masala & More" : (slug === "chips-namkeens" || slug === "chips-and-namkeens") ? "Chips, Namkeen & More" : (slug === "cold-drinks-juices" || slug === "cold-drinks-and-juices") ? "Drinks, Juices & More" : (slug === "ice-cream" || slug === "ice-creams-frozen-desserts" || slug === "ice-creams-and-desserts") ? "Ice Creams & More" : (slug === "meat-seafood" || slug === "meat-and-seafood") ? "Chicken, Meat & Fish" : (slug === "noodles-pasta-vermicelli" || slug === "noodles-and-pasta") ? "Noodles, Pasta & Vermicelli" : (slug === "paan-corner") ? "Paan Corner" : (slug === "bath-body" || slug === "bath-and-body") ? "Bath & Body" : (slug === "hair-care" || slug === "hair") ? "Hair" : (slug === "skin-care" || slug === "skincare") ? "Skincare" : (slug === "makeup" || slug === "makeups") ? "Makeup" : (slug === "feminine-hygiene") ? "Female Hygiene" : (matchedCategory ? matchedCategory.name : "Products")} description={matchedCategory ? `Shop top quality ${matchedCategory.name} online with fast 10-minute delivery on Buyto.` : "Browse categories on Buyto."} />

      {/* 1. Left Vertical Category Navigation Sidebar */}
      <aside
        style={{
          position: "sticky",
          top: isMobile ? "116px" : "120px",
          height: isMobile ? "calc(100vh - 180px)" : "calc(100vh - 140px)",
          overflowY: "auto",
          width: isMobile ? "90px" : "140px",
          flexShrink: 0,
          background: "white",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "16px 0",
          boxSizing: "border-box",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          borderRight: "1px solid #f3f4f6"
        }}
        className="hide-scrollbar"
      >
        {subcategories.map((sub) => {
          const isActive = activeSubcategory === sub;
          const label = sub === "Show All" ? "All" : sub;
          const image = subcategoryImageMap[sub];

          return (
            <button
              key={sub}
              ref={isActive ? activeItemRef : null}
              onClick={() => setActiveSubcategory(sub)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: "8px 4px",
                cursor: "pointer",
                position: "relative",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {/* Active Indicator on RIGHT edge */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "10%",
                  height: "80%",
                  width: "6px",
                  backgroundColor: "#318616",
                  borderRadius: "4px 0 0 4px",
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "right",
                  transition: "opacity 0.25s ease, transform 0.25s ease"
                }}
              />

              {/* Icon / Image container */}
              <div
                style={{
                  width: isMobile ? "44px" : "54px",
                  height: isMobile ? "44px" : "54px",
                  borderRadius: "50%",
                  backgroundColor: isActive ? "#eefaf2" : "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: "6px",
                  transition: "background-color 0.2s ease"
                }}
              >
                {image && image.startsWith("http") ? (
                  <img
                    src={image}
                    alt={label}
                    style={{
                      width: "60%",
                      height: "60%",
                      objectFit: "contain",
                      filter: isActive ? "none" : "grayscale(30%)"
                    }}
                  />
                ) : (
                  <span style={{ fontSize: isMobile ? "20px" : "24px" }}>
                    {image || "🛍️"}
                  </span>
                )}
              </div>

              {/* Category Name */}
              <span
                style={{
                  fontSize: isMobile ? "10px" : "12px",
                  fontWeight: isActive ? "800" : "600",
                  color: isActive ? "#318616" : "#4b5563",
                  textAlign: "center",
                  lineHeight: "1.2",
                  padding: "0 4px",
                  wordBreak: "break-word"
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* 2. Right Content Area (Filters, Banner, Products Grid) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: isMobile ? "12px" : "20px 24px",
          boxSizing: "border-box"
        }}
      >
        {/* Category header block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <h1 style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: "900", color: "#1f2937", margin: 0 }}>
              {matchedCategory.icon && <span style={{ marginRight: "8px" }}>{matchedCategory.icon}</span>}
              {(slug === "fresh-vegetables" || slug === "fresh-fruits") ? "Vegetables & Fruits" : (slug === "oils-and-ghee" || slug === "oil-ghee") ? "Oil, Ghee, Masala & More" : (slug === "chips-namkeens" || slug === "chips-and-namkeens") ? "Chips, Namkeen & More" : (slug === "cold-drinks-juices" || slug === "cold-drinks-and-juices") ? "Drinks, Juices & More" : (slug === "ice-cream" || slug === "ice-creams-frozen-desserts" || slug === "ice-creams-and-desserts") ? "Ice Creams & More" : (slug === "meat-seafood" || slug === "meat-and-seafood") ? "Chicken, Meat & Fish" : (slug === "noodles-pasta-vermicelli" || slug === "noodles-and-pasta") ? "Noodles, Pasta & Vermicelli" : (slug === "paan-corner") ? "Paan Corner" : (slug === "bath-body" || slug === "bath-and-body") ? "Bath & Body" : (slug === "hair-care" || slug === "hair") ? "Hair" : (slug === "skin-care" || slug === "skincare") ? "Skincare" : (slug === "makeup" || slug === "makeups") ? "Makeup" : (slug === "feminine-hygiene") ? "Female Hygiene" : matchedCategory.name}
            </h1>
            <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>
              ({filteredCategoryProducts.length} items)
            </span>
          </div>
        </div>

        {/* Premium Horizontal Filter Row */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            padding: "4px 0 16px 0",
            width: "100%",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            alignItems: "center"
          }}
          className="hide-scrollbar"
        >
          {/* Filters Button */}
          <button
            onClick={() => {
              setActiveMobileFilterSection("All");
              setIsFilterBottomSheetOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "14px",
              border: Object.keys(selectedFilters).length > 0 ? "1.5px solid #318616" : "1px solid #e5e7eb",
              background: Object.keys(selectedFilters).length > 0 ? "#eefaf2" : "white",
              color: Object.keys(selectedFilters).length > 0 ? "#318616" : "#4b5563",
              fontSize: "13px",
              fontWeight: "750",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              height: "46px",
              boxSizing: "border-box"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Filters</span>
            {Object.keys(selectedFilters).length > 0 && (
              <span style={{ background: "#318616", color: "white", borderRadius: "50%", width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800" }}>
                {Object.values(selectedFilters).reduce((a, b) => a + b.length, 0)}
              </span>
            )}
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Sort Button with dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "14px",
                border: sortBy !== "default" ? "1.5px solid #318616" : "1px solid #e5e7eb",
                background: sortBy !== "default" ? "#eefaf2" : "white",
                color: sortBy !== "default" ? "#318616" : "#4b5563",
                fontSize: "13px",
                fontWeight: "750",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                height: "46px",
                boxSizing: "border-box"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 20 22 24 18" /><line x1="20" y1="22" x2="20" y2="2" /><polyline points="8 6 4 2 0 6" /><line x1="4" y1="2" x2="4" y2="22" />
              </svg>
              <span>Sort{sortBy !== "default" ? `: ${sortBy === "price-asc" ? "L-H" : sortBy === "price-desc" ? "H-L" : "Savings"}` : ""}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isSortOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setIsSortOpen(false)} />
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "4px", background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", zIndex: 10, minWidth: "160px", padding: "4px" }}>
                  {[
                    { val: "default", label: "Default" },
                    { val: "price-asc", label: "Price: Low to High" },
                    { val: "price-desc", label: "Price: High to Low" },
                    { val: "discount", label: "Discount" }
                  ].map(opt => {
                    const isActive = sortBy === opt.val;
                    return (
                      <button
                        key={opt.val}
                        onClick={() => {
                          setSortBy(opt.val);
                          setIsSortOpen(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          border: "none",
                          borderRadius: "10px",
                          background: isActive ? "#eefaf2" : "transparent",
                          color: isActive ? "#318616" : "#4b5563",
                          fontSize: "13px",
                          fontWeight: isActive ? "750" : "500",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Dynamic Filter Sections (Type, Country, Brand etc.) */}
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "14px",
                  border: selectedCount > 0 ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  background: selectedCount > 0 ? "#eefaf2" : "white",
                  color: selectedCount > 0 ? "#318616" : "#4b5563",
                  fontSize: "13px",
                  fontWeight: "750",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  height: "46px",
                  boxSizing: "border-box"
                }}
              >
                <span>{section}</span>
                {selectedCount > 0 && (
                  <span style={{ background: "#318616", color: "white", borderRadius: "50%", width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800" }}>
                    {selectedCount}
                  </span>
                )}
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            );
          })}
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
          {/* Left Sidebar Layout (Filters) */}
          {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "220px" }}>
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
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
