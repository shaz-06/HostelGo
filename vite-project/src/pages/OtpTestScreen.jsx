import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { msg91Login } from "../services/otpService";

export default function OtpTestScreen() {
  const { setAuthSession, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [backendDetails, setBackendDetails] = useState(null);
  const [sessionRestored, setSessionRestored] = useState("Checking...");

  useEffect(() => {
    const hasToken = localStorage.getItem("buyto_token");
    setSessionRestored(hasToken ? "Restored" : "Not Restored");

    // Initialize MSG91 Widget configuration dynamically
    window.configuration = {
      widgetId: "366676677233393137373632",
      tokenAuth: "543604TezJRg0EB6a38de05P1",
      success: async (data) => {
        console.log("=== MSG91 SUCCESS CALLBACK TRIGGERED (TEST) ===");
        console.log("MSG91 SUCCESS PAYLOAD:", JSON.stringify(data, null, 2));
        
        const token = data?.accessToken || data?.access_token || data?.token || data?.message || (data?.data && (data.data.accessToken || data.data.access_token || data.data.token));
        console.log("MSG91 SUCCESS PAYLOAD:", data);
        console.log("EXTRACTED ACCESS TOKEN:", token);
        
        if (!token) {
          setError("No access token returned from MSG91 widget. Payload: " + JSON.stringify(data));
          return;
        }
        setLoading(true);
        setError("");
        setSuccessMsg("Widget verification succeeded! Sending to backend...");
        try {
          const res = await msg91Login(token);
          setSuccessMsg("Authenticated successfully with backend JWT!");
          setBackendDetails({
            token: res.token,
            user: res.user
          });
          await setAuthSession(res.token, res.user);
        } catch (err) {
          console.error("Backend login error:", err);
          setError("Backend Authentication Error: " + err.message);
        } finally {
          setLoading(false);
        }
      },
      failure: (err) => {
        console.error("OTP Failure inside Test Screen:", err);
        setError("Widget error: " + JSON.stringify(err));
      }
    };

    // 1. Inject intl-tel-input CSS
    const linkEl = document.createElement("link");
    linkEl.id = "intl-tel-css-test";
    linkEl.rel = "stylesheet";
    linkEl.href = "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.min.css";
    document.head.appendChild(linkEl);

    // 2. Load intl-tel-input JS
    const intlScript = document.createElement("script");
    intlScript.id = "intl-tel-js-test";
    intlScript.src = "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js";
    intlScript.async = true;

    intlScript.onload = () => {
      console.log("[DEBUG-TEST] intlTelInput successfully loaded. Type =", typeof window.intlTelInput);

      // 3. Load MSG91 loader script
      const loaderScript = document.createElement("script");
      loaderScript.id = "msg91-widget-loader-test";
      loaderScript.src = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";
      loaderScript.async = true;
      loaderScript.onload = () => {
        console.log("[DEBUG-TEST] MSG91 otp-provider loaded. initSendOTP type =", typeof window.initSendOTP);
        if (typeof window.initSendOTP === "function") {
          window.initSendOTP(window.configuration);
        }
      };
      document.body.appendChild(loaderScript);
    };

    document.body.appendChild(intlScript);

    return () => {
      document.getElementById("intl-tel-css-test")?.remove();
      document.getElementById("intl-tel-js-test")?.remove();
      document.getElementById("msg91-widget-loader-test")?.remove();
      delete window.configuration;
    };
  }, []);

  return (
    <div style={{ maxWidth: "450px", margin: "40px auto", padding: "24px", background: "white", borderRadius: "24px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)", fontFamily: "'Outfit', sans-serif" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1f2937", marginBottom: "8px", textAlign: "center" }}>
        MSG91 OTP Test Screen ⚡
      </h2>
      <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "24px", fontWeight: "600" }}>
        Verify MSG91 Phone Auth Widget integration
      </p>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "12px", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "12px", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Widget Target Container */}
      <div id="msg91-otp-widget-container" style={{ minHeight: "220px", marginBottom: "20px" }}>
        {loading && <div style={{ fontSize: "13px", color: "#6b7280", textAlign: "center" }}>Verifying credentials with backend...</div>}
      </div>

      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1.5px solid #cbd5e1", marginBottom: "16px" }}>
        <b style={{ fontSize: "14px", color: "#1f2937" }}>Session Status:</b>
        <span style={{
          marginLeft: "8px",
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "800",
          background: sessionRestored === "Restored" ? "#d1fae5" : "#fee2e2",
          color: sessionRestored === "Restored" ? "#065f46" : "#991b1b"
        }}>
          {sessionRestored}
        </span>
      </div>

      {backendDetails && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1.5px dashed #cbd5e1" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1f2937", margin: "0 0 10px 0" }}>
            Backend JWT Token Details
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
            <div>
              <b style={{ color: "#4b5563" }}>Token:</b> <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{backendDetails.token.substring(0, 30)}...</span>
            </div>
            <div>
              <b style={{ color: "#4b5563" }}>DB User ID:</b> <span>{backendDetails.user._id}</span>
            </div>
            <div>
              <b style={{ color: "#4b5563" }}>Role:</b> <span>{backendDetails.user.role}</span>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1.5px solid #cbd5e1" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#059669", margin: "0 0 6px 0" }}>
            Current AuthContext User Status:
          </h4>
          <pre style={{ fontSize: "11px", background: "#f8fafc", padding: "10px", borderRadius: "10px", margin: 0, overflowX: "auto" }}>
            {JSON.stringify(user, null, 2)}
          </pre>
          <button
            onClick={() => navigate("/")}
            style={{ width: "100%", padding: "10px", background: "#1f2937", color: "white", border: "none", borderRadius: "10px", fontSize: "12.5px", fontWeight: "750", cursor: "pointer", marginTop: "12px" }}
          >
            🏪 Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
