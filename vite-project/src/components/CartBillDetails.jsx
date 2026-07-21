import React from "react";

import BuyCoin from "./common/BuyCoin";

export default function CartBillDetails({ billBreakdown }) {
  if (!billBreakdown || billBreakdown.itemTotal === 0) return null;

  const {
    itemTotal,
    originalItemTotal,
    handlingFee,
    smallCartFee,
    deliveryFee,
    isDeliveryFree,
    configuredDeliveryFee,
    rainFee,
    lateNightFee,
    gstAndCharges,
    couponDiscount,
    couponCode,
    buyCoinsDiscount,
    codConvenienceFee,
    total,
    originalTotal,
  } = billBreakdown;

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    fontSize: "14px",
    color: "#374151",
  };

  const labelStyle = {
    fontWeight: "500",
    fontFamily: "'Outfit', 'Inter', sans-serif",
  };

  const valueStyle = {
    fontWeight: "600",
    color: "#1f2937",
    fontFamily: "'Outfit', 'Inter', sans-serif",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "20px 24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        border: "1px solid rgba(229, 231, 235, 0.5)",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      <h3
        style={{
          margin: "0 0 18px 0",
          fontSize: "16px",
          fontWeight: "750",
          color: "#1f2937",
          letterSpacing: "-0.3px",
        }}
      >
        Bill Details
      </h3>

      {/* 1. Item Total */}
      <div style={rowStyle}>
        <span style={labelStyle}>Item Total</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {originalItemTotal > itemTotal && (
            <span
              style={{
                textDecoration: "line-through",
                color: "#9ca3af",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              ₹{originalItemTotal}
            </span>
          )}
          <span style={valueStyle}>₹{itemTotal}</span>
        </div>
      </div>

      {/* 2. Handling Fee */}
      {handlingFee > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Handling Fee</span>
          <span style={valueStyle}>₹{handlingFee}</span>
        </div>
      )}

      {/* 3. Small Cart Fee */}
      {smallCartFee > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Small Cart Fee</span>
          <span style={valueStyle}>₹{smallCartFee}</span>
        </div>
      )}

      {/* 4. Delivery Partner Fee */}
      {configuredDeliveryFee > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Delivery Partner Fee</span>
          {isDeliveryFree ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#9ca3af",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                ₹{configuredDeliveryFee}
              </span>
              <span
                style={{
                  color: "#16a34a",
                  fontWeight: "750",
                  fontSize: "14px",
                }}
              >
                FREE
              </span>
            </div>
          ) : (
            <span style={valueStyle}>₹{configuredDeliveryFee}</span>
          )}
        </div>
      )}

      {/* 5. Rain Fee */}
      {rainFee > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Rain Fee</span>
          <span style={valueStyle}>₹{rainFee}</span>
        </div>
      )}

      {/* 6. Late Night Fee */}
      {lateNightFee > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Late Night Fee</span>
          <span style={valueStyle}>₹{lateNightFee}</span>
        </div>
      )}

      {/* 7. GST and Charges */}
      {gstAndCharges > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>GST and Charges</span>
          <span style={valueStyle}>₹{gstAndCharges}</span>
        </div>
      )}

      {/* 8. Coupon Discount */}
      {couponDiscount > 0 && (
        <div style={rowStyle}>
          <span style={{ ...labelStyle, color: "#10b981", fontWeight: "600" }}>🎁 Coupon ({couponCode})</span>
          <span style={{ ...valueStyle, color: "#10b981" }}>-₹{couponDiscount}</span>
        </div>
      )}

      {/* 9. BuyCoins Discount */}
      {buyCoinsDiscount > 0 && (
        <div style={rowStyle}>
          <span style={{ ...labelStyle, color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}><BuyCoin size={14} /> BuyCoins Redeemed</span>
          <span style={{ ...valueStyle, color: "#10b981" }}>-₹{buyCoinsDiscount}</span>
        </div>
      )}

      {/* 9.5 Cash on Delivery Fee */}
      {codConvenienceFee > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Cash on Delivery Fee</span>
          <span style={valueStyle}>₹{codConvenienceFee}</span>
        </div>
      )}

      {/* Divider */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e5e7eb",
          margin: "16px 0",
        }}
      />

      {/* To Pay */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px",
        }}
      >
        <span
          style={{
            fontSize: "16px",
            fontWeight: "750",
            color: "#1f2937",
            fontFamily: "'Outfit', 'Inter', sans-serif",
          }}
        >
          To Pay
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          {originalTotal > total && (
            <span
              style={{
                textDecoration: "line-through",
                color: "#6b7280",
                fontSize: "15px",
                fontWeight: "500",
              }}
            >
              ₹{originalTotal}
            </span>
          )}
          <span
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#1f2937",
              fontFamily: "'Outfit', 'Inter', sans-serif",
            }}
          >
            ₹{total}
          </span>
        </div>
      </div>
    </div>
  );
}