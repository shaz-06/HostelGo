import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BuyCoin from "../components/common/BuyCoin";

export default function BuyCoinsRewardsPage() {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useContext(AuthContext);

  const [availableCoins, setAvailableCoins] = useState(user?.buyCoins || 0);
  const [redeemingId, setRedeemingId] = useState(null);

  const [rewardsList, setRewardsList] = useState([
    { id: "coffee", name: "☕ Free Coffee Coupon", cost: 50, desc: "Get a free fresh brewed hot coffee at any partner cafe." },
    { id: "fifty_off", name: "🍕 ₹50 Off Coupon", cost: 100, desc: "Get flat ₹50 off on your next purchase (min order ₹150)." },
    { id: "free_deliv", name: "🛵 Free Delivery Pass", cost: 150, desc: "Unlock 3 free deliveries with no minimum purchase requirement." },
    { id: "merch", name: "🎁 Buyto Merchandise", cost: 500, desc: "Get an exclusive Buyto branded t-shirt or hoodie." }
  ]);

  useEffect(() => {
    // Sync available coins from user context or backend
    if (token) {
      fetch(window.API_BASE_URL + "/api/buycoins/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.wallet) {
            setAvailableCoins(data.wallet.availableCoins);
          }
        })
        .catch(err => console.error("Error syncing wallet balance:", err));
    }
  }, [token]);

  const handleRedeem = async (reward) => {
    if (availableCoins < reward.cost) {
      alert(`Insufficient BuyCoins! You need ${reward.cost - availableCoins} more coins to redeem this.`);
      return;
    }

    try {
      setRedeemingId(reward.id);
      const res = await fetch(window.API_BASE_URL + "/api/buycoins/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rewardName: reward.name,
          cost: reward.cost
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Successfully redeemed: ${reward.name}! Your coupon/rewards have been activated and logged in your profile.`);
        setAvailableCoins(data.wallet.availableCoins);
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        alert(data.message || "Failed to redeem reward");
      }
    } catch (err) {
      console.error(err);
      alert("Network error redeeming reward. Please try again.");
    } finally {
      setRedeemingId(null);
    }
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
          <h1 style={titleStyle}>Redeem Rewards</h1>
          <p style={subtitleStyle}>Exchange your hard-earned BuyCoins for premium rewards</p>
        </div>

        {/* Balance Card */}
        <div style={balanceCardStyle}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#b45309", textTransform: "uppercase" }}>
              Your Balance
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#78350f", margin: "4px 0 0 0" }}>
              {availableCoins} BuyCoins
            </h2>
          </div>
          <span style={{ fontSize: "28px" }}><BuyCoin size={32} animate={true} /></span>
        </div>

        {/* Catalog */}
        {rewardsList.length === 0 ? (
          <div style={emptyStateStyle}>
            <img
              src="/images/Not Found Reward.svg"
              alt="No Rewards Found"
              style={emptyImageStyle}
            />
            <h3 style={emptyTitleStyle}>No Rewards Found</h3>
            <p style={emptySubtitleStyle}>
              You haven't earned any rewards yet. Start shopping to unlock exciting rewards.
            </p>
            <button onClick={() => navigate("/")} style={ctaButtonStyle}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <h3 style={sectionTitleStyle}>Catalog</h3>
            <div style={catalogGridStyle}>
              {rewardsList.map((reward) => {
                const hasEnough = availableCoins >= reward.cost;
                const isRedeeming = redeemingId === reward.id;

                return (
                  <div key={reward.id} style={rewardCardStyle}>
                    <div>
                      <h4 style={rewardNameStyle}>{reward.name}</h4>
                      <p style={rewardDescStyle}>{reward.desc}</p>
                    </div>

                    <div style={rewardFooterStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={costStyle(hasEnough)}>{reward.cost}</span>
                        <BuyCoin size={14} />
                      </div>

                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={isRedeeming}
                        style={redeemBtnStyle(hasEnough, isRedeeming)}
                      >
                        {isRedeeming ? "Processing..." : hasEnough ? "Redeem" : "Locked 🔒"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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

const balanceCardStyle = {
  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
  borderRadius: "20px",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "28px",
  border: "1px solid #fbbf24"
};

const sectionTitleStyle = {
  fontSize: "16px",
  fontWeight: "850",
  color: "#0f172a",
  margin: "0 0 16px 0"
};

const catalogGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px"
};

const rewardCardStyle = {
  background: "#f8fafc",
  border: "1px solid #f1f5f9",
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: "160px",
  boxSizing: "border-box"
};

const rewardNameStyle = {
  margin: "0 0 4px 0",
  fontSize: "15px",
  fontWeight: "800",
  color: "#1f2937"
};

const rewardDescStyle = {
  margin: 0,
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "1.5",
  fontWeight: "600"
};

const rewardFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px"
};

const costStyle = (hasEnough) => ({
  fontSize: "15px",
  fontWeight: "900",
  color: hasEnough ? "#b45309" : "#64748b"
});

const redeemBtnStyle = (hasEnough, isRedeeming) => ({
  background: isRedeeming
    ? "#94a3b8"
    : hasEnough
      ? "linear-gradient(135deg, #d1a558ff, #ffb81c)"
      : "#e2e8f0",
  color: hasEnough ? "white" : "#94a3b8",
  border: "none",
  borderRadius: "10px",
  padding: "8px 18px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: (hasEnough && !isRedeeming) ? "pointer" : "not-allowed",
  boxShadow: (hasEnough && !isRedeeming) ? "0 4px 10px rgba(245, 158, 11, 0.2)" : "none",
  transition: "all 0.15s ease"
});

const emptyStateStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "40px 16px",
  boxSizing: "border-box"
};

const emptyImageStyle = {
  width: "250px",
  height: "auto",
  objectFit: "contain",
  marginBottom: "24px"
};

const emptyTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#1f2937",
  margin: "0 0 8px 0"
};

const emptySubtitleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
  fontWeight: "500",
  margin: "0 0 24px 0",
  maxWidth: "320px"
};

const ctaButtonStyle = {
  background: "#10b981",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  transition: "all 0.2s ease"
};
