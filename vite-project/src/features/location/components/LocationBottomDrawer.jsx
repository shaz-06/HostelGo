import React, { useState, useEffect, useRef, useContext } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { useAddress } from "../context/AddressContext";
import { AuthContext } from "../../../context/AuthContext";
import { DRAWER_STATE } from "../constants/addressConstants";
import { AddressSearch } from "./AddressSearch";
import { AddressBanner } from "./AddressBanner";
import { SavedAddressList } from "./SavedAddressList";
import { AddAddressForm } from "./AddAddressForm";
import { useAddressSearch } from "../hooks/useAddressSearch";
import { useDrawerGesture } from "../hooks/useDrawerGesture";
import { hasLocationServicesEnabled, requestLocationPermission, getCurrentLocation } from "../../../services/location/locationService";

export function LocationBottomDrawer({ isOpen, onClose, restrictDismiss = false, hideUseCurrentLocation = false }) {
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

  // Address request states
  const [activeRequestId, setActiveRequestId] = useState(() => sessionStorage.getItem("buyto_active_request_id") || "");
  const [activeShareUrl, setActiveShareUrl] = useState(() => sessionStorage.getItem("buyto_active_share_url") || "");
  const [receivedAddress, setReceivedAddress] = useState(null);
  const [saveReceivedForFuture, setSaveReceivedForFuture] = useState(true);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);

  const { results: searchResults, loading: searchLoading } = useAddressSearch(searchQuery);

  // Focus trap / Accessibility
  const drawerRef = useRef(null);

  // Socket connection and lifecycle
  useEffect(() => {
    if (activeRequestId && isOpen) {
      const socket = io(window.API_BASE_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("joinAddressRequestRoom", activeRequestId);
      });

      socket.on("address-request-completed", (data) => {
        if (data.requestId === activeRequestId) {
          console.log("[Socket] Received completed address request:", data);
          setReceivedAddress(data.address);
          setCurrentState(DRAWER_STATE.RECEIVED);
          // Auto-select immediately
          selectAddress(data.address);
          // Invalidate session storage
          sessionStorage.removeItem("buyto_active_request_id");
          sessionStorage.removeItem("buyto_active_share_url");
        }
      });

      socket.on("address-request-cancelled", (data) => {
        if (data.requestId === activeRequestId) {
          console.log("[Socket] Request cancelled by other client");
          handleCancelClean();
        }
      });

      // Polling fallback
      const checkStatus = async () => {
        try {
          const res = await fetch(`${window.API_BASE_URL}/api/address-request/${activeRequestId}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.status === "completed" && data.address) {
              setReceivedAddress(data.address);
              setCurrentState(DRAWER_STATE.RECEIVED);
              selectAddress(data.address);
              sessionStorage.removeItem("buyto_active_request_id");
              sessionStorage.removeItem("buyto_active_share_url");
            }
          }
        } catch (e) {
          console.error("Status check failed:", e);
        }
      };

      checkStatus();
      const interval = setInterval(checkStatus, 5000);

      return () => {
        clearInterval(interval);
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [activeRequestId, isOpen]);

  const handleShareAgain = async () => {
    if (!activeShareUrl || !activeShareUrl.includes("token=")) {
      console.error("Invalid share URL:", activeShareUrl);
      setErrorMessage("Unable to generate secure share link.");
      return;
    }
    const shareMsg = `📍 Share your delivery address\n\nHi! I'm placing an order on Buyto.\n\nPlease securely share your delivery address using the link below.\n\n${activeShareUrl}\n\n• One-time secure link\n• Valid for 24 hours\n• Used only for this delivery`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Share Delivery Address",
          text: shareMsg,
          url: activeShareUrl
        });
      } catch (err) {
        console.log("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(activeShareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  const handleRequestAddress = async () => {
    setErrorMessage("");
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(`${window.API_BASE_URL}/api/address-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Validation check
        if (!data.shareUrl || !data.shareUrl.includes("token=")) {
          console.error("Invalid share URL:", data.shareUrl);
          setErrorMessage("Unable to generate secure share link.");
          return;
        }

        // Parse the token from the backend shareUrl and construct a clientShareUrl using window.location.origin
        const urlObj = new URL(data.shareUrl);
        const urlToken = urlObj.searchParams.get("token");
        const clientShareUrl = `${window.location.origin}/address/request/${data.requestId}?token=${urlToken}`;

        // Debug Logging
        console.log("Generated Client Share URL:", clientShareUrl);

        setActiveRequestId(data.requestId);
        setActiveShareUrl(clientShareUrl);
        sessionStorage.setItem("buyto_active_request_id", data.requestId);
        sessionStorage.setItem("buyto_active_share_url", clientShareUrl);
        setCurrentState(DRAWER_STATE.WAITING);
      } else {
        setErrorMessage(data.message || "Failed to initiate address request");
      }
    } catch (err) {
      setErrorMessage("Network error, please try again.");
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequestId) return;
    try {
      const token = localStorage.getItem("buyto_token");
      await fetch(`${window.API_BASE_URL}/api/address-request/${activeRequestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      handleCancelClean();
    } catch (err) {
      console.error("Error cancelling request:", err);
    }
  };

  const handleCancelClean = () => {
    setActiveRequestId("");
    setActiveShareUrl("");
    sessionStorage.removeItem("buyto_active_request_id");
    sessionStorage.removeItem("buyto_active_share_url");
    setCurrentState(DRAWER_STATE.SEARCH);
  };

  const handleConfirmReceivedAddress = async () => {
    if (saveReceivedForFuture && receivedAddress) {
      await addAddress({
        label: "Shared Address",
        fullName: receivedAddress.fullName,
        phone: receivedAddress.phone,
        addressLine: receivedAddress.addressLine,
        landmark: receivedAddress.landmark || "",
        roomNumber: receivedAddress.roomNumber || "",
        latitude: receivedAddress.latitude,
        longitude: receivedAddress.longitude,
        isDefault: false
      });
    }
    // Select it as active address with isTemporary option
    selectAddress({
      ...receivedAddress,
      isTemporary: !saveReceivedForFuture
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const savedRequestId = sessionStorage.getItem("buyto_active_request_id");
      const savedShareUrl = sessionStorage.getItem("buyto_active_share_url");
      if (savedRequestId && savedShareUrl) {
        setActiveRequestId(savedRequestId);
        setActiveShareUrl(savedShareUrl);
        setCurrentState(DRAWER_STATE.WAITING);
      } else {
        setCurrentState(DRAWER_STATE.SEARCH);
      }
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
                      {!hideUseCurrentLocation && (
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
                      )}

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
                        onClick={handleRequestAddress}
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
                          <img 
                            src="https://img.icons8.com/?size=100&id=E1Qn77QWMLgx&format=png&color=000000" 
                            alt="Share Address Icon"
                            style={{ width: "24px", height: "24px", objectFit: "contain" }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: "750", color: "#b7791f", lineHeight: "1.4" }}>
                            Did you know you ? can share your address with friends and family
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
            ) : currentState === DRAWER_STATE.WAITING ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "10px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <button
                    onClick={handleCancelClean}
                    style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" }}
                  >
                    ⬅️
                  </button>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>
                    📤 Link Shared
                  </h3>
                  <div style={{ width: "24px" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "#318616" }}>Waiting for your friend...</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>They are choosing their delivery location</span>
                </div>

                {/* Animated loader */}
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", margin: "10px 0" }}>
                  <span className="dot" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#318616", animation: "bounce 0.6s infinite alternate" }} />
                  <span className="dot" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#318616", animation: "bounce 0.6s infinite alternate 0.2s" }} />
                  <span className="dot" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#318616", animation: "bounce 0.6s infinite alternate 0.4s" }} />
                </div>
                <style dangerouslySetInnerHTML={{
                  __html: `
                  @keyframes bounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(-8px); }
                  }
                `}} />

                {/* Status Checklist */}
                <div style={{ width: "100%", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: "750", color: "#475569" }}>
                    <span style={{ color: "#318616" }}>✓</span> Link sent to friend
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: "750", color: "#475569" }}>
                    <span style={{ color: "#f59e0b", animation: "pulse 1s infinite alternate" }}>⏳</span> Waiting for address submission
                  </div>
                  <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes pulse {
                      from { opacity: 0.5; }
                      to { opacity: 1; }
                    }
                  `}} />
                </div>

                {/* QR Code renderer */}
                {activeShareUrl && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", marginTop: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "750", color: "#64748b" }}>Or let them scan this QR code:</span>
                    <div style={{ padding: "10px", backgroundColor: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px" }}>
                      <QRCodeSVG value={activeShareUrl} size={110} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "10px" }}>
                  <button
                    onClick={() => {
                      if (!activeShareUrl || !activeShareUrl.includes("token=")) {
                        console.error("Invalid share URL:", activeShareUrl);
                        setErrorMessage("Unable to generate secure share link.");
                        return;
                      }
                      const shareMsg = `📍 Share your delivery address\n\nHi! I'm placing an order on Buyto.\n\nPlease securely share your delivery address using the link below.\n\n${activeShareUrl}\n\n• One-time secure link\n• Valid for 24 hours\n• Used only for this delivery`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`, '_blank');
                    }}
                    style={{ width: "100%", padding: "12px", border: "none", borderRadius: "14px", backgroundColor: "#25D366", color: "#ffffff", fontWeight: "750", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.459 3.474 1.33 4.988L2 22l5.184-1.361c1.474.804 3.129 1.229 4.82 1.229 5.506 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm0 18.294c-1.494 0-2.96-.402-4.24-1.162l-.304-.18-3.15.827.84-3.07-.197-.314a8.272 8.272 0 0 1-1.266-4.407c0-4.57 3.717-8.288 8.292-8.288 2.215 0 4.296.864 5.86 2.43 1.564 1.564 2.426 3.646 2.426 5.858 0 4.57-3.717 8.288-8.293 8.288zm4.55-6.2c-.25-.124-1.476-.727-1.704-.81-.227-.083-.393-.124-.558.125-.165.248-.64.81-.784.975-.143.165-.288.185-.538.062-.25-.124-1.054-.388-2.008-1.24-.742-.662-1.243-1.48-1.39-1.728-.144-.25-.015-.385.11-.509.112-.112.25-.29.375-.434.124-.145.165-.248.25-.414.083-.165.04-.31-.02-.434-.063-.124-.559-1.347-.765-1.844-.2-.488-.4-.422-.558-.43-.145-.007-.31-.01-.476-.01-.166 0-.434.062-.66.31-.228.248-.868.85-.868 2.07 0 1.22.888 2.4 1.01 2.565.124.165 1.748 2.67 4.235 3.74.59.254 1.053.406 1.412.52.593.189 1.134.162 1.56.098.476-.072 1.476-.602 1.683-1.157.207-.554.207-1.03.145-1.127-.062-.097-.227-.165-.477-.289z"/></svg>
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={handleShareAgain}
                    style={{ width: "100%", padding: "12px", border: "none", borderRadius: "14px", backgroundColor: "#318616", color: "#ffffff", fontWeight: "750", fontSize: "13px", cursor: "pointer" }}
                  >
                    Share via other Apps
                  </button>
                  <button
                    onClick={async () => {
                      if (!activeShareUrl || !activeShareUrl.includes("token=")) {
                        console.error("Invalid share URL:", activeShareUrl);
                        setErrorMessage("Unable to generate secure share link.");
                        return;
                      }
                      try {
                        const copyMsg = `🏠 Please share your delivery address with me.\n\nTap the link below to submit your address:\n${activeShareUrl}`;
                        await navigator.clipboard.writeText(copyMsg);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      } catch (err) {
                        console.error("Copy failed:", err);
                      }
                    }}
                    style={{ width: "100%", padding: "12px", border: "1.5px solid #e2e8f0", borderRadius: "14px", backgroundColor: "#ffffff", color: "#475569", fontWeight: "750", fontSize: "13px", cursor: "pointer" }}
                  >
                    {copied ? "✓ Link Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    style={{ width: "100%", padding: "12px", border: "none", borderRadius: "14px", backgroundColor: "#fef2f2", color: "#ef4444", fontWeight: "750", fontSize: "13px", cursor: "pointer" }}
                  >
                    Cancel Request
                  </button>
                </div>
              </motion.div>
            ) : currentState === DRAWER_STATE.RECEIVED ? (
              <motion.div
                key="received"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "10px", display: "flex", flexDirection: "column", gap: "20px" }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#318616" }}>
                  ✅ Address received
                </h3>

                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>{receivedAddress?.fullName}</span>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "650" }}>{receivedAddress?.phone}</span>
                  <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }} />
                  <span style={{ fontSize: "13px", fontWeight: "750", color: "#334155" }}>
                    📍 {receivedAddress?.addressLine}
                  </span>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#475569", fontSize: "13px", fontWeight: "750", textAlign: "left", margin: "10px 0" }}>
                  <input
                    type="checkbox"
                    checked={saveReceivedForFuture}
                    onChange={(e) => setSaveReceivedForFuture(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  Save this address for future deliveries
                </label>

                <button
                  onClick={handleConfirmReceivedAddress}
                  style={{ width: "100%", padding: "14px", border: "none", borderRadius: "16px", backgroundColor: "#318616", color: "#ffffff", fontWeight: "850", fontSize: "14px", cursor: "pointer" }}
                >
                  Continue
                </button>
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
