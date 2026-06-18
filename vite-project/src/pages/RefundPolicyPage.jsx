import React from "react";
import { useNavigate } from "react-router-dom";

export default function RefundPolicyPage() {
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
                        Refund Policy 💸
                    </h1>

                    <p
                        style={{
                            fontSize: "18px",
                            color: "#64748b",
                        }}
                    >
                        Customer satisfaction is important to Buyto. We strive to
                        ensure every order reaches you in perfect condition.
                    </p>
                </div>

                {/* Eligible Refunds */}
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
                        ✅ Eligible Refund Cases
                    </h2>

                    <ul style={{ lineHeight: "2", fontSize: "17px" }}>
                        <li>Damaged products</li>
                        <li>Incorrect items delivered</li>
                        <li>Missing products</li>
                        <li>Failed deliveries</li>
                        <li>Payment deducted but order not confirmed</li>
                    </ul>
                </div>

                {/* Non Refund Cases */}
                <div
                    style={{
                        background: "#fff",
                        padding: "30px",
                        borderRadius: "24px",
                        marginBottom: "20px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2 style={{ color: "#ef4444" }}>
                        ❌ Non-Refundable Cases
                    </h2>

                    <ul style={{ lineHeight: "2", fontSize: "17px" }}>
                        <li>Incorrect address provided by customer</li>
                        <li>Order rejected after dispatch</li>
                        <li>Perishable items consumed before reporting issue</li>
                    </ul>
                </div>

                {/* Timeline */}
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
                        ⏳ Refund Timeline
                    </h2>

                    <p
                        style={{
                            lineHeight: "1.8",
                            color: "#475569",
                        }}
                    >
                        Approved refunds are generally processed within
                        5–7 business days. The actual credit time may vary
                        depending on your bank or payment provider.
                    </p>
                </div>

                {/* Contact Support */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg,#fff7cc,#dcfce7)",
                        padding: "30px",
                        borderRadius: "24px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2>🎧 Need Help?</h2>

                    <p
                        style={{
                            marginTop: "10px",
                            lineHeight: "1.8",
                        }}
                    >
                        If you believe your order qualifies for a refund,
                        contact our support team immediately with your
                        Order ID and issue details.
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
                        support@buyto.co.in
                    </div>
                </div>
            </div>
        </div>
    );
}