import React from "react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicyPage() {
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
                    maxWidth: "1000px",
                    margin: "0 auto",
                }}
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate("/profile")}
                    style={{
                        background: "#318616",
                        color: "#fff",
                        border: "none",
                        padding: "12px 22px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        fontWeight: "700",
                        marginBottom: "30px",
                    }}
                >
                    ← Back to Profile
                </button>

                {/* Header */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "24px",
                        padding: "40px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        marginBottom: "25px",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "52px",
                            fontWeight: "900",
                            marginBottom: "10px",
                        }}
                    >
                        Privacy Policy 🔒
                    </h1>

                    <p
                        style={{
                            fontSize: "18px",
                            color: "#64748b",
                        }}
                    >
                        Your privacy matters. Buyto is committed to protecting your
                        personal information and keeping your data secure.
                    </p>
                </div>

                {/* Section 1 */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "24px",
                        padding: "30px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616", marginBottom: "15px" }}>
                        📦 Information We Collect
                    </h2>

                    <ul style={{ lineHeight: "2", fontSize: "17px" }}>
                        <li>Name and contact details</li>
                        <li>Delivery addresses</li>
                        <li>Order history</li>
                        <li>Payment information</li>
                        <li>Location data for delivery services</li>
                    </ul>
                </div>

                {/* Section 2 */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "24px",
                        padding: "30px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616", marginBottom: "15px" }}>
                        🚀 How We Use Your Information
                    </h2>

                    <ul style={{ lineHeight: "2", fontSize: "17px" }}>
                        <li>Process and deliver orders</li>
                        <li>Provide customer support</li>
                        <li>Improve Buyto services</li>
                        <li>Send important notifications</li>
                        <li>Prevent fraud and misuse</li>
                    </ul>
                </div>

                {/* Section 3 */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "24px",
                        padding: "30px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616", marginBottom: "15px" }}>
                        🛡 Data Security
                    </h2>

                    <p
                        style={{
                            lineHeight: "1.8",
                            color: "#475569",
                        }}
                    >
                        Buyto uses industry-standard security measures to protect
                        customer information. We do not sell personal data to
                        third parties.
                    </p>
                </div>

                {/* Section 4 */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg,#fff7cc,#dcfce7)",
                        borderRadius: "24px",
                        padding: "30px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ marginBottom: "15px" }}>
                        💚 Buyto Privacy Promise
                    </h2>

                    <p
                        style={{
                            lineHeight: "1.8",
                            fontSize: "17px",
                        }}
                    >
                        We believe privacy is a fundamental right. Your data is
                        used only to provide a better shopping experience and
                        improve our delivery services.
                    </p>

                    <div
                        style={{
                            marginTop: "20px",
                            background: "#fff",
                            padding: "15px",
                            borderRadius: "14px",
                            fontWeight: "700",
                            color: "#318616",
                        }}
                    >
                        Last Updated: June 2026
                    </div>
                </div>
            </div>
        </div>
    );
}