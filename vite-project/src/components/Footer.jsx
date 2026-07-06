import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

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
                background: "linear-gradient(180deg, #ffffff 0%, #f7f9f3 100%)",
                borderTop: "1px solid #e5e7eb",
                marginTop: "60px",
                position: "relative",
                fontFamily: "'Outfit', 'Inter', sans-serif"
            }}
        >
            {/* 8. Thin green-yellow accent line at the top */}
            <div
                style={{
                    height: "4px",
                    background: "linear-gradient(90deg, #f59e0b 0%, #318616 100%)",
                    width: "100%"
                }}
            />

            {/* Global style for animations & hover effects */}
            <style>{`
                .footer-social-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #ffffff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
                    border: 1px solid #e2e8f0;
                    text-decoration: none;
                    font-size: 18px;
                    transition: all 0.2s ease-in-out;
                }
                .footer-social-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 15px rgba(49, 134, 22, 0.15);
                    border-color: #318616;
                }
                .footer-card {
                    background: #ffffff;
                    border-radius: 20px;
                    border: 1px solid rgba(49, 134, 22, 0.05);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                    padding: 24px;
                    box-sizing: border-box;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .footer-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.07);
                }
                .footer-link {
                    color: #4b5563;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 14px;
                    transition: color 0.15s ease;
                }
                .footer-link:hover {
                    color: #318616;
                }
            `}</style>

            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "40px 20px 20px 20px",
                    boxSizing: "border-box"
                }}
            >
                {/* 9. Statistics Row */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "20px",
                        marginBottom: "40px",
                        paddingBottom: "30px",
                        borderBottom: "1px solid #e5e7eb",
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
                            <div style={{ fontSize: "24px", fontWeight: "900", color: "#1f2937" }}>{stat.num}</div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", marginTop: "2px" }}>{stat.label}</div>
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
                                <span style={{ color: "#318616" }}>to</span>
                            </h2>
                            {/* 4. Improved Logo Area */}
                            <p
                                style={{
                                    color: "#4b5563",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    lineHeight: "1.6",
                                    margin: 0
                                }}
                            >
                                🛒 India's Student-Friendly Quick Commerce Platform. Delivering happiness to your doorstep in minutes.
                            </p>
                        </div>

                        {/* 3. Social Icons Circular Buttons */}
                        <div>
                            <a href="https://instagram.com/letsbuyto" target="_blank" rel="noreferrer" className="footer-social-btn">📸</a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-btn">💼</a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-social-btn">▶️</a>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-btn">📘</a>
                        </div>

                        {/* 5. Trust Badges */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "5px" }}>
                            {[
                                { text: "Fast Delivery", icon: "🚚" },
                                { text: "Secure Payments", icon: "🔒" },
                                { text: "Trusted by Students", icon: "⭐" },
                                { text: "Serving Karnataka", icon: "📍" }
                            ].map((badge, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                                    <span style={{ fontSize: "16px" }}>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. Footer Cards (Quick Links, Legal, Contact) */}
                    <div className="footer-card">
                        <h3 style={{ fontSize: "17px", fontWeight: "850", color: "#1f2937", margin: "0 0 15px 0" }}>Quick Links</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Link to="/about" className="footer-link">About Us</Link>
                            <Link to="/contact" className="footer-link">Contact Us</Link>
                            <Link to="/faq" className="footer-link">FAQ</Link>
                        </div>
                    </div>

                    <div className="footer-card">
                        <h3 style={{ fontSize: "17px", fontWeight: "850", color: "#1f2937", margin: "0 0 15px 0" }}>Legal</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
                            <Link to="/terms" className="footer-link">Terms & Conditions</Link>
                            <Link to="/refund-policy" className="footer-link">Refund Policy</Link>
                            <Link to="/shipping-policy" className="footer-link">Shipping Policy</Link>
                        </div>
                    </div>

                    <div className="footer-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <h3 style={{ fontSize: "17px", fontWeight: "850", color: "#1f2937", margin: "0 0 15px 0" }}>Contact Us</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", color: "#4b5563", fontSize: "14px", fontWeight: "500", lineHeight: "1.5" }}>
                                <p style={{ margin: 0 }}>📧 support@buyto.co.in</p>
                                <p style={{ margin: 0 }}>🌐 www.buyto.co.in</p>
                                <p style={{ margin: 0 }}>📍 Bengaluru, Karnataka</p>
                            </div>
                        </div>

                        {/* 2. Download the App Section */}
                        <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #f3f4f6" }}>
                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#1f2937", display: "flex", alignItems: "center", gap: "5px" }}>
                                <span>📱</span> Get the Buyto App
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", margin: "2px 0 8px 0" }}>
                                ⚡ Groceries in Minutes
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: "850",
                                    background: "#e8f7e3",
                                    color: "#318616",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    display: "inline-block"
                                }}
                            >
                                Coming Soon on Android & iOS
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. Newsletter Section & Footer Copyright */}
                <div
                    style={{
                        paddingTop: "24px",
                        borderTop: "1px solid #e5e7eb",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}
                >
                    {/* Newsletter Container */}
                    <div
                        style={{
                            background: "rgba(49, 134, 22, 0.04)",
                            border: "1px dashed rgba(49, 134, 22, 0.2)",
                            borderRadius: "16px",
                            padding: "20px",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "15px"
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "16px", fontWeight: "850", color: "#1f2937", display: "flex", alignItems: "center", gap: "6px" }}>
                                Stay Updated 🚀
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", marginTop: "2px" }}>
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
                                style={{
                                    flexGrow: 1,
                                    height: "40px",
                                    borderRadius: "10px",
                                    border: "1px solid #cbd5e1",
                                    padding: "0 14px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    height: "40px",
                                    padding: "0 18px",
                                    background: "#318616",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontWeight: "800",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "background 0.2s ease"
                                }}
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
                            color: "#6b7280"
                        }}
                    >
                        <div>© 2026 Buyto. All Rights Reserved.</div>
                        <div style={{ color: "#9ca3af" }}>Version 1.0.0</div>
                    </div>
                </div>
            </div>
        </footer>
    );
}