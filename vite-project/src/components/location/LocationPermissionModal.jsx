import React, { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { openLocationSettings } from "../../services/location/locationService";

export default function LocationPermissionModal({ isOpen, isPermanentlyDenied, onAllow, onSelectManually }) {
  // Prevent Capacitor hardware back button when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const backButtonHandler = CapApp.addListener("backButton", () => {
      console.log("[LocationPermissionModal] Back button blocked while permission is required.");
    });

    return () => {
      backButtonHandler.then((h) => h.remove());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes modalPopIn {
            0% { transform: scale(0.92); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .modal-card-permission,
          .dark .modal-card-permission,
          .dark div.modal-card-permission,
          .dark div.modal-card-permission[style] {
            background-color: #ffffff !important;
            background: #ffffff !important;
          }
          .modal-card-permission h3,
          .dark .modal-card-permission h3 {
            color: #0f172a !important;
          }
          .modal-card-permission p,
          .dark .modal-card-permission p {
            color: #64748b !important;
          }
        `
      }} />
      <div className="modal-card-permission" style={cardStyle}>
        {/* Large Location Pin */}
        <div style={iconContainerStyle}>
          <img
            src="https://img.icons8.com/?size=100&id=RIGL9yeMfewz&format=png&color=000000"
            alt="Location Pin"
            style={{ width: "86px", height: "86px", objectFit: "contain" }}
          />
        </div>

        <h3 style={titleStyle}>Location permission required</h3>
        <p style={descriptionStyle}>
          {isPermanentlyDenied
            ? "To detect nearby stores and offer accurate delivery estimates, please enable Location permission in Settings."
            : "Turn on your location permission for a better delivery experience and to show products and delivery estimates available in your area."}
        </p>

        <div style={btnContainerStyle}>
          {isPermanentlyDenied ? (
            <button
              onClick={openLocationSettings}
              style={primaryBtnStyle}
            >
              Open Settings
            </button>
          ) : (
            <button
              onClick={onAllow}
              style={primaryBtnStyle}
            >
              Allow Location
            </button>
          )}

          <button
            onClick={onSelectManually}
            style={secondaryBtnStyle}
          >
            Select location manually
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999999,
  padding: "20px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "28px",
  maxWidth: "420px",
  width: "90%",
  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.18)",
  textAlign: "center",
  border: "1px solid #f1f5f9",
};

const iconContainerStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "24px"
};

const titleStyle = {
  fontSize: "21px",
  fontWeight: "750",
  color: "#0f172a",
  marginBottom: "10px",
  fontFamily: "'Outfit', sans-serif"
};

const descriptionStyle = {
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "1.6",
  marginBottom: "28px",
  fontWeight: "450"
};

const btnContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const primaryBtnStyle = {
  backgroundColor: "#318616",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: "750",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)",
  transition: "all 0.2s"
};

const secondaryBtnStyle = {
  backgroundColor: "transparent",
  color: "#318616",
  border: "1.5px solid #e2e8f0",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: "750",
  cursor: "pointer",
  transition: "all 0.2s"
};
