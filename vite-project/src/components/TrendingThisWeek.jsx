import React from "react";
import { useNavigate } from "react-router-dom";

const trendingItems = [
  {
    title: "Atta Fest",
    offer: "Flat 15% OFF",
    bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    titleColor: "#92400e",
    offerColor: "#b45309",
    image: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=200&auto=format&fit=crop&q=80",
    route: "/category/atta-rice-and-dal"
  },
  {
    title: "Stone Fruit Festival",
    offer: "Freshly Picked",
    bg: "linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)",
    titleColor: "#c53030",
    offerColor: "#e53e3e",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80",
    route: "/category/fresh-fruits"
  },
  {
    title: "Dairy Coolers",
    offer: "Up to 30% OFF",
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    titleColor: "#1e40af",
    offerColor: "#2563eb",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&auto=format&fit=crop&q=80",
    route: "/category/dairy-bread-eggs"
  },
  {
    title: "Sustainable Living",
    offer: "100% Organic",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    titleColor: "#166534",
    offerColor: "#16a34a",
    image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=200&auto=format&fit=crop&q=80",
    route: "/category/fresh-vegetables"
  },
  {
    title: "Glass Skin Glow",
    offer: "Min. 25% OFF",
    bg: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
    titleColor: "#9d174d",
    offerColor: "#db2777",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80",
    route: "/category/skin-care"
  },
  {
    title: "Summer Appliances",
    offer: "Super Saver Deals",
    bg: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
    titleColor: "#0f766e",
    offerColor: "#0d9488",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&auto=format&fit=crop&q=80",
    route: "/category/mobiles-electronics"
  }
];

export default function TrendingThisWeek() {
  const navigate = useNavigate();

  return (
    <div className="trending-this-week-section">
      <h3 className="trending-this-week-title">Trending This Week 🔥</h3>
      <div className="trending-cards-scroll-container hide-scrollbar">
        {trendingItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.route)}
            className="trending-promo-card"
            style={{ background: item.bg }}
          >
            {/* Left Column: Text & Offer */}
            <div className="trending-promo-card-left">
              <span className="trending-promo-card-title" style={{ color: item.titleColor }}>
                {item.title}
              </span>
              <span className="trending-promo-card-offer" style={{ color: item.offerColor }}>
                {item.offer}
              </span>
            </div>

            {/* Right Column: Image */}
            <div className="trending-promo-card-right">
              <img
                src={item.image}
                alt={item.title}
                className="trending-promo-card-img"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .trending-this-week-section {
          padding: 16px 0;
          font-family: 'Outfit', 'Inter', sans-serif;
          background: #ffffff;
          border-radius: 24px;
          margin-bottom: 16px;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .trending-this-week-title {
          font-size: 18px;
          fontWeight: 900;
          color: #111827;
          margin: 0 0 16px 0;
          padding-left: 4px;
        }

        .trending-cards-scroll-container {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 4px 12px 4px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .trending-cards-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .trending-promo-card {
          flex: 0 0 240px;
          height: 105px;
          border-radius: 20px;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          scroll-snap-align: start;
          box-sizing: border-box;
          border: 1px solid rgba(0, 0, 0, 0.03);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        }

        .trending-promo-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
        }

        .trending-promo-card-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: left;
          flex: 1.2;
          overflow: hidden;
        }

        .trending-promo-card-title {
          font-size: 15px;
          font-weight: 870;
          line-height: 1.2;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .trending-promo-card-offer {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2px;
          text-transform: uppercase;
        }

        .trending-promo-card-right {
          flex: 0.8;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .trending-promo-card-img {
          width: 76px;
          height: 76px;
          object-fit: contain;
          border-radius: 10px;
          mix-blend-mode: multiply;
        }

        @media (max-width: 767px) {
          .trending-this-week-section {
            padding: 12px 16px;
            margin: 0;
            border-radius: 0;
            background: #ffffff;
            border-bottom: 1.5px solid #f3f4f6;
          }
          .trending-this-week-title {
            font-size: 15px;
            font-weight: 850;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .trending-promo-card {
            flex: 0 0 200px;
            height: 90px;
            padding: 10px 12px;
            border-radius: 16px;
          }
          .trending-promo-card-title {
            font-size: 13px;
          }
          .trending-promo-card-offer {
            font-size: 10px;
          }
          .trending-promo-card-img {
            width: 62px;
            height: 62px;
          }
        }
      `}</style>
    </div>
  );
}
