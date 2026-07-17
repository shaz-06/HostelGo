import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function WelcomeRewardModal() {
  const { showWelcomeModal, setShowWelcomeModal, welcomeBonus, user, appConfig } = useContext(AuthContext);
  const [confetti, setConfetti] = useState([]);

  const minOrder = appConfig?.buyCoins?.minBuyCoinsOrder ?? 99;
  const bonus = welcomeBonus ?? appConfig?.buyCoins?.welcomeBonus ?? 20;

  useEffect(() => {
    if (showWelcomeModal) {
      // Check session storage to ensure it only shows once
      if (sessionStorage.getItem("buytoWelcomeRewardShown") === "true") {
        setShowWelcomeModal(false);
        return;
      }
      
      // Mark as shown in session storage
      sessionStorage.setItem("buytoWelcomeRewardShown", "true");

      // Generate confetti particles
      const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];
      const particles = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * 100, // random start horizontal %
        size: Math.random() * 6 + 4, // size in pixels
        delay: Math.random() * 0.5, // delay in seconds
        duration: Math.random() * 2 + 2, // falling duration
        angle: Math.random() * 360 // initial rotation angle
      }));
      setConfetti(particles);
    }
  }, [showWelcomeModal, setShowWelcomeModal]);

  if (!showWelcomeModal) return null;

  const handleClose = () => {
    setShowWelcomeModal(false);
  };

  return (
    <AnimatePresence>
      <div style={backdropStyle}>
        {/* Style tag injection for keyframes */}
        <style>{`
          @keyframes fall {
            0% {
              transform: translateY(-20px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(105vh) rotate(720deg);
              opacity: 0;
            }
          }
          @keyframes scaleCheck {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Confetti Elements */}
        <div style={confettiContainerStyle}>
          {confetti.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                top: "-20px",
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                transform: `rotate(${p.angle}deg)`,
                animation: `fall ${p.duration}s linear ${p.delay}s forwards`
              }}
            />
          ))}
        </div>

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          style={modalCardStyle}
        >
          {/* Green Check Animation Container */}
          <div style={successIconContainerStyle}>
            <div style={successIconBgStyle}>
              <span style={checkMarkStyle}>🎉</span>
            </div>
          </div>

          <h2 style={titleStyle}>Welcome to Buyto!</h2>
          
          <div style={badgeContainerStyle}>
            <span style={badgeStyle}>
              🎁 Welcome Bonus: +{bonus} BuyCoins
            </span>
          </div>

          <p style={descriptionStyle}>
            +{bonus} BuyCoins have been credited to your wallet.
          </p>

          {/* Current Balance Display */}
          <div style={balanceCardStyle}>
            <span style={balanceLabelStyle}>Current Balance</span>
            <span style={balanceValueStyle}>{user?.buyCoins ?? bonus} BuyCoins 🪙</span>
          </div>

          <p style={helperNoteStyle}>
            Redeem BuyCoins on eligible orders above ₹{minOrder}.
          </p>

          <button onClick={handleClose} style={ctaButtonStyle}>
            Start Shopping & Save
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// STYLES
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(16px)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px"
};

const confettiContainerStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: "none",
  overflow: "hidden",
  zIndex: 10000
};

const modalCardStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "32px",
  boxShadow: "0 24px 64px -12px rgba(15, 23, 42, 0.15)",
  width: "100%",
  maxWidth: "400px",
  padding: "36px 32px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  zIndex: 10001,
  boxSizing: "border-box",
  backdropFilter: "blur(20px)",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const successIconContainerStyle = {
  marginBottom: "20px"
};

const successIconBgStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "40px",
  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
  border: "2px solid #34d399",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  animation: "scaleCheck 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
};

const checkMarkStyle = {
  fontSize: "36px"
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  color: "#0f172a",
  margin: "0 0 12px 0",
  letterSpacing: "-0.5px"
};

const badgeContainerStyle = {
  marginBottom: "16px"
};

const badgeStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#065f46",
  backgroundColor: "#d1fae5",
  padding: "6px 14px",
  borderRadius: "100px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const descriptionStyle = {
  fontSize: "14.5px",
  color: "#475569",
  lineHeight: "1.5",
  margin: "0 0 20px 0",
  fontWeight: "500"
};

const balanceCardStyle = {
  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "16px 20px",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxSizing: "border-box",
  marginBottom: "16px"
};

const balanceLabelStyle = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "4px"
};

const balanceValueStyle = {
  fontSize: "18px",
  fontWeight: "850",
  color: "#0f172a"
};

const helperNoteStyle = {
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "1.4",
  margin: "0 0 28px 0",
  fontWeight: "600"
};

const ctaButtonStyle = {
  width: "100%",
  padding: "16px",
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: "18px",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 10px 20px -6px rgba(16, 185, 129, 0.3)",
  transition: "all 0.2s ease",
  outline: "none"
};
