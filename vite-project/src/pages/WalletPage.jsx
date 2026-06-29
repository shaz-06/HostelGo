import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import BuyCoin from "../components/common/BuyCoin";

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(window.API_BASE_URL + "/api/buycoins/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setWallet(data.wallet);
          setTransactions(data.transactions || []);
        } else {
          setError(data.message || "Failed to load wallet data");
        }
      } catch (err) {
        console.error("Wallet Page load exception:", err);
        setError("Connection failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [token]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loaderStyle}>🔄 Loading your Wallet...</div>
      </div>
    );
  }

  const balance = wallet ? wallet.availableCoins : (user?.buyCoins || 0);
  const earned = wallet ? wallet.lifetimeEarned : (user?.totalBuyCoinsEarned || 0);
  const spent = wallet ? wallet.lifetimeRedeemed : (user?.totalBuyCoinsSpent || 0);

  return (
    <div style={containerStyle}>
      <div style={cardWrapperStyle}>
        {/* Back navigation */}
        <button onClick={handleBack} style={backButtonStyle}>
          ← Back
        </button>

        {/* Heading */}
        <div style={headerStyle}>
          <span style={{ fontSize: "28px" }}>💰</span>
          <h1 style={titleStyle}>BuyCoins Wallet</h1>
          <p style={subtitleStyle}>Earn coins on purchases and redeem them at checkout</p>
        </div>

        {/* Wallet Balance Card */}
        <div style={balanceCardStyle}>
          <div>
            <span style={balanceLabelStyle}>Available Balance</span>
            <h2 style={balanceValueStyle}>{balance} Coins</h2>
            <span style={balanceCashValueStyle}>Equivalent to ₹{balance}</span>
          </div>
          <span style={coinIconStyle}><BuyCoin size={48} animate={true} /></span>
        </div>

        {/* Quick Stats Grid */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Lifetime Earned</span>
            <span style={{ ...statValueStyle, color: "#10b981" }}>+{earned}</span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Lifetime Spent</span>
            <span style={{ ...statValueStyle, color: "#ef4444" }}>-{spent}</span>
          </div>
        </div>

        {/* Info Box */}
        <div style={infoBoxStyle}>
          <h3 style={infoTitleStyle}>How to use BuyCoins? ⚡</h3>
          <ul style={infoListStyle}>
            <li>1 BuyCoin is worth exactly ₹1.</li>
            <li>Earn coins automatically when your order gets delivered.</li>
            <li>Redeem up to 20% of your product subtotal during checkout.</li>
            <li>Minimum payable amount must be at least ₹1 per order.</li>
          </ul>
        </div>

        {/* Transactions log */}
        <h3 style={sectionTitleStyle}>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div style={noTxsStyle}>No recent transactions found.</div>
        ) : (
          <div style={txListStyle}>
            {transactions.map((tx) => {
              const isPositive = ["earn", "earned", "bonus", "admin", "refund"].includes(tx.type);
              const val = tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0);
              let displayDesc = tx.description || "";
              if (!displayDesc) {
                if (["earn", "earned"].includes(tx.type)) {
                  displayDesc = `Order Reward`;
                } else if (tx.type === "bonus") {
                  displayDesc = "Bonus Reward";
                } else if (["redeem", "spent"].includes(tx.type)) {
                  displayDesc = "Checkout Redemption";
                } else if (tx.type === "refund") {
                  displayDesc = "Refund Coins";
                } else if (tx.type === "reversal") {
                  displayDesc = "Reversal Deduction";
                } else if (tx.type === "admin") {
                  displayDesc = "Admin Grant";
                } else {
                  displayDesc = "Transaction";
                }
              }

              return (
                <div key={tx._id} style={txItemStyle}>
                  <div style={txInfoStyle}>
                    <span style={txDescStyle}>{displayDesc}</span>
                    <span style={txDateStyle}>
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span style={{ ...txAmountStyle, color: isPositive ? "#10b981" : "#ef4444" }}>
                    {isPositive ? "+" : "-"}{val}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Styling Object
const containerStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "40px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
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
  marginBottom: "20px",
  padding: 0,
  outline: "none"
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "24px"
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  color: "#0f172a",
  margin: "8px 0 4px 0"
};

const subtitleStyle = {
  fontSize: "13px",
  color: "#64748b",
  margin: 0,
  lineHeight: "1.4"
};

const balanceCardStyle = {
  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 20px rgba(245, 158, 11, 0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "20px",
  border: "1.5px solid #fbbf24"
};

const balanceLabelStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#b45309",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const balanceValueStyle = {
  fontSize: "32px",
  fontWeight: "900",
  color: "#78350f",
  margin: "4px 0 2px 0"
};

const balanceCashValueStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#b45309"
};

const coinIconStyle = {
  fontSize: "48px"
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "24px"
};

const statCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const statLabelStyle = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "700"
};

const statValueStyle = {
  fontSize: "20px",
  fontWeight: "900"
};

const infoBoxStyle = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "28px"
};

const infoTitleStyle = {
  fontSize: "14px",
  fontWeight: "800",
  color: "#166534",
  margin: "0 0 10px 0"
};

const infoListStyle = {
  margin: 0,
  paddingLeft: "20px",
  fontSize: "12px",
  color: "#166534",
  lineHeight: "1.6",
  fontWeight: "600"
};

const sectionTitleStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 12px 0"
};

const noTxsStyle = {
  color: "#64748b",
  fontSize: "13px",
  fontStyle: "italic",
  textAlign: "center",
  padding: "20px 0"
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
  padding: "12px 16px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #f1f5f9"
};

const txInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const txDescStyle = {
  fontSize: "13px",
  fontWeight: "750",
  color: "#1f2937"
};

const txDateStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "600"
};

const txAmountStyle = {
  fontSize: "14px",
  fontWeight: "850"
};

const loaderStyle = {
  fontSize: "16px",
  color: "#64748b",
  fontWeight: "650"
};
