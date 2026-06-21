import React, { useState, useEffect, useContext, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../config/firebase";
import { AuthContext } from "../../context/AuthContext";

export default function OtpLoginBottomSheet() {
  const { isLoginOpen, closeLogin, setAuthSession } = useContext(AuthContext);
  const loginBottomSheetOpen = isLoginOpen;

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const recaptchaVerifierRef = useRef(null);

  // Initialize invisible reCAPTCHA when the bottom sheet is opened
  useEffect(() => {
    if (!loginBottomSheetOpen) {
      // Reset state when closed
      setPhone("");
      setOtp("");
      setConfirmationResult(null);
      setError("");
      setSuccessMsg("");
      setLoading(false);
      return;
    }

    const initRecaptcha = async () => {
      try {
        // Wait a tiny bit for the DOM container to render
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const container = document.getElementById("recaptcha-container-sheet");
        if (container && !recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container-sheet", {
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA solved on bottom sheet");
            }
          });
        }
      } catch (err) {
        console.error("Recaptcha Init Error in sheet:", err);
        setError("Failed to initialize verification helper: " + err.message);
      }
    };

    initRecaptcha();

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {}
      }
    };
  }, [loginBottomSheetOpen]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("91") && formattedPhone.length > 10) {
        formattedPhone = "+" + formattedPhone;
      } else {
        formattedPhone = "+91" + formattedPhone;
      }
    }

    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error("Verification helper is not ready yet. Please try again.");
      }
      const appVerifier = recaptchaVerifierRef.current;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setSuccessMsg("OTP sent successfully to " + phone);
    } catch (err) {
      console.error("Send OTP Error inside sheet:", err);
      setError(err.message || "Failed to send OTP. Please check the number and try again.");
      // Reset recaptcha
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {}
      }
      // Re-initialize recaptcha next tick
      setTimeout(() => {
        const container = document.getElementById("recaptcha-container-sheet");
        if (container) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container-sheet", {
            size: "invisible"
          });
        }
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!otp || otp.length !== 6) {
      setError("Please enter a 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const fbUser = result.user;
      setSuccessMsg("Verified! Logging in...");

      // Login to backend
      const res = await fetch(window.API_BASE_URL + "/api/auth/firebase-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: fbUser.uid,
          phoneNumber: fbUser.phoneNumber,
          email: ""
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to log in on backend server.");
      }

      const data = await res.json();
      await setAuthSession(data.token, data.user);
    } catch (err) {
      console.error("Verification Error in sheet:", err);
      setError(err.message || "Incorrect OTP. Please enter it again.");
    } finally {
      setLoading(false);
    }
  };

  if (!loginBottomSheetOpen) return null;

  return (
    <div style={backdropStyle} onClick={closeLogin}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        {/* Drag handle indicator */}
        <div style={dragIndicatorStyle} onClick={closeLogin}></div>

        <div style={contentWrapperStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={titleStyle}>Login / Sign Up</h2>
            <button onClick={closeLogin} style={closeButtonStyle}>×</button>
          </div>

          <p style={subtitleStyle}>Enter phone number to receive a one-time verification code</p>

          <div id="recaptcha-container-sheet"></div>

          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}
          {successMsg && <div style={successBannerStyle}>✨ {successMsg}</div>}

          {!confirmationResult ? (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div style={inputContainerStyle}>
                <span style={phonePrefixStyle}>+91</span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? "Sending OTP..." : "Continue with Phone Number →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div>
                <label style={labelStyle}>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  placeholder="Enter code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                  style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "20px", marginTop: "6px" }}
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#6b7280" }}>OTP sent to {phone}</span>
                <button type="button" onClick={() => setConfirmationResult(null)} style={changeNumButtonStyle}>
                  Change Number
                </button>
              </div>

              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? "Verifying..." : "Verify OTP & Login"}
              </button>
            </form>
          )}

          <p style={footerDisclaimerStyle}>
            By continuing, you agree to our Terms & Conditions and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

// Styling Objects
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(4px)",
  zIndex: 100000,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  animation: "fadeIn 0.25s ease-out"
};

const sheetStyle = {
  width: "100%",
  maxWidth: "480px",
  background: "#ffffff",
  borderTopLeftRadius: "28px",
  borderTopRightRadius: "28px",
  boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.08)",
  boxSizing: "border-box",
  animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  paddingBottom: "safe-area-inset-bottom"
};

const dragIndicatorStyle = {
  width: "36px",
  height: "5px",
  background: "#cbd5e1",
  borderRadius: "3px",
  margin: "12px auto 8px auto",
  cursor: "pointer"
};

const contentWrapperStyle = {
  padding: "24px 28px 36px 28px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const titleStyle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "850",
  color: "#111827"
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "28px",
  color: "#9ca3af",
  cursor: "pointer",
  lineHeight: "1",
  padding: 0
};

const subtitleStyle = {
  margin: "4px 0 16px 0",
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: "1.4",
  fontWeight: "550"
};

const inputContainerStyle = {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #e5e7eb",
  borderRadius: "16px",
  padding: "4px 16px",
  background: "#f9fafb",
  boxSizing: "border-box"
};

const phonePrefixStyle = {
  fontSize: "16px",
  fontWeight: "750",
  color: "#374151",
  marginRight: "10px",
  userSelect: "none"
};

const inputStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "12px 0",
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box"
};

const primaryButtonStyle = {
  width: "100%",
  background: "linear-gradient(135deg, #318616 0%, #286f12 100%)",
  color: "white",
  border: "none",
  borderRadius: "16px",
  padding: "16px",
  fontSize: "16px",
  fontWeight: "755",
  cursor: "pointer",
  boxShadow: "0 8px 16px rgba(49, 134, 22, 0.15)",
  transition: "all 0.15s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const changeNumButtonStyle = {
  background: "none",
  border: "none",
  color: "#318616",
  fontWeight: "750",
  cursor: "pointer",
  padding: 0,
  fontSize: "12px"
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "750",
  color: "#4b5563",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const errorBannerStyle = {
  background: "#fef2f2",
  color: "#ef4444",
  border: "1.5px solid #fecaca",
  borderRadius: "12px",
  padding: "12px",
  fontSize: "12px",
  fontWeight: "650",
  marginBottom: "12px"
};

const successBannerStyle = {
  background: "#f0fdf4",
  color: "#16a34a",
  border: "1.5px solid #bbf7d0",
  borderRadius: "12px",
  padding: "12px",
  fontSize: "12px",
  fontWeight: "650",
  marginBottom: "12px"
};

const footerDisclaimerStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center",
  marginTop: "20px",
  lineHeight: "1.4",
  margin: "20px 0 0 0",
  fontWeight: "500"
};
