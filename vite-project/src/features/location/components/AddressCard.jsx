import React from "react";

export const AddressCard = React.memo(({ address, isSelected, onSelect, onEdit }) => {
  const label = address.label || address.addressType || "Other";
  const displayAddress = address.addressLine + (address.landmark ? `, ${address.landmark}` : "");
  
  const getPresetIcon = (label) => {
    switch (label.toLowerCase()) {
      case "home": return "🏡";
      case "pg": return "🏢";
      case "office": return "💼";
      case "hostel": return "🏠";
      case "college": return "🎓";
      default: return "📍";
    }
  };

  return (
    <div
      onClick={() => onSelect(address)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        padding: "16px",
        borderRadius: "18px",
        backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
        border: isSelected ? "1.5px solid #22c55e" : "1.5px solid #e2e8f0",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative"
      }}
    >
      <div style={{
        fontSize: "24px",
        padding: "10px",
        backgroundColor: isSelected ? "#dcfce7" : "#f1f5f9",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {getPresetIcon(label)}
      </div>

      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>{label}</span>
          {address.isDefault && (
            <span style={{
              fontSize: "10px",
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "700"
            }}>
              Default
            </span>
          )}
        </div>
        
        <p style={{
          fontSize: "13px",
          color: "#475569",
          margin: "0 0 6px 0",
          lineHeight: "1.5",
          fontWeight: "500"
        }}>
          {displayAddress}
        </p>

        {address.phone && (
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
            Phone: {address.phone}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#318616",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
});
