import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { calculateBill } from "../utils/billCalculator";
import CartBillDetails from "../components/CartBillDetails";

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

export default function PaymentPage({ 
  cart, 
  setCart,
  activeCoupons = [],
  selectedCoupon = null,
  setSelectedCoupon = () => {}
}) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const [coinsToRedeem, setCoinsToRedeem] = useState(() => Number(localStorage.getItem("buyto_coins_redeem") || 0));

  const [isAddressServiceable, setIsAddressServiceable] = useState(true);
  const [checkingServiceability, setCheckingServiceability] = useState(true);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  useEffect(() => {
    const checkServiceability = async () => {
      const savedUser = localStorage.getItem("buyto_user") ? JSON.parse(localStorage.getItem("buyto_user")) : null;
      const coords = savedUser?.coords;
      if (!coords || coords.length < 2) {
        setIsAddressServiceable(false);
        setCheckingServiceability(false);
        return;
      }

      try {
        const res = await fetch(window.API_BASE_URL + "/api/auth/verify-serviceability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: coords[0],
            longitude: coords[1]
          })
        });
        if (res.ok) {
          const data = await res.json();
          setIsAddressServiceable(data.serviceable);
        } else {
          setIsAddressServiceable(false);
        }
      } catch (err) {
        console.error("Error checking serviceability in PaymentPage:", err);
        setIsAddressServiceable(false);
      } finally {
        setCheckingServiceability(false);
      }
    };
    checkServiceability();
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchRewardsData = async () => {
      try {
        const meRes = await fetch(window.API_BASE_URL + "/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setUserCoins(meData.user.buyCoins || 0);
          }
        }
      } catch (err) {
        console.error("Error fetching rewards details in PaymentPage:", err);
      }
    };
    fetchRewardsData();
  }, [token]);

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
  const [config, setConfig] = useState({
    handlingFee: 0,
    gstPercentage: 5,
    gstFixedCharges: 2
  });
  const [deliverySettings, setDeliverySettings] = useState({
    lateNightDeliveryEnabled: false,
    rainyDeliveryEnabled: false
  });

  useEffect(() => {
    fetch(window.API_BASE_URL + "/api/config/fees")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig(data);
        }
      })
      .catch(err => console.error("Failed to load fee configuration in PaymentPage:", err));

    fetch(window.API_BASE_URL + "/api/delivery-settings")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setDeliverySettings(data);
        }
      })
      .catch(err => console.error("Failed to load delivery settings in PaymentPage:", err));

    // Connect to Socket.IO for real-time updates
    const socket = io(window.API_BASE_URL);
    socket.on("deliverySettingsUpdated", (updatedSettings) => {
        console.log("🔌 Socket: delivery settings updated in real-time (payment):", updatedSettings);
        if (updatedSettings) {
            setDeliverySettings(updatedSettings);
        }
    });

    // Fallback polling every 30 seconds
    const pollInterval = setInterval(() => {
        fetch(window.API_BASE_URL + "/api/delivery-settings")
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setDeliverySettings(data);
                }
            })
            .catch(err => console.error("Failed to poll delivery settings in PaymentPage:", err));
    }, 30000);

    return () => {
        socket.disconnect();
        clearInterval(pollInterval);
    };
  }, []);

  const subtotal = Object.values(cart || {}).reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const originalSubtotal = Object.values(cart || {}).reduce(
    (acc, item) => acc + (item.product.originalPrice || item.product.price) * item.quantity,
    0
  );

  const billBreakdown = calculateBill(subtotal, originalSubtotal, config, deliverySettings, selectedCoupon, coinsToRedeem);
  const { total } = billBreakdown;

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
        const response = await fetch(window.API_BASE_URL + "/api/orders", {
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
            deliveryLongitude: gpsCoords ? gpsCoords.longitude : null,
            couponId: billBreakdown.couponId,
            couponCode: billBreakdown.couponCode,
            couponDiscount: billBreakdown.couponDiscount,
            buyCoinsRedeemed: billBreakdown.buyCoinsRedeemed,
            buyCoinsDiscount: billBreakdown.buyCoinsDiscount,
            noBagPledge: localStorage.getItem("buyto_no_bag_pledge") === "true",
            addressId: localStorage.getItem("buyto_selected_address_id") || null
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
        const response = await fetch(window.API_BASE_URL + "/api/payment/create-order", {
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
            deliveryLongitude: gpsCoords ? gpsCoords.longitude : null,
            couponId: billBreakdown.couponId,
            couponCode: billBreakdown.couponCode,
            couponDiscount: billBreakdown.couponDiscount,
            buyCoinsRedeemed: billBreakdown.buyCoinsRedeemed,
            buyCoinsDiscount: billBreakdown.buyCoinsDiscount,
            noBagPledge: localStorage.getItem("buyto_no_bag_pledge") === "true",
            addressId: localStorage.getItem("buyto_selected_address_id") || null
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
              const verifyRes = await fetch(window.API_BASE_URL + "/api/payment/verify", {
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

  const handleNotifyMe = async () => {
    if (!waitlistEmail) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const savedUser = localStorage.getItem("buyto_user") ? JSON.parse(localStorage.getItem("buyto_user")) : null;
      const coords = savedUser?.coords || [13.628, 74.693];
      const res = await fetch(window.API_BASE_URL + "/api/auth/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name || "Guest User",
          email: waitlistEmail,
          phone: user.phone || "0000000000",
          address: user.location || "Central Address",
          latitude: coords[0],
          longitude: coords[1]
        })
      });

      if (res.ok) {
        setWaitlistSubmitted(true);
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to join waitlist");
      }
    } catch (err) {
      console.error(err);
      alert("Error joining waitlist");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
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
        {checkingServiceability ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <span style={{ fontSize: "24px" }}>🔄</span>
            <p style={{ marginTop: "12px", color: "#6b7280", fontWeight: "600" }}>Checking delivery zone serviceability...</p>
          </div>
        ) : !isAddressServiceable ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "48px" }}>📍</span>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", margin: "16px 0 8px 0" }}>Service Unavailable</h2>
              <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: "1.6", margin: 0 }}>
                We're currently expanding our services.<br />
                Buyto is not yet available in your area.
              </p>
              <p style={{ color: "#4b5563", fontSize: "14px", marginTop: "12px", fontWeight: "500" }}>
                Join our waitlist and we'll notify you when we launch nearby.
              </p>
            </div>

            {waitlistSubmitted ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "16px", textAlign: "center", color: "#16a34a", fontWeight: "700", marginBottom: "24px" }}>
                🎉 You're on the list! We will notify you as soon as we start deliveries here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                <input
                  type="email"
                  placeholder="Enter email to join waitlist"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    border: "1.5px solid #e5e7eb",
                    fontSize: "16px",
                    fontWeight: "500",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#f9fafb"
                  }}
                />
                <button
                  onClick={handleNotifyMe}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #FF4D4F 0%, #E03E40 100%)",
                    color: "white",
                    border: "none",
                    padding: "16px",
                    borderRadius: "16px",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(255, 77, 79, 0.2)"
                  }}
                >
                  Notify Me
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/details")}
              style={{
                width: "100%",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                padding: "16px",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Choose Another Address
            </button>
          </div>
        ) : (
          <>
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

        {/* Customer Retention: Coupons and BuyCoins */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Coupon Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "18px" }}>🎁</span>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "750", color: "#374151" }}>
                Apply Coupon
              </h3>
            </div>

            {/* FIRST20 Banner suggestion */}
            {activeCoupons.some(c => c.couponCode === "FIRST20") && subtotal >= 149 && !selectedCoupon && (
              <div
                style={{
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "1.5px solid #f59e0b",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 4px 15px rgba(245, 158, 11, 0.08)",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#b45309" }}>
                    🎉 FIRST20 Available
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#b45309", fontWeight: "600" }}>
                    Save ₹20 on this order
                  </p>
                </div>
                <button
                  onClick={() => {
                    const first20 = activeCoupons.find(c => c.couponCode === "FIRST20");
                    if (first20) setSelectedCoupon(first20, "payment");
                  }}
                  style={{
                    background: "#d97706",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontWeight: "750",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(217, 119, 6, 0.2)",
                  }}
                >
                  Apply Coupon
                </button>
              </div>
            )}
            
            {activeCoupons.length === 0 ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontStyle: "italic" }}>
                No active coupons available.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeCoupons.map((coupon) => {
                  const minVal = coupon.minimumOrderValue || coupon.minOrderValue || 149;
                  const isEligible = subtotal >= minVal;
                  const isApplied = selectedCoupon?._id === coupon._id;
                  return (
                    <div
                      key={coupon._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: isApplied ? "rgba(16, 185, 129, 0.05)" : "#f9fafb",
                        border: isApplied ? "1.5px solid #10b981" : "1px dashed #cbd5e1",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              background: "linear-gradient(135deg, #FF4D4F 0%, #E03E40 100%)",
                              color: "white",
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              letterSpacing: "0.5px"
                            }}
                          >
                            {coupon.couponCode}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1f2937" }}>
                            ₹{coupon.discountAmount} OFF
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", fontWeight: "500" }}>
                          Min Order: ₹{minVal} • Expires in: 48h
                        </div>
                      </div>
                      
                      {isApplied ? (
                        <button
                          onClick={() => setSelectedCoupon(null, "payment")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            fontWeight: "800",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          disabled={!isEligible}
                          onClick={() => setSelectedCoupon(coupon, "payment")}
                          style={{
                            background: isEligible ? "#318616" : "#e5e7eb",
                            color: isEligible ? "white" : "#9ca3af",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontWeight: "750",
                            fontSize: "12px",
                            cursor: isEligible ? "pointer" : "not-allowed",
                            transition: "all 0.15s ease"
                          }}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: 0 }} />

          {/* BuyCoins Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🪙</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "750", color: "#374151" }}>
                    Use BuyCoins
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                    Available: {userCoins} Coins (₹{userCoins})
                  </p>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  disabled={coinsToRedeem <= 0}
                  onClick={() => setCoinsToRedeem(prev => Math.max(0, prev - 1))}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    background: "white",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: coinsToRedeem <= 0 ? "not-allowed" : "pointer",
                    color: "#334155"
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: "14px", fontWeight: "750", color: "#1f2937", minWidth: "60px", textAlign: "center" }}>
                  {coinsToRedeem} Coins
                </span>
                <button
                  type="button"
                  disabled={coinsToRedeem >= Math.min(userCoins, 20)}
                  onClick={() => setCoinsToRedeem(prev => Math.min(Math.min(userCoins, 20), prev + 1))}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    background: "white",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: coinsToRedeem >= Math.min(userCoins, 20) ? "not-allowed" : "pointer",
                    color: "#334155"
                  }}
                >
                  +
                </button>
              </div>
            </div>
            {coinsToRedeem > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#16a34a",
                  fontWeight: "700",
                  background: "rgba(22, 163, 74, 0.05)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(22, 163, 74, 0.2)"
                }}
              >
                🎉 Redeeming ₹{billBreakdown.buyCoinsDiscount} discount! (Max 20 coins per order)
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ marginBottom: "28px" }}>
          <CartBillDetails billBreakdown={billBreakdown} />
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
          </>
        )}
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