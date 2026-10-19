import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cachedFetch } from "../../utils/apiCache";

const applyOverrides = (data) => {
  return (data || []).map((item) => {
    if (item.slug === "fresh-vegetables" && item.previewImages) {
      const overriddenImages = [...item.previewImages];
      if (overriddenImages.length >= 2) {
        overriddenImages[1] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1783186386/11038303-2f61-4057-9957-afa933fef357_1045_1_hz61jf.jpg";
      }
      if (overriddenImages.length >= 3) {
        overriddenImages[2] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1783179725/cd81bcb8-cc78-4372-9a1e-eefb25be9d87_262849_1_rfwy06.jpg";
      }
      return { ...item, previewImages: overriddenImages };
    }
    if (item.slug === "chips-and-namkeens" && item.previewImages) {
      const overriddenImages = [...item.previewImages];
      if (overriddenImages.length >= 1) {
        overriddenImages[0] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1783399740/0f5702da-10d7-4742-ad6b-5e31a1073d85_9098WZL1A1_MN_17122025_s0e4kj.png";
      }
      if (overriddenImages.length >= 2) {
        overriddenImages[1] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1783399693/e2d9d163-6439-4cf1-bb52-ef5efed7303a_3845_1_yiheiw.jpg";
      }
      if (overriddenImages.length >= 3) {
        overriddenImages[2] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1783243360/b654b666-43b5-4599-9919-98f9c7a924e9_cf31e6c0-a70b-4415-b702-3a622d866898_mijtiv.png";
      }
      if (overriddenImages.length >= 4) {
        overriddenImages[3] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1783157132/69cddaed-be9a-4908-ac75-0c514bf85eaf_XRIHO46WUM_1_27714783-6e28-4629-a4b3-4c8e7a8cd98c_dx8ryn.png";
      }
      return { ...item, previewImages: overriddenImages };
    }
    if (item.slug === "dairy-bread-and-eggs" && item.previewImages) {
      const overriddenImages = [...item.previewImages];
      if (overriddenImages.length >= 1) {
        overriddenImages[0] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290506/87310a53-66ae-4e51-9131-3e11591fcbfa_Q3L8WG2OTP_MN_17122025_gm8e09.png";
      }
      if (overriddenImages.length >= 2) {
        overriddenImages[1] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290515/e2c20e3f-023c-457c-913e-ef5e584143b7_M4XP8K9M1H_MN_16122025_qvfbvx.png";
      }
      if (overriddenImages.length >= 3) {
        overriddenImages[2] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290537/21404d65-3d9a-470e-96bf-5fb54a163fc0_PAYA6JI9LP_MN_17122025_umjsni.png";
      }
      if (overriddenImages.length >= 4) {
        overriddenImages[3] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290575/398ef2b4-3835-4fbf-b94b-1da3a2746f11_47FMPZMSHD_MN_17122025_xuxosm.png";
      }
      return { ...item, previewImages: overriddenImages };
    }
    if (item.slug === "oils-and-ghee" && item.previewImages) {
      const overriddenImages = [...item.previewImages];
      if (overriddenImages.length >= 1) {
        overriddenImages[0] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290850/62f8f22f-2cf4-42f9-b395-64183c5a4e6c_ZJ717X5W4Y_MN_18022026_y89h0b.png";
      }
      if (overriddenImages.length >= 2) {
        overriddenImages[1] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290855/a54d1b9a-f1a9-4846-a24a-66208271590c_266_1_hjrdjj.png";
      }
      if (overriddenImages.length >= 3) {
        overriddenImages[2] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290879/d014f2cf-7bd9-4a87-9090-2daccd259f8b_ZCMSGFWHMU_MN_18022026_rv5wzg.png";
      }
      if (overriddenImages.length >= 4) {
        overriddenImages[3] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786290896/52d5ab71-f66d-44de-984c-92f90e03fbac_QJB6JP3LGF_MN_18022026_syo5xs.png";
      }
      return { ...item, previewImages: overriddenImages };
    }
    if (item.slug === "cold-drinks-and-juices" && item.previewImages) {
      const overriddenImages = [...item.previewImages];
      if (overriddenImages.length >= 1) {
        overriddenImages[0] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291220/01fa96d0-82b1-4526-950a-f7537fded5d7_973416_1_q9bbyh.png";
      }
      if (overriddenImages.length >= 2) {
        overriddenImages[1] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291252/27ab369b-35f1-4d0a-9475-426e9eb89312_UEN0486EBM_tagged_qytd2p.png";
      }
      if (overriddenImages.length >= 3) {
        overriddenImages[2] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291262/54579e09-c4b4-4c02-8e2b-cc7c67be51e2_X79SWFOHGH_tagged_qjtwuh.png";
      }
      if (overriddenImages.length >= 4) {
        overriddenImages[3] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291287/47f800e4-3c64-4894-8642-a6d2c2629ed7_S1DCB6HNUV_tagged_itfyyq.png";
      }
      return { ...item, previewImages: overriddenImages };
    }
    if (item.slug === "ice-creams-and-desserts" && item.previewImages) {
      const overriddenImages = [...item.previewImages];
      if (overriddenImages.length >= 1) {
        overriddenImages[0] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291582/9f95e648-dd91-47f4-b862-6e1a7003b93e_U2K15F2FRX_MN_11022026_jf7lro.png";
      }
      if (overriddenImages.length >= 2) {
        overriddenImages[1] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291591/6d221ffc-fab0-4f74-bc7e-ed13ab6458c4_1_ccd9fa8d-683d-4856-b495-3c4e1682bfff_upg3a4.png";
      }
      if (overriddenImages.length >= 3) {
        overriddenImages[2] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291604/1d55e61b-379b-4fa1-97fe-cd4507e0b274_NPI-129480_1_20260424_095220_r4ncvh.png";
      }
      if (overriddenImages.length >= 4) {
        overriddenImages[3] =
          "https://res.cloudinary.com/dshelwy43/image/upload/v1786291626/75538383-ec7f-43a5-af42-4fb31d5ff5c2_7623_1_fcvtvs.jpg";
      }
      return { ...item, previewImages: overriddenImages };
    }
    return item;
  });
};

export default function BestsellersSection({ initialData = null }) {
  const navigate = useNavigate();
  const [bestsellers, setBestsellers] = React.useState(() =>
    applyOverrides(initialData),
  );
  const [bestsellersLoading, setBestsellersLoading] = React.useState(
    !initialData,
  );
  const [selectedCategory, setSelectedCategory] = React.useState(null);

  React.useEffect(() => {
    if (!selectedCategory) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedCategory(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCategory]);

  React.useEffect(() => {
    if (initialData && initialData.length > 0) {
      setBestsellers(applyOverrides(initialData));
      setBestsellersLoading(false);
      return;
    }
    cachedFetch((window.API_BASE_URL || "") + "/api/products/bestsellers")
      .then((data) => {
        setBestsellers(applyOverrides(data));
        setBestsellersLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load bestsellers:", err);
        setBestsellersLoading(false);
      });
  }, [initialData]);

  const handleCardClick = (item) => {
    setSelectedCategory(item);
  };

  if (bestsellersLoading || bestsellers.length === 0) {
    return (
      <div
        className="bestsellers-container skeleton-active"
        style={{
          borderRadius: "24px",
          padding: "20px 16px",
          fontFamily: "'Outfit', 'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          background: "#FFFFFF",
          border: "1px solid #f3f4f6",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "900",
            color: "#111827",
            margin: 0,
            paddingLeft: "4px",
          }}
          className="bestsellers-heading"
        >
          Bestsellers
        </h2>
        <div className="bestsellers-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bestseller-item"
              style={{ width: "100%" }}
            >
              <div
                className="bestseller-card skeleton-card"
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: "18px",
                  padding: "8px",
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                <div
                  className="bestseller-collage"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gridTemplateRows: "repeat(2, 1fr)",
                    gap: "6px",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div
                    className="bestseller-collage-img-wrapper skeleton-img"
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#e2e8f0",
                    }}
                  ></div>
                  <div
                    className="bestseller-collage-img-wrapper skeleton-img"
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#e2e8f0",
                    }}
                  ></div>
                  <div
                    className="bestseller-collage-img-wrapper skeleton-img"
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#e2e8f0",
                    }}
                  ></div>
                  <div
                    className="bestseller-collage-img-wrapper skeleton-img"
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#e2e8f0",
                    }}
                  ></div>
                </div>
              </div>
              <div
                className="skeleton-text"
                style={{
                  marginTop: "12px",
                  width: "70%",
                  height: "14px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "4px",
                  position: "relative",
                  overflow: "hidden",
                }}
              ></div>
            </div>
          ))}
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .skeleton-card {
            background-color: #f8fafc !important;
            border: 1px solid #f1f5f9 !important;
          }
          .dark .skeleton-card {
            background-color: #1f2937 !important;
            border-color: #374151 !important;
          }
          .skeleton-img {
            background-color: #e2e8f0 !important;
          }
          .dark .skeleton-img {
            background-color: #374151 !important;
          }
          .skeleton-text {
            background-color: #e2e8f0 !important;
          }
          .dark .skeleton-text {
            background-color: #374151 !important;
          }
          /* Shimmer animation keyframes and classes */
          .skeleton-active .skeleton-card::after,
          .skeleton-active .skeleton-img::after,
          .skeleton-active .skeleton-text::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.6) 60%, rgba(255,255,255,0) 100%);
            animation: shimmer 1.5s infinite;
          }
          .dark .skeleton-active .skeleton-card::after,
          .dark .skeleton-active .skeleton-img::after,
          .dark .skeleton-active .skeleton-text::after {
            background-image: linear-gradient(90deg, rgba(31,41,55,0) 0%, rgba(31,41,55,0.3) 20%, rgba(31,41,55,0.5) 60%, rgba(31,41,55,0) 100%);
          }
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `,
          }}
        />
      </div>
    );
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
        border: "1px solid #f3f4f6",
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "900",
          color: "#111827",
          margin: 0,
          paddingLeft: "4px",
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
              onClick={() => handleCardClick(item)}
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
                        style={
                          item.slug === "fresh-vegetables"
                            ? { objectFit: "cover", transform: "scale(1.15)" }
                            : {}
                        }
                      />
                    </div>
                  ))}
                  {item.previewImages.length < 4 &&
                    [...Array(4 - item.previewImages.length)].map((_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className="bestseller-collage-img-wrapper-empty"
                      />
                    ))}
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

      {selectedCategory &&
        createPortal(
          <div
            className="bestseller-drawer-overlay"
            onClick={() => setSelectedCategory(null)}
            role="presentation"
          >
            <button
              type="button"
              className="bestseller-drawer-close-floating"
              onClick={() => setSelectedCategory(null)}
              aria-label="Close category drawer"
            >
              ×
            </button>
            <section
              className="bestseller-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedCategory.name} category`}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="bestseller-drawer-titlebar">
                <h2>
                  {selectedCategory.name === "Fresh Vegetables"
                    ? "Vegetables, Fruits & More"
                    : selectedCategory.name}
                </h2>
              </header>
              <div className="bestseller-drawer-body">
                <nav
                  className="bestseller-category-sidebar"
                  aria-label="Categories"
                >
                  {bestsellers.map((category) => (
                    <button
                      type="button"
                      key={category.slug || category.name}
                      className={`bestseller-sidebar-category ${
                        selectedCategory.slug === category.slug
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <span className="bestseller-sidebar-thumb">
                        {category.previewImages?.[0] && (
                          <img
                            src={category.previewImages[0]}
                            alt=""
                            loading="lazy"
                          />
                        )}
                      </span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </nav>
                <div className="bestseller-drawer-products">
                  <div className="bestseller-drawer-products-grid">
                    {(selectedCategory.previewImages || []).map(
                      (imgUrl, index) => (
                        <button
                          type="button"
                          className="bestseller-drawer-product"
                          key={`${imgUrl}-${index}`}
                          onClick={() =>
                            navigate(`/category/${selectedCategory.slug}`)
                          }
                          aria-label={`Explore ${selectedCategory.name}`}
                        >
                          <div className="bestseller-product-image-wrap">
                            <img
                              src={imgUrl}
                              alt={selectedCategory.name}
                              loading="lazy"
                            />
                            <span
                              className="bestseller-product-heart"
                              aria-hidden="true"
                            >
                              ♡
                            </span>
                            <span
                              className="bestseller-product-dots"
                              aria-hidden="true"
                            >
                              <i /> <i />
                            </span>
                          </div>
                          <div className="bestseller-product-info">
                            <span className="bestseller-product-name">
                              {selectedCategory.name}
                            </span>
                            <span className="bestseller-product-subtitle">
                              Explore available products
                            </span>
                            <span className="bestseller-product-link">
                              VIEW PRODUCTS <b>›</b>
                            </span>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    className="bestseller-drawer-explore"
                    onClick={() => {
                      const slug = selectedCategory.slug;
                      setSelectedCategory(null);
                      navigate(`/category/${slug}`);
                    }}
                  >
                    Explore all products <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .bestseller-drawer-overlay {
          position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: flex-end;
          justify-content: center; background: rgba(0,0,0,.78); animation: bestsellerOverlayIn 180ms ease-out both;
        }
        .bestseller-drawer-panel {
          width: 100%; height: 78dvh; max-height: 78dvh; min-height: 78dvh; overflow: hidden;
          box-sizing: border-box; padding: 0; background: #fff; color: #242424;
          border-radius: 26px 26px 0 0; box-shadow: 0 -12px 45px rgba(0,0,0,.18);
          animation: bestsellerDrawerUp 300ms cubic-bezier(.2,.8,.2,1) both;
          font-family: 'Outfit', 'Inter', sans-serif; display: flex; flex-direction: column;
        }
        .dark .bestseller-drawer-panel { background: #111827; color: #f9fafb; }
        .bestseller-drawer-close-floating { position: fixed; z-index: 2147483001; top: 13%; left: 50%; transform: translateX(-50%); width: 54px; height: 54px; border: 0; border-radius: 50%; background: #111; color: #fff; font-size: 36px; line-height: 1; cursor: pointer; box-shadow: 0 4px 18px #0005; }
        .bestseller-drawer-titlebar { flex: 0 0 auto; padding: 30px 22px 22px; border-bottom: 1px solid #e5e7eb; background: #fff; }
        .bestseller-drawer-titlebar h2 { margin: 0; font-size: clamp(21px, 4vw, 30px); line-height: 1.2; font-weight: 900; color: #303030; }
        .bestseller-drawer-body { min-height: 0; flex: 1; display: grid; grid-template-columns: 126px minmax(0,1fr); overflow: hidden; }
        .bestseller-category-sidebar { overflow-y: auto; border-right: 1px solid #eee; background: #fff; padding: 8px 0 24px; }
        .bestseller-sidebar-category { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 8px; width: 100%; min-height: 126px; padding: 12px 8px; border: 0; background: #fff; color: #6b7280; font: inherit; font-size: 13px; line-height: 1.25; text-align: center; cursor: pointer; }
        .bestseller-sidebar-category.is-active { color: #222; font-weight: 800; background: #f8fff6; }
        .bestseller-sidebar-category.is-active::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 5px; border-radius: 5px 0 0 5px; background: #318616; }
        .bestseller-sidebar-thumb { display: block; width: 76px; height: 76px; flex: 0 0 auto; overflow: hidden; border-radius: 50%; background: #f3f5f8; }
        .bestseller-sidebar-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .bestseller-drawer-products { min-width: 0; overflow-y: auto; padding: 14px 12px 24px; }
        .bestseller-drawer-products-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 22px 12px; }
        .bestseller-drawer-product { min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; font: inherit; cursor: pointer; }
        .bestseller-product-image-wrap { position: relative; aspect-ratio: 1 / 1; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 14px; background: #f8f8f8; }
        .bestseller-product-image-wrap > img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bestseller-product-heart { position: absolute; top: 8px; right: 9px; color: #fff; text-shadow: 0 1px 4px #555; font-size: 26px; line-height: 1; }
        .bestseller-product-dots { position: absolute; left: 10px; bottom: 9px; display: flex; gap: 5px; }
        .bestseller-product-dots i { width: 7px; height: 7px; border-radius: 50%; background: #d1d5db; }
        .bestseller-product-dots i:first-child { background: #374151; }
        .bestseller-product-info { display: flex; flex-direction: column; gap: 6px; padding-top: 9px; }
        .bestseller-product-name { color: #242424; font-size: 15px; font-weight: 800; line-height: 1.3; }
        .dark .bestseller-product-name { color: #f9fafb; }
        .bestseller-product-subtitle { color: #737373; font-size: 12px; line-height: 1.3; }
        .bestseller-product-link { display: flex; align-items: center; justify-content: space-between; margin-top: 3px; padding: 8px 9px; border: 1px solid #7da76f; border-radius: 10px; color: #318616; font-size: 11px; font-weight: 900; }
        .bestseller-product-link b { font-size: 18px; }
        .bestseller-drawer-explore { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 46px; margin-top: 18px; padding: 12px; border: 0; border-radius: 12px; background: #318616; color: white; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
        @media (max-width: 380px) { .bestseller-drawer-body { grid-template-columns: 100px minmax(0,1fr); } .bestseller-sidebar-thumb { width: 64px; height: 64px; } .bestseller-sidebar-category { min-height: 112px; font-size: 12px; } .bestseller-drawer-products { padding: 10px 8px 20px; } .bestseller-drawer-products-grid { gap: 18px 8px; } }
        @media (min-width: 768px) { .bestseller-drawer-panel { max-width: 900px; height: 78dvh; max-height: 78dvh; min-height: 78dvh; } .bestseller-drawer-close-floating { top: 7%; } .bestseller-drawer-body { grid-template-columns: 150px minmax(0,1fr); } .bestseller-drawer-products { padding: 20px; } .bestseller-drawer-products-grid { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 24px 16px; } }
        @keyframes bestsellerOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bestsellerDrawerUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .bestseller-drawer-overlay, .bestseller-drawer-panel { animation-duration: 1ms; }
        }

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
      `,
        }}
      />
    </div>
  );
}
