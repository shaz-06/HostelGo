import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Preload the OrderTrackingPage component dynamically
const preloadOrderTrackingPage = () => {
  import("./OrderTrackingPage").catch(() => {});
};

// 1. Background Glow Component
const BackgroundGlow = ({ reducedMotion }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "450px",
        height: "450px",
        background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(255,255,255,0) 70%)",
        borderRadius: "50%",
        zIndex: 1,
        animation: reducedMotion ? "none" : "pulseGlow 4s ease-in-out infinite",
        opacity: 0,
        animationDelay: "150ms",
        animationFillMode: "forwards",
      }}
    />
  );
};

// 2. Animated Checkmark Component
const AnimatedCheckmark = ({ reducedMotion }) => {
  return (
    <div
      className="checkmark-container"
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "#22c55e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
        zIndex: 5,
        opacity: 0,
        transform: reducedMotion ? "scale(1)" : "scale(0.4)",
        animation: reducedMotion
          ? "fadeInOnly 400ms ease forwards"
          : "scaleCircle 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, circleGlowPulse 2.5s ease-in-out infinite 850ms",
        animationDelay: "250ms",
      }}
    >
      <svg
        width="38"
        height="28"
        viewBox="0 0 38 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 14L14 25L35 3"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: 60,
            animation: reducedMotion
              ? "drawTickStatic 300ms ease forwards"
              : "drawTick 400ms ease-out forwards, tickPop 450ms ease-in-out forwards 850ms",
            animationDelay: "600ms",
          }}
        />
      </svg>
    </div>
  );
};

// 3. Success Illustration Component (layered SVG + independent grocery animations)
const SuccessIllustration = ({ reducedMotion }) => {
  return (
    <div
      style={{
        position: "relative",
        width: "260px",
        height: "260px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 4,
        marginTop: "16px",
        opacity: 0,
        transform: reducedMotion ? "translateY(0)" : "translateY(40px)",
        animation: reducedMotion
          ? "fadeInOnly 450ms ease forwards 1000ms"
          : "slideUpBag 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1000ms, celebrateBag 3s ease-in-out infinite 1600ms",
      }}
    >
      <svg
        width="220"
        height="240"
        viewBox="0 0 220 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* Background groceries inside the bag */}
        
        {/* Greens / Wobble */}
        <g
          className="greens-group"
          style={{
            transformOrigin: "110px 130px",
            animation: reducedMotion ? "none" : "greensWobble 4s ease-in-out infinite 1200ms",
          }}
        >
          {/* Lettuce leaves */}
          <path d="M75 80C65 70 85 45 100 55C115 45 125 70 120 85C135 80 145 105 130 115C115 125 85 125 75 80Z" fill="#4ade80" />
          <path d="M90 90C85 80 98 62 108 70C118 62 124 80 120 92" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Juice Bottle / Upward Bounce */}
        <g
          className="juice-bottle"
          style={{
            transformOrigin: "60px 140px",
            animation: reducedMotion ? "none" : "juiceBounce 3s ease-in-out infinite 1200ms",
          }}
        >
          {/* Bottle body */}
          <path d="M50 140V100C50 90 60 85 65 85H75C80 85 90 90 90 100V140H50Z" fill="#fbbf24" />
          {/* Juice content */}
          <path d="M53 137V105C53 98 60 94 65 94H75C80 94 87 98 87 105V137H53Z" fill="#f59e0b" />
          {/* Label */}
          <rect x="56" y="108" width="28" height="18" rx="2" fill="white" />
          <circle cx="70" cy="117" r="4" fill="#fbbf24" />
          {/* Cap */}
          <rect x="63" y="79" width="14" height="6" rx="1.5" fill="#22c55e" />
        </g>

        {/* Milk Bottle / Tilt */}
        <g
          className="milk-bottle"
          style={{
            transformOrigin: "160px 140px",
            animation: reducedMotion ? "none" : "milkTilt 3.5s ease-in-out infinite 1200ms",
          }}
        >
          {/* Bottle body */}
          <path d="M145 140V95C145 88 152 82 158 82H168C174 82 181 88 181 95V140H145Z" fill="#f3f4f6" />
          <path d="M148 137V98C148 92 153 87 158 87H168C173 87 178 92 178 98V137H148Z" fill="#e5e7eb" />
          {/* Blue Label band */}
          <rect x="145" y="105" width="36" height="15" fill="#3b82f6" />
          <rect x="153" y="108" width="20" height="9" rx="1" fill="white" />
          {/* Cap */}
          <rect x="156" y="76" width="14" height="6" rx="1.5" fill="#22c55e" />
        </g>

        {/* Apple / Tiny Bounce */}
        <g
          className="apple-group"
          style={{
            transformOrigin: "110px 135px",
            animation: reducedMotion ? "none" : "appleBounce 2.5s ease-in-out infinite 1200ms",
          }}
        >
          {/* Apple Red Body */}
          <circle cx="108" cy="125" r="17" fill="#ef4444" />
          <circle cx="118" cy="125" r="16" fill="#dc2626" />
          {/* Leaf */}
          <path d="M112 108C112 103 118 100 120 102C122 104 118 108 112 108Z" fill="#22c55e" />
          <path d="M111 110L113 105" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Shopping Bag Front */}
        <g className="bag-front">
          {/* Main body of the bag */}
          <path d="M35 125L42 225C43 232 48 238 55 238H165C172 238 177 232 178 225L185 125H35Z" fill="#22c55e" />
          {/* Left shading / perspective */}
          <path d="M35 125L42 225C43 232 48 238 55 238H110V125H35Z" fill="#16a34a" />
          {/* Handles */}
          <path d="M75 125C75 105 100 105 100 125" stroke="#14532d" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M120 125C120 105 145 105 145 125" stroke="#14532d" strokeWidth="4.5" strokeLinecap="round" />
          {/* Logo text "Buyto" */}
          <text
            x="110"
            y="195"
            fill="white"
            fontSize="30"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="'Outfit', 'Inter', sans-serif"
            letterSpacing="-0.5px"
          >
            Buyto
          </text>
        </g>
      </svg>
    </div>
  );
};

// 4. Confetti Layer Component
const ConfettiLayer = ({ reducedMotion }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (reducedMotion) return;

    // Generate confetti pieces launched from both left and right sides
    const colors = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7", "#ec4899"];
    const temp = [];

    // Left side launcher (20 pieces)
    for (let i = 0; i < 20; i++) {
      const angle = -45 + (Math.random() * 30); // shoot diagonally right-up
      const distance = 150 + Math.random() * 150;
      temp.push({
        id: `l-${i}`,
        left: "10%",
        bottom: "20%",
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: Math.random() * 10 + 6,
        delay: Math.random() * 0.2,
        shape: Math.random() > 0.5 ? "circle" : "square",
        transformX: Math.cos(angle * Math.PI / 180) * distance,
        transformY: Math.sin(angle * Math.PI / 180) * distance - 100,
      });
    }

    // Right side launcher (20 pieces)
    for (let i = 0; i < 20; i++) {
      const angle = -135 - (Math.random() * 30); // shoot diagonally left-up
      const distance = 150 + Math.random() * 150;
      temp.push({
        id: `r-${i}`,
        right: "10%",
        bottom: "20%",
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: Math.random() * 10 + 6,
        delay: Math.random() * 0.2,
        shape: Math.random() > 0.5 ? "circle" : "square",
        transformX: Math.cos(angle * Math.PI / 180) * distance,
        transformY: Math.sin(angle * Math.PI / 180) * distance - 100,
      });
    }

    // Delayed trigger corresponding to 1400ms timeline
    const timer = setTimeout(() => {
      setParticles(temp);
    }, 1400);

    return () => clearTimeout(timer);
  }, [reducedMotion]);

  if (reducedMotion || particles.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 3,
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            right: p.right,
            bottom: p.bottom,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            opacity: 0,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall 2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
            animationDelay: `${p.delay}s`,
            "--tx": `${p.transformX}px`,
            "--ty": `${p.transformY}px`,
          }}
        />
      ))}
    </div>
  );
};

// 5. Floating Particles Decoration Component
const FloatingParticles = ({ reducedMotion }) => {
  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    if (reducedMotion) return;

    // Static coordinates and parameters around the bag area
    const list = [
      { id: 1, left: "25%", top: "35%", delay: "0s", duration: "4s", size: 8, content: "★", color: "#eab308" },
      { id: 2, left: "72%", top: "32%", delay: "1s", duration: "5s", size: 10, content: "✦", color: "#eab308" },
      { id: 3, left: "32%", top: "50%", delay: "0.5s", duration: "4.5s", size: 6, content: "●", color: "#22c55e" },
      { id: 4, left: "68%", top: "54%", delay: "1.5s", duration: "4.8s", size: 6, content: "●", color: "#fbbf24" },
      { id: 5, left: "20%", top: "45%", delay: "2s", duration: "6s", size: 12, content: "🍃", color: "#4ade80" },
      { id: 6, left: "80%", top: "40%", delay: "0.8s", duration: "5.5s", size: 12, content: "✦", color: "#22c55e" },
    ];

    // Trigger at 1500ms timeline
    const timer = setTimeout(() => {
      setDecorations(list);
    }, 1500);

    return () => clearTimeout(timer);
  }, [reducedMotion]);

  if (reducedMotion || decorations.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {decorations.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute",
            left: d.left,
            top: d.top,
            fontSize: `${d.size}px`,
            color: d.color,
            opacity: 0,
            animation: `floatDecorations ${d.duration} ease-in-out infinite`,
            animationDelay: d.delay,
          }}
        >
          {d.content}
        </div>
      ))}
    </div>
  );
};

// 6. Typography & Content Component
const SuccessContent = ({ reducedMotion }) => {
  return (
    <div
      style={{
        textAlign: "center",
        zIndex: 5,
        marginTop: "24px",
        padding: "0 24px",
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "900",
          color: "#14532d",
          margin: "0 0 12px 0",
          opacity: 0,
          transform: reducedMotion ? "translateY(0)" : "translateY(20px)",
          animation: reducedMotion
            ? "fadeInOnly 400ms ease forwards 1600ms"
            : "slideUpText 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          animationDelay: "1600ms",
        }}
      >
        Order Successfully Placed! 🎉
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: "15px",
          color: "#4b5563",
          lineHeight: "1.6",
          maxWidth: "320px",
          margin: "0 auto 24px auto",
          opacity: 0,
          animation: "fadeInOnly 500ms ease forwards",
          animationDelay: "1800ms",
        }}
      >
        Thank you for shopping with Buyto. We've received your order and it's being processed.
      </p>

      {/* Heart Update status indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          fontSize: "14px",
          fontWeight: "700",
          color: "#166534",
          opacity: 0,
          animation: "fadeInOnly 500ms ease forwards",
          animationDelay: "2000ms",
        }}
      >
        <span
          style={{
            color: "#22c55e",
            display: "inline-block",
            animation: reducedMotion ? "none" : "pulseHeart 2s ease-in-out infinite",
            animationDelay: "2000ms",
          }}
        >
          💚
        </span>{" "}
        We'll keep you updated!
      </div>
    </div>
  );
};

// 7. SuccessPage Main Container
export default function SuccessPage({ orderId: propOrderId }) {
  const navigate = useNavigate();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const startTimeRef = useRef(null);

  // Check prefers-reduced-motion media query
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const listener = (e) => setReducedMotion(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Determine active Order ID
  const activeOrderId = propOrderId || localStorage.getItem("latestOrderId");

  useEffect(() => {
    startTimeRef.current = performance.now();
    // Track Analytics: Success Page Viewed
    console.log("[Analytics] Success Page Viewed. Order ID:", activeOrderId);

    // Preload OrderTrackingPage bundle
    preloadOrderTrackingPage();

    // Trigger preloading API request if we have an ID
    if (activeOrderId) {
      const token = localStorage.getItem("buyto_token");
      fetch(window.API_BASE_URL + `/api/orders/track/${activeOrderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.ok) {
            console.log("[Preload] Successfully preloaded order tracking data.");
          }
        })
        .catch((e) => console.warn("[Preload] Failed to preload tracking API:", e));
    }

    // Set timeline triggers
    const redirectTimer = setTimeout(() => {
      // 3000 ms: Fade the entire screen
      setIsFadingOut(true);
    }, 3000);

    const navTimer = setTimeout(() => {
      // 3200 ms: Navigate to Order Tracking
      if (activeOrderId) {
        const duration = performance.now() - startTimeRef.current;
        console.log("[Analytics] Auto Redirect Success. Duration:", duration.toFixed(0), "ms");
        navigate(`/track-order/${activeOrderId}`);
      } else {
        console.error("[Failsafe] No active orderId found for redirection!");
        setRedirectFailed(true);
      }
    }, 3200);

    return () => {
      clearTimeout(redirectTimer);
      clearTimeout(navTimer);
    };
  }, [activeOrderId, navigate]);

  const handleManualRedirect = () => {
    if (activeOrderId) {
      console.log("[Analytics] Manual Redirect Clicked.");
      navigate(`/track-order/${activeOrderId}`);
    } else {
      alert("No active order details found. Please check My Orders page.");
      navigate("/orders");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        overflow: "hidden",
        opacity: isFadingOut ? 0 : 1,
        transition: "opacity 200ms ease-in-out",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      {/* Styles Injection block for CSS Keyframes */}
      <style>{`
        @keyframes scaleCircle {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawTick {
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawTickStatic {
          to { stroke-dashoffset: 0; }
        }
        @keyframes tickPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes circleGlowPulse {
          0% { box-shadow: 0 8px 24px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 8px 32px rgba(34,197,94,0.6); }
          100% { box-shadow: 0 8px 24px rgba(34,197,94,0.3); }
        }
        @keyframes pulseGlow {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.25; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.40; }
          100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.25; }
        }
        @keyframes slideUpBag {
          0% { transform: translateY(40px) scale(0.92); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes celebrateBag {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.03) rotate(-2deg); }
          40% { transform: scale(1.03) rotate(2deg); }
          60% { transform: scale(1) rotate(0deg); }
        }
        @keyframes juiceBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes milkTilt {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes greensWobble {
          0%, 100% { transform: rotate(0deg) skewX(0deg); }
          50% { transform: rotate(-3deg) skewX(-2deg); }
        }
        @keyframes appleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slideUpText {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInOnly {
          to { opacity: 1; }
        }
        @keyframes pulseHeart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes confettiFall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(720deg); opacity: 0; }
        }
        @keyframes floatDecorations {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-40px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* Decorative pulse background */}
      <BackgroundGlow reducedMotion={reducedMotion} />

      {/* Success check circle */}
      <AnimatedCheckmark reducedMotion={reducedMotion} />

      {/* Celebration Bag SVG illustration */}
      <SuccessIllustration reducedMotion={reducedMotion} />

      {/* Floating particles stars/leaves */}
      <FloatingParticles reducedMotion={reducedMotion} />

      {/* Confetti launchers */}
      <ConfettiLayer reducedMotion={reducedMotion} />

      {/* Text headings and content */}
      <SuccessContent reducedMotion={reducedMotion} />

      {/* Failsafe layout in case routing fails */}
      {redirectFailed && (
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleManualRedirect}
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(34,197,94,0.2)",
            }}
          >
            View Order Tracking
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Retry Redirect
          </button>
        </div>
      )}
    </div>
  );
}