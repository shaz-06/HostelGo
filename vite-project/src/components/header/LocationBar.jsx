import React, { useState, useMemo } from "react";
import { useAppStore, selectUserLocation, selectRoomNumber, selectIsLoggedIn } from "../../store/appStore";

export const LocationBar = React.memo(({ authLoading, onOpenAddressModal, useDarkAzure, welcomeBannerVisible, isHomepage, isMobile }) => {
  const userLocation = useAppStore(selectUserLocation);
  const roomNumber = useAppStore(selectRoomNumber);
  const isLoggedIn = useAppStore(selectIsLoggedIn);

  const [addressExpanded, setAddressExpanded] = useState(false);
  const addressType = localStorage.getItem("buyto_selected_address_type") || "PG";

  const getTruncatedAddress = (fullText, wordCount = 7) => {
    if (!fullText) return "";
    const words = fullText.split(/\s+/);
    if (words.length <= wordCount) return fullText;
    return words.slice(0, wordCount).join(" ") + "...";
  };

  const addressText = useMemo(() => {
    if (authLoading) {
      return "Loading location...";
    }
    if (!isLoggedIn) {
      return "Login · Your location will appear here";
    }
    return userLocation
      ? `${userLocation}${roomNumber ? `, Room ${roomNumber}` : ""}`
      : "Select Delivery Address";
  }, [authLoading, isLoggedIn, userLocation, roomNumber]);

  const fullAddressJson = localStorage.getItem("buyto_selected_address_full");
  let addressDetails = null;
  if (fullAddressJson) {
    try {
      addressDetails = JSON.parse(fullAddressJson);
    } catch (e) { }
  }

  const renderExpandedAddress = () => {
    if (!addressDetails) {
      return <div style={{ fontSize: "14px", color: isMobile ? "#FFFFFF" : "#374151", padding: "8px 0" }}>{addressText}</div>;
    }
    return (
      <div style={{
        fontSize: "14px",
        color: isMobile ? "#FFFFFF" : "#374151",
        lineHeight: "1.4",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px 12px",
        background: isMobile ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.5)",
        borderRadius: "12px",
        border: isMobile ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.3)",
        marginTop: "6px",
        animation: "fadeIn 200ms ease-out"
      }}>
        <div style={{ fontWeight: "750", color: isMobile ? "#FFFFFF" : "#111827", fontSize: "15px" }}>{addressDetails.label || "Address"}</div>
        {addressDetails.fullName && <div>Name: {addressDetails.fullName}</div>}
        {addressDetails.phone && <div>Phone: {addressDetails.phone}</div>}
        {addressDetails.roomNumber && <div>Room / Flat: {addressDetails.roomNumber}</div>}
        {addressDetails.addressLine && <div>Address: {addressDetails.addressLine}</div>}
        {addressDetails.landmark && <div>Landmark: {addressDetails.landmark}</div>}
        {addressDetails.city && <div>City: {addressDetails.city}</div>}
        {addressDetails.pincode && <div>Pincode: {addressDetails.pincode}</div>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", margin: "1px 0" }}>
      <button
        type="button"
        onClick={onOpenAddressModal}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          userSelect: "none",
          alignSelf: "flex-start"
        }}
      >
        <span style={{ fontSize: "13px", color: "var(--header-text-color, #FFFFFF)", fontWeight: "400", transition: "color 350ms ease-in-out" }}>
          <strong style={{ fontWeight: "700" }}>{addressType}</strong> • {getTruncatedAddress(addressText, 7)}
        </span>
        <span style={{
          fontSize: "10px",
          color: "var(--header-text-color, #FFFFFF)",
          display: "inline-block",
          transition: "transform 200ms ease, color 350ms ease-in-out",
          transform: addressExpanded ? "rotate(180deg)" : "rotate(0deg)"
        }}>▼</span>
      </button>
      {addressExpanded && renderExpandedAddress()}
    </div>
  );
});

export default LocationBar;
