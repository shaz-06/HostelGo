import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";
import SEO from "../components/common/SEO";
import { ArrowUp } from "lucide-react";

const getCategoryGradient = (name, isStore = false) => {
  const lower = name.toLowerCase();

  // Spotlight stores specific themes
  if (lower.includes("ice cream"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(225,210,255,.30), transparent 35%), linear-gradient(135deg, #F8F5FF 0%, #F2ECFF 35%, #ECE3FF 70%, #E7DBFF 100%)`;

  if (lower.includes("travel"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(185,220,255,.30), transparent 35%), linear-gradient(135deg, #F7FBFF 0%, #EEF6FF 35%, #E3F0FF 70%, #D9EAFF 100%)`;

  if (lower.includes("hobby"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,230,195,.30), transparent 35%), linear-gradient(135deg, #FAF6F0 0%, #F5EFEB 35%, #F0E4DA 70%, #EADAD0 100%)`;

  if (lower.includes("sports"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(205,235,170,.35), transparent 35%), linear-gradient(135deg, #F9FDF8 0%, #F3FDEE 35%, #F0FAEB 70%, #EAF8E2 100%)`;

  if (isStore) {
    return "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)";
  }

  // Grocery & Kitchen
  if (lower.includes("vegetable") || lower.includes("fruit"))
    return `linear-gradient(135deg, #EBFDF5 0%, #D1FAE5 100%)`;

  if (lower.includes("atta") || lower.includes("rice") || lower.includes("dal"))
    return `linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)`;

  if (lower.includes("oil") || lower.includes("ghee") || lower.includes("masala"))
    return `linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)`;

  if (lower.includes("dairy") || lower.includes("bread") || lower.includes("egg"))
    return `linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)`;

  if (lower.includes("bakery") || lower.includes("biscuit"))
    return `linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)`;

  if (lower.includes("dry fruit") || lower.includes("cereal"))
    return `linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)`;

  if (lower.includes("chicken") || lower.includes("meat") || lower.includes("fish"))
    return `linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%)`;

  if (lower.includes("kitchenware") || lower.includes("appliance"))
    return `linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)`;

  // Snacks & Drinks
  if (lower.includes("chip") || lower.includes("namkeen"))
    return `linear-gradient(135deg, #FFF9EF 0%, #FFE9CC 100%)`;

  if (lower.includes("sweet") || lower.includes("chocolate"))
    return `linear-gradient(135deg, #FFF8F1 0%, #F7E7D4 100%)`;

  if (lower.includes("drink") || lower.includes("juice"))
    return `linear-gradient(135deg, #F2FAFF 0%, #DFF2FF 100%)`;

  if (lower.includes("tea") || lower.includes("coffee"))
    return `linear-gradient(135deg, #FFFBF7 0%, #FDEBD8 100%)`;

  if (lower.includes("instant"))
    return `linear-gradient(135deg, #FFFEF8 0%, #FFF6D8 100%)`;

  if (lower.includes("sauce") || lower.includes("spread"))
    return `linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%)`;

  if (lower.includes("paan"))
    return `linear-gradient(135deg, #F5FFF7 0%, #E3FAE9 100%)`;

  if (lower.includes("ice cream"))
    return `linear-gradient(135deg, #F8F5FF 0%, #ECE3FF 100%)`;

  // Beauty & Wellness
  if (lower.includes("bath"))
    return `linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)`;

  if (lower.includes("hair"))
    return `linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)`;

  if (lower.includes("skin") || lower.includes("face"))
    return `linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)`;

  if (lower.includes("beauty") || lower.includes("cosmetic"))
    return `linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)`;

  if (lower.includes("female") || lower.includes("feminine"))
    return `linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)`;

  if (lower.includes("baby"))
    return `linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)`;

  if (lower.includes("health") || lower.includes("pharma"))
    return `linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)`;

  if (lower.includes("sexual"))
    return `linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%)`;

  // Household
  if (lower.includes("home"))
    return `linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)`;

  if (lower.includes("clean"))
    return `linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)`;

  if (lower.includes("electronics"))
    return `linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)`;

  if (lower.includes("stationery") || lower.includes("game"))
    return `linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)`;

  return "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)";
};

const discoverySections = [
  {
    title: "Grocery & Kitchen",
    items: [
      { name: "Vegetables & Fruits", slug: "fresh-vegetables", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=150" },
      { name: "Atta, Rice & Dal", slug: "atta-rice-dal", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=150" },
      { name: "Oil, Ghee & Masala", slug: "oils-and-ghee", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=150" },
      { name: "Dairy, Bread & Eggs", slug: "dairy-bread-eggs", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=150" },
      { name: "Bakery & Biscuits", slug: "biscuits-and-cakes", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150" },
      { name: "Dry Fruits & Cereals", slug: "cereals-breakfast", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=150" },
      { name: "Chicken, Meat & Fish", slug: "meat-seafood", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=150" },
      { name: "Kitchenware & Appliances", slug: "home-kitchen", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150" }
    ]
  },
  {
    title: "Snacks & Drinks",
    items: [
      { name: "Chips & Namkeen", slug: "chips-namkeens", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=150" },
      { name: "Sweets & Chocolates", slug: "chocolates", image: "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=150" },
      { name: "Drinks & Juices", slug: "cold-drinks-juices", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150" },
      { name: "Tea, Coffee & Milk Drinks", slug: "tea-coffee-drinks", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=150" },
      { name: "Instant Food", slug: "snacks", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150" },
      { name: "Sauces & Spreads", slug: "sauces-and-spreads", image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=150" },
      { name: "Paan Corner", slug: "paan-corner", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=150" },
      { name: "Ice Creams & More", slug: "ice-creams-frozen-desserts", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150" }
    ]
  },
  {
    title: "Beauty & Personal Care",
    items: [
      { name: "Bath & Body", slug: "bath-body", image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150" },
      { name: "Hair", slug: "hair-care", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150" },
      { name: "Skin & Face", slug: "skincare", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150" },
      { name: "Beauty & Cosmetics", slug: "makeup", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150" },
      { name: "Feminine Hygiene", slug: "feminine-hygiene", image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=150" },
      { name: "Baby Care", slug: "baby-care", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=150" },
      { name: "Health & Pharma", slug: "health-pharma", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150" },
      { name: "Sexual Wellness", slug: "sexual-wellness", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150" }
    ]
  },
  {
    title: "Household Essentials",
    items: [
      { name: "Home & Lifestyle", slug: "home-furnishing", image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150" },
      { name: "Cleaners & Repellents", slug: "cleaners-repellents", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150" },
      { name: "Electronics", slug: "electronics-appliances", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150" },
      { name: "Stationery & Games", slug: "books-stationery", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150" }
    ]
  }
];

const spotlightStores = [
  { name: "Ice Cream Store", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150", route: "/category/ice-creams-frozen-desserts", bg: "#F8F5FF" },
  { name: "Travel Store", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150", route: "/category/home-kitchen", bg: "#F7FBFF" },
  { name: "Hobby Store", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150", route: "/category/decor", bg: "#FAF6F0" },
  { name: "Sports Store", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150", route: "/category/home-kitchen", bg: "#F9FDF8" }
];

const lifestylePicks = [
  { name: "Spiritual Needs", image: "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=150", route: "/category/puja", bg: "#FFFDF7" },
  { name: "Pet Store", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150", route: "/category/home-kitchen", bg: "#F8FBFF" },
  { name: "Fashion Basics", image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=150", route: "/category/bath-body", bg: "#FBF9FF" },
  { name: "Toy Store", image: "https://images.unsplash.com/photo-1537655780520-1e392edd816a?w=150", route: "/category/kids", bg: "#FBF9FF" },
  { name: "Book Store", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150", route: "/category/home-kitchen", bg: "#FFFDF8" },
  { name: "Pharma Store", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150", route: "/category/pharmacy", bg: "#F6FFF9" },
  { name: "E-Gifts Store", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150", route: "/category/decor", bg: "#FFF9FA" },
  { name: "Jewellery Store", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150", route: "/category/bath-body", bg: "#FFF9FB" }
];

const searchSuggestions = [
  "Milk",
  "Curd",
  "Rice",
  "Atta",
  "Chocolates",
  "Ice Cream",
  "Shampoo",
  "Face Wash",
  "Cold Drinks",
  "Bread",
  "Eggs",
  "Snacks"
];

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

export default function CategoriesPage({ products = [], searchQuery = "", setSearchQuery = () => {} }) {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const [searchIndex, setSearchIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (localQuery === searchQuery) return;
    const handler = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [localQuery, searchQuery, setSearchQuery]);

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isFocused]);

  const handleCardClick = (item) => {
    if (item.slug) {
      navigate(`/category/${item.slug}`);
    } else {
      navigate(`/category/${generateSlug(item.name)}`);
    }
  };

  const dynamicSections = useMemo(() => {
    return discoverySections.map(section => {
      const updatedItems = section.items.map(item => {
        const itemCanonical = canonicalCategory(item.name);
        
        // Find matching products
        const matchingProducts = (products || []).filter(p => {
          const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
          return classified === itemCanonical;
        });

        const dynamicImage = (matchingProducts.length > 0 && matchingProducts[0].image)
          ? matchingProducts[0].image
          : item.image;

        return {
          ...item,
          image: dynamicImage,
          count: matchingProducts.length
        };
      });

      return {
        ...section,
        items: updatedItems
      };
    });
  }, [products]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        boxSizing: "border-box",
        paddingBottom: "80px",
        width: "100%"
      }}
    >
      <SEO title="Categories" description="Explore Buyto categories including Grocery, Snacks, Drinks, Beauty, and Household Essentials." />
      
      {/* Main Categories Grids */}
      <main style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {dynamicSections.map((section) => (
          <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "750",
                color: "#1f2937",
                margin: 0,
                paddingLeft: "4px"
              }}
            >
              {section.title}
            </h2>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                columnGap: "12px",
                rowGap: "16px"
              }}
            >
              {section.items.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleCardClick(item)}
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
                      borderRadius: "16px",
                      background: getCategoryGradient(item.name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px",
                      boxSizing: "border-box",
                      marginBottom: "6px"
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
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
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Stores in Spotlight */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: "750",
              color: "#1f2937",
              margin: 0,
              paddingLeft: "4px"
            }}
          >
            Stores in spotlight
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              columnGap: "12px",
              rowGap: "16px"
            }}
          >
            {spotlightStores.map((store) => (
              <div
                key={store.name}
                onClick={() => navigate(store.route)}
                style={{
                  background: store.bg,
                  borderRadius: "16px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  aspectRatio: "1 / 1",
                  border: "1px solid rgba(0,0,0,0.03)",
                  boxSizing: "border-box"
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#1f2937",
                    textAlign: "center",
                    lineHeight: "1.2",
                    marginBottom: "4px",
                    wordBreak: "break-word"
                  }}
                >
                  {store.name}
                </span>
                <img
                  src={store.image}
                  alt={store.name}
                  style={{
                    width: "100%",
                    height: "55px",
                    objectFit: "contain",
                    marginTop: "auto"
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Picks for Your Lifestyle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: "750",
              color: "#1f2937",
              margin: 0,
              paddingLeft: "4px"
            }}
          >
            Picks for your lifestyle
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              columnGap: "12px",
              rowGap: "16px"
            }}
          >
            {lifestylePicks.map((pick) => (
              <div
                key={pick.name}
                onClick={() => navigate(pick.route)}
                style={{
                  background: pick.bg,
                  borderRadius: "16px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  aspectRatio: "1 / 1",
                  border: "1px solid rgba(0,0,0,0.03)",
                  boxSizing: "border-box"
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#1f2937",
                    lineHeight: "1.2",
                    textAlign: "left",
                    wordBreak: "break-word",
                    marginBottom: "4px"
                  }}
                >
                  {pick.name}
                </span>
                <img
                  src={pick.image}
                  alt={pick.name}
                  style={{
                    width: "100%",
                    height: "55px",
                    objectFit: "contain",
                    marginTop: "auto"
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Back to Top Button */}
      <button
        onClick={handleScrollToTop}
        style={{
          position: "fixed",
          bottom: "140px",
          left: "50%",
          transform: showBackToTop ? "translate3d(-50%, 0, 0)" : "translate3d(-50%, 15px, 0)",
          background: "#333333",
          color: "#ffffff",
          border: "none",
          borderRadius: "30px",
          padding: "10px 22px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "750",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          cursor: "pointer",
          zIndex: 9999,
          opacity: showBackToTop ? 1 : 0,
          visibility: showBackToTop ? "visible" : "hidden",
          transition: "opacity 300ms ease, transform 300ms ease, visibility 300ms ease",
          outline: "none"
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "1.5px solid #ffffff",
            boxSizing: "border-box"
          }}
        >
          <ArrowUp size={12} strokeWidth={3} />
        </span>
        <span>Back to top</span>
      </button>
    </div>
  );
}
