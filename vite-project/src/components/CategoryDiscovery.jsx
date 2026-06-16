import React from "react";
import { useNavigate } from "react-router-dom";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";

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
    title: "Shop by Store",
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

export default function CategoryDiscovery({ products = [] }) {
  const navigate = useNavigate();

  const handleCardClick = (name) => {
    const slug = generateSlug(name);
    console.log("Category Discovery Clicked:", name, "Slug:", slug);
    navigate(`/category/${slug}`);
  };

  const dynamicSections = React.useMemo(() => {
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
        background: "#FFFFFF",
        borderRadius: "24px",
        padding: "20px 0",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
        marginBottom: "24px"
      }}
    >
      {dynamicSections.map((section) => (
        <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "900",
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
                className="category-discovery-card"
              >
                <div
                  className="category-discovery-image-wrapper"
                  style={{
                    background: section.isStore 
                      ? "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)" 
                      : "#f3f4f6"
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="category-discovery-img"
                    loading="lazy"
                  />
                </div>
                <span className="category-discovery-text">
                  {item.name}
                  {item.count > 0 && ` (${item.count})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <style>{`
        .category-discovery-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .category-discovery-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-discovery-card:hover {
          transform: translateY(-2px);
        }

        .category-discovery-image-wrapper {
          width: 100%;
          aspect-ratio: 80/72;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          border: 1px solid rgba(0, 0, 0, 0.01);
          background-color: #f3f4f6;
        }

        .category-discovery-img {
          width: 66px;
          height: 61px;
          max-width: 85%;
          max-height: 85%;
          object-fit: contain;
          transition: transform 0.2s ease-in-out;
        }

        .category-discovery-card:hover .category-discovery-img {
          transform: scale(1.05);
        }

        .category-discovery-text {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-align: center;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          min-height: 30px;
          padding: 0 2px;
        }

        @media (min-width: 768px) {
          .category-discovery-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 18px;
          }
          .category-discovery-text {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
