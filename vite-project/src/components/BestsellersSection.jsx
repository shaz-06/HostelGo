import React from "react";
import { useNavigate } from "react-router-dom";
import { cachedFetch } from "../utils/apiCache";

export default function BestsellersSection() {
  const navigate = useNavigate();
  const [bestsellers, setBestsellers] = React.useState([]);
  const [bestsellersLoading, setBestsellersLoading] = React.useState(true);

  React.useEffect(() => {
    cachedFetch((window.API_BASE_URL || "") + "/api/products/bestsellers")
      .then((data) => {
        const updated = (data || []).map(item => {
          if (item.slug === "fresh-vegetables" && item.previewImages) {
            const overriddenImages = [...item.previewImages];
            if (overriddenImages.length >= 2) {
              overriddenImages[1] = "https://res.cloudinary.com/dshelwy43/image/upload/v1783186386/11038303-2f61-4057-9957-afa933fef357_1045_1_hz61jf.jpg";
            }
            if (overriddenImages.length >= 3) {
              overriddenImages[2] = "https://res.cloudinary.com/dshelwy43/image/upload/v1783179725/cd81bcb8-cc78-4372-9a1e-eefb25be9d87_262849_1_rfwy06.jpg";
            }
            return { ...item, previewImages: overriddenImages };
          }
          if (item.slug === "chips-and-namkeens" && item.previewImages) {
            const overriddenImages = [...item.previewImages];
            if (overriddenImages.length >= 1) {
              overriddenImages[0] = "https://res.cloudinary.com/dshelwy43/image/upload/v1783399740/0f5702da-10d7-4742-ad6b-5e31a1073d85_9098WZL1A1_MN_17122025_s0e4kj.png";
            }
            if (overriddenImages.length >= 2) {
              overriddenImages[1] = "https://res.cloudinary.com/dshelwy43/image/upload/v1783399693/e2d9d163-6439-4cf1-bb52-ef5efed7303a_3845_1_yiheiw.jpg";
            }
            if (overriddenImages.length >= 3) {
              overriddenImages[2] = "https://res.cloudinary.com/dshelwy43/image/upload/v1783243360/b654b666-43b5-4599-9919-98f9c7a924e9_cf31e6c0-a70b-4415-b702-3a622d866898_mijtiv.png";
            }
            if (overriddenImages.length >= 4) {
              overriddenImages[3] = "https://res.cloudinary.com/dshelwy43/image/upload/v1783157132/69cddaed-be9a-4908-ac75-0c514bf85eaf_XRIHO46WUM_1_27714783-6e28-4629-a4b3-4c8e7a8cd98c_dx8ryn.png";
            }
            return { ...item, previewImages: overriddenImages };
          }
          if (item.slug === "dairy-bread-and-eggs" && item.previewImages) {
            const overriddenImages = [...item.previewImages];
            if (overriddenImages.length >= 1) {
              overriddenImages[0] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290506/87310a53-66ae-4e51-9131-3e11591fcbfa_Q3L8WG2OTP_MN_17122025_gm8e09.png";
            }
            if (overriddenImages.length >= 2) {
              overriddenImages[1] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290515/e2c20e3f-023c-457c-913e-ef5e584143b7_M4XP8K9M1H_MN_16122025_qvfbvx.png";
            }
            if (overriddenImages.length >= 3) {
              overriddenImages[2] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290537/21404d65-3d9a-470e-96bf-5fb54a163fc0_PAYA6JI9LP_MN_17122025_umjsni.png";
            }
            if (overriddenImages.length >= 4) {
              overriddenImages[3] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290575/398ef2b4-3835-4fbf-b94b-1da3a2746f11_47FMPZMSHD_MN_17122025_xuxosm.png";
            }
            return { ...item, previewImages: overriddenImages };
          }
          if (item.slug === "oils-and-ghee" && item.previewImages) {
            const overriddenImages = [...item.previewImages];
            if (overriddenImages.length >= 1) {
              overriddenImages[0] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290850/62f8f22f-2cf4-42f9-b395-64183c5a4e6c_ZJ717X5W4Y_MN_18022026_y89h0b.png";
            }
            if (overriddenImages.length >= 2) {
              overriddenImages[1] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290855/a54d1b9a-f1a9-4846-a24a-66208271590c_266_1_hjrdjj.png";
            }
            if (overriddenImages.length >= 3) {
              overriddenImages[2] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290879/d014f2cf-7bd9-4a87-9090-2daccd259f8b_ZCMSGFWHMU_MN_18022026_rv5wzg.png";
            }
            if (overriddenImages.length >= 4) {
              overriddenImages[3] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786290896/52d5ab71-f66d-44de-984c-92f90e03fbac_QJB6JP3LGF_MN_18022026_syo5xs.png";
            }
            return { ...item, previewImages: overriddenImages };
          }
          if (item.slug === "cold-drinks-and-juices" && item.previewImages) {
            const overriddenImages = [...item.previewImages];
            if (overriddenImages.length >= 1) {
              overriddenImages[0] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291220/01fa96d0-82b1-4526-950a-f7537fded5d7_973416_1_q9bbyh.png";
            }
            if (overriddenImages.length >= 2) {
              overriddenImages[1] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291252/27ab369b-35f1-4d0a-9475-426e9eb89312_UEN0486EBM_tagged_qytd2p.png";
            }
            if (overriddenImages.length >= 3) {
              overriddenImages[2] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291262/54579e09-c4b4-4c02-8e2b-cc7c67be51e2_X79SWFOHGH_tagged_qjtwuh.png";
            }
            if (overriddenImages.length >= 4) {
              overriddenImages[3] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291287/47f800e4-3c64-4894-8642-a6d2c2629ed7_S1DCB6HNUV_tagged_itfyyq.png";
            }
            return { ...item, previewImages: overriddenImages };
          }
          if (item.slug === "ice-creams-and-desserts" && item.previewImages) {
            const overriddenImages = [...item.previewImages];
            if (overriddenImages.length >= 1) {
              overriddenImages[0] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291582/9f95e648-dd91-47f4-b862-6e1a7003b93e_U2K15F2FRX_MN_11022026_jf7lro.png";
            }
            if (overriddenImages.length >= 2) {
              overriddenImages[1] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291591/6d221ffc-fab0-4f74-bc7e-ed13ab6458c4_1_ccd9fa8d-683d-4856-b495-3c4e1682bfff_upg3a4.png";
            }
            if (overriddenImages.length >= 3) {
              overriddenImages[2] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291604/1d55e61b-379b-4fa1-97fe-cd4507e0b274_NPI-129480_1_20260424_095220_r4ncvh.png";
            }
            if (overriddenImages.length >= 4) {
              overriddenImages[3] = "https://res.cloudinary.com/dshelwy43/image/upload/v1786291626/75538383-ec7f-43a5-af42-4fb31d5ff5c2_7623_1_fcvtvs.jpg";
            }
            return { ...item, previewImages: overriddenImages };
          }
          return item;
        });
        setBestsellers(updated);
        setBestsellersLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load bestsellers:", err);
        setBestsellersLoading(false);
      });
  }, []);

  const handleCardClick = (slug) => {
    navigate(`/category/${slug}`);
  };

  if (bestsellersLoading || bestsellers.length === 0) {
    return null;
  }

  return (
    <div
      className="bestsellers-container"
      style={{
        borderRadius: "24px",
        padding: "20px 16px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        background: "#FFFFFF",
        border: "1px solid #f3f4f6"
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "900",
          color: "#111827",
          margin: 0,
          paddingLeft: "4px"
        }}
        className="bestsellers-heading"
      >
        Bestsellers
      </h2>
      <div className="bestsellers-grid">
        {bestsellers.map((item) => {
          const displayCount = item.count - item.previewImages.length;
          return (
            <div
              key={item.name}
              onClick={() => handleCardClick(item.slug)}
              className="bestseller-item group"
            >
              <div className="bestseller-card">
                <div className="bestseller-collage">
                  {item.previewImages.slice(0, 4).map((imgUrl, index) => (
                    <div key={index} className="bestseller-collage-img-wrapper">
                      <img
                        src={imgUrl}
                        alt=""
                        className="bestseller-collage-img"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {item.previewImages.length < 4 && 
                    [...Array(4 - item.previewImages.length)].map((_, idx) => (
                      <div key={`empty-${idx}`} className="bestseller-collage-img-wrapper-empty" />
                    ))
                  }
                </div>
                {displayCount > 0 && (
                  <div className="bestseller-more-pill">
                    +{displayCount} more
                  </div>
                )}
              </div>
              <h3 className="bestseller-text">{item.name}</h3>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dark .bestsellers-container {
          background: transparent !important;
          border-color: #1f2937 !important;
        }

        .bestsellers-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          column-gap: 12px;
          row-gap: 20px;
        }

        .bestseller-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          box-sizing: border-box;
          text-decoration: none;
        }

        .bestseller-card {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 300ms ease;
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid #f1f5f9;
          position: relative;
          padding: 8px;
        }

        .dark .bestseller-card {
          background-color: #1f2937;
          border-color: #374151;
        }

        .bestseller-item:hover .bestseller-card {
          transform: translateY(-4px);
        }

        .bestseller-collage {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 6px;
          width: 100%;
          height: 100%;
        }

        .bestseller-collage-img-wrapper {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #f1f5f9;
        }

        .dark .bestseller-collage-img-wrapper {
          background: #111827;
          border-color: #374151;
        }

        .bestseller-collage-img-wrapper-empty {
          background: transparent;
        }

        .bestseller-collage-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .bestseller-more-pill {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.95);
          color: #374151;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          white-space: nowrap;
          border: 1px solid #e5e7eb;
        }

        .dark .bestseller-more-pill {
          background: rgba(31, 41, 55, 0.95);
          color: #f3f4f6;
          border-color: #4b5563;
        }

        .bestsellers-heading {
          color: #111827;
        }

        .dark .bestsellers-heading {
          color: #f3f4f6 !important;
        }

        .bestseller-text {
          font-size: 14.5px;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.25;
          text-align: center;
          margin: 10px 0 0 0;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .dark .bestseller-text {
          color: #f3f4f6 !important;
        }

        @media (max-width: 767px) {
          .bestsellers-container {
            margin: 12px 16px;
          }
          .bestsellers-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            column-gap: 10px;
            row-gap: 16px;
          }
          .bestseller-card {
            border-radius: 14px;
            padding: 6px;
          }
          .bestseller-collage {
            gap: 4px;
          }
          .bestseller-collage-img-wrapper {
            border-radius: 6px;
          }
          .bestseller-more-pill {
            bottom: 8px;
            padding: 3px 8px;
            font-size: 10px;
          }
          .bestseller-text {
            font-size: 13px;
            margin-top: 8px;
            min-height: 32px;
          }
        }

        @media (min-width: 768px) {
          .bestsellers-container {
            margin: 0 0 24px 0;
            padding: 20px 24px;
          }
          .bestsellers-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            column-gap: 18px;
            row-gap: 28px;
          }
          .bestseller-card {
            border-radius: 22px;
          }
          .bestseller-text {
            font-size: 17.5px;
            margin-top: 12px;
            min-height: 44px;
          }
        }
      ` }} />
    </div>
  );
}
