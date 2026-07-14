import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BuyCoin from "../components/common/BuyCoin";

export default function BuyCoinsTransactionsPage() {
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [errorId, setErrorId] = useState("");
  const [requestId, setRequestId] = useState("");

  const fetchTxs = async () => {
    setLoading(true);
    setAuthError(false);
    setNetworkError(false);
    setServerError(false);
    setErrorId("");
    setRequestId("");

    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(window.API_BASE_URL + "/api/buycoins/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reqIdHeader = res.headers.get("x-request-id");
      if (reqIdHeader) {
        setRequestId(reqIdHeader);
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions || []);
        } else {
          setServerError(true);
          if (data.errorId) setErrorId(data.errorId);
          if (data.requestId) setRequestId(data.requestId);
        }
      } else {
        if (res.status === 401) {
          setAuthError(true);
        } else {
          setServerError(true);
          try {
            const data = await res.json();
            if (data.errorId) setErrorId(data.errorId);
            if (data.requestId) setRequestId(data.requestId);
          } catch (e) {
            // Non-JSON response
          }
        }
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [token]);

  const handleSignInRedirect = () => {
    if (logout) logout();
    navigate("/login?redirect=/buycoins/transactions");
  };

  return (
    <div style={containerStyle}>
      <div style={cardWrapperStyle}>
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
          ← Back to Wallet
        </button>

        {/* Header */}
        <div style={headerStyle}>
          <BuyCoin size={48} animate={true} />
          <h1 style={titleStyle}>BuyCoins Transactions</h1>
          <p style={subtitleStyle}>Full audit log of your earned and spent rewards</p>
        </div>

        {loading ? (
          <div style={skeletonContainerStyle}>
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} style={skeletonRowStyle}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={skeletonIconStyle} />
                  <div>
                    <div style={skeletonTextStyle(120)} />
                    <div style={{ ...skeletonTextStyle(60), marginTop: "6px" }} />
                  </div>
                </div>
                <div style={skeletonTextStyle(40)} />
              </div>
            ))}
          </div>
        ) : authError ? (
          <div style={stateBoxStyle}>
            <span style={{ fontSize: "40px" }}>🔒</span>
            <h3 style={stateTitleStyle}>Session Expired</h3>
            <p style={stateDescStyle}>Please sign in again to view your BuyCoins history.</p>
            <button onClick={handleSignInRedirect} style={actionButtonStyle}>
              Sign In
            </button>
          </div>
        ) : networkError ? (
          <div style={stateBoxStyle}>
            <span style={{ fontSize: "40px" }}>🔌</span>
            <h3 style={stateTitleStyle}>Connection Problem</h3>
            <p style={stateDescStyle}>Unable to connect. Please check your internet connection.</p>
            <button onClick={fetchTxs} style={actionButtonStyle}>
              Retry Connection
            </button>
          </div>
        ) : serverError ? (
          <div style={stateBoxStyle}>
            <span style={{ fontSize: "40px" }}>⚠️</span>
            <h3 style={stateTitleStyle}>Server Error</h3>
            <p style={stateDescStyle}>Something went wrong. Please try again later.</p>
            {(errorId || requestId) && (
              <div style={debugInfoStyle}>
                {errorId && <div>Reference ID: {errorId}</div>}
                {requestId && <div>Request ID: {requestId}</div>}
              </div>
            )}
            <button onClick={fetchTxs} style={{ ...actionButtonStyle, marginTop: "16px" }}>
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div style={stateBoxStyle}>
            <span style={{ fontSize: "40px" }}>📖</span>
            <h3 style={stateTitleStyle}>No Transactions</h3>
            <p style={stateDescStyle}>Earn BuyCoins by placing orders and completing rewards.</p>
            <button onClick={() => navigate("/")} style={actionButtonStyle}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={txListStyle}>
            {transactions.map((tx) => {
              const isPositive = ["earn", "earned", "bonus", "admin", "refund"].includes(tx.type) || (tx.type === "redeemed" && (tx.amount || tx.coins) < 0);
              const isRedemption = tx.type === "redeemed" || ["spent", "redeem"].includes(tx.type);
              
              const val = tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0);
              const txDate = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }) : "Unknown Date";

              return (
                <div key={tx._id} style={txItemStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={iconBoxStyle(isPositive)}>
                      {isPositive ? "📈" : "📉"}
                    </div>
                    <div>
                      <div style={txDescStyle}>{tx.description || (isRedemption ? "Redeemed Reward" : "Earned Coins")}</div>
                      <div style={txDateStyle}>{txDate}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ ...txAmountStyle, color: isPositive ? "#10b981" : "#ef4444" }}>
                      {isPositive ? "+" : "-"}{val}
                    </span>
                    <BuyCoin size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// STYLING DICTIONARY
const containerStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "40px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box"
};

const cardWrapperStyle = {
  width: "100%",
  maxWidth: "480px",
  background: "#ffffff",
  borderRadius: "32px",
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.04)",
  padding: "28px",
  boxSizing: "border-box",
  border: "1px solid #e2e8f0"
};

const backButtonStyle = {
  background: "none",
  border: "none",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "650",
  cursor: "pointer",
  marginBottom: "24px",
  padding: 0
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "850",
  color: "#0f172a",
  margin: "12px 0 4px 0"
};

const subtitleStyle = {
  fontSize: "13px",
  color: "#64748b",
  margin: 0
};

const stateBoxStyle = {
  textAlign: "center",
  padding: "40px 20px",
  background: "#f8fafc",
  borderRadius: "24px",
  border: "1px dashed #cbd5e1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const stateTitleStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#1e293b",
  margin: "16px 0 6px 0"
};

const stateDescStyle = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0 0 20px 0",
  lineHeight: "1.5"
};

const actionButtonStyle = {
  background: "#318616",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "background 150ms ease",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
};

const debugInfoStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  background: "#f1f5f9",
  padding: "8px 12px",
  borderRadius: "8px",
  fontFamily: "monospace",
  marginTop: "10px",
  textAlign: "left"
};

const txListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const txItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 16px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #f1f5f9"
};

const iconBoxStyle = (isPositive) => ({
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: isPositive ? "#ecfdf5" : "#fef2f2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px"
});

const txDescStyle = {
  fontSize: "14px",
  fontWeight: "800",
  color: "#1f2937"
};

const txDateStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "600",
  marginTop: "2px"
};

const txAmountStyle = {
  fontSize: "15px",
  fontWeight: "900"
};

const skeletonContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const skeletonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 16px",
  borderRadius: "18px",
  background: "#ffffff",
  border: "1px solid #f1f5f9"
};

const skeletonIconStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "#f1f5f9"
};

const skeletonTextStyle = (width) => ({
  width: `${width}px`,
  height: "12px",
  background: "#f1f5f9",
  borderRadius: "4px"
});
