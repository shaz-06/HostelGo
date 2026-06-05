import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HelpPage() {
  const navigate = useNavigate();

  // FAQ Accordion State
  const [activeFAQ, setActiveFAQ] = useState(null);

  const faqs = [
    {
      q: "How fast is delivery?",
      a: "Super fast! We deliver instantly to your doorstep within 10 minutes of placing the order.",
    },
    {
      q: "Is there a cash on delivery option?",
      a: "Yes! We support Cash on Delivery, UPI, Cards, and Buyto Wallet payments.",
    },
    {
      q: "Can I request a refund if an item is damaged?",
      a: "Absolutely. If you receive a damaged or incorrect product, contact us immediately via the chat support and we will process a replacement or full refund to your Buyto Wallet.",
    },
    {
      q: "Can I edit my delivery address after placing an order?",
      a: "Since our delivery partners pick up items instantly, address modifications are only allowed before order packing begins. Please call our delivery helper instantly to coordinate.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
        padding: "40px 24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "36px",
          borderRadius: "32px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
        }}
      >
        {/* Back Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: 0,
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: "12px", background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F", padding: "6px 12px", borderRadius: "10px", fontWeight: "700" }}>
            🎧 Customer Help
          </span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: "850", color: "#111827", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
          How can we help? 🎧
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px 0" }}>
          Reach out to us or explore the frequently asked questions.
        </p>

        {/* Support Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
          {/* Call Support */}
          <div
            onClick={() => alert("📞 Dialing Buyto Hotline: +91 6363849864")}
            style={cardStyle}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>📞</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Call Support</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#6b7280" }}>Speak with our helper</p>
              </div>
            </div>
            <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>
          </div>

          {/* Chat Support */}
          <div
            onClick={() => navigate("/support/chat")}
            style={cardStyle}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>💬</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Chat With Us</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#6b7280" }}>24/7 instant chat assistant</p>
              </div>
            </div>
            <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>
          </div>

          {/* Email Support */}
          <a
            href="mailto:support@buyto.com"
            style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>📧</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Email Support</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#6b7280" }}>support@buyto.com</p>
              </div>
            </div>
            <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>
          </a>
        </div>

        {/* FAQ Section */}
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "750", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
            Frequently Asked Questions
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFAQ === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#f9fafb",
                    borderRadius: "16px",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    onClick={() => setActiveFAQ(isOpen ? null : idx)}
                    style={{
                      padding: "16px 18px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: "700",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: "#FF4D4F", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                      ▼
                    </span>
                  </div>
                  {isOpen && (
                    <div
                      style={{
                        padding: "0 18px 16px 18px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#6b7280",
                        borderTop: "1px solid #f3f4f6",
                        paddingTop: "12px",
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  border: "1.5px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px 20px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: "all 0.15s ease",
  boxSizing: "border-box",
};