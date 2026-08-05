import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";
import { Eye, EyeOff } from "lucide-react";

export default function ClaimGiftCardsPage() {
  const navigate = useNavigate();
  const { token, refreshUser } = useContext(AuthContext);

  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Format code input (digits only, max 16 characters, trim whitespace)
  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCode(val);
  };

  // Format PIN input (digits only, max 6 characters)
  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(val);
  };

  // Real-time form validation
  const isValidCode = code.length === 16;
  const isValidPin = pin.length === 6;
  const isFormValid = isValidCode && isValidPin && !loading;

  // Handle Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(window.API_BASE_URL + "/api/buycoins/claim-gift-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code, pin })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setToast({
          type: "success",
          message: `₹${data.creditedAmount} added to your wallet.`
        });
        setCode("");
        setPin("");
        
        // Refresh the global application state/wallet context
        if (refreshUser) {
          await refreshUser();
        }

        // Auto-navigate back to wallet or profile after 2.5 seconds
        setTimeout(() => {
          navigate(-1);
        }, 2500);
      } else {
        // Handle specific server-returned error codes and map to toast messages
        let errorMsg = "Unable to redeem gift card. Check your internet connection.";
        if (data.code === "INVALID_CODE_OR_PIN") {
          errorMsg = "Incorrect PIN. Please try again.";
        } else if (data.code === "ALREADY_REDEEMED") {
          errorMsg = "This gift card has already been redeemed.";
        } else if (data.code === "EXPIRED") {
          errorMsg = "This gift card has expired.";
        } else if (data.message) {
          errorMsg = data.message;
        }

        setToast({
          type: "error",
          message: errorMsg
        });
      }
    } catch (err) {
      console.error("Gift card redemption exception:", err);
      setToast({
        type: "error",
        message: "Unable to redeem gift card. Check your internet connection."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <SEO title="Claim Gift Cards • Buyto" description="Redeem your Buyto gift cards here easily by entering code and pin." />

      {/* Decorative Golden Hero Header */}
      <div style={heroHeaderStyle}>
        {/* Back navigation - only visible on desktops/tablets */}
        {windowWidth >= 768 && (
          <button onClick={() => navigate(-1)} style={backButtonStyle}>
            ←
          </button>
        )}

        <button 
          onClick={() => setToast({ type: "info", message: "Enter the 16-digit card code and 6-digit pin found on your gift voucher." })} 
          style={faqButtonStyle}
        >
          FAQ
        </button>

        {/* Gift Cards Slanted Illustration Left */}
        <div style={illustrationLeftStyle}>
          <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(-18deg)" }}>
            <rect x="15" y="42" width="70" height="46" fill="#16a34a" rx="6" />
            <rect x="10" y="28" width="80" height="16" fill="#fbbf24" rx="4" />
            <rect x="44" y="28" width="12" height="60" fill="#f59e0b" />
            <path d="M50,28 C35,12 30,26 50,28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <path d="M50,28 C65,12 70,26 50,28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          </svg>
        </div>

        <h1 style={heroTitleStyle}>Gift<br />Cards</h1>

        {/* Gift Cards Slanted Illustration Right */}
        <div style={illustrationRightStyle}>
          <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(18deg)" }}>
            <rect x="15" y="42" width="70" height="46" fill="#16a34a" rx="6" />
            <rect x="10" y="28" width="80" height="16" fill="#fbbf24" rx="4" />
            <rect x="44" y="28" width="12" height="60" fill="#f59e0b" />
            <path d="M50,28 C35,12 30,26 50,28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <path d="M50,28 C65,12 70,26 50,28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={contentWrapperStyle}>
        {/* Form Container */}
        <form onSubmit={handleSubmit} style={formCardStyle}>
          <p style={instructionStyle}>
            Enter 16 digit code and the 6 digit PIN to claim your gift card
          </p>

          {/* Input 1: Code */}
          <div style={inputWrapperStyle}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter gift card code"
              value={code}
              onChange={handleCodeChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>

          {/* Input 2: PIN with Visibility Toggle */}
          <div style={pinInputContainerStyle}>
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter pin"
              value={pin}
              onChange={handlePinChange}
              disabled={loading}
              style={pinInputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={eyeButtonStyle}
              tabIndex="-1"
            >
              {showPin ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
            </button>
          </div>
        </form>

        {/* Note / Instructions Section */}
        <div style={noteSectionStyle}>
          <h4 style={noteHeaderStyle}>NOTE</h4>
          <ul style={noteListStyle}>
            <li style={noteItemStyle}>
              You can claim gift cards worth up to ₹25,000 each month.
            </li>
            <li style={noteItemStyle}>
              Gift card balance can be used on Buyto.
            </li>
            <li style={noteItemStyle}>
              Gift card amount will have the same expiry date as that of the gift card.
            </li>
            <li style={noteItemStyle}>
              Claimed gift card cannot be transferred to another account.
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Sticky Action Area */}
      <div style={bottomBarStyle}>
        <p style={termsTextStyle}>
          By continuing, you agree to our{" "}
          <span 
            onClick={() => navigate("/terms")} 
            style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "700" }}
          >
            Terms & Conditions
          </span>
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          style={isFormValid ? activeSubmitButtonStyle : disabledSubmitButtonStyle}
        >
          {loading ? (
            <div style={spinnerContainerStyle}>
              <div style={spinnerStyle}></div>
              <span>Claiming...</span>
            </div>
          ) : (
            "Continue"
          )}
        </button>
      </div>

      {/* Toast Notification Overlay */}
      {toast && (
        <div style={{
          ...toastOverlayStyle,
          backgroundColor: toast.type === "success" ? "#10b981" : toast.type === "info" ? "#3b82f6" : "#ef4444"
        }}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// Inline Styles Object
const containerStyle = {
  minHeight: "100vh",
  background: "#f4f5f8",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  flexDirection: "column",
  paddingBottom: "140px", // space for bottom sticky action bar
  boxSizing: "border-box",
  position: "relative"
};

const heroHeaderStyle = {
  background: "linear-gradient(180deg, #FDE047 0%, #FEF08A 30%, #FFFDF9 100%)",
  height: "220px",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottomLeftRadius: "24px",
  borderBottomRightRadius: "24px",
  overflow: "hidden"
};

const backButtonStyle = {
  position: "absolute",
  left: "20px",
  top: "20px",
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "#ffffff",
  border: "none",
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1e293b",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  zIndex: 10
};

const faqButtonStyle = {
  position: "absolute",
  right: "20px",
  top: "20px",
  padding: "8px 16px",
  borderRadius: "12px",
  background: "#ffffff",
  border: "none",
  fontSize: "14px",
  fontWeight: "800",
  color: "#1e293b",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  zIndex: 10
};

const heroTitleStyle = {
  fontSize: "38px",
  lineHeight: "1.1",
  fontWeight: "900",
  color: "#451a03",
  textAlign: "center",
  margin: 0,
  zIndex: 5,
  fontFamily: "'Outfit', sans-serif"
};

const illustrationLeftStyle = {
  position: "absolute",
  left: "-25px",
  bottom: "-10px",
  opacity: 0.9,
  zIndex: 1
};

const illustrationRightStyle = {
  position: "absolute",
  right: "-25px",
  bottom: "-10px",
  opacity: 0.9,
  zIndex: 1
};

const contentWrapperStyle = {
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  maxWidth: "500px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box"
};

const formCardStyle = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
  border: "1px solid #e2e8f0"
};

const instructionStyle = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#475569",
  lineHeight: "1.5",
  margin: "0 0 20px 0"
};

const inputWrapperStyle = {
  marginBottom: "16px",
  position: "relative"
};

const inputStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "14px",
  border: "1.5px solid #cbd5e1",
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
  background: "#ffffff",
  transition: "border-color 0.2s ease"
};

const pinInputContainerStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center"
};

const pinInputStyle = {
  width: "100%",
  padding: "16px 50px 16px 16px",
  borderRadius: "14px",
  border: "1.5px solid #cbd5e1",
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
  background: "#ffffff",
  transition: "border-color 0.2s ease"
};

const eyeButtonStyle = {
  position: "absolute",
  right: "16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0
};

const noteSectionStyle = {
  padding: "8px 4px"
};

const noteHeaderStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#64748b",
  letterSpacing: "0.5px",
  margin: "0 0 12px 0"
};

const noteListStyle = {
  margin: 0,
  paddingLeft: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const noteItemStyle = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "600",
  lineHeight: "1.5"
};

const bottomBarStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#ffffff",
  borderTop: "1px solid #e2e8f0",
  padding: "16px 20px calc(16px + env(safe-area-inset-bottom, 0px)) 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
  zIndex: 100
};

const termsTextStyle = {
  margin: 0,
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "600"
};

const activeSubmitButtonStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#10b981",
  color: "#ffffff",
  border: "none",
  borderRadius: "16px",
  padding: "16px 20px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
  transition: "transform 0.1s ease, background 0.2s ease"
};

const disabledSubmitButtonStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#cbd5e1",
  color: "#94a3b8",
  border: "none",
  borderRadius: "16px",
  padding: "16px 20px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "not-allowed",
  textAlign: "center"
};

const spinnerContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px"
};

const spinnerStyle = {
  width: "18px",
  height: "18px",
  border: "2px solid #ffffff",
  borderTop: "2px solid transparent",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite"
};

const toastOverlayStyle = {
  position: "fixed",
  top: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  borderRadius: "12px",
  color: "#ffffff",
  fontWeight: "750",
  fontSize: "14px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  zIndex: 1000,
  animation: "fadeIn 0.2s ease"
};

// Add standard spin animation CSS to DOM
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
