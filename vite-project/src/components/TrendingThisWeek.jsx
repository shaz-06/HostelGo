import React from "react";
import { useNavigate } from "react-router-dom";

const trendingItems = [
  {
    title: "Atta Fest",
    offer: "FLAT 15% OFF",
    bg: "linear-gradient(135deg, #FFF8D6 0%, #FFF0B8 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783259120/9941b19b-02aa-49bb-b0e0-3f535408df84_T1LXCL506J_MN_15122025_iend15.png",
    route: "/category/atta-rice-and-dal"
  },
  {
    title: "Fruit Festival",
    offer: "FRESHLY PICKED",
    bg: "linear-gradient(135deg, #FFE7EA 0%, #FFD5D9 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783259296/feac5f4b-2040-40af-9c69-8099bdb70d87_T8FOQ65W90_MN_20112025_kwqbtb.jpg",
    route: "/category/fresh-fruits"
  },
  {
    title: "Dairy Coolers",
    offer: "UP TO 30% OFF",
    bg: "linear-gradient(135deg, #E8F1FF 0%, #D7E8FF 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243355/5b0984b8-303b-4a80-81b7-9656f1950b67_63aaae7c-1add-4357-8ae1-5a9662d6b240_jnbnil.png",
    route: "/category/dairy-bread-eggs"
  },
  {
    title: "Fresh Living",
    offer: "100% ORGANIC",
    bg: "linear-gradient(135deg, #FFF8D6 0%, #FFF0B8 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245595/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2_sbqlin.png",
    route: "/category/fresh-vegetables"
  },
  {
    title: "Skin Glow",
    offer: "MIN. 25% OFF",
    bg: "linear-gradient(135deg, #FFE7EA 0%, #FFD5D9 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243400/d6930a4e-6a3c-44c9-8b6b-86f63e20434a_0c08d4e2-6423-4a9e-ad4b-35b339a149b0_jgix4i.png",
    route: "/category/skin-care"
  },
  {
    title: "Coolers",
    offer: "SUPER SAVER DEALS",
    bg: "linear-gradient(135deg, #FFF2E1 0%, #FFE4BF 100%)",
    image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243351/5bec1f84-4aa5-49ae-9c3d-9a0dcb9fe2ad_d990b4fc-4629-4cc6-bc7a-ace787fb378a_uftkev.png",
    route: "/category/mobiles-electronics"
  }
];

export default function TrendingThisWeek() {
  const navigate = useNavigate();

  return (
    <div className="trending-this-week-section">
      <div className="trending-this-week-header">
        <div>
          <h2 className="trending-this-week-heading">Trending This Week</h2>
          <p className="trending-this-week-subheading">Top picks loved by students</p>
        </div>
        <button className="trending-view-all-btn" onClick={() => navigate("/categories")}>
          View All →
        </button>
      </div>

      <div className="trending-cards-scroll-container hide-scrollbar">
        {trendingItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.route)}
            className="trending-promo-card group"
            style={{ background: item.bg }}
          >
            {/* Decorative elements */}
            <div className="trending-blob-top" />
            <div className="trending-blob-bottom" />

            {/* Left Info Column */}
            <div className="trending-promo-card-left">
              <span className="trending-promo-card-badge">🔥 Limited Time</span>
              <h3 className="trending-promo-card-title">{item.title}</h3>
              <p className="trending-promo-card-offer">{item.offer}</p>
            </div>

            {/* Floating Product Image */}
            <div className="trending-promo-card-image-wrapper">
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
          padding: 20px;
          font-family: 'Outfit', 'Inter', sans-serif;
          background: #ffffff;
          border-radius: 32px;
          margin-bottom: 16px;
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #f3f4f6;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
        }

        .trending-this-week-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .trending-this-week-heading {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .trending-this-week-subheading {
          color: #6b7280;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .trending-view-all-btn {
          background: none;
          border: none;
          color: #318616;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s ease;
          outline: none;
          padding: 0;
        }

        .trending-view-all-btn:hover {
          transform: translateX(2px);
        }

        .trending-cards-scroll-container {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 4px 16px 4px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .trending-cards-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .trending-promo-card {
          flex: 0 0 300px;
          min-width: 300px;
          height: 170px;
          border-radius: 28px;
          padding: 20px;
          display: flex;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          scroll-snap-align: start;
          box-sizing: border-box;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.02);
        }

        .trending-promo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
        }

        /* Decorative Background Elements */
        .trending-blob-top {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 128px;
          height: 128px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
          pointer-events: none;
        }

        .trending-blob-bottom {
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
          pointer-events: none;
        }

        .trending-promo-card-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          text-align: left;
          flex: 1;
          z-index: 2;
        }

        .trending-promo-card-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .trending-promo-card-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px 0;
          line-height: 1.1;
        }

        .trending-promo-card-offer {
          font-size: 16px;
          font-weight: 700;
          color: #F59E0B;
          margin: 0;
          letter-spacing: 0.3px;
        }

        /* Floating Image Container */
        .trending-promo-card-image-wrapper {
          position: absolute;
          right: 16px;
          bottom: 16px;
          width: 96px; /* w-24 */
          height: 96px; /* h-24 */
          border-radius: 24px; /* rounded-3xl */
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: transform 300ms ease;
        }

        .trending-promo-card:hover .trending-promo-card-image-wrapper {
          transform: scale(1.05);
        }

        .trending-promo-card-img {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }

        @media (max-width: 767px) {
          .trending-this-week-section {
            padding: 16px;
            margin: 12px 16px;
            border-radius: 24px;
            border: 1px solid #f3f4f6;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          }

          .trending-this-week-heading {
            font-size: 20px;
          }

          .trending-this-week-subheading {
            font-size: 12px;
          }

          .trending-promo-card {
            flex: 0 0 260px;
            min-width: 260px;
            height: 150px;
            padding: 16px;
            border-radius: 24px;
          }

          .trending-promo-card-title {
            font-size: 20px;
          }

          .trending-promo-card-offer {
            font-size: 14px;
          }

          .trending-promo-card-image-wrapper {
            width: 80px;
            height: 80px;
            right: 12px;
            bottom: 12px;
          }

          .trending-promo-card-img {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </div>
  );
}
