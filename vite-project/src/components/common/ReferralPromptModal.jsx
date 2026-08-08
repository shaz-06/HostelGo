import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function ReferralPromptModal() {
  const { user, token, updateUserInSession } = useContext(AuthContext);
  const [pendingReferralCode, setPendingReferralCode] = useState(null);
  const [hasOrders, setHasOrders] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(true);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Read code from sessionStorage
    const code = sessionStorage.getItem("pendingReferralCode");
    if (code) {
      setPendingReferralCode(code);
    }
  }, []);

  useEffect(() => {
    if (!token || !user || user.referredBy || !pendingReferralCode) {
      setCheckingOrders(false);
      return;
    }
    fetch(`${window.API_BASE_URL || ""}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setHasOrders(true);
        }
        setCheckingOrders(false);
      })
      .catch(() => setCheckingOrders(false));
  }, [token, user, pendingReferralCode]);

  if (dismissed || checkingOrders || !pendingReferralCode || !user || user.referredBy || hasOrders) {
    return null;
  }

  const handleApply = async () => {
    setLinking(true);
    setLinkError("");
    try {
      const res = await fetch(`${window.API_BASE_URL || ""}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user.name,
          referralCode: pendingReferralCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to apply referral code.");
      }
      updateUserInSession(data.user);
      sessionStorage.removeItem("pendingReferralCode");
      setLinkSuccess(true);
      setTimeout(() => {
        setDismissed(true);
      }, 3000);
    } catch (err) {
      console.error(err);
      if (err.message?.toLowerCase().includes("self")) {
        setLinkError("You can't use your own referral code.");
      } else if (err.message?.toLowerCase().includes("invalid")) {
        setLinkError("That referral code isn't valid.");
      } else {
        setLinkError(err.message || "Something went wrong.");
      }
    } finally {
      setLinking(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.removeItem("pendingReferralCode");
    setDismissed(true);
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        {!linkSuccess ? (
          <>
            <div style={iconStyle}>🎁</div>
            <h2 style={titleStyle}>Referral code detected!</h2>
            <p style={subtitleStyle}>Your friend invited you to Buyto.</p>
            
            <div style={codeBoxStyle}>
              <span style={codeLabelStyle}>REFERRAL CODE</span>
              <span style={codeValueStyle}>{pendingReferralCode}</span>
            </div>

            <p style={descStyle}>
              Apply this code to unlock <strong style={{ color: "#318616" }}>₹50 BuyCoins</strong> reward after your first qualifying order of ₹199 or more is delivered.
            </p>

            {linkError && (
              <div style={errorStyle}>
                ⚠️ {linkError}
              </div>
            )}

            <div style={btnRowStyle}>
              <button onClick={handleSkip} disabled={linking} style={skipBtnStyle}>
                Skip
              </button>
              <button onClick={handleApply} disabled={linking} style={applyBtnStyle}>
                {linking ? "Applying..." : "Apply Referral"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={iconStyle}>🎉</div>
            <h2 style={titleStyle}>Referral applied!</h2>
            <p style={descStyle} className="text-center">
              You're now eligible for <strong style={{ color: "#318616" }}>₹50 BuyCoins</strong> after your first qualifying order is delivered.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(4px)",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px"
};

const modalStyle = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "28px 24px",
  maxWidth: "380px",
  width: "100%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const iconStyle = {
  fontSize: "48px",
  marginBottom: "16px"
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "850",
  color: "#1e293b",
  margin: "0 0 4px 0",
  textAlign: "center"
};

const subtitleStyle = {
  fontSize: "13.5px",
  color: "#64748b",
  margin: "0 0 20px 0",
  textAlign: "center",
  fontWeight: "600"
};

const codeBoxStyle = {
  background: "#fff7cc",
  border: "1.5px dashed #f59e0b",
  borderRadius: "16px",
  padding: "12px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "16px"
};

const codeLabelStyle = {
  fontSize: "10px",
  fontWeight: "800",
  color: "#b45309",
  letterSpacing: "1px"
};

const codeValueStyle = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#78350f",
  letterSpacing: "2px",
  marginTop: "4px"
};

const descStyle = {
  fontSize: "13px",
  color: "#475569",
  lineHeight: "1.5",
  margin: "0 0 20px 0",
  textAlign: "center",
  fontWeight: "550"
};

const errorStyle = {
  color: "#ef4444",
  background: "#fef2f2",
  border: "1px solid #fee2e2",
  padding: "10px 14px",
  borderRadius: "12px",
  fontSize: "12.5px",
  fontWeight: "700",
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "20px",
  textAlign: "center"
};

const btnRowStyle = {
  display: "flex",
  gap: "12px",
  width: "100%"
};

const skipBtnStyle = {
  flex: 1,
  height: "48px",
  borderRadius: "9999px",
  border: "1.5px solid #cbd5e1",
  background: "#ffffff",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "750",
  cursor: "pointer",
  outline: "none"
};

const applyBtnStyle = {
  flex: 2,
  height: "48px",
  borderRadius: "9999px",
  border: "none",
  background: "#318616",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  outline: "none",
  boxShadow: "0 4px 10px rgba(49, 134, 22, 0.2)"
};
