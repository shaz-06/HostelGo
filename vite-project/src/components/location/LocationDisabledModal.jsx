import React, { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { openLocationSettings } from "../../services/location/locationService";

export default function LocationDisabledModal({ isOpen, onSelectManually }) {
  // Prevent Capacitor hardware back button when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const backButtonHandler = CapApp.addListener("backButton", () => {
      console.log("[LocationDisabledModal] Back button blocked while location services are disabled.");
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
          .modal-card-disabled {
            animation: modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `
      }} />
      <div className="modal-card-disabled" style={cardStyle}>
        {/* Large Location Pin with red diagonal slash */}
        <div style={iconContainerStyle}>
          <svg
            width="86"
            height="86"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e11d48"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 4px 6px rgba(225, 29, 72, 0.15))" }}
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
            <line x1="3" y1="3" x2="21" y2="21" stroke="#e11d48" strokeWidth="2" />
          </svg>
        </div>

        <h3 style={titleStyle}>Location is turned off</h3>
        <p style={descriptionStyle}>
          Turn on your device location for a better delivery experience and accurate nearby store availability.
        </p>

        <div style={btnContainerStyle}>
          <button
            onClick={openLocationSettings}
            style={primaryBtnStyle}
          >
            Enable device location
          </button>
          
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
