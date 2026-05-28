import React from "react";
import { useNavigate } from "react-router-dom";

const categorySections = [
  {
    title: "Fresh items 🥦",
    items: [
      { name: "Fresh Vegetables", emoji: "🥦", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=150", filter: "The Veggie Store", bg: "#eefaf2" },
      { name: "Fresh Fruits", emoji: "🍎", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=150", filter: "The Fruit Store", bg: "#fff5f5" },
      { name: "Dairy, Bread & Eggs", emoji: "🥛", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=150", filter: "Dairy, Bread & Eggs", bg: "#f0f7ff" },
      { name: "Meat and Seafood", emoji: "🥩", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=150", filter: "Meat and Seafood", bg: "#fff7ed" },
    ]
  },
  {
    title: "Grocery & Kitchen 🌾",
    items: [
      { name: "Atta, Rice and Dal", emoji: "🌾", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150", filter: "Atta, Rice and Dal", bg: "#fafaf9" },
      { name: "Masalas", emoji: "🌶️", image: "https://images.unsplash.com/photo-1596790011460-9d89e51d0342?w=150", filter: "Masalas", bg: "#fef2f2" },
      { name: "Oils and Ghee", emoji: "🧈", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150", bg: "#fefce8" },
      { name: "Cereals & Breakfast", emoji: "🥣", image: "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=150", bg: "#f5f3ff" },
    ]
  },
  {
    title: "Snacks & drinks 🥤",
    items: [
      { name: "Cold Drinks and Juices", emoji: "🥤", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150", filter: "Beverages", bg: "#ecfeff" },
      { name: "Ice Creams & Desserts", emoji: "🍦", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150", filter: "Dairy, Bread & Eggs", bg: "#fff1f2" },
      { name: "Chips and Namkeens", emoji: "🍟", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=150", filter: "Snacks", bg: "#fef2f2" },
      { name: "Chocolates", emoji: "🍫", image: "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=150", filter: "Snacks", bg: "#fff7ed" },
      { name: "Biscuits and Cakes", emoji: "🍪", image: "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=150", filter: "Snacks", bg: "#fafaf9" },
      { name: "Tea, Coffee & Drinks", emoji: "☕", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150", filter: "Beverages", bg: "#fffbeb" },
      { name: "Sauces and Spreads", emoji: "🥫", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150", filter: "Premium Pickles", bg: "#fef2f2" },
      { name: "Sweet Corner", emoji: "🍬", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=150", bg: "#fff7ed" },
    ]
  },
  {
    title: "Beauty & Wellness 💅",
    items: [
      { name: "Bath and Body", emoji: "🧼", image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=150", bg: "#fdf2f8" },
      { name: "Hair Care", emoji: "🧴", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150", bg: "#ecfdf5" },
      { name: "Skincare", emoji: "💄", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150", bg: "#fdf2f8" },
      { name: "Health and Pharma", emoji: "💊", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=150", filter: "Sexual Wellness", bg: "#f0fdf4" },
    ]
  },
  {
    title: "Household & Lifestyle 🍳",
    items: [
      { name: "Home and Kitchen", emoji: "🍳", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150", bg: "#fafaf9" },
      { name: "Puja Store", emoji: "🕉️", image: "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=150", bg: "#fffbeb" },
      { name: "Cleaners & Repellents", emoji: "🧹", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150", filter: "Cleaners & Repellents", bg: "#f0f9ff" },
      { name: "Electronics & Appliances", emoji: "🎧", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150", bg: "#f8fafc" },
    ]
  }
];

function CategoryGridNavigator({ setSelectedCategory, windowWidth }) {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    const name = item.name.toLowerCase().trim().replace(/[.,]/g, "");
    if (name === "fresh vegetables") {
      navigate("/section/veggies");
    } else if (name === "fresh fruits") {
      navigate("/section/fruits");
    } else if (name === "dairy bread & eggs") {
      navigate("/section/dairy");
    } else if (name === "meat and seafood") {
      navigate("/section/meat");
    } else if (name === "atta rice and dal") {
      navigate("/section/grocery");
    } else if (name === "masalas") {
      navigate("/section/masalas");
    } else if (name === "oils and ghee") {
      navigate("/section/oils-ghee");
    } else if (name === "cereals & breakfast") {
      navigate("/section/cereals-breakfast");
    } else if (name === "cold drinks and juices") {
      navigate("/section/cold-drinks");
    } else if (name === "ice creams & desserts") {
      navigate("/section/ice-cream");
    } else if (name === "chips and namkeens") {
      navigate("/section/chips-namkeens");
    } else if (name === "chocolates") {
      navigate("/section/chocolates");
    } else if (name === "biscuits and cakes") {
      navigate("/section/biscuits-cakes");
    } else if (name === "tea coffee & drinks") {
      navigate("/section/tea-coffee");
    } else if (name === "sauces and spreads") {
      navigate("/section/sauces-spreads");
    } else if (name === "sweet corner") {
      navigate("/section/sweet-corner");
    } else if (name === "bath and body") {
      navigate("/section/bath-body");
    } else if (name === "hair care") {
      navigate("/section/hair-care");
    } else if (name === "skincare") {
      navigate("/section/skincare");
    } else if (name === "health and pharma") {
      navigate("/section/health-pharma");
    } else if (name === "home and kitchen") {
      navigate("/section/home-kitchen");
    } else if (name === "puja store") {
      navigate("/section/puja-store");
    } else if (name === "cleaners & repellents") {
      navigate("/section/cleaners-repellents");
    } else if (name === "electronics & appliances") {
      navigate("/section/electronics-appliances");
    } else if (item.filter) {
      setSelectedCategory(item.filter);
      // Smooth scroll to product listings
      const listingsEl = document.getElementById("product-listings-anchor");
      if (listingsEl) {
        listingsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      alert(`Coming soon to Buyto Instant! 🚀 We are expanding our local inventory for ${item.name} in real-time.`);
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "24px",
        padding: windowWidth < 768 ? "16px" : "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        border: "1px solid #f3f4f6",
        marginBottom: "32px",
      }}
    >
      <h2
        style={{
          fontSize: windowWidth < 768 ? "20px" : "24px",
          fontWeight: "900",
          color: "#111827",
          margin: "0 0 8px 0",
          letterSpacing: "-0.5px",
        }}
      >
        Shop by Category 🛍️
      </h2>
      <p
        style={{
          fontSize: windowWidth < 768 ? "12px" : "14px",
          color: "#6b7280",
          margin: "0 0 24px 0",
          fontWeight: "600",
        }}
      >
        Superfast 10-minute delivery to your doorstep!
      </p>

      {categorySections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: "28px" }}>
          <h3
            style={{
              fontSize: windowWidth < 768 ? "14px" : "16px",
              fontWeight: "850",
              color: "#374151",
              margin: "0 0 12px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {section.title}
          </h3>

          <div
            style={{
              display: "flex",
              gap: windowWidth < 768 ? "12px" : "16px",
              overflowX: "auto",
              paddingBottom: "12px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="hide-scrollbar"
          >
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                onClick={() => handleItemClick(item)}
                style={{
                  background: item.bg,
                  width: windowWidth < 768 ? "110px" : "135px",
                  height: windowWidth < 768 ? "130px" : "160px",
                  borderRadius: "20px",
                  padding: windowWidth < 768 ? "10px" : "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxSizing: "border-box",
                  border: "1px solid rgba(0,0,0,0.02)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.01)",
                  transition: "all 0.2s ease-in-out",
                }}
                className="hover:-translate-y-1 hover:shadow-md transition-all duration-200"
              >
                <div
                  style={{
                    width: "100%",
                    height: "65%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "10px",
                    }}
                  />
                </div>

                <span
                  style={{
                    fontSize: windowWidth < 768 ? "10px" : "12px",
                    fontWeight: "800",
                    color: "#374151",
                    textAlign: "center",
                    lineHeight: "1.2",
                    height: "30%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CategoryGridNavigator;
