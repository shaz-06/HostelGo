import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { X, Gift } from "lucide-react";

export default function BirthdayGreetingModal() {
  const { user, isLoggedIn } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user || !user.dateOfBirth) {
      setIsOpen(false);
      return;
    }

    // Check if today is user's birthday in IST
    const dob = new Date(user.dateOfBirth);
    if (isNaN(dob.getTime())) return;

    const istDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istDateStr);

    const isBirthday = dob.getUTCDate() === istDate.getDate() && dob.getUTCMonth() === istDate.getMonth();
    if (!isBirthday) {
      setIsOpen(false);
      return;
    }

    const userId = user._id || user.id || "";
    const currentYear = istDate.getFullYear();
    const sessionKey = `buyto_birthday_greeting_${userId}_${currentYear}`;

    if (!sessionStorage.getItem(sessionKey)) {
      setIsOpen(true);
      sessionStorage.setItem(sessionKey, "true");
    }
  }, [isLoggedIn, user]);

  if (!isOpen || !user) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        className="animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "white",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "400px",
          padding: "32px 24px 24px 24px",
          position: "relative",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
          boxSizing: "border-box",
          fontFamily: "'Outfit', 'Inter', sans-serif"
        }}
      >
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF"
          }}
        >
          <X className="w-5 h-5" />
        </button>

        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>

        <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1F2937", margin: "0 0 12px 0" }}>
          Happy Birthday, {user.name || "Shetty"}! 🎂
        </h2>

        <p style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563", margin: "0 0 24px 0", lineHeight: "1.5" }}>
          Wishing you an amazing birthday from all of us at Buyto! We've got a special treat waiting for you in your cart. ❤️
        </p>

        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "#318616",
            color: "white",
            border: "none",
            borderRadius: "14px",
            width: "100%",
            padding: "14px",
            fontWeight: "800",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <Gift className="w-5 h-5" />
          Claim Birthday Treat
        </button>
      </div>
    </div>
  );
}
