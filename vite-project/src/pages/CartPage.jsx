import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CartPage({
    cartItems,
    increaseQty,
    decreaseQty,
    removeFromCart,
    isLoggedIn,
}) {
    const [noBagPledge, setNoBagPledge] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    const originalSubtotal = cartItems.reduce(
        (acc, item) => acc + (item.originalPrice || item.price) * item.quantity,
        0
    );

    const handlingFee = subtotal > 0 ? 4 : 0;
    const smallCartFee = subtotal > 0 && subtotal < 150 ? 15 : 0;
    const FREE_DELIVERY_THRESHOLD = 99;
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 29;
    const gstAndCharges = subtotal > 0 ? Math.round(subtotal * 0.05 + 2) : 0;

    const total = subtotal > 0 ? subtotal + handlingFee + smallCartFee + deliveryFee + gstAndCharges : 0;
    const originalTotal = originalSubtotal > 0 ? originalSubtotal + handlingFee + smallCartFee + deliveryFee + gstAndCharges : 0;
    const user = localStorage.getItem("buyto_user") ? JSON.parse(localStorage.getItem("buyto_user")) : null;
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f3f4f6",
            }}
        >
            <div
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    padding: windowWidth < 768 ? "12px" : "24px",
                    paddingBottom: windowWidth < 768 ? "120px" : "140px",
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                        }}
                    >
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: "28px",
                                cursor: "pointer",
                            }}
                        >
                            ←
                        </button>

                        <h1
                            style={{
                                fontSize: windowWidth < 768 ? "22px" : "34px",
                                fontWeight: "700",
                                margin: 0,
                            }}
                        >
                            Your Cart
                        </h1>
                    </div>

                    <div
                        style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "50%",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                            fontSize: "24px",
                        }}
                    >
                        🛒
                    </div>
                </div>

                {/* SAVINGS BAR */}
                <div
                    style={{
                        background: "#d1fae5",
                        color: "#059669",
                        padding: "20px",
                        borderRadius: "22px",
                        marginBottom: "24px",
                        fontWeight: "600",
                        fontSize: "18px",
                    }}
                >
                    ₹28 saved! Save more on every order 🎉
                </div>

                {/* APPLY COUPON CARD */}
                <div
                    style={{
                        background: "white",
                        borderRadius: windowWidth < 768 ? "18px" : "24px",
                        padding: windowWidth < 768 ? "16px" : "28px",
                        marginBottom: "24px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: windowWidth < 768 ? "16px" : "20px" }}>Apply Coupon</h2>
                    <p
                        style={{
                            color: "#6b7280",
                            marginTop: "8px",
                            marginBottom: 0,
                            fontSize: "14px",
                        }}
                    >
                        Save more with coupons available for you
                    </p>
                </div>

                {/* EMPTY CART CHECK */}
                {cartItems.length === 0 ? (
                    /* EMPTY CART UI */
                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "120px",
                        }}
                    >
                        <h2>Your cart is empty 😢</h2>
                        <p style={{ color: "#6b7280" }}>Add some products</p>
                    </div>
                ) : (
                    /* START MAIN CART CONTENT */
                    <>
                        {/* BIG WHITE CART CARD */}
                        <div
                            style={{
                                background: "white",
                                borderRadius: windowWidth < 768 ? "18px" : "28px",
                                padding: windowWidth < 768 ? "16px" : "28px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                marginBottom: "24px",
                            }}
                        >
                            {/* DELIVERY HEADER */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "20px",
                                }}
                            >
                                <h2 style={{ margin: 0, fontSize: windowWidth < 768 ? "16px" : "20px" }}>30 Mins</h2>
                                <p style={{ margin: 0, color: "#6b7280", fontWeight: "600" }}>
                                    {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                                </p>
                            </div>

                            {/* DOTTED DIVIDER */}
                            <hr
                                style={{
                                    borderStyle: "dashed",
                                    borderColor: "#d1d5db",
                                    marginBottom: "24px",
                                    borderTop: "none",
                                }}
                            />

                            {/* LOOP PRODUCTS */}
                            {cartItems.map((item) => (
                                /* EACH ITEM CONTAINER */
                                <div
                                    key={item._id || item.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "18px",
                                    }}
                                >
                                    {/* LEFT SIDE */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: windowWidth < 768 ? "10px" : "18px",
                                            alignItems: "center",
                                        }}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{
                                                width: windowWidth < 768 ? "56px" : "72px",
                                                height: windowWidth < 768 ? "56px" : "72px",
                                                objectFit: "cover",
                                                borderRadius: windowWidth < 768 ? "12px" : "18px",
                                            }}
                                        />
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: windowWidth < 768 ? "15px" : "18px" }}>{item.name}</h3>
                                            <p
                                                style={{
                                                    color: "#6b7280",
                                                    margin: "4px 0",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {item.weight}
                                            </p>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    alignItems: "center",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                <b style={{ fontSize: "16px" }}>₹{item.price}</b>
                                                {item.originalPrice && (
                                                    <s
                                                        style={{
                                                            color: "#9ca3af",
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        ₹{item.originalPrice}
                                                    </s>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: windowWidth < 768 ? "8px" : "18px",
                                        }}
                                    >
                                        {/* QUANTITY CONTROL */}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: windowWidth < 768 ? "8px" : "12px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: windowWidth < 768 ? "10px" : "14px",
                                                padding: windowWidth < 768 ? "4px 8px" : "8px 14px",
                                            }}
                                        >
                                            <button
                                                onClick={() => decreaseQty(item.id)}
                                                style={{
                                                    border: "none",
                                                    background: "transparent",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                -
                                            </button>
                                            <span style={{ fontSize: "15px", fontWeight: "600" }}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => increaseQty(item.id)}
                                                style={{
                                                    border: "none",
                                                    background: "transparent",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "#ef4444",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* NO BAG PLEDGE CARD */}
                        <div
                            style={{
                                background: noBagPledge ? "#d1fae5" : "white",
                                borderRadius: windowWidth < 768 ? "18px" : "24px",
                                padding: windowWidth < 768 ? "16px" : "24px",
                                marginBottom: "24px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                display: "flex",
                                flexDirection: windowWidth < 768 ? "column" : "row",
                                justifyContent: "space-between",
                                alignItems: windowWidth < 768 ? "flex-start" : "center",
                                gap: windowWidth < 768 ? "16px" : "0",
                                transition: "background-color 0.2s ease",
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        fontSize: windowWidth < 768 ? "18px" : "28px",
                                        fontWeight: "700",
                                        marginBottom: "10px",
                                        margin: 0,
                                        color: noBagPledge ? "#065f46" : "#1f2937",
                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    I don't need a bag! 🌿
                                </h3>

                                <p
                                    style={{
                                        color: noBagPledge ? "#047857" : "#6b7280",
                                        fontSize: windowWidth < 768 ? "13px" : "18px",
                                        margin: "8px 0 0 0",
                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    Take the pledge for a greener future – opt for a no bag delivery!
                                </p>
                            </div>

                            {/* Toggle */}
                            <div
                                onClick={() => setNoBagPledge(!noBagPledge)}
                                style={{
                                    width: "72px",
                                    height: "40px",
                                    background: noBagPledge ? "#10b981" : "#e5e7eb",
                                    borderRadius: "999px",
                                    position: "relative",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                    transition: "background-color 0.2s ease",
                                    alignSelf: windowWidth < 768 ? "flex-end" : "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: "34px",
                                        height: "34px",
                                        background: "white",
                                        borderRadius: "50%",
                                        position: "absolute",
                                        top: "3px",
                                        left: noBagPledge ? "35px" : "3px",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                        transition: "left 0.2s ease",
                                    }}
                                />
                            </div>
                        </div>
                        {/* DELIVERY ADDRESS CARD */}
                        {user && (
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: windowWidth < 768 ? "18px" : "28px",
                                    padding: windowWidth < 768 ? "16px" : "28px",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                    marginBottom: "24px",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <h2 style={{ margin: 0, fontSize: windowWidth < 768 ? "16px" : "20px" }}>Delivery Location</h2>
                                    <span style={{ fontSize: "12px", background: "rgba(34, 197, 94, 0.1)", color: "#16A34A", padding: "4px 10px", borderRadius: "8px", fontWeight: "700" }}>
                                        Saved Address
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "16px" }}>👤</span>
                                        <span style={{ fontWeight: "700", color: "#1f2937" }}>{user.name}</span>
                                        <span style={{ color: "#6b7280" }}>•</span>
                                        <span style={{ color: "#6b7280", fontWeight: "500" }}>{user.phone}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                        <span style={{ fontSize: "16px", marginTop: "2px" }}>📍</span>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ color: "#374151", fontWeight: "600" }}>
                                                {user.location}
                                            </span>
                                            {user.room && (
                                                <span style={{ color: "#6b7280", fontSize: "14px", marginTop: "2px" }}>
                                                    Room Number: {user.room}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BILL DETAILS CARD */}
                        <div
                            style={{
                                background: "white",
                                borderRadius: windowWidth < 768 ? "18px" : "28px",
                                padding: windowWidth < 768 ? "16px" : "28px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                marginBottom: "24px",
                            }}
                        >
                            {/* BILL ROWS */}
                            <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: windowWidth < 768 ? "16px" : "20px" }}>
                                Bill Details
                            </h2>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "18px",
                                    color: "#4b5563",
                                    fontSize: "20px",
                                }}
                            >
                                <span>Item Total</span>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    {originalSubtotal > subtotal && (
                                        <span
                                            style={{
                                                textDecoration: "line-through",
                                                color: "#9ca3af",
                                                fontSize: "18px",
                                            }}
                                        >
                                            ₹{originalSubtotal}
                                        </span>
                                    )}

                                    <span
                                        style={{
                                            fontWeight: "600",
                                            color: "#111827",
                                        }}
                                    >
                                        ₹{subtotal}
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "12px",
                                    fontSize: "16px",
                                    color: "#4b5563",
                                }}
                            >
                                <span>Handling Fee</span>
                                <span>₹{handlingFee}</span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "12px",
                                    fontSize: "16px",
                                    color: "#4b5563",
                                }}
                            >
                                <span>Small Cart Fee</span>
                                <span>₹{smallCartFee}</span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "12px",
                                    fontSize: "16px",
                                    color: "#4b5563",
                                }}
                            >
                                <span>Delivery Partner Fee</span>
                                {deliveryFee === 0 ? (
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <span style={{ textDecoration: "line-through", color: "#9CA3AF", fontSize: "14px" }}>₹29</span>
                                        <span style={{ color: "#16A34A", fontWeight: 700 }}>FREE</span>
                                    </div>
                                ) : (
                                    <span>₹29</span>
                                )}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "16px",
                                    fontSize: "16px",
                                    color: "#4b5563",
                                }}
                            >
                                <span>GST and Charges</span>
                                <span>₹{gstAndCharges}</span>
                            </div>
                            <hr
                                style={{
                                    border: "none",
                                    borderTop: "1px solid #e5e7eb",
                                    marginBottom: "16px",
                                }}
                            />

                            {/* TOTAL SECTION */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontWeight: "700",
                                    fontSize: windowWidth < 768 ? "16px" : "20px",
                                    marginTop: "18px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "700",
                                        color: "#111827",
                                    }}
                                >To Pay
                                </span>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            textDecoration: "line-through",
                                            fontSize: "22px",
                                            fontWeight: "500",
                                            color: "#6b7280"

                                        }}
                                    >₹{originalTotal}
                                    </span>

                                    <span
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: "700",
                                            color: "#111827",
                                        }}
                                    >₹{total}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* NOTE CARD */}
                        <div
                            style={{
                                background: "#f58383ff",
                                borderRadius: "22px",
                                padding: "24px",
                                marginTop: "24px",
                                marginBottom: "120px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                            }}
                        >
                            <p
                                style={{
                                    color: "black",
                                    fontWeight: "700",
                                    marginBottom: "10px",
                                    fontSize: "16px",
                                    margin: 0,
                                }}
                            >
                                NOTE:
                            </p>

                            <p
                                style={{
                                    color: "#4b5563",
                                    fontSize: "15px",
                                    lineHeight: "1.6",
                                    margin: "8px 0 0 0",
                                }}
                            >
                                Amount once paid is non-refundable and non-exchangeable with products.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* FIXED BOTTOM BAR */}
            {cartItems.length > 0 && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "16px",

                        left: "50%",
                        transform: "translateX(-50%)",

                        width: windowWidth < 768 ? "calc(100% - 48px)" : "100%",
                        maxWidth: "1020px",

                        background: "white",

                        padding: "14px 22px",

                        borderRadius: "22px",

                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",

                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        borderTop: "1px solid #e5e7eb",

                        zIndex: 999,
                    }}
                >
                    {/* Left */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                color: "#6b7280",
                                fontWeight: "500",
                                marginBottom: "2px",
                            }}
                        >
                            To Pay
                        </span>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    textDecoration: "line-through",
                                    color: "#9ca3af",
                                    fontSize: "20px",
                                    fontWeight: "500",
                                }}
                            >
                                ₹{originalTotal}
                            </span>

                            <span
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "700",
                                    color: "#111827",
                                }}
                            >
                                ₹{total}
                            </span>
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={() => {
                            if (!isLoggedIn) {
                                navigate("/login", { state: { from: { pathname: "/payment" } } });
                            } else {
                                navigate(user?.location ? "/payment" : "/details");
                            }
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#286f12")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "#318616")}
                        style={{
                            background: "#318616",
                            color: "white",
                            border: "none",
                            padding: "14px 28px",
                            borderRadius: "16px",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(49,134,22,0.25)",
                            transition: "all 0.2s",
                        }}
                    >
                        {!isLoggedIn 
                            ? "Login to Place Order" 
                            : user?.location 
                                ? "Proceed to Pay" 
                                : "Add Delivery Details"}
                    </button>
                </div>
            )}
            {/* CLOSE MAIN CONTAINER */}
        </div>
    );
}