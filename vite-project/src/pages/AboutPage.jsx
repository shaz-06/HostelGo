import React from "react";
import { useNavigate } from "react-router-dom";

const AboutPage = () => {
    const navigate = useNavigate();

    const highlights = [
        {
            icon: "⚡",
            title: "Delivery in Minutes",
            desc: "Ultra-fast delivery powered by local fulfillment partners.",
        },
        {
            icon: "https://img.icons8.com/?size=100&id=QrVIoywwY1OD&format=png&color=000000",
            title: "24/7 Support",
            desc: "Customer assistance available whenever you need help.",
        },
        {
            icon: "https://img.icons8.com/?size=100&id=TquBfvAjccPc&format=png&color=000000",
            title: "Thousands of Products",
            desc: "Groceries, electronics, fashion, essentials and more.",
        },
        {
            icon: "https://img.icons8.com/?size=100&id=BL6umjxvbHck&format=png&color=000000",
            title: "Secure Payments",
            desc: "Safe and trusted payment processing for every order.",
        },
        {
            icon: "💰",
            title: "Affordable Pricing",
            desc: "Competitive prices with exciting offers and discounts.",
        },
        {
            icon: "https://img.icons8.com/?size=100&id=DA67d1tKQ9Pr&format=png&color=000000",
            title: "BuyCoins Rewards",
            desc: "Earn rewards and exclusive benefits on purchases.",
        },
        {
            icon: "https://img.icons8.com/?size=100&id=xPX4qmtKvtBp&format=png&color=000000",
            title: "Hyperlocal Network",
            desc: "Supporting local stores and communities.",
        },
        {
            icon: "https://img.icons8.com/?size=100&id=lTKW3iI3wIT0&format=png&color=000000",
            title: "Technology Driven",
            desc: "Built using modern cloud and AI-powered systems.",
        },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                padding: "30px 20px",
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

            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "30px",
                    padding: "50px",
                    boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
                }}
            >
                {/* Hero */}
                <div style={{ textAlign: "center", marginBottom: "60px" }}>
                    <h1
                        style={{
                            fontSize: "64px",
                            fontWeight: "900",
                            marginBottom: "15px",
                        }}
                    >
                        About{" "}
                        <span style={{ color: "#facc15" }}>Buy</span>
                        <span style={{ color: "#318616" }}>to</span> 🚀
                    </h1>

                    <p
                        style={{
                            fontSize: "24px",
                            color: "#64748b",
                            maxWidth: "800px",
                            margin: "0 auto",
                            lineHeight: "1.8",
                        }}
                    >
                        India's Next Generation Quick-Commerce Platform
                    </p>

                    <p
                        style={{
                            fontSize: "18px",
                            color: "#64748b",
                            marginTop: "10px",
                        }}
                    >
                        Delivering groceries, essentials, electronics and lifestyle
                        products to your doorstep in minutes.
                    </p>
                </div>

                {/* Founder Story */}
                <div
                    style={{
                        background: "linear-gradient(135deg,#fff7cc,#dcfce7)",
                        padding: "35px",
                        borderRadius: "24px",
                        marginBottom: "40px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "42px",
                            fontWeight: "800",
                            marginBottom: "20px",
                        }}
                    >
                        👨‍💼 Founder's Story
                    </h2>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "2",
                            color: "#334155",
                        }}
                    >
                        Buyto was founded by <strong>Shashank Shetty</strong>, a Computer
                        Science student and entrepreneur from Karnataka.
                    </p>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "2",
                            color: "#334155",
                        }}
                    >
                        The idea for Buyto started with a simple observation: people waste
                        valuable time visiting multiple stores for everyday needs. Existing
                        delivery services often had delays, limited product availability and
                        inconsistent customer experiences.
                    </p>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "2",
                            color: "#334155",
                        }}
                    >
                        As a technology enthusiast, Shashank envisioned a platform that
                        combines speed, affordability and convenience into one seamless
                        experience. What started as an idea has evolved into Buyto — a
                        modern quick-commerce platform built for the future.
                    </p>
                </div>

                {/* Vision */}
                <div
                    style={{
                        background: "#f0fdf4",
                        padding: "35px",
                        borderRadius: "24px",
                        marginBottom: "30px",
                    }}
                >
                    <h2 style={{ fontSize: "38px", fontWeight: "800" }}>
                        🌍 Founder's Vision
                    </h2>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "2",
                            marginTop: "15px",
                            color: "#334155",
                        }}
                    >
                        "My vision is to build one of India's most trusted quick-commerce
                        brands by using technology to simplify everyday life."
                    </p>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "2",
                            color: "#334155",
                        }}
                    >
                        Buyto is not just a delivery app. It is a platform that empowers
                        local businesses, creates opportunities for delivery partners and
                        provides customers with a fast and affordable shopping experience.
                    </p>
                </div>

                {/* Mission */}
                <div
                    style={{
                        background: "#eff6ff",
                        padding: "35px",
                        borderRadius: "24px",
                        marginBottom: "50px",
                    }}
                >
                    <h2 style={{ fontSize: "38px", fontWeight: "800" }}>
                        🎯 Our Mission
                    </h2>

                    <p
                        style={{
                            fontSize: "18px",
                            lineHeight: "2",
                            marginTop: "15px",
                            color: "#334155",
                        }}
                    >
                        To make everyday shopping fast, affordable and accessible by
                        delivering products in minutes while maintaining exceptional
                        customer service and reliability.
                    </p>
                </div>

                {/* Highlights */}
                <h2
                    style={{
                        fontSize: "48px",
                        fontWeight: "900",
                        textAlign: "center",
                        marginBottom: "40px",
                    }}
                >
                    Why Choose Buyto?
                </h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                        gap: "20px",
                        marginBottom: "60px",
                    }}
                >
                    {highlights.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                background: "#fff",
                                borderRadius: "20px",
                                padding: "25px",
                                boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div style={{ fontSize: "40px", display: "flex", alignItems: "center", height: "40px" }}>
                                {typeof item.icon === "string" && item.icon.startsWith("http") ? (
                                    <img
                                        src={item.icon}
                                        alt={item.title}
                                        style={{ width: "40px", height: "40px", objectFit: "contain" }}
                                    />
                                ) : (
                                    item.icon
                                )}
                            </div>

                            <h3
                                style={{
                                    marginTop: "15px",
                                    fontSize: "22px",
                                    fontWeight: "700",
                                }}
                            >
                                {item.title}
                            </h3>

                            <p
                                style={{
                                    color: "#64748b",
                                    lineHeight: "1.8",
                                }}
                            >
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Future */}
                <div
                    style={{
                        background: "linear-gradient(135deg,#dcfce7,#dbeafe)",
                        padding: "35px",
                        borderRadius: "24px",
                        marginBottom: "50px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "40px",
                            fontWeight: "800",
                            marginBottom: "20px",
                        }}
                    >
                        🔮 Future Roadmap
                    </h2>

                    <ul
                        style={{
                            fontSize: "18px",
                            lineHeight: "2.2",
                            color: "#334155",
                        }}
                    >
                        <li>Expansion across multiple cities</li>
                        <li>AI-powered shopping recommendations</li>
                        <li>Dedicated delivery partner ecosystem</li>
                        <li>Vendor and merchant platform</li>
                        <li>Enhanced BuyCoins rewards program</li>
                        <li>Nationwide quick-commerce coverage</li>
                    </ul>
                </div>

                {/* Closing */}
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px",
                        borderTop: "2px solid #e2e8f0",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "40px",
                            fontWeight: "800",
                            marginBottom: "20px",
                        }}
                    >
                        Built with ❤️ in India
                    </h2>

                    <p
                        style={{
                            fontSize: "20px",
                            color: "#475569",
                            lineHeight: "2",
                        }}
                    >
                        Buyto is more than an app. It is a mission to redefine convenience,
                        empower local commerce and make shopping effortless for millions of
                        customers.
                    </p>

                    <p
                        style={{
                            marginTop: "20px",
                            fontWeight: "700",
                            fontSize: "22px",
                            color: "#318616",
                        }}
                    >
                        — Shashank Shetty, Founder
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;