import React from "react";

export default function ProductDetailsSkeleton() {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh", padding: "16px", fontFamily: "Inter, sans-serif" }}>
      {/* Breadcrumb skeleton */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <div className="animate-pulse" style={{ width: "60px", height: "16px", background: "#e5e7eb", borderRadius: "4px" }} />
        <span style={{ color: "#d1d5db" }}>/</span>
        <div className="animate-pulse" style={{ width: "80px", height: "16px", background: "#e5e7eb", borderRadius: "4px" }} />
        <span style={{ color: "#d1d5db" }}>/</span>
        <div className="animate-pulse" style={{ width: "120px", height: "16px", background: "#e5e7eb", borderRadius: "4px" }} />
      </div>

      <div style={{ background: "white", borderRadius: "24px", padding: isMobile ? "16px" : "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: isMobile ? "24px" : "48px" }}>
        {/* Left Column: Image Gallery */}
        <div style={{ display: "flex", gap: "16px", flexDirection: isMobile ? "column-reverse" : "row" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: "10px", justifyContent: "center" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse" style={{ width: "64px", height: "64px", background: "#f3f4f6", borderRadius: "12px" }} />
            ))}
          </div>
          <div className="animate-pulse" style={{ flexGrow: 1, height: isMobile ? "280px" : "420px", background: "#f3f4f6", borderRadius: "20px" }} />
        </div>

        {/* Right Column: Content info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="animate-pulse" style={{ width: "100px", height: "20px", background: "#f3f4f6", borderRadius: "4px" }} />
          <div className="animate-pulse" style={{ width: "85%", height: "36px", background: "#f3f4f6", borderRadius: "8px" }} />
          
          {/* Rating */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="animate-pulse" style={{ width: "50px", height: "20px", background: "#f3f4f6", borderRadius: "4px" }} />
            <div className="animate-pulse" style={{ width: "80px", height: "20px", background: "#f3f4f6", borderRadius: "4px" }} />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6" }} />

          {/* Price */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="animate-pulse" style={{ width: "120px", height: "32px", background: "#f3f4f6", borderRadius: "6px" }} />
            <div className="animate-pulse" style={{ width: "80px", height: "24px", background: "#f3f4f6", borderRadius: "6px" }} />
            <div className="animate-pulse" style={{ width: "60px", height: "20px", background: "#f3f4f6", borderRadius: "4px" }} />
          </div>

          {/* Delivery Info */}
          <div style={{ padding: "16px", borderRadius: "16px", background: "#f9fafb", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="animate-pulse" style={{ width: "160px", height: "18px", background: "#f3f4f6", borderRadius: "4px" }} />
            <div className="animate-pulse" style={{ width: "220px", height: "16px", background: "#f3f4f6", borderRadius: "4px" }} />
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <div className="animate-pulse" style={{ flex: 1, height: "50px", background: "#f3f4f6", borderRadius: "14px" }} />
            <div className="animate-pulse" style={{ flex: 1, height: "50px", background: "#f3f4f6", borderRadius: "14px" }} />
          </div>

          {/* Description & Specifications accordions */}
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="animate-pulse" style={{ height: "48px", background: "#f3f4f6", borderRadius: "8px" }} />
            <div className="animate-pulse" style={{ height: "48px", background: "#f3f4f6", borderRadius: "8px" }} />
          </div>
        </div>
      </div>

      {/* Similar & Related Products */}
      <div style={{ marginTop: "32px" }}>
        <div className="animate-pulse" style={{ width: "180px", height: "24px", background: "#e5e7eb", borderRadius: "6px", marginBottom: "16px" }} />
        <div style={{ display: "flex", gap: "16px", overflowX: "hidden" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse" style={{ minWidth: "160px", height: "240px", background: "white", borderRadius: "20px", padding: "12px", border: "1px solid #f3f4f6" }}>
              <div style={{ height: "120px", background: "#f3f4f6", borderRadius: "16px", marginBottom: "12px" }} />
              <div style={{ width: "80px", height: "16px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "8px" }} />
              <div style={{ width: "120px", height: "20px", background: "#f3f4f6", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
