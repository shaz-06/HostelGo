import React, { useState, useEffect, useContext } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../config/firebase";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OtpTestScreen() {
  const { setAuthSession, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [firebaseDetails, setFirebaseDetails] = useState(null);
  const [backendDetails, setBackendDetails] = useState(null);
  const [sessionRestored, setSessionRestored] = useState("Checking...");

  useEffect(() => {
    const hasToken = localStorage.getItem("buyto_token");
    if (hasToken) {
      setSessionRestored("Restored");
    } else {
      setSessionRestored("Not Restored");
    }
  }, []);

  useEffect(() => {
    // Setup invisible recaptcha verifier
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          }
        });
      }
    } catch (err) {
      console.error("Recaptcha Init Error:", err);
      setError("Failed to initialize recaptcha: " + err.message);
    }
  }, []);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    // Prefix with +91 if not present
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("91") && formattedPhone.length > 10) {
        formattedPhone = "+" + formattedPhone;
      } else {
        formattedPhone = "+91" + formattedPhone;
      }
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setSuccessMsg("SMS OTP sent successfully!");
    } catch (err) {
      console.error("Send OTP Error:", err);
      setError("Error sending OTP: " + err.message);
      // Reset recaptcha verifier if error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {}
      }
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
      setSuccessMsg("OTP Verification Successful");
      
      console.log("Firebase Phone Auth Verification Successful!");
      console.log("Firebase UID:", fbUser.uid);
      console.log("Phone Number:", fbUser.phoneNumber);

      setFirebaseDetails({
        uid: fbUser.uid,
        phoneNumber: fbUser.phoneNumber
      });

      // Call Backend to generate JWT token
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
        throw new Error(errData.message || "Backend login failed");
      }

      const data = await res.json();
      setBackendDetails({
        token: data.token,
        user: data.user
      });

      // Save JWT and user session
      await setAuthSession(data.token, data.user);
      setSuccessMsg("Session created and stored successfully! JWT Received.");

    } catch (err) {
      console.error("Verification Error:", err);
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "40px auto", padding: "24px", background: "white", borderRadius: "24px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)", fontFamily: "'Outfit', sans-serif" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1f2937", marginBottom: "8px", textAlign: "center" }}>
        Firebase OTP Test Screen ⚡
      </h2>
      <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "24px", fontWeight: "600" }}>
        Verify Firebase Phone Auth on Web & Android APK
      </p>

      {/* Firebase configuration parameters info banner */}
      <div style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "16px", fontSize: "11.5px", color: "#475569", lineHeight: "1.4" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>Firebase Project:</b>
          <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0f172a" }}>{auth?.app?.options?.projectId}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <b>API Key:</b>
          <span style={{ fontFamily: "monospace" }}>{auth?.app?.options?.apiKey?.substring(0, 12)}...</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <b>App ID:</b>
          <span style={{ fontFamily: "monospace" }}>{auth?.app?.options?.appId?.substring(0, 22)}...</span>
        </div>
      </div>

      {/* reCAPTCHA target element */}
      <div id="recaptcha-container"></div>

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

      {!confirmationResult ? (
        <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "6px" }}>
              Phone Number
            </label>
            <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", background: "white" }}>
              <span style={{ padding: "14px", background: "#f3f4f6", fontSize: "14px", fontWeight: "700", color: "#374151" }}>
                +91
              </span>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "14px", border: "none", fontSize: "14px", fontWeight: "600", outline: "none" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#318616", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(49,134,22,0.2)" }}
          >
            {loading ? "Sending SMS..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "6px" }}>
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="e.g. 123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: "100%", padding: "14px", border: "1.5px solid #e5e7eb", borderRadius: "12px", fontSize: "16px", fontWeight: "800", letterSpacing: "8px", textAlign: "center", outline: "none" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#318616", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(49,134,22,0.2)" }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={() => setConfirmationResult(null)}
            style={{ background: "transparent", border: "none", color: "#4b5563", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: "8px" }}
          >
            ← Back to Phone Input
          </button>
        </form>
      )}

      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1.5px solid #cbd5e1", marginBottom: "16px" }}>
        <b style={{ fontSize: "14px", color: "#1f2937" }}>Session:</b>
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

      {firebaseDetails && (
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1.5px dashed #cbd5e1" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#1f2937", margin: "0 0 10px 0" }}>
            Firebase Credentials
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
            <div>
              <b style={{ color: "#4b5563" }}>UID:</b> <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{firebaseDetails.uid}</span>
            </div>
            <div>
              <b style={{ color: "#4b5563" }}>Phone:</b> <span>{firebaseDetails.phoneNumber}</span>
            </div>
          </div>
        </div>
      )}

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
