import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginRequiredPrompt({
  isOpen,
  onClose,
  onConfirm,
  title = "📍 Save Your Delivery Address",
  message = "Log in to save your delivery address and enjoy a faster checkout experience.\n\nYour cart is safely saved, and you'll return here after signing in.",
  confirmText = "Continue with Phone Number",
  cancelText = "Maybe Later"
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={backdropStyle} onClick={onClose}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          style={modalCardStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Icon/Pin illustration */}
          <div style={iconContainerStyle}>
            <div style={iconBgStyle}>
              <span style={iconStyle}>📍</span>
            </div>
          </div>

          <h2 style={titleStyle}>{title}</h2>

          <div style={messageContainerStyle}>
            {message.split("\n\n").map((paragraph, index) => (
              <p key={index} style={messageStyle}>
                {paragraph}
              </p>
            ))}
          </div>

          <div style={buttonContainerStyle}>
            <button onClick={onConfirm} style={confirmButtonStyle}>
              {confirmText}
            </button>
            <button onClick={onClose} style={cancelButtonStyle}>
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Styling Objects
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(16px)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px"
};

const modalCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "28px",
  width: "100%",
  maxWidth: "400px",
  padding: "32px 24px 24px 24px",
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const iconContainerStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "16px"
};

const iconBgStyle = {
  width: "64px",
  height: "64px",
  borderRadius: "20px",
  backgroundColor: "rgba(49, 134, 22, 0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const iconStyle = {
  fontSize: "32px"
};

const titleStyle = {
  margin: "0 0 12px 0",
  fontSize: "20px",
  fontWeight: "800",
  color: "#1f2937"
};

const messageContainerStyle = {
  marginBottom: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const messageStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#4b5563",
  lineHeight: "1.5",
  fontWeight: "600"
};

const buttonContainerStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const confirmButtonStyle = {
  width: "100%",
  background: "#318616",
  color: "#ffffff",
  border: "none",
  padding: "14px",
  borderRadius: "14px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)",
  transition: "all 0.2s"
};

const cancelButtonStyle = {
  width: "100%",
  background: "transparent",
  color: "#6b7280",
  border: "none",
  padding: "12px",
  borderRadius: "14px",
  fontSize: "14px",
  fontWeight: "750",
  cursor: "pointer",
  transition: "all 0.2s"
};
