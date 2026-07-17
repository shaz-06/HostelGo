import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { msg91Login } from "../../services/otpService";

export default function OtpLoginBottomSheet() {
  const { isLoginOpen, closeLogin, setAuthSession, openOnboarding } = useContext(AuthContext);
  const loginBottomSheetOpen = isLoginOpen;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const verifyingTokenRef = useRef(null);
  const hasVerifiedRef = useRef(false);

  // Reset state when sheet is opened/closed
  useEffect(() => {
    if (!loginBottomSheetOpen) {
      setError("");
      setSuccessMsg("");
      setLoading(false);
      verifyingTokenRef.current = null;
      hasVerifiedRef.current = false;
    }
  }, [loginBottomSheetOpen]);

  // Load and mount the MSG91 OTP Widget script when bottom sheet opens
  useEffect(() => {
    if (!loginBottomSheetOpen) return;

    // Define success verification handler
    window.configuration = {
      widgetId: "366676677233393137373632",
      tokenAuth: "543604TezJRg0EB6a38de05P1",
      success: async (data) => {
        console.log("OTP SUCCESS CALLBACK", Date.now());
        
        // Dynamic search for token property names
        const accessToken = data?.accessToken || data?.access_token || data?.token || data?.message || (data?.data && (data.data.accessToken || data.data.access_token || data.data.token));
        console.log("accessToken:", accessToken);
        console.log("verification in progress:", hasVerifiedRef.current);
        
        if (!accessToken) {
          setError("Failed to fetch verified access token from widget. Payload: " + JSON.stringify(data));
          return;
        }

        // Prevent duplicate verification attempts for the same token
        if (hasVerifiedRef.current) {
          console.log("[DEBUG-SHEET] Verification already succeeded or in progress, ignoring duplicate success callback.");
          return;
        }
        hasVerifiedRef.current = true;

        setLoading(true);
        setError("");
        setSuccessMsg("SMS verified successfully! Creating session...");

        try {
          // Log user in using access token validation route
          const loginData = await msg91Login(accessToken);
          
          await setAuthSession(loginData.token, loginData.user, loginData.isNewUser, loginData.welcomeBonus);
          
          if (loginData.user && loginData.user.role === "admin" && loginData.user.isFounder) {
            console.log("PHONE:", loginData.user.phone);
            console.log("ROLE:", loginData.user.role);
            console.log("FOUNDER:", loginData.user.isFounder);
            console.log("REDIRECT TARGET: /admin-verify");
            navigate("/admin-verify");
          } else {
            console.log("PHONE:", loginData.user?.phone);
            console.log("ROLE:", loginData.user?.role);
            console.log("FOUNDER:", loginData.user?.isFounder);
            console.log("REDIRECT TARGET: /");
            navigate("/");
          }

          if (!loginData.profileCompleted) {
            openOnboarding();
          }
        } catch (err) {
          console.error("Backend Session Validation Error:", err);
          setError(err.message || "Failed to log in. Please try again.");
          hasVerifiedRef.current = false;
        } finally {
          setLoading(false);
        }
      },
      failure: (err) => {
        console.error("OTP Widget Failure:", err);
        setError("Verification Error: " + (err.message || JSON.stringify(err)));
      }
    };

    // 1. Inject intl-tel-input CSS
    const linkEl = document.createElement("link");
    linkEl.id = "intl-tel-css";
    linkEl.rel = "stylesheet";
    linkEl.href = "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.min.css";
    document.head.appendChild(linkEl);

    // 2. Load intl-tel-input JS
    const intlScript = document.createElement("script");
    intlScript.id = "intl-tel-js";
    intlScript.src = "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js";
    intlScript.async = true;

    intlScript.onload = () => {
      console.log("[DEBUG-SHEET] intlTelInput successfully loaded. Type =", typeof window.intlTelInput);
      
      // 3. Load MSG91 loader script only after dependencies are verified
      const loaderScript = document.createElement("script");
      loaderScript.id = "msg91-widget-loader-sheet";
      loaderScript.src = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";
      loaderScript.async = true;
      loaderScript.onload = () => {
        console.log("[DEBUG-SHEET] MSG91 otp-provider loaded. initSendOTP type =", typeof window.initSendOTP);
        if (typeof window.initSendOTP === "function") {
          window.initSendOTP(window.configuration);
        }
      };
      document.body.appendChild(loaderScript);
    };

    document.body.appendChild(intlScript);

    // Cleanup scripts on component unmount
    return () => {
      document.getElementById("intl-tel-css")?.remove();
      document.getElementById("intl-tel-js")?.remove();
      document.getElementById("msg91-widget-loader-sheet")?.remove();
      delete window.configuration;
    };
  }, [loginBottomSheetOpen]);

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

          <p style={subtitleStyle}>Verify your mobile number to sign up or log in</p>

          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}
          {successMsg && <div style={successBannerStyle}>✨ {successMsg}</div>}

          {/* MSG91 Widget Mount Target */}
          <div id="msg91-otp-widget-container" style={{ minHeight: "220px", marginTop: "16px" }}>
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px", fontSize: "14px", fontWeight: "600", color: "#6b7280" }}>
                Verifying session with backend server...
              </div>
            )}
          </div>

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
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(4px)",
  zIndex: 1000,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center"
};

const sheetStyle = {
  backgroundColor: "#ffffff",
  borderTopLeftRadius: "28px",
  borderTopRightRadius: "28px",
  width: "100%",
  maxWidth: "480px",
  padding: "24px 24px 34px 24px",
  boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.08)",
  animation: "slideUp 0.3s ease-out-back",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const dragIndicatorStyle = {
  width: "48px",
  height: "5px",
  backgroundColor: "#e5e7eb",
  borderRadius: "3px",
  margin: "0 auto 20px auto",
  cursor: "pointer"
};

const contentWrapperStyle = {
  display: "flex",
  flexDirection: "column"
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "850",
  color: "#1f2937",
  margin: 0,
  letterSpacing: "-0.5px"
};

const subtitleStyle = {
  fontSize: "13.5px",
  color: "#6b7280",
  margin: "4px 0 0 0",
  lineHeight: "1.5",
  fontWeight: "550"
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "26px",
  color: "#9ca3af",
  cursor: "pointer",
  lineHeight: 1,
  padding: "4px"
};

const errorBannerStyle = {
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
  padding: "12px 16px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: "750",
  marginTop: "16px",
  border: "1px solid #fee2e2"
};

const successBannerStyle = {
  backgroundColor: "#f0fdf4",
  color: "#166534",
  padding: "12px 16px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: "750",
  marginTop: "16px",
  border: "1px solid #dcfce7"
};

const footerDisclaimerStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center",
  margin: "24px 0 0 0",
  lineHeight: "1.6",
  fontWeight: "500"
};
