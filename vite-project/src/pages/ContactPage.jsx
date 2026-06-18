import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ContactPage() {
    const navigate = useNavigate();
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                padding: "40px 20px",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                }}
            >

                <div style={{ marginBottom: "30px" }}>
                    <button
                        onClick={() => navigate("/profile")}
                        style={{
                            background: "#318616",
                            color: "#fff",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "999px",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "700"
                        }}
                    >
                        ← Back to Profile
                    </button>
                </div>
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "50px",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "56px",
                            fontWeight: "800",
                            marginBottom: "10px",
                        }}
                    >
                        Contact{" "}
                        <span style={{ color: "#F7C600" }}>
                            Buy
                        </span>
                        <span style={{ color: "#318616" }}>
                            to
                        </span>
                        🚀
                    </h1>

                    <p
                        style={{
                            fontSize: "20px",
                            color: "#374151",
                            maxWidth: "700px",
                            margin: "0 auto",
                        }}
                    >
                        Fast support for customers, delivery partners,
                        local stores and business inquiries.
                    </p>
                </div>

                {/* Contact Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                        gap: "20px",
                        marginBottom: "40px",
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: "25px",
                            borderRadius: "24px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        }}
                    >
                        <h3>📧 Email Support</h3>
                        <p>support@buyto.co.in</p>
                    </div>

                    <div
                        style={{
                            background: "#fff",
                            padding: "25px",
                            borderRadius: "24px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        }}
                    >
                        <h3>📞 Phone Support</h3>
                        <p>+91 XXXXX XXXXX</p>
                    </div>

                    <div
                        style={{
                            background: "#fff",
                            padding: "25px",
                            borderRadius: "24px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        }}
                    >
                        <h3>🌐 Website</h3>
                        <p>www.buyto.co.in</p>
                    </div>

                    <div
                        style={{
                            background: "#fff",
                            padding: "25px",
                            borderRadius: "24px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        }}
                    >
                        <h3>⏰ Support Hours</h3>
                        <p>24 Hours / 7 Days</p>
                    </div>
                </div>

                {/* Founder Section */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg,#dcfce7,#fef3c7)",
                        borderRadius: "30px",
                        padding: "40px",
                        marginBottom: "40px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "32px",
                            marginBottom: "15px",
                        }}
                    >
                        Founder & CEO 👨‍💼
                    </h2>

                    <h3
                        style={{
                            fontSize: "24px",
                            color: "#318616",
                            marginBottom: "15px",
                        }}
                    >
                        Shashank Shetty
                    </h3>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "1.8",
                            color: "#374151",
                        }}
                    >
                        Buyto was built with a vision to transform
                        local commerce through technology and ultra-fast
                        delivery. Our goal is to make shopping simpler,
                        faster and more affordable for everyone.
                    </p>
                </div>

                {/* Contact Form */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "30px",
                        padding: "40px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "32px",
                            marginBottom: "25px",
                        }}
                    >
                        Send Us A Message ✉️
                    </h2>

                    <input
                        type="text"
                        placeholder="Your Name"
                        style={{
                            width: "100%",
                            padding: "16px",
                            marginBottom: "15px",
                            borderRadius: "12px",
                            border: "1px solid #ddd",
                            fontSize: "16px",
                        }}
                    />

                    <input
                        type="email"
                        placeholder="Email Address"
                        style={{
                            width: "100%",
                            padding: "16px",
                            marginBottom: "15px",
                            borderRadius: "12px",
                            border: "1px solid #ddd",
                            fontSize: "16px",
                        }}
                    />

                    <textarea
                        rows="5"
                        placeholder="Type your message..."
                        style={{
                            width: "100%",
                            padding: "16px",
                            marginBottom: "20px",
                            borderRadius: "12px",
                            border: "1px solid #ddd",
                            fontSize: "16px",
                        }}
                    />

                    <button
                        style={{
                            background: "#318616",
                            color: "#fff",
                            border: "none",
                            padding: "16px 40px",
                            borderRadius: "14px",
                            fontSize: "18px",
                            fontWeight: "700",
                            cursor: "pointer",
                        }}
                    >
                        Send Message 🚀
                    </button>
                </div>

                {/* Footer */}
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "50px",
                        color: "#111827",
                    }}
                >
                    <p>© 2026 Buyto. All Rights Reserved.</p>

                    <div
                        style={{
                            marginTop: "10px",
                            display: "flex",
                            justifyContent: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                        }}
                    >
                        <Link to="/about">About</Link>
                        <Link to="/privacy-policy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                        <Link to="/faq">FAQ</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}