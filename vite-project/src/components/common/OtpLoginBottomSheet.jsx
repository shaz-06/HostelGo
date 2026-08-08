import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SEO from "./SEO";
import { msg91Login } from "../../services/otpService";
import phoneIllustration from "../../assets/illustrations/phone-verification.png";
import { RotateCw } from "lucide-react";
import { logoPath } from "../../config/branding";

export default function OtpLoginBottomSheet() {
  const { isLoginOpen, closeLogin, setAuthSession, openOnboarding } = useContext(AuthContext);
  const loginBottomSheetOpen = isLoginOpen;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 768);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const verifyingTokenRef = useRef(null);
  const hasVerifiedRef = useRef(false);

  // Reset state when sheet is opened/closed
  useEffect(() => {
    if (!loginBottomSheetOpen) {
      setError("");
      setInfoMsg(null);
      setSuccessMsg("");
      setLoading(false);
      setRetrying(false);
      setIsHovered(false);
      setIsActive(false);
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
        setInfoMsg(null);
        setSuccessMsg("SMS verified successfully! Creating session...");

        try {
          // Log user in using access token validation route
          const loginData = await msg91Login(accessToken);

          await setAuthSession(loginData.token, loginData.user, loginData.isNewUser, loginData.welcomeBonus);

          const redirectTarget = sessionStorage.getItem("redirectAfterLogin");
          sessionStorage.removeItem("redirectAfterLogin");

          if (redirectTarget && redirectTarget.startsWith("/")) {
            console.log("REDIRECT TARGET (sessionStorage):", redirectTarget);
            navigate(redirectTarget);
          } else if (loginData.user && loginData.user.role === "admin" && loginData.user.isFounder) {
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
        const errMsg = err.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
        if (errMsg.toLowerCase().includes("cancelled") || errMsg.toLowerCase().includes("canceled")) {
          setInfoMsg({
            heading: "Phone verification was cancelled",
            body: "Please verify your mobile number to continue with checkout."
          });
          setError("");
        } else {
          setError("Verification Error: " + errMsg);
          setInfoMsg(null);
        }
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

  const handleRetry = () => {
    setRetrying(true);
    setError("");
    setInfoMsg(null);
    setSuccessMsg("");
    setLoading(false);
    hasVerifiedRef.current = false;

    // Reset container HTML
    const container = document.getElementById("msg91-otp-widget-container");
    if (container) {
      container.innerHTML = "";
    }

    // Re-initialize MSG91 widget
    if (typeof window.initSendOTP === "function" && window.configuration) {
      window.initSendOTP(window.configuration);
    }

    setTimeout(() => {
      setRetrying(false);
    }, 800);
  };

  if (!loginBottomSheetOpen) return null;

  const isCheckoutRedirect = sessionStorage.getItem("redirectAfterLogin") !== null;

  const activeRetryButtonStyle = {
    ...retryButtonStyle,
    backgroundColor: isHovered ? "#256510" : "#318616",
    transform: isActive ? "scale(0.98)" : "scale(1)",
    opacity: retrying ? 0.7 : 1,
    pointerEvents: retrying ? "none" : "auto",
  };

  const isMobile = windowWidth < 768;

  const responsiveBackdropStyle = {
    ...backdropStyle,
    alignItems: isMobile ? "flex-end" : "center",
  };

  const responsiveSheetStyle = {
    ...sheetStyle,
    borderTopLeftRadius: "32px",
    borderTopRightRadius: "32px",
    borderBottomLeftRadius: isMobile ? "0px" : "32px",
    borderBottomRightRadius: isMobile ? "0px" : "32px",
    margin: isMobile ? "0" : "auto",
    transform: isMobile ? "none" : "translateY(0)",
    boxShadow: "0 10px 40px rgba(30,41,59,0.16)",
    maxWidth: isMobile ? "100%" : "460px",
  };

  return (
    <div style={responsiveBackdropStyle} onClick={closeLogin}>
      <SEO title="Login" description="Sign in securely with your mobile number to continue shopping on Buyto." />
      <style>{`
        /* MSG91 Custom overrides to match Buyto Premium UI */
        #msg91-otp-widget-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          font-family: 'Outfit', 'Inter', sans-serif !important;
        }

        #msg91-otp-widget-container .widget-header,
        #msg91-otp-widget-container .header,
        #msg91-otp-widget-container .logo,
        #msg91-otp-widget-container h1,
        #msg91-otp-widget-container h2,
        #msg91-otp-widget-container h3,
        #msg91-otp-widget-container p.subtitle,
        #msg91-otp-widget-container .close-btn {
          display: none !important;
        }

        #msg91-otp-widget-container .iti {
          width: 100% !important;
          margin-bottom: 16px !important;
        }

        /* Styling the elevated inputs */
        #msg91-otp-widget-container input[type="tel"],
        #msg91-otp-widget-container input[type="text"],
        #msg91-otp-widget-container input[type="number"],
        #msg91-otp-widget-container .phone-input {
          width: 100% !important;
          height: 56px !important;
          border-radius: 16px !important;
          border: 1.5px solid #e2e8f0 !important;
          background-color: #f8fafc !important;
          padding-left: 56px !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          color: #0f172a !important;
          outline: none !important;
          transition: all 0.2s ease !important;
          box-sizing: border-box !important;
        }

        #msg91-otp-widget-container input[type="tel"]:focus,
        #msg91-otp-widget-container input[type="text"]:focus,
        #msg91-otp-widget-container input[type="number"]:focus {
          border-color: #318616 !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(49, 134, 22, 0.1) !important;
        }

        #msg91-otp-widget-container .iti__selected-flag {
          background-color: transparent !important;
          border-top-left-radius: 16px !important;
          border-bottom-left-radius: 16px !important;
          padding-left: 14px !important;
        }

        /* Hide duplicate standalone prefix/dial codes injected below input fields */
        #msg91-otp-widget-container .dial-code,
        #msg91-otp-widget-container .country-dial-code,
        #msg91-otp-widget-container .phone-dial-code,
        #msg91-otp-widget-container label[for="phone"] span,
        #msg91-otp-widget-container .phone-container > span,
        #msg91-otp-widget-container .phone-number-container + span,
        #msg91-otp-widget-container .country-code-container,
        #msg91-otp-widget-container .duplicate-prefix,
        #msg91-otp-widget-container .dialcode-msg91 {
          display: none !important;
        }

        /* Styling for validation errors inside MSG91 Widget */
        #msg91-otp-widget-container input.error,
        #msg91-otp-widget-container input.is-invalid,
        #msg91-otp-widget-container input.invalid,
        #msg91-otp-widget-container .has-error input {
          border-color: #D64545 !important;
          box-shadow: 0 0 0 4px rgba(214, 69, 69, 0.1) !important;
        }

        #msg91-otp-widget-container .error-msg,
        #msg91-otp-widget-container .error-message,
        #msg91-otp-widget-container .validation-message,
        #msg91-otp-widget-container .error-text {
          color: #D64545 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          margin-top: 6px !important;
          text-align: left !important;
          width: 100% !important;
          display: block !important;
        }

        /* Premium Pill-shaped Green Buttons */
        #msg91-otp-widget-container button,
        #msg91-otp-widget-container input[type="button"],
        #msg91-otp-widget-container .btn-primary,
        #msg91-otp-widget-container .submit-btn {
          width: 100% !important;
          height: 54px !important;
          background: #318616 !important;
          color: white !important;
          font-size: 15px !important;
          font-weight: 850 !important;
          border-radius: 9999px !important;
          border: none !important;
          cursor: pointer !important;
          box-shadow: 0 4px 12px rgba(49, 134, 22, 0.2) !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        #msg91-otp-widget-container button:hover,
        #msg91-otp-widget-container input[type="button"]:hover,
        #msg91-otp-widget-container .btn-primary:hover {
          background: #1e5e0f !important;
          box-shadow: 0 6px 16px rgba(49, 134, 22, 0.3) !important;
        }

        #msg91-otp-widget-container button:active,
        #msg91-otp-widget-container input[type="button"]:active {
          transform: scale(0.98) !important;
        }

        /* Captcha soft container overlay */
        #msg91-otp-widget-container iframe,
        #msg91-otp-widget-container .h-captcha {
          margin: 16px auto !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          background: #f8fafc !important;
          padding: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }

        /* Digit input containers */
        #msg91-otp-widget-container .otp-inputs,
        #msg91-otp-widget-container .otp-container,
        #msg91-otp-widget-container .digit-inputs {
          display: flex !important;
          justify-content: space-between !important;
          gap: 8px !important;
          margin-top: 16px !important;
          margin-bottom: 24px !important;
          width: 100% !important;
        }

        #msg91-otp-widget-container .otp-inputs input,
        #msg91-otp-widget-container .otp-container input,
        #msg91-otp-widget-container .digit-inputs input {
          width: 44px !important;
          height: 48px !important;
          border-radius: 12px !important;
          border: 1.5px solid #cbd5e1 !important;
          background-color: #f8fafc !important;
          text-align: center !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          outline: none !important;
          transition: all 0.2s ease !important;
        }

        #msg91-otp-widget-container .otp-inputs input:focus,
        #msg91-otp-widget-container .otp-container input:focus {
          border-color: #318616 !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(49, 134, 22, 0.1) !important;
        }

        #msg91-otp-widget-container .resend-container,
        #msg91-otp-widget-container .resend-otp-wrapper,
        #msg91-otp-widget-container .timer-text {
          font-size: 13px !important;
          color: #64748b !important;
          font-weight: 600 !important;
          margin-top: 12px !important;
        }

        #msg91-otp-widget-container .resend-btn,
        #msg91-otp-widget-container .resend-link,
        #msg91-otp-widget-container .resend-otp-link {
          color: #318616 !important;
          font-weight: 700 !important;
          text-decoration: none !important;
          cursor: pointer !important;
        }

        /* Subtle MSG91 security text */
        #msg91-otp-widget-container .powered-by,
        #msg91-otp-widget-container .secured-by {
          font-size: 11px !important;
          color: #94a3b8 !important;
          text-align: center !important;
          margin-top: 12px !important;
          font-weight: 500 !important;
        }

        /* React close button hover state */
        .close-btn-react:hover {
          background-color: #e5e7eb !important;
          color: #1f2937 !important;
        }
      `}</style>

      <div style={responsiveSheetStyle} onClick={(e) => e.stopPropagation()}>
        {/* Drag handle indicator */}
        <div style={dragIndicatorStyle} onClick={closeLogin}></div>

        <div style={contentWrapperStyle}>
          {/* Brand Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img
                src={logoPath}
                alt="Buyto"
                style={{
                  height: "36px",
                  width: "auto",
                  objectFit: "contain"
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: "900", color: "#1e5e0f" }}>Buyto</span>
            </div>
            <button onClick={closeLogin} style={closeButtonStyle} className="close-btn-react">×</button>
          </div>

          <h2 style={titleStyle}>Welcome to Buyto 👋</h2>
          <p style={subtitleStyle}>Enter your mobile number to continue</p>

          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}
          {infoMsg && (
            <div style={infoBannerStyle}>
              <div style={{ fontWeight: "750", marginBottom: "4px" }}>ℹ️ {infoMsg.heading}</div>
              <div style={{ fontSize: "12px", opacity: 0.95, fontWeight: "550" }}>{infoMsg.body}</div>
            </div>
          )}
          {successMsg && <div style={successBannerStyle}>✨ {successMsg}</div>}

          <img src={phoneIllustration} alt="Phone Verification" style={illustrationStyle} />

          {infoMsg ? (
            <button
              onClick={handleRetry}
              disabled={retrying}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseDown={() => setIsActive(true)}
              onMouseUp={() => setIsActive(false)}
              style={activeRetryButtonStyle}
            >
              <RotateCw size={18} className={retrying ? "animate-spin" : ""} style={{ marginRight: "8px" }} />
              {retrying ? "Retrying..." : "Retry Login"}
            </button>
          ) : (
            /* MSG91 Widget Mount Target */
            <div id="msg91-otp-widget-container" style={{ minHeight: "220px", marginTop: "16px" }}>
              {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px", fontSize: "14px", fontWeight: "600", color: "#6b7280" }}>
                  Verifying session with backend server...
                </div>
              )}
            </div>
          )}


          <p style={footerDisclaimerStyle}>
            By continuing, you agree to Buyto's Terms & Conditions and Privacy Policy.
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
  justifyContent: "center"
};

const sheetStyle = {
  backgroundColor: "#ffffff",
  borderTopLeftRadius: "32px",
  borderTopRightRadius: "32px",
  width: "100%",
  padding: "28px 24px 34px 24px",
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
  background: "#f3f4f6",
  border: "none",
  fontSize: "20px",
  color: "#4b5563",
  cursor: "pointer",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  transition: "all 0.2s ease"
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

const infoBannerStyle = {
  backgroundColor: "#fef3c7",
  color: "#b45309",
  padding: "12px 16px",
  borderRadius: "14px",
  fontSize: "13px",
  marginTop: "16px",
  border: "1px solid #fde68a"
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

const illustrationStyle = {
  width: "200px",
  height: "auto",
  display: "block",
  margin: "24px auto",
  maxWidth: "100%",
  objectFit: "contain"
};

const retryButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "48px",
  borderRadius: "14px",
  backgroundColor: "#318616",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)",
  transition: "all 0.2s ease",
  margin: "24px 0",
};

const footerDisclaimerStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center",
  margin: "24px 0 0 0",
  lineHeight: "1.6",
  fontWeight: "500"
};
