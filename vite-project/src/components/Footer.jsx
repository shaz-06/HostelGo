import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isSubscribeHovered, setIsSubscribeHovered] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail("");
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    return (
        <footer
            style={{
                background: "#318616",
                borderTop: "1px solid rgba(255,255,255,0.12)",
                marginTop: "60px",
                position: "relative",
                fontFamily: "'Outfit', 'Inter', sans-serif"
            }}
        >
            {/* Thin green-yellow accent line at the top */}
            <div
                style={{
                    height: "4px",
                    background: "linear-gradient(90deg, #f59e0b 0%, #ffffff 100%)",
                    width: "100%"
                }}
            />

            {/* Global style for animations & hover effects */}
            <style>{`
                .footer-social-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.08);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    text-decoration: none;
                    font-size: 18px;
                    transition: all 0.2s ease-in-out;
                }
                .footer-social-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 15px rgba(245, 158, 11, 0.25);
                    border-color: #F59E0B;
                    background: rgba(255, 255, 255, 0.15);
                }
                .footer-card {
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                    padding: 24px;
                    box-sizing: border-box;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                }
                .footer-card:hover {
                    transform: translateY(-2px);
                    background: rgba(255, 255, 255, 0.07);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
                .footer-link {
                    color: #FFFFFF;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 14px;
                    transition: color 0.2s ease;
                }
                .footer-link:hover {
                    color: #F59E0B;
                }
            `}</style>

            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "56px 20px 36px 20px",
                    boxSizing: "border-box"
                }}
            >
                {/* Statistics Row */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "20px",
                        marginBottom: "40px",
                        paddingBottom: "30px",
                        borderBottom: "1px solid rgba(255,255,255,0.12)",
                        textAlign: "center"
                    }}
                >
                    {[
                        { num: "10K+", label: "Products Available", icon: "📦" },
                        { num: "5K+", label: "Happy Customers", icon: "👥" },
                        { num: "24×7", label: "Instant Support", icon: "🕒" },
                        { num: "15 Min", label: "Average Delivery Time", icon: "⚡" }
                    ].map((stat, idx) => (
                        <div key={idx} style={{ padding: "10px" }}>
                            <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>{stat.icon}</span>
                            <div style={{ fontSize: "24px", fontWeight: "900", color: "#FFFFFF" }}>{stat.num}</div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.75)", marginTop: "2px" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "24px",
                        marginBottom: "40px"
                    }}
                >
                    {/* Brand & Trust Badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <h2
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "950",
                                    margin: "0 0 10px 0",
                                    letterSpacing: "-0.5px"
                                }}
                            >
                                <span style={{ color: "#facc15" }}>Buy</span>
                                <span style={{ color: "#ffffffff" }}>to</span>
                            </h2>
                            <p
                                style={{
                                    color: "rgba(255,255,255,0.75)",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    lineHeight: "1.6",
                                    margin: 0
                                }}
                            >
                                🛒 India's Student-Friendly Quick Commerce Platform. Delivering happiness to your doorstep in minutes.
                            </p>
                        </div>

                        {/* Social Icons Circular Buttons */}
                        <div>
                            <a href="https://instagram.com/letsbuyto" target="_blank" rel="noreferrer" className="footer-social-btn">📸</a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-btn">💼</a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-social-btn">▶️</a>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-btn">📘</a>
                        </div>

                        {/* Trust Badges */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "5px" }}>
                            {[
                                { text: "Fast Delivery", icon: "🛵" },
                                { text: "Secure Payments", icon: "🔒" },
                                { text: "Trusted by Students", icon: "⭐" },
                                { text: "Serving Karnataka", icon: "📍" }
                            ].map((badge, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.85)" }}>
                                    <span style={{ fontSize: "16px" }}>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Cards (Quick Links, Legal, Contact) */}
                    <div className="footer-card">
                        <h3 style={{ fontSize: "17px", fontWeight: "850", color: "#FFFFFF", margin: "0 0 15px 0" }}>Quick Links</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Link to="/about" className="footer-link">About Us</Link>
                            <Link to="/contact" className="footer-link">Contact Us</Link>
                            <Link to="/faq" className="footer-link">FAQ</Link>
                        </div>
                    </div>

                    <div className="footer-card">
                        <h3 style={{ fontSize: "17px", fontWeight: "850", color: "#FFFFFF", margin: "0 0 15px 0" }}>Legal</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
                            <Link to="/terms" className="footer-link">Terms & Conditions</Link>
                            <Link to="/refund-policy" className="footer-link">Refund Policy</Link>
                            <Link to="/shipping-policy" className="footer-link">Shipping Policy</Link>
                        </div>
                    </div>

                    <div className="footer-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <h3 style={{ fontSize: "17px", fontWeight: "850", color: "#FFFFFF", margin: "0 0 15px 0" }}>Contact Us</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", color: "rgba(255,255,255,0.75)", fontSize: "14px", fontWeight: "500", lineHeight: "1.5" }}>
                                <p style={{ margin: 0 }}>📧 support@buyto.co.in</p>
                                <p style={{ margin: 0 }}>🌐 www.buyto.co.in</p>
                                <p style={{ margin: 0 }}>📍 Bengaluru, Karnataka</p>
                            </div>
                        </div>

                        {/* Download the App Section */}
                        <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "5px" }}>
                                <span>📱</span> Get the Buyto App
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.75)", margin: "2px 0 8px 0" }}>
                                ⚡ Groceries in Minutes
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: "850",
                                    background: "rgba(255,255,255,0.12)",
                                    color: "#FFFFFF",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    display: "inline-block"
                                }}
                            >
                                Coming Soon on iOS
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter Section & Footer Copyright */}
                <div
                    style={{
                        paddingTop: "24px",
                        borderTop: "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}
                >
                    {/* Newsletter Container */}
                    <div
                        style={{
                            background: "#FFF8D9",
                            border: "1px solid #F6D365",
                            borderRadius: "24px",
                            padding: "28px",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "15px",
                            boxShadow: "0 10px 30px rgba(245,158,11,0.08)"
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1F2937", display: "flex", alignItems: "center", gap: "6px" }}>
                                Stay Updated 🚀
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#4B5563", marginTop: "2px" }}>
                                Get offers and new product updates.
                            </div>
                        </div>

                        <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "8px", flexGrow: 1, maxWidth: "400px" }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                style={{
                                    flexGrow: 1,
                                    height: "40px",
                                    borderRadius: "14px",
                                    border: isInputFocused ? "1px solid #318616" : "1px solid #E5E7EB",
                                    boxShadow: isInputFocused ? "0 0 0 4px rgba(49,134,22,0.12)" : "none",
                                    background: "#FFFFFF",
                                    padding: "0 14px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#111827",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.15s ease, box-shadow 0.15s ease"
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    height: "40px",
                                    padding: "0 18px",
                                    background: isSubscribeHovered ? "#D97706" : "#F59E0B",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "14px",
                                    fontWeight: "800",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "background 0.2s ease"
                                }}
                                onMouseEnter={() => setIsSubscribeHovered(true)}
                                onMouseLeave={() => setIsSubscribeHovered(false)}
                            >
                                {subscribed ? "Subscribed!" : "Subscribe"}
                            </button>
                        </form>
                    </div>

                    {/* Copyright & Version */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "10px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "rgba(255,255,255,0.7)"
                        }}
                    >
                        <div>© 2026 Buyto. All Rights Reserved.</div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>Version 1.1.0</div>
                    </div>
                </div>
            </div>
        </footer>
    );
}