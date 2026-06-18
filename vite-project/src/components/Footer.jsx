import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer
            style={{
                background: "#ffffff",
                borderTop: "1px solid #e5e7eb",
                marginTop: "60px",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "50px 20px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                        gap: "30px",
                    }}
                >
                    {/* Brand */}
                    <div>
                        <h2
                            style={{
                                fontSize: "32px",
                                fontWeight: "900",
                                marginBottom: "15px",
                            }}
                        >
                            <span style={{ color: "#facc15" }}>Buy</span>
                            <span style={{ color: "#318616" }}>to</span>
                        </h2>

                        <p
                            style={{
                                color: "#64748b",
                                lineHeight: "1.8",
                            }}
                        >
                            Fast, reliable and affordable delivery of groceries,
                            essentials, electronics and lifestyle products.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3
                            style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                marginBottom: "15px",
                            }}
                        >
                            Quick Links
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                            }}
                        >
                            <Link to="/about">About Us</Link>
                            <Link to="/contact">Contact Us</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3
                            style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                marginBottom: "15px",
                            }}
                        >
                            Legal
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                            }}
                        >
                            <Link to="/privacy-policy">Privacy Policy</Link>
                            <Link to="/terms">Terms & Conditions</Link>
                            <Link to="/refund-policy">Refund Policy</Link>
                            <Link to="/shipping-policy">Shipping Policy</Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3
                            style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                marginBottom: "15px",
                            }}
                        >
                            Contact
                        </h3>

                        <div
                            style={{
                                color: "#64748b",
                                lineHeight: "2",
                            }}
                        >
                            <p>📧 supportbuyto@gmail.com</p>
                            <p>🌐 www.buyto.co.in</p>
                            <p>📍 Bengaluru, India</p>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: "40px",
                        paddingTop: "20px",
                        borderTop: "1px solid #e5e7eb",
                        textAlign: "center",
                        color: "#64748b",
                    }}
                >
                    © 2026 Buyto. All Rights Reserved.
                </div>
            </div>
        </footer>
    );
}