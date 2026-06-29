import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminVerification() {
  const navigate = useNavigate();
  const { user, token, verifyAdmin, updateUserInSession } = useContext(AuthContext);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    // If not logged in as admin at all, redirect to customer home
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    // Check if user needs PIN setup
    setIsSetup(!user.hasAdminPin);
  }, [user, navigate]);

  // Handle lockout countdown timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (pin.length !== 6 || isNaN(pin)) {
      setError("Please enter a valid 6-digit PIN.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(window.API_BASE_URL + "/api/auth/admin-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        verifyAdmin(data.token);
        navigate("/admin");
      } else {
        if (res.status === 429) {
          // Locked out
          setLockoutTime(15 * 60); // 15 mins
        }
        setError(data.message || "Incorrect PIN. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6 || isNaN(newPin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(window.API_BASE_URL + "/api/auth/admin-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPin })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update user state to reflect PIN is set
        updateUserInSession({ ...user, hasAdminPin: true });
        verifyAdmin(data.token);
        navigate("/admin");
      } else {
        setError(data.message || "Failed to initialize Admin PIN.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatLockout = () => {
    const mins = Math.floor(lockoutTime / 60);
    const secs = lockoutTime % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: "40px" }}>🛡️</span>
          <h1 style={titleStyle}>{isSetup ? "Setup Admin PIN" : "Admin Verification"}</h1>
          <p style={subtitleStyle}>
            {isSetup
              ? "Choose a secure 6-digit passcode to initialize your founder admin session."
              : "Verify your administrative privileges using your secure 6-digit PIN."}
          </p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {lockoutTime > 0 ? (
          <div style={lockoutContainerStyle}>
            <span style={{ fontSize: "28px" }}>⏳</span>
            <span style={lockoutTitleStyle}>Verification Temporarily Locked</span>
            <span style={lockoutTimerStyle}>{formatLockout()}</span>
            <p style={lockoutDescStyle}>Please wait for the lockout period to end before trying again.</p>
          </div>
        ) : isSetup ? (
          <form onSubmit={handleSetupPin} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Enter New 6-Digit PIN</label>
              <input
                type="password"
                maxLength="6"
                pattern="\d{6}"
                required
                placeholder="••••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                style={inputStyle}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Confirm New 6-Digit PIN</label>
              <input
                type="password"
                maxLength="6"
                pattern="\d{6}"
                required
                placeholder="••••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Saving Passcode..." : "Initialize Admin Session"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Enter your 6-Digit Passcode</label>
              <input
                type="password"
                maxLength="6"
                pattern="\d{6}"
                required
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Verifying..." : "Verify Passcode"}
            </button>
          </form>
        )}

        <button onClick={() => navigate("/")} style={cancelButtonStyle}>
          Cancel & Return Home
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
  padding: "20px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const cardStyle = {
  background: "#ffffff",
  border: "1.5px solid #e5e7eb",
  borderRadius: "24px",
  padding: "36px",
  maxWidth: "420px",
  width: "100%",
  boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  gap: "24px"
};

const headerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px"
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  color: "#111827",
  margin: 0
};

const subtitleStyle = {
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: "1.5",
  margin: 0,
  fontWeight: "500"
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "18px"
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  textAlign: "left"
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#4b5563"
};

const inputStyle = {
  padding: "14px",
  borderRadius: "14px",
  border: "1.5px solid #cbd5e1",
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "6px",
  textAlign: "center",
  outline: "none",
  transition: "border-color 0.15s ease",
  "&:focus": {
    borderColor: "#318616"
  }
};

const buttonStyle = {
  padding: "14px",
  borderRadius: "14px",
  background: "#318616",
  color: "#ffffff",
  border: "none",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(49, 134, 22, 0.15)",
  transition: "all 0.15s ease"
};

const cancelButtonStyle = {
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  textDecoration: "underline"
};

const errorStyle = {
  padding: "12px",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#dc2626",
  fontSize: "13px",
  fontWeight: "700",
  textAlign: "center",
  border: "1px solid #fecaca"
};

const lockoutContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  padding: "16px",
  borderRadius: "16px",
  background: "#fafbfd",
  border: "1.5px solid #f3f4f6"
};

const lockoutTitleStyle = {
  fontSize: "14px",
  fontWeight: "800",
  color: "#ef4444"
};

const lockoutTimerStyle = {
  fontSize: "32px",
  fontWeight: "900",
  color: "#111827",
  fontFamily: "monospace"
};

const lockoutDescStyle = {
  fontSize: "11px",
  color: "#6b7280",
  margin: 0,
  lineHeight: "1.4"
};
