import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BuyCoin from "../components/common/BuyCoin";

export default function BuyCoinsTransactionsPage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/buycoins/transactions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTransactions(data.transactions || []);
          }
        } else {
          setError("Failed to fetch transaction logs");
        }
      } catch (err) {
        console.error(err);
        setError("Network error loading transactions");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTxs();
  }, [token]);

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
          <p style={statusTextStyle}>Loading transactions...</p>
        ) : error ? (
          <p style={{ ...statusTextStyle, color: "#ef4444" }}>{error}</p>
        ) : transactions.length === 0 ? (
          <div style={emptyBoxStyle}>
            <span style={{ fontSize: "36px" }}>📖</span>
            <p style={{ margin: "10px 0 0 0", color: "#6b7280", fontSize: "14px", fontWeight: "600" }}>
              No transactions logged yet.
            </p>
          </div>
        ) : (
          <div style={txListStyle}>
            {transactions.map((tx) => {
              const isPositive = ["earn", "earned", "bonus", "admin", "refund"].includes(tx.type) || (tx.type === "redeemed" && (tx.amount || tx.coins) < 0);
              const isRedemption = tx.type === "redeemed" || ["spent", "redeem"].includes(tx.type);
              
              // Handle formatting
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

const statusTextStyle = {
  textAlign: "center",
  fontSize: "14px",
  color: "#64748b",
  fontWeight: "600",
  padding: "24px 0"
};

const emptyBoxStyle = {
  textAlign: "center",
  padding: "40px 20px",
  background: "#f8fafc",
  borderRadius: "20px",
  border: "1px dashed #cbd5e1"
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
