import React from "react";
import { useNavigate } from "react-router-dom";

export default function FAQPage() {
    const navigate = useNavigate();

    const faqs = [
        {
            question: "What is Buyto?",
            answer:
                "Buyto is a quick-commerce platform delivering groceries, electronics, fashion, essentials and more in minutes.",
        },
        {
            question: "How fast is delivery?",
            answer:
                "Most orders are delivered within 10–30 minutes depending on location, traffic and product availability.",
        },
        {
            question: "Which payment methods are accepted?",
            answer:
                "We accept UPI, Debit Cards, Credit Cards, Net Banking, Wallets and Cash on Delivery where available.",
        },
        {
            question: "How can I track my order?",
            answer:
                "You can track your order in real-time from the Profile → My Orders section.",
        },
        {
            question: "Can I cancel my order?",
            answer:
                "Orders can be cancelled before they are packed or dispatched.",
        },
        {
            question: "How do refunds work?",
            answer:
                "Eligible refunds are processed within 5–7 business days after approval.",
        },
        {
            question: "How can I contact support?",
            answer:
                "You can reach us anytime at support@buyto.co.in.",
        },
    ];

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

                {/* Hero Section */}
                <div
                    style={{
                        background: "#fff",
                        padding: "40px",
                        borderRadius: "24px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        marginBottom: "30px",
                        textAlign: "center",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "52px",
                            fontWeight: "900",
                            marginBottom: "10px",
                        }}
                    >
                        Frequently Asked Questions ❓
                    </h1>

                    <p
                        style={{
                            color: "#64748b",
                            fontSize: "18px",
                        }}
                    >
                        Everything you need to know about Buyto.
                    </p>
                </div>

                {/* FAQ Cards */}
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        style={{
                            background: "#fff",
                            padding: "25px",
                            borderRadius: "20px",
                            marginBottom: "15px",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                        }}
                    >
                        <h3
                            style={{
                                color: "#318616",
                                marginBottom: "10px",
                                fontSize: "22px",
                            }}
                        >
                            {faq.question}
                        </h3>

                        <p
                            style={{
                                color: "#475569",
                                lineHeight: "1.8",
                            }}
                        >
                            {faq.answer}
                        </p>
                    </div>
                ))}

                {/* Help Section */}
                <div
                    style={{
                        marginTop: "25px",
                        background:
                            "linear-gradient(135deg,#fff7cc,#dcfce7)",
                        padding: "30px",
                        borderRadius: "24px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                        textAlign: "center",
                    }}
                >
                    <h2>💬 Still Need Help?</h2>

                    <p
                        style={{
                            marginTop: "10px",
                            lineHeight: "1.8",
                        }}
                    >
                        Our support team is available 24/7 to help you with
                        orders, payments and delivery issues.
                    </p>

                    <div
                        style={{
                            marginTop: "20px",
                            display: "inline-block",
                            background: "#fff",
                            padding: "12px 20px",
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