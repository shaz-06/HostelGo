import React from "react";
import { useNavigate } from "react-router-dom";

export default function TermsPage() {
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
                        marginBottom: "25px",
                    }}
                >
                    ← Back to Profile
                </button>

                {/* Header */}
                <div
                    style={{
                        background: "#fff",
                        padding: "40px",
                        borderRadius: "24px",
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
                        Terms & Conditions 📜
                    </h1>

                    <p
                        style={{
                            fontSize: "18px",
                            color: "#64748b",
                        }}
                    >
                        By using Buyto, you agree to follow these terms and conditions.
                    </p>
                </div>

                {/* User Responsibilities */}
                <div
                    style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "24px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616" }}>
                        👤 User Responsibilities
                    </h2>

                    <ul style={{ lineHeight: "2", fontSize: "17px" }}>
                        <li>Provide accurate personal information.</li>
                        <li>Maintain account security.</li>
                        <li>Use Buyto services lawfully.</li>
                        <li>Respect platform policies.</li>
                    </ul>
                </div>

                {/* Orders */}
                <div
                    style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "24px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616" }}>
                        📦 Orders & Deliveries
                    </h2>

                    <p
                        style={{
                            lineHeight: "1.8",
                            color: "#475569",
                        }}
                    >
                        Orders are subject to product availability,
                        serviceability, verification and successful
                        payment processing.
                    </p>
                </div>

                {/* Payments */}
                <div
                    style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "24px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616" }}>
                        💳 Payments
                    </h2>

                    <p
                        style={{
                            lineHeight: "1.8",
                            color: "#475569",
                        }}
                    >
                        Payments are processed securely through approved
                        payment providers. Buyto does not store sensitive
                        payment card details.
                    </p>
                </div>

                {/* Cancellation */}
                <div
                    style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "24px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#318616" }}>
                        ❌ Cancellations
                    </h2>

                    <p
                        style={{
                            lineHeight: "1.8",
                            color: "#475569",
                        }}
                    >
                        Orders may only be cancelled before processing.
                        Once dispatched, cancellation may not be possible.
                    </p>
                </div>

                {/* Footer Card */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg,#fff7cc,#dcfce7)",
                        padding: "30px",
                        borderRadius: "24px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2>⚖️ Agreement</h2>

                    <p
                        style={{
                            marginTop: "10px",
                            lineHeight: "1.8",
                        }}
                    >
                        By continuing to use Buyto, you acknowledge
                        and agree to these Terms & Conditions.
                    </p>

                    <div
                        style={{
                            marginTop: "20px",
                            background: "#fff",
                            padding: "14px",
                            borderRadius: "12px",
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