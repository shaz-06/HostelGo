import React from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div style={pageContainerStyle}>
      {/* 3. Floating Decorative Blobs */}
      <div style={blobLeftStyle} />
      <div style={blobRightStyle} />

      <div style={contentWrapperStyle}>
        
        {/* Global style injections for premium interactions */}
        <style>{`
          .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(49, 134, 22, 0.1);
            background: #fdfdfd;
          }
          .premium-card {
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          .premium-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(49, 134, 22, 0.08) !important;
            border-color: rgba(49, 134, 22, 0.25) !important;
          }
          .premium-btn-yellow {
            transition: all 0.2s ease-in-out;
          }
          .premium-btn-yellow:hover {
            transform: scale(1.03);
            box-shadow: 0 6px 15px rgba(245, 158, 11, 0.25);
          }
          .premium-btn-green {
            transition: all 0.2s ease-in-out;
          }
          .premium-btn-green:hover {
            transform: scale(1.03);
            box-shadow: 0 6px 15px rgba(49, 134, 22, 0.25);
          }
        `}</style>

        {/* Back Button */}
        <div style={{ marginBottom: "28px", position: "relative", zIndex: 10 }}>
          <button
            onClick={() => navigate("/profile")}
            className="back-btn"
            style={backBtnStyle}
          >
            ← Back to Profile
          </button>
        </div>

        {/* 1. Hero Card behind the title */}
        <div style={heroCardStyle}>
          <h1 style={headerTitleStyle}>
            📞 Contact Buyto
          </h1>
          <p style={headerSubtitleStyle}>
            We're here to help 24×7. Connect with us through any channel below.
          </p>
        </div>

        {/* 10. Better layout: Grid of Contact Cards */}
        <div style={cardsGridStyle}>
          
          {/* Card 1: Phone Support */}
          <div className="premium-card" style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={iconContainerStyle}>
                <Phone size={24} color="#318616" />
              </div>
              <h3 style={cardTitleStyle}>Phone Support</h3>
            </div>
            <p style={cardContentStyle}>+91 **</p>
            <button
              onClick={() => window.open("tel:+91 **")}
              className="premium-btn-yellow"
              style={ctaBtnYellowStyle}
            >
              Call Now 📞
            </button>
          </div>

          {/* Card 2: Email Support */}
          <div className="premium-card" style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={iconContainerStyle}>
                <Mail size={24} color="#318616" />
              </div>
              <h3 style={cardTitleStyle}>Email Support</h3>
            </div>
            <p style={cardContentStyle}>support@buyto.co.in</p>
            <button
              onClick={() => window.open("mailto:support@buyto.co.in")}
              className="premium-btn-yellow"
              style={ctaBtnYellowStyle}
            >
              Email Us ✉️
            </button>
          </div>

          {/* Card 3: Live Chat */}
          <div className="premium-card" style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={iconContainerStyle}>
                <MessageCircle size={24} color="#318616" />
              </div>
              <h3 style={cardTitleStyle}>Live Chat</h3>
            </div>
            <p style={cardContentStyle}>Open Buyto Assistant</p>
            <button
              onClick={() => navigate("/support/chat")}
              className="premium-btn-green"
              style={ctaBtnGreenStyle}
            >
              Chat Now 💬
            </button>
          </div>

          {/* Card 4: Business Address */}
          <div className="premium-card" style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={iconContainerStyle}>
                <MapPin size={24} color="#318616" />
              </div>
              <h3 style={cardTitleStyle}>Business Address</h3>
            </div>
            <p style={{ ...cardContentStyle, fontSize: "14px", lineHeight: "1.6" }}>
              Buyto Headquarters<br />
              Bengaluru, Karnataka
            </p>
          </div>

          {/* Card 5: Working Hours */}
          <div className="premium-card" style={contactCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={iconContainerStyle}>
                <Clock size={24} color="#318616" />
              </div>
              <h3 style={cardTitleStyle}>Working Hours</h3>
            </div>
            <p style={cardContentStyle}>8:00 AM - 11:00 PM</p>
            <span style={badgeStyle}>Active Daily</span>
          </div>

        </div>

        {/* 7. Quick Response Badges & Trust badges */}
        <div style={badgeContainerStyle}>
          <span style={trustBadgeItemStyle}>⚡ Replies in minutes</span>
          <span style={trustBadgeItemStyle}>🕒 24×7 Support</span>
          <span style={trustBadgeItemStyle}>🚚 Delivery Assistance</span>
          <span style={trustBadgeItemStyle}>⭐ Trusted by Students</span>
        </div>

        {/* 8. Statistics Section */}
        <div style={statsSectionStyle}>
          <div style={statItemStyle}>
            <div style={statNumStyle}>10K+</div>
            <div style={statLabelStyle}>Happy Customers</div>
          </div>
          <div style={statItemStyle}>
            <div style={statNumStyle}>15 Min</div>
            <div style={statLabelStyle}>Average Delivery</div>
          </div>
          <div style={statItemStyle}>
            <div style={statNumStyle}>24×7</div>
            <div style={statLabelStyle}>Customer Support</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// STYLING DICTIONARY

// 2. Soft Gradient Background
const pageContainerStyle = {
  minHeight: "100vh",
  background: `
    radial-gradient(circle at top left, #f5ffe9 0%, transparent 40%),
    radial-gradient(circle at top right, #fff6d8 0%, transparent 40%),
    #f9faf5
  `,
  padding: "40px 16px 80px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box",
  overflowX: "hidden",
  position: "relative"
};

// 3. Large blurred background blobs
const blobLeftStyle = {
  position: "absolute",
  top: "10%",
  left: "-10%",
  width: "300px",
  height: "300px",
  borderRadius: "50%",
  background: "#e8f7e3",
  filter: "blur(120px)",
  opacity: 0.35,
  pointerEvents: "none",
  zIndex: 1
};

const blobRightStyle = {
  position: "absolute",
  top: "15%",
  right: "-10%",
  width: "300px",
  height: "300px",
  borderRadius: "50%",
  background: "#fff6d8",
  filter: "blur(120px)",
  opacity: 0.35,
  pointerEvents: "none",
  zIndex: 1
};

const contentWrapperStyle = {
  width: "100%",
  maxWidth: "850px",
  boxSizing: "border-box",
  position: "relative",
  zIndex: 5
};

const backBtnStyle = {
  background: "white",
  border: "1px solid rgba(49, 134, 22, 0.15)",
  color: "#318616",
  padding: "10px 24px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "750",
  boxShadow: "0 4px 15px rgba(49, 134, 22, 0.04)",
  transition: "all 0.2s ease"
};

// 1. Hero Card behind the title
const heroCardStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "32px",
  padding: "40px 30px",
  border: "1px solid rgba(255, 255, 255, 0.8)",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.06)",
  textAlign: "center",
  marginBottom: "40px",
  boxSizing: "border-box"
};

const headerTitleStyle = {
  fontSize: "36px",
  fontWeight: "950",
  color: "#1f2937",
  margin: "0 0 12px 0",
  letterSpacing: "-0.8px"
};

const headerSubtitleStyle = {
  fontSize: "16px",
  color: "#4b5563",
  fontWeight: "600",
  margin: 0,
  maxWidth: "520px",
  marginLeft: "auto",
  marginRight: "auto",
  lineHeight: "1.6"
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "24px",
  marginBottom: "40px"
};

// 4. Premium Glassmorphism Cards
const contactCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.8)",
  borderRadius: "28px",
  padding: "32px",
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  minHeight: "220px",
  boxSizing: "border-box"
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "16px"
};

const iconContainerStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  background: "rgba(49, 134, 22, 0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "850",
  color: "#1f2937"
};

const cardContentStyle = {
  margin: "0 0 20px 0",
  fontSize: "17px",
  fontWeight: "750",
  color: "#374151",
  wordBreak: "break-word"
};

// 9. Premium Buttons
const ctaBtnYellowStyle = {
  width: "100%",
  height: "46px",
  background: "linear-gradient(90deg, #f59e0b, #ffbf00)",
  color: "white",
  border: "none",
  borderRadius: "14px",
  fontWeight: "800",
  fontSize: "14px",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
  marginTop: "auto"
};

const ctaBtnGreenStyle = {
  width: "100%",
  height: "46px",
  background: "linear-gradient(90deg, #318616, #3da61a)",
  color: "white",
  border: "none",
  borderRadius: "14px",
  fontWeight: "800",
  fontSize: "14px",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
  marginTop: "auto"
};

const badgeStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#318616",
  background: "#e8f7e3",
  padding: "6px 14px",
  borderRadius: "14px",
  marginTop: "auto"
};

// 7. Quick Response Badges Style
const badgeContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "12px",
  marginBottom: "48px"
};

const trustBadgeItemStyle = {
  background: "white",
  border: "1px solid rgba(49, 134, 22, 0.1)",
  borderRadius: "999px",
  padding: "8px 18px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#374151",
  boxShadow: "0 4px 10px rgba(0,0,0,0.02)"
};

// 8. Statistics Section Style
const statsSectionStyle = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "24px",
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.6)",
  borderRadius: "32px",
  padding: "30px 20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
  textAlign: "center",
  boxSizing: "border-box"
};

const statItemStyle = {
  flex: "1 1 200px"
};

const statNumStyle = {
  fontSize: "28px",
  fontWeight: "950",
  color: "#318616",
  marginBottom: "4px"
};

const statLabelStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#6b7280"
};