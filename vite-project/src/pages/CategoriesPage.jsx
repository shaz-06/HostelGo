import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";

const getCategoryGradient = (name, isStore = false) => {
  if (isStore) {
    return "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)";
  }

  const lower = name.toLowerCase();

  if (lower.includes("vegetable"))
    return "linear-gradient(180deg,#F7FDEB,#EAF7D7)";

  if (lower.includes("fruit"))
    return "linear-gradient(180deg,#FFF5E6,#FFE8CC)";

  if (lower.includes("dairy"))
    return "linear-gradient(180deg,#FFFDF5,#FFF5D6)";

  if (
    lower.includes("meat") ||
    lower.includes("seafood")
  )
    return "linear-gradient(180deg,#FFF1F1,#FFE3E3)";

  if (
    lower.includes("snack") ||
    lower.includes("sweet") ||
    lower.includes("chocolate")
  )
    return "linear-gradient(180deg,#FFF7E8,#FFE9BF)";

  return "linear-gradient(180deg,#F7FDEB,#EAF7D7)";
};

const getCategoryBadge = (name, isStore = false) => {
  if (isStore) return "Best Seller";

  const lower = name.toLowerCase();

  if (lower.includes("vegetable")) return "Organic";
  if (lower.includes("fruit")) return "Fresh";
  if (lower.includes("dairy")) return "Daily";
  if (
    lower.includes("meat") ||
    lower.includes("seafood")
  )
    return "Premium";
  if (lower.includes("sweet")) return "Trending";
  if (lower.includes("drink")) return "Chilled";
  if (lower.includes("paan")) return "New";

  return "Popular";
};

const discoverySections = [
  {
    title: "Grocery & Kitchen",
    items: [
      { name: "Fresh Vegetables", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=150&auto=format&fit=crop&q=80" },
      { name: "Fresh Fruits", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=150&auto=format&fit=crop&q=80" },
      { name: "Dairy, Bread & Eggs", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=150&auto=format&fit=crop&q=80" },
      { name: "Meat & Seafood", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=150&auto=format&fit=crop&q=80" },
    ]
  },
  {
    title: "Snacks & Drinks",
    items: [
      { name: "Cold Drinks & Juices", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80" },
      { name: "Ice Creams & Frozen Desserts", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&auto=format&fit=crop&q=80" },
      { name: "Chips & Namkeens", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=150&auto=format&fit=crop&q=80" },
      { name: "Chocolates", image: "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=150&auto=format&fit=crop&q=80" },
      { name: "Noodles, Pasta & Vermicelli", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&auto=format&fit=crop&q=80" },
      { name: "Frozen Food", image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=150&auto=format&fit=crop&q=80" },
      { name: "Sweet Corner", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=150&auto=format&fit=crop&q=80" },
      { name: "Paan Corner", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=150&auto=format&fit=crop&q=80" },
    ]
  },
  {
    title: "Beauty & Wellness",
    items: [
      { name: "Bath & Body", image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150&auto=format&fit=crop&q=80" },
      { name: "Hair Care", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150&auto=format&fit=crop&q=80" },
      { name: "Skin Care", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80" },
      { name: "Makeup", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80" },
      { name: "Oral Care", image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=150&auto=format&fit=crop&q=80" },
      { name: "Grooming", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=150&auto=format&fit=crop&q=80" },
      { name: "Baby Care", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=150&auto=format&fit=crop&q=80" },
      { name: "Fragrances", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=150&auto=format&fit=crop&q=80" },
      { name: "Protein & Supplements", image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=150&auto=format&fit=crop&q=80" },
      { name: "Feminine Hygiene", image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=150&auto=format&fit=crop&q=80" },
      { name: "Sexual Wellness", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150&auto=format&fit=crop&q=80" },
      { name: "Health & Pharma", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80" },
    ]
  },
  {
    title: "Household & Lifestyle",
    items: [
      { name: "Home & Furnishing", image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150&auto=format&fit=crop&q=80" },
      { name: "Kitchen & Dining", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&auto=format&fit=crop&q=80" },
      { name: "Cleaning Essentials", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&auto=format&fit=crop&q=80" },
      { name: "Clothing", image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=150&auto=format&fit=crop&q=80" },
      { name: "Mobiles & Electronics", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80" },
      { name: "Appliances", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=80" },
      { name: "Books & Stationery", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&auto=format&fit=crop&q=80" },
      { name: "Jewellery & Accessories", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80" },
    ]
  },
  {
    title: "Electronics & Appliances",
    items: [
      { name: "Puja", image: "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=150&auto=format&fit=crop&q=80" },
      { name: "Toys & Games", image: "https://images.unsplash.com/photo-1537655780520-1e392edd816a?w=150&auto=format&fit=crop&q=80" },
      { name: "Sports & Fitness", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80" },
      { name: "Pet Supplies", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80" },
    ]
  },
  {
    title: "Shop By Store",
    isStore: true,
    items: [
      { name: "Book Store", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&auto=format&fit=crop&q=80" },
      { name: "The Noice Store", image: "https://images.unsplash.com/photo-1558089687-f282ffcbd1d5?w=150&auto=format&fit=crop&q=80" },
      { name: "Health Hub", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=150&auto=format&fit=crop&q=80" },
      { name: "Sports & Fitness Store", image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=150&auto=format&fit=crop&q=80" },
      { name: "Instadrops Store", image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=150&auto=format&fit=crop&q=80" },
      { name: "Summer Store", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80" },
      { name: "Gourmet Store", image: "https://images.unsplash.com/photo-1534080391025-097d5c128f40?w=150&auto=format&fit=crop&q=80" },
      { name: "Travel Store", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&auto=format&fit=crop&q=80" },
    ]
  }
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

export default function CategoriesPage({ products = [], searchQuery = "", setSearchQuery = () => {} }) {
  const navigate = useNavigate();
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


  // Staggered placeholder rotation
  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isFocused]);

  const handleCardClick = (name) => {
    const slug = generateSlug(name);
    console.log("Categories Page Clicked:", name, "Slug:", slug);
    navigate(`/category/${slug}`);
  };

  const dynamicSections = useMemo(() => {
    return discoverySections.map(section => {
      const updatedItems = section.items.map(item => {
        const itemCanonical = canonicalCategory(item.name);

        // Find all products matching this item
        const matchingProducts = (products || []).filter(p => {
          const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
          return classified === itemCanonical;
        });

        // First available product image OR fallback to cover image
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
        background: "#F7F8FA",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        boxSizing: "border-box",
        paddingBottom: "80px"
      }}
    >
      {/* Sticky Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "white",
          borderBottom: "1px solid #f0f0f0",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          padding: "16px 20px",
          gap: "16px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#1f2937",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ←
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "800",
            color: "#1f2937",
          }}
        >
          Categories
        </h1>
      </header>

      {/* Full-width Search Bar */}
      <div style={{ padding: "12px 16px", background: "white", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="text"
            placeholder=""
            value={localQuery}
            onChange={(e) => {
              const val = e.target.value;
              setLocalQuery(val);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              background: "#F3F4F6",
              borderRadius: "24px",
              padding: "12px 40px",
              width: "100%",
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              color: "#1f2937",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
          {(!localQuery && !isFocused) && (
            <div
              style={{
                position: "absolute",
                left: "40px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#9ca3af",
                fontFamily: "inherit",
                height: "24px",
                overflow: "hidden"
              }}
            >
              <span>Search for&nbsp;</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `translateY(-${searchIndex * 24}px)`,
                  height: "24px"
                }}
              >
                {searchSuggestions.map((sug, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: "24px",
                      lineHeight: "24px",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    '{sug}'
                  </span>
                ))}
              </div>
            </div>
          )}
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", alignItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </div>
      </div>

      {/* Category Sections */}
      <main style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "28px" }}>
        {dynamicSections.map((section) => (
          <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: "850",
                color: "#111827",
                margin: 0,
                paddingLeft: "4px"
              }}
            >
              {section.title}
            </h2>
            <div className="category-discovery-grid">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleCardClick(item.name)}
                  className="category-discovery-card group"
                  style={{
                    background: getCategoryGradient(item.name, section.isStore),
                    boxShadow: "0 4px 20px rgba(49, 134, 22, 0.08)"
                  }}
                >
                  <span className="category-discovery-badge">
                    {getCategoryBadge(item.name, section.isStore)}
                  </span>
                  <div className="category-discovery-image-wrapper">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="category-discovery-img"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="category-discovery-text">{item.name}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <style>{`
        .category-discovery-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          background: white;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
        }

        .category-discovery-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          border-radius: 28px;
          border: 1px solid #DCECC7;
          transition: all 300ms ease;
          padding: 16px;
          gap: 12px;
          position: relative;
          box-sizing: border-box;
        }

        .category-discovery-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(49, 134, 22, 0.15) !important;
        }

        .category-discovery-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.9);
          color: #318616;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 99px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          z-index: 5;
        }

        .category-discovery-image-wrapper {
          width: 64px; /* w-16 */
          height: 64px; /* h-16 */
          border-radius: 16px; /* rounded-2xl */
          background-color: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06); /* shadow-md */
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 300ms ease;
          z-index: 2;
        }

        .category-discovery-card:hover .category-discovery-image-wrapper {
          transform: scale(1.05);
        }

        .category-discovery-img {
          width: 48px; /* w-12 */
          height: 48px; /* h-12 */
          object-fit: contain;
          transition: transform 300ms ease;
        }

        .category-discovery-text {
          font-size: 11px;
          font-weight: 600;
          color: #1F2937;
          line-height: 1.3;
          text-align: center;
          margin: 0;
          word-break: break-word;
          min-height: 30px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          z-index: 2;
        }

        @media (min-width: 768px) {
          .category-discovery-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 18px;
          }
          .category-discovery-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
