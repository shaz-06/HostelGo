import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      console.log("=== RAZORPAY SDK LOADED ===");
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function PaymentPage({ cart, setCart }) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("=== CUSTOMER GPS ===");
          console.log(lat, lng);
          setGpsCoords({ latitude: lat, longitude: lng });
        },
        (error) => {
          console.warn("=== GEOLOCATION DENIED ===");
          console.warn("Error message:", error.message, "- Falling back safely to Kundapura.");
          setGpsCoords({ latitude: 13.628, longitude: 74.693 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation not supported by browser. Falling back safely.");
      setGpsCoords({ latitude: 13.628, longitude: 74.693 });
    }
  }, []);

  // Load authenticated session and active checkout/guest details
  const authUser = localStorage.getItem("buyto_user") ? JSON.parse(localStorage.getItem("buyto_user")) : null;
  const checkoutUser = localStorage.getItem("buyto_user") ? JSON.parse(localStorage.getItem("buyto_user")) : null;

  // Merge session with current checkout inputs to avoid missing name/phone/location
  const user = {
    ...authUser,
    ...checkoutUser,
    name: checkoutUser?.name || authUser?.name || "",
    phone: checkoutUser?.phone || authUser?.phone || "",
    location: checkoutUser?.location || authUser?.location || "",
    room: checkoutUser?.roomNumber || checkoutUser?.room || authUser?.room || ""
  };

  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'razorpay'

  // Cart Calculations
  const subtotal = Object.values(cart || {}).reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const handlingFee = subtotal > 0 ? 4 : 0;
  const smallCartFee = subtotal > 0 && subtotal < 150 ? 15 : 0;
  const FREE_DELIVERY_THRESHOLD = 99;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 29;
  const gstAndCharges = subtotal > 0 ? Math.round(subtotal * 0.05 + 2) : 0;
  const total = subtotal > 0 ? subtotal + handlingFee + smallCartFee + deliveryFee + gstAndCharges : 0;

  const handlePlaceOrder = async () => {
    console.log("=== PAYMENT START ===");
    console.log("=== USER DATA ===", user);

    if (subtotal === 0) {
      alert("Your cart is empty");
      return;
    }
    if (!user) {
      alert("No delivery details found. Please go back and fill checkout details.");
      return;
    }

    const products = Object.values(cart).map((item) => ({
      productId: item.product._id || item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      weight: item.product.selectedWeight || item.product.weight,
      price: item.product.price
    }));

    const actualLocation = user.location || "Central Address";
    const actualRoom = user.room || user.roomNumber || "";
    const deliveryAddress = `${actualLocation}${actualRoom ? `, Room: ${actualRoom}` : ""}`;

    setIsProcessing(true);

    try {
      if (paymentMethod === "cod") {
        // 1. Cash on Delivery placement
        console.log("=== CREATE ORDER REQUEST ===");
        const response = await fetch("http://localhost:8000/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            user: {
              name: user.name || "Guest User",
              phone: user.phone || "0000000000",
              location: user.location || "Central Address",
              room: String(user.room || user.roomNumber || "")
            },
            products,
            amount: total,
            deliveryAddress,
            deliveryLatitude: gpsCoords ? gpsCoords.latitude : null,
            deliveryLongitude: gpsCoords ? gpsCoords.longitude : null
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log("=== CREATE ORDER RESPONSE ===", data);
          // Store latest order details for tracking dashboard
          localStorage.setItem(
            "latestOrder",
            JSON.stringify(products.map(p => ({
              id: p.productId,
              name: p.name,
              quantity: p.quantity,
              weight: p.weight
            })))
          );
          const orderId = data.order?._id;
          localStorage.setItem("latestOrderId", orderId || "");
          localStorage.setItem("activeOrder", "true");
          localStorage.removeItem("hideTrackingCard");

          setCart({});
          if (orderId) {
            console.log("=== PAYMENT VERIFIED SUCCESS ===");
            console.log("=== REDIRECTING TO TRACKING PAGE ===", orderId);
            navigate(`/track-order/${orderId}`);
          } else {
            navigate("/success");
          }
        } else {
          console.log("=== PAYMENT ERROR ===", data);
          alert(data.message || "Failed to place Cash on Delivery order.");
        }
      } else {
        // 2. Online Payment via Razorpay
        console.log("=== RAZORPAY INIT ===");
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          alert("Razorpay payment gateway failed to load! Please check your network connection and reload the page.");
          setIsProcessing(false);
          return;
        }

        console.log("=== CREATE ORDER REQUEST ===");
        const response = await fetch("http://localhost:8000/api/payment/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: total,
            user: {
              name: user.name || "Guest User",
              phone: user.phone || "0000000000",
              location: user.location || "Central Address",
              room: String(user.room || user.roomNumber || "")
            },
            products,
            deliveryAddress,
            deliveryLatitude: gpsCoords ? gpsCoords.latitude : null,
            deliveryLongitude: gpsCoords ? gpsCoords.longitude : null
          })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("=== [FRONTEND] create-order response error ===");
          console.error("Response Status:", response.status);
          console.error("Response JSON Data:", data);
          console.log("=== PAYMENT ERROR ===", data);
          alert(`Failed to initiate online transaction: ${data.message || "Unknown error"}${data.error ? ` (${data.error})` : ""}`);
          setIsProcessing(false);
          return;
        }

        console.log("=== CREATE ORDER RESPONSE ===", data);
        const { keyId, orderId, amount } = data;

        const options = {
          key: keyId,
          amount: amount,
          currency: "INR",
          name: "Buyto Instant Delivery ⚡",
          description: "Instant Cart Order Purchase",
          order_id: orderId,
          handler: async function (response) {
            try {
              setIsProcessing(true);
              console.log("=== RAZORPAY PAYMENT SUCCESS ===");
              const verifyRes = await fetch("http://localhost:8000/api/payment/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
              });

              const verifyData = await verifyRes.json();
              console.log("=== PAYMENT VERIFY RESPONSE ===", verifyData);

              if (verifyRes.ok && verifyData.success) {
                console.log("=== VERIFY SUCCESS ===");
                // Store latest order details for tracking dashboard
                localStorage.setItem(
                  "latestOrder",
                  JSON.stringify(products.map(p => ({
                    id: p.productId,
                    name: p.name,
                    quantity: p.quantity,
                    weight: p.weight
                  })))
                );
                const orderId = verifyData.order?._id;
                localStorage.setItem("latestOrderId", orderId || "");
                localStorage.setItem("activeOrder", "true");
                localStorage.removeItem("hideTrackingCard");

                setCart({});
                if (orderId) {
                  console.log("=== PAYMENT VERIFIED SUCCESS ===");
                  console.log("=== REDIRECTING TO TRACKING PAGE ===", orderId);
                  navigate(`/track-order/${orderId}`);
                } else {
                  navigate("/success");
                }
              } else {
                console.error("=== [FRONTEND] Payment verification failed ===");
                console.error("Status:", verifyRes.status);
                console.error("JSON Data:", verifyData);
                console.log("=== PAYMENT ERROR ===", verifyData);
                alert(verifyData.message || "Payment validation failed!");
              }
            } catch (err) {
              console.error("=== [FRONTEND] Signature verification exception ===");
              console.log("=== PAYMENT ERROR ===", err);
              alert(`Error verifying checkout signature: ${err.message}`);
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: user.name,
            contact: user.phone,
          },
          theme: {
            color: "#318616",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        console.log("=== RAZORPAY OPEN ===");
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          console.error("=== [FRONTEND] Razorpay checkout popup reported payment failure ===");
          console.error("Error Details:", response.error);
          console.log("=== PAYMENT ERROR ===", response.error);
          alert(`Order Payment Failed: ${response.error.description}`);
          setIsProcessing(false);
        });
        rzp.open();
      }
    } catch (error) {
      console.log("=== PAYMENT ERROR ===", error);
      const isNetworkError = error.message.includes("Load failed") || error.message.includes("Failed to fetch");
      const errorMessage = isNetworkError 
        ? "Network connection to server failed. Please ensure the backend is running and online."
        : error.message;
      alert(`Something went wrong during checkout: ${errorMessage}`);
    } finally {
      if (paymentMethod === "cod") {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
        padding: "40px 24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "36px",
          borderRadius: "32px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/cart")}
          disabled={isProcessing}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isProcessing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
            padding: 0,
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => {
            if (!isProcessing) e.target.style.color = "#318616";
          }}
          onMouseOut={(e) => {
            if (!isProcessing) e.target.style.color = "#6b7280";
          }}
        >
          ← Back to Cart
        </button>

        {/* Progress Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#318616", textTransform: "uppercase", letterSpacing: "1px" }}>
              Step 3 of 3
            </span>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#d1d5db" }}></span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Payment</span>
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "850",
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Choose Payment Method 💳
          </h1>
        </div>

        {/* Delivery Address Card */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px" }}>📍</span>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#374151" }}>
              Deliver To
            </h3>
          </div>
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px", color: "#4b5563" }}>
              <span style={{ fontWeight: "700", color: "#1f2937" }}>{user.name}</span>
              <span>{user.location}</span>
              {(user.room || user.roomNumber) && <span>Room: {user.room || user.roomNumber}</span>}
              <span style={{ marginTop: "4px", fontWeight: "600" }}>📞 {user.phone}</span>
            </div>
          ) : (
            <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: "600" }}>
              No address details found. Please go back and fill checkout details.
            </span>
          )}
        </div>

        {/* Payment Options */}
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "750", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Payment Options
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* COD */}
            <div
              onClick={() => !isProcessing && setPaymentMethod("cod")}
              style={optionStyle(paymentMethod === "cod")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>💵</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontWeight: "700", fontSize: "15px", color: "#1f2937" }}>Cash on Delivery</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>Pay when your delivery arrives</span>
                </div>
              </div>
              <input type="radio" checked={paymentMethod === "cod"} readOnly style={radioStyle} />
            </div>

            {/* Online Payment via Razorpay */}
            <div
              onClick={() => !isProcessing && setPaymentMethod("razorpay")}
              style={optionStyle(paymentMethod === "razorpay")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>💳</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontWeight: "700", fontSize: "15px", color: "#1f2937" }}>Pay Online Securely</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>UPI, Credit/Debit Cards, Netbanking</span>
                </div>
              </div>
              <input type="radio" checked={paymentMethod === "razorpay"} readOnly style={radioStyle} />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "28px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "750", color: "#374151" }}>
            Order Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "#4b5563" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Items Subtotal</span>
              <span style={{ fontWeight: "600", color: "#1f2937" }}>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Handling Fee</span>
              <span>₹{handlingFee}</span>
            </div>
            {smallCartFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Small Cart Fee</span>
                <span>₹{smallCartFee}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery Fee</span>
              {deliveryFee === 0 ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ textDecoration: "line-through", color: "#9CA3AF", fontSize: "14px" }}>₹29</span>
                  <span style={{ color: "#16A34A", fontWeight: "700" }}>FREE</span>
                </div>
              ) : (
                <span>₹29</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>GST and Charges</span>
              <span>₹{gstAndCharges}</span>
            </div>
            <div
              style={{
                borderTop: "1.5px solid #e5e7eb",
                paddingTop: "12px",
                marginTop: "4px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: "800",
                color: "#111827",
              }}
            >
              <span>Total Payable</span>
              <span style={{ color: "#318616", fontSize: "20px" }}>₹{total}</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          style={{
            width: "100%",
            height: "58px",
            border: "none",
            borderRadius: "18px",
            background: isProcessing ? "#9ca3af" : "linear-gradient(135deg, #318616 0%, #286f12 100%)",
            color: "white",
            fontSize: "18px",
            fontWeight: "755",
            cursor: isProcessing ? "not-allowed" : "pointer",
            boxShadow: isProcessing ? "none" : "0 10px 20px rgba(49, 134, 22, 0.2)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(40, 111, 18, 0.3)";
            }
          }}
          onMouseOut={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(40, 111, 18, 0.2)";
            }
          }}
        >
          {isProcessing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="20" height="20" viewBox="0 0 38 38" stroke="#fff" style={{ animation: "spin 1s linear infinite" }}>
                <defs>
                  <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
                    <stop stopColor="#fff" stopOpacity="0" offset="0%" />
                    <stop stopColor="#fff" stopOpacity=".631" offset="63.146%" />
                    <stop stopColor="#fff" offset="100%" />
                  </linearGradient>
                </defs>
                <g fill="none" fillRule="evenodd">
                  <g transform="translate(1 1)">
                    <path d="M36 18c0-9.94-8.06-18-18-18" stroke="url(#a)" strokeWidth="2">
                      <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="0.9s" repeatCount="indefinite" />
                    </path>
                    <circle fill="#fff" cx="36" cy="18" r="1">
                      <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="0.9s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </g>
              </svg>
              <span>Processing Order...</span>
            </div>
          ) : (
            <span>Place Order ⚡</span>
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

const optionStyle = (active) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  borderRadius: "16px",
  border: active ? "2.5px solid #318616" : "1.5px solid #e5e7eb",
  background: active ? "rgba(49, 134, 22, 0.04)" : "white",
  cursor: "pointer",
  transition: "all 0.15s ease",
  boxSizing: "border-box",
});

const radioStyle = {
  width: "18px",
  height: "18px",
  cursor: "pointer",
  accentColor: "#318616",
};
