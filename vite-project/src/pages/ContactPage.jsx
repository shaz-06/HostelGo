import React from "react";
import { useNavigate } from "react-router-dom";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div style={pageContainerStyle}>
      <div style={contentWrapperStyle}>

        {/* Back Button */}
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/profile")}
            style={backBtnStyle}
          >
            ← Back to Profile
          </button>
        </div>

        {/* Header Section */}
        <div style={headerSectionStyle}>
          <h1 style={headerTitleStyle}>
            📞 Contact Buyto
          </h1>
          <p style={headerSubtitleStyle}>
            We're here to help. Reach us through any of the channels below.
          </p>
        </div>

        {/* Grid of Contact Cards */}
        <div style={cardsGridStyle}>

          {/* Card 1: Phone Support */}
          <div style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "28px" }}>☎</span>
              <h3 style={cardTitleStyle}>Phone Support</h3>
            </div>
            <p style={cardContentStyle}>+91 6363849864</p>
            <button
              onClick={() => window.open("tel:+91 6363849864")}
              style={ctaButtonStyle}
            >
              Call Now 📞
            </button>
          </div>

          {/* Card 2: Email Support */}
          <div style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "28px" }}>✉</span>
              <h3 style={cardTitleStyle}>Email Support</h3>
            </div>
            <p style={cardContentStyle}>support@buyto.co.in</p>
            <button
              onClick={() => window.open("mailto:support@buyto.co.in")}
              style={ctaButtonStyle}
            >
              Email Us ✉️
            </button>
          </div>

          {/* Card 3: Live Chat */}
          <div style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "28px" }}>💬</span>
              <h3 style={cardTitleStyle}>Live Chat</h3>
            </div>
            <p style={cardContentStyle}>Open Buyto Assistant</p>
            <button
              onClick={() => navigate("/support/chat")}
              style={{ ...ctaButtonStyle, background: "linear-gradient(135deg, #318616, #4ca728)" }}
            >
              Chat Now 💬
            </button>
          </div>

          {/* Card 4: Business Address */}
          <div style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "28px" }}>📍</span>
              <h3 style={cardTitleStyle}>Business Address</h3>
            </div>
            <p style={{ ...cardContentStyle, fontSize: "14px", lineHeight: "1.5" }}>
              Buyto Headquarters<br />
              Bengaluru, Karnataka
            </p>
          </div>

          {/* Card 5: Working Hours */}
          <div style={{ ...contactCardStyle, gridColumn: "span 1" }}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: "28px" }}>🕒</span>
              <h3 style={cardTitleStyle}>Working Hours</h3>
            </div>
            <p style={cardContentStyle}>8:00 AM - 11:00 PM</p>
            <span style={badgeStyle}>Active Daily</span>
          </div>

        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#9ca3af" }}>
            Made with ❤️ by Buyto
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "10px", fontWeight: "500", color: "#bdc3c7" }}>
            Version 1.0.0
          </p>
        </div>

      </div>
    </div>
  );
}

// STYLING DICTIONARY
const pageContainerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f8fff2 0%, #fff9e8 100%)",
  padding: "40px 16px 60px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box",
  overflowX: "hidden"
};

const contentWrapperStyle = {
  width: "100%",
  maxWidth: "800px",
  boxSizing: "border-box"
};

const backBtnStyle = {
  background: "white",
  border: "1px solid rgba(49, 134, 22, 0.15)",
  color: "#318616",
  padding: "10px 20px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "750",
  boxShadow: "0 4px 10px rgba(49, 134, 22, 0.05)",
  transition: "all 0.2s ease"
};

const headerSectionStyle = {
  textAlign: "center",
  marginTop: "16px",
  marginBottom: "40px"
};

const headerTitleStyle = {
  fontSize: "32px",
  fontWeight: "900",
  color: "#1f2937",
  margin: "0 0 10px 0",
  letterSpacing: "-0.5px"
};

const headerSubtitleStyle = {
  fontSize: "15px",
  color: "#4b5563",
  fontWeight: "600",
  margin: 0,
  maxWidth: "500px",
  marginLeft: "auto",
  marginRight: "auto",
  lineHeight: "1.5"
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginBottom: "40px"
};

const contactCardStyle = {
  background: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(49, 134, 22, 0.12)",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 10px 25px rgba(49, 134, 22, 0.04)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  minHeight: "180px",
  boxSizing: "border-box"
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px"
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "850",
  color: "#1f2937"
};

const cardContentStyle = {
  margin: "0 0 16px 0",
  fontSize: "16px",
  fontWeight: "750",
  color: "#374151",
  wordBreak: "break-word"
};

const ctaButtonStyle = {
  width: "100%",
  height: "42px",
  background: "linear-gradient(135deg, #f59e0b, #ffb81c)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(245, 158, 11, 0.15)",
  marginTop: "auto"
};

const badgeStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#318616",
  background: "#e8f7e3",
  padding: "4px 10px",
  borderRadius: "12px",
  marginTop: "auto"
};

const footerStyle = {
  textAlign: "center",
  marginTop: "20px"
};