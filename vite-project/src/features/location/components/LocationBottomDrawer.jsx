import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAddress } from "../context/AddressContext";
import { DRAWER_STATE } from "../constants/addressConstants";
import { AddressSearch } from "./AddressSearch";
import { AddressBanner } from "./AddressBanner";
import { SavedAddressList } from "./SavedAddressList";
import { AddAddressForm } from "./AddAddressForm";
import { useAddressSearch } from "../hooks/useAddressSearch";
import { useDrawerGesture } from "../hooks/useDrawerGesture";
import { hasLocationServicesEnabled, requestLocationPermission, getCurrentLocation } from "../../../services/location/locationService";

export function LocationBottomDrawer({ isOpen, onClose, restrictDismiss = false }) {
  const navigate = useNavigate();
  const {
    selectedAddress,
    savedAddresses,
    selectAddress,
    addAddress,
    updateAddress
  } = useAddress();

  const [currentState, setCurrentState] = useState(DRAWER_STATE.SEARCH);
  const [editingAddress, setEditingAddress] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGpsOff, setIsGpsOff] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showShareBanner, setShowShareBanner] = useState(true);

  const { results: searchResults, loading: searchLoading } = useAddressSearch(searchQuery);

  // Focus trap / Accessibility
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentState(DRAWER_STATE.SEARCH);
      setSearchQuery("");
      setErrorMessage("");
      // Check GPS service availability
      hasLocationServicesEnabled().then(enabled => setIsGpsOff(!enabled));
      // Focus drawer for accessibility
      setTimeout(() => drawerRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !restrictDismiss) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, restrictDismiss, onClose]);

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    transformStyle,
    transitionStyle
  } = useDrawerGesture(() => {
    if (!restrictDismiss) onClose();
  });

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setErrorMessage("");
    try {
      const enabled = await hasLocationServicesEnabled();
      if (!enabled) {
        setIsGpsOff(true);
        setLocationLoading(false);
        return;
      }
      
      const perm = await requestLocationPermission();
      if (perm !== "granted") {
        setErrorMessage("Location permission denied. Please select location manually.");
        setLocationLoading(false);
        return;
      }

      const coords = await getCurrentLocation();
      // Reverse geocode via openstreetmap Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
      if (res.ok) {
        const data = await res.json();
        const addressObj = {
          addressLine: data.display_name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          coords
        };
        const success = await selectAddress(addressObj);
        if (success) {
          onClose();
        } else {
          setErrorMessage("This location is outside our delivery zone.");
        }
      }
    } catch (err) {
      setErrorMessage("Could not detect location. Please type manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSelectAddressItem = async (addr) => {
    setErrorMessage("");
    const success = await selectAddress({
      ...addr,
      coords: { latitude: addr.latitude, longitude: addr.longitude }
    });
    if (success) {
      onClose();
    } else {
      setErrorMessage("This address is outside our delivery area.");
    }
  };

  const handleSaveFormAddress = async (formData) => {
    setErrorMessage("");
    let savedAddr;
    if (formData.id) {
      savedAddr = await updateAddress(formData);
    } else {
      savedAddr = await addAddress(formData);
    }

    if (savedAddr) {
      const success = await selectAddress({
        ...savedAddr,
        coords: { latitude: savedAddr.latitude, longitude: savedAddr.longitude }
      });
      if (success) {
        onClose();
      } else {
        setErrorMessage("Saved, but this location is outside our delivery zone.");
        setCurrentState(DRAWER_STATE.SEARCH);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Backdrop */}
      <div
        onClick={() => { if (!restrictDismiss) onClose(); }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)"
        }}
      />

      {/* Slide up Drawer */}
      <motion.div
        ref={drawerRef}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Delivery location picker"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "92vh",
          backgroundColor: "#f8fafc",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          overflowY: "auto",
          paddingBottom: "safe-area-inset-bottom",
          boxShadow: "0 -10px 25px rgba(0,0,0,0.15)",
          transform: transformStyle,
          transition: transitionStyle,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Swipe drag line indicator */}
        <div style={{
          width: "42px",
          height: "5px",
          backgroundColor: "#cbd5e1",
          borderRadius: "3px",
          margin: "12px auto 6px auto",
          cursor: "grab"
        }} />

        {/* Close Button */}
        {!restrictDismiss && (
          <button
            onClick={onClose}
            aria-label="Close address drawer"
            style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              background: "rgba(15, 23, 42, 0.08)",
              border: "none",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              fontSize: "14px",
              fontWeight: "900",
              color: "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        )}

        {/* Error message Banner */}
        {errorMessage && (
          <div style={{
            margin: "0 16px 12px 16px",
            padding: "10px 14px",
            backgroundColor: "#fff1f2",
            color: "#e11d48",
            borderRadius: "12px",
            fontSize: "12.5px",
            fontWeight: "750",
            border: "1px solid #fecdd3"
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div style={{ padding: "16px", flex: 1 }}>
          <AnimatePresence mode="wait">
            {currentState === DRAWER_STATE.SEARCH ? (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* GPS Off Banner */}
                <AddressBanner isGpsOff={isGpsOff} />

                <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "900", color: "#0f172a", textAlign: "left" }}>
                  Select delivery location
                </h3>

                {/* Search Component */}
                <AddressSearch
                  query={searchQuery}
                  onChange={setSearchQuery}
                />

                {searchQuery.trim() !== "" ? (
                  /* Search Suggestions List */
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                    {searchLoading && <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Searching...</div>}
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectAddressItem(item)}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "14px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          textAlign: "left",
                          cursor: "pointer",
                          fontWeight: "650",
                          fontSize: "13px",
                          color: "#334155"
                        }}
                      >
                        📍 {item.addressLine}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Default Main Options */
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      {/* Use Current Location Option */}
                      <button
                        onClick={handleUseCurrentLocation}
                        disabled={locationLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "16px",
                          borderRadius: "16px",
                          border: "1.5px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          fontWeight: "750",
                          color: "#318616",
                          fontSize: "14px"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          🎯 {locationLoading ? "Fetching Location..." : "Use current location"}
                        </span>
                        <span>❯</span>
                      </button>

                      {/* Add New Address Option */}
                      <button
                        onClick={() => {
                          setEditingAddress(null);
                          setCurrentState(DRAWER_STATE.ADD);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "16px",
                          borderRadius: "16px",
                          border: "1.5px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          fontWeight: "750",
                          color: "#475569",
                          fontSize: "14px"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ color: "#318616", fontSize: "18px", fontWeight: "bold" }}>＋</span> Add new address
                        </span>
                        <span>❯</span>
                      </button>

                      {/* Request address from someone else */}
                      <button
                        onClick={() => {
                          if (!restrictDismiss) onClose();
                          navigate("/profile/request-address");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "16px",
                          borderRadius: "16px",
                          border: "1.5px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          fontWeight: "750",
                          color: "#475569",
                          fontSize: "14px",
                          textAlign: "left"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img 
                            src="https://img.icons8.com/?size=100&id=DUEq8l5qTqBE&format=png&color=000000" 
                            alt="WhatsApp Icon"
                            style={{ width: "24px", height: "24px", objectFit: "contain" }}
                          />
                          Request address from someone else
                        </span>
                        <span>❯</span>
                      </button>

                      {/* Import addresses from Zomato */}
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "16px",
                          borderRadius: "16px",
                          border: "1.5px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          fontWeight: "750",
                          color: "#475569",
                          fontSize: "14px",
                          textAlign: "left"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            backgroundColor: "#CB202D",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontFamily: "sans-serif",
                            fontSize: "7px",
                            fontWeight: "900",
                            fontStyle: "italic"
                          }}>
                            zomato
                          </div>
                          Import your addresses from Zomato
                        </span>
                        <span>❯</span>
                      </button>
                    </div>

                    {/* Saved Addresses Section */}
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "900", color: "#64748b", textAlign: "left" }}>
                      Your saved addresses
                    </h4>

                    <SavedAddressList
                      addresses={savedAddresses}
                      selectedId={selectedAddress?.id || selectedAddress?._id}
                      onSelect={handleSelectAddressItem}
                      onEdit={(addr) => {
                        setEditingAddress(addr);
                        setCurrentState(DRAWER_STATE.EDIT);
                      }}
                    />

                    {/* Share Banner */}
                    {showShareBanner && (
                      <div 
                        onClick={() => {
                          if (!restrictDismiss) onClose();
                          navigate("/profile/manage-shares");
                        }}
                        style={{
                          marginTop: "20px",
                          padding: "16px",
                          backgroundColor: "#fdf8ee",
                          border: "1px solid #fbd38d",
                          borderRadius: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
                          <span style={{ fontSize: "20px" }}>📤</span>
                          <span style={{ fontSize: "13px", fontWeight: "750", color: "#b7791f", lineHeight: "1.4" }}>
                            Now share your addresses with friends and family
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShareBanner(false);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "14px",
                            fontWeight: "900",
                            color: "#718096",
                            cursor: "pointer",
                            padding: "4px"
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              /* Add / Edit state */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <button
                    onClick={() => setCurrentState(DRAWER_STATE.SEARCH)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "20px",
                      cursor: "pointer",
                      padding: "0"
                    }}
                  >
                    ⬅️
                  </button>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>
                    {currentState === DRAWER_STATE.ADD ? "Add Address details" : "Edit Address details"}
                  </h3>
                </div>

                <AddAddressForm
                  initialAddress={editingAddress}
                  onSave={handleSaveFormAddress}
                  onCancel={() => setCurrentState(DRAWER_STATE.SEARCH)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
