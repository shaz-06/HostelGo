import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMessaging, onMessage } from "firebase/messaging";
import { app } from "../../config/firebase";

// Setup styles for priority colors
const PRIORITY_STYLES = {
  order_update: {
    badgeColor: "#10b981", // Green
    badgeText: "🟢 Order Update",
    accentColor: "#10b981"
  },
  offer: {
    badgeColor: "#fbbf24", // Yellow/Gold
    badgeText: "🎁 Special Offer",
    accentColor: "#fbbf24"
  },
  security: {
    badgeColor: "#ef4444", // Red
    badgeText: "🚨 Security",
    accentColor: "#ef4444"
  },
  announcement: {
    badgeColor: "#3b82f6", // Blue
    badgeText: "📢 Announcement",
    accentColor: "#3b82f6"
  },
  default: {
    badgeColor: "#6b7280", // Gray
    badgeText: "💬 Message",
    accentColor: "#10b981" // Buyto Green as fallback
  }
};

export default function ForegroundNotificationBanner() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [activeNotification, setActiveNotification] = useState(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5000);
  
  const timerRef = useRef(null);
  const lastTimeRef = useRef(null);
  const isHoveredRef = useRef(false);
  const recentIdsRef = useRef(new Map()); // cache of messageId/content-hash -> timestamp

  // Touch/Swipe gestures state
  const dragStartY = useRef(0);
  const dragY = useRef(0);
  const [translateY, setTranslateY] = useState(0);

  // Initialize FCM onMessage listener
  useEffect(() => {
    let unsubscribe = null;
    try {
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("[ForegroundNotificationBanner] Foreground push received:", payload);

        // Deduplication using messageId or payload messageId
        const messageId = payload.messageId || payload.fcmMessageId || `${payload.notification?.title}:${payload.notification?.body}`;
        
        // Clean old IDs (older than 30s)
        const now = Date.now();
        recentIdsRef.current.forEach((timestamp, id) => {
          if (now - timestamp > 30000) {
            recentIdsRef.current.delete(id);
          }
        });

        if (recentIdsRef.current.has(messageId)) {
          console.warn("[ForegroundNotificationBanner] Duplicate notification detected. Skipping:", messageId);
          return;
        }

        recentIdsRef.current.set(messageId, now);

        // Parse notification properties
        const title = payload.notification?.title || "Notification";
        const body = payload.notification?.body || "";
        const image = payload.notification?.imageUrl || payload.data?.image || payload.data?.imageUrl || null;
        const deepLink = payload.data?.deepLink || payload.data?.ctaLink || null;
        const ctaText = payload.data?.ctaText || "View";
        
        // Determine Priority / Type mapping
        let typeKey = "default";
        const payloadType = String(payload.data?.type || "").toLowerCase();
        if (payloadType.includes("order")) typeKey = "order_update";
        else if (payloadType.includes("offer") || payloadType.includes("promo")) typeKey = "offer";
        else if (payloadType.includes("security") || payloadType.includes("alert")) typeKey = "security";
        else if (payloadType.includes("announcement")) typeKey = "announcement";

        const newNotification = {
          id: messageId,
          title,
          body,
          image,
          deepLink,
          ctaText,
          typeKey
        };

        setQueue((prevQueue) => [...prevQueue, newNotification]);
      });
    } catch (err) {
      console.warn("[ForegroundNotificationBanner] Firebase messaging not supported or failed to init onMessage:", err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Process the queue
  useEffect(() => {
    if (!activeNotification && queue.length > 0) {
      const nextNotification = queue[0];
      setQueue((prev) => prev.slice(1));
      setActiveNotification(nextNotification);
      setIsDismissing(false);
      setTimeRemaining(5000);
      setTranslateY(0);
      dragY.current = 0;
    }
  }, [queue, activeNotification]);

  // Handle countdown timer (with pause on hover)
  useEffect(() => {
    if (!activeNotification || isDismissing) return;

    lastTimeRef.current = Date.now();
    
    const step = () => {
      if (isHoveredRef.current) {
        // Pause timer: keep resetting lastTimeRef to keep diff at 0
        lastTimeRef.current = Date.now();
        timerRef.current = requestAnimationFrame(step);
        return;
      }

      const now = Date.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setTimeRemaining((prev) => {
        const next = prev - elapsed;
        if (next <= 0) {
          triggerDismiss();
          return 0;
        }
        return next;
      });

      timerRef.current = requestAnimationFrame(step);
    };

    timerRef.current = requestAnimationFrame(step);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [activeNotification, isDismissing]);

  const triggerDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setActiveNotification(null);
      setIsDismissing(false);
    }, 300); // match fade-out animation length
  };

  const handleBannerClick = (e) => {
    // If clicked on close button, do not navigate
    if (e.target.closest(".close-btn")) {
      return;
    }

    if (activeNotification?.deepLink) {
      navigate(activeNotification.deepLink);
    } else {
      console.warn("[ForegroundNotificationBanner] Clicked but no valid deepLink found.");
    }
    triggerDismiss();
  };

  // Drag / Touch handlers for swiping up to dismiss
  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    isHoveredRef.current = true; // Pause timer during touch
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diffY = currentY - dragStartY.current;
    
    // Only allow swiping UP (negative diffY)
    if (diffY < 0) {
      dragY.current = diffY;
      setTranslateY(diffY);
    }
  };

  const handleTouchEnd = () => {
    isHoveredRef.current = false; // Resume timer
    if (dragY.current < -60) {
      // Swipe threshold met: dismiss
      triggerDismiss();
    } else {
      // Revert position
      setTranslateY(0);
      dragY.current = 0;
    }
  };

  if (!activeNotification) return null;

  const priorityMeta = PRIORITY_STYLES[activeNotification.typeKey] || PRIORITY_STYLES.default;
  const hasImage = !!activeNotification.image;

  return (
    <div
      role={activeNotification.typeKey === "security" ? "alert" : "status"}
      aria-live="polite"
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleBannerClick}
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        width: "calc(100% - 40px)",
        maxWidth: "480px",
        zIndex: 999999,
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: `1.5px solid ${priorityMeta.accentColor}40`, // 25% opacity accent border
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)",
        cursor: activeNotification.deepLink ? "pointer" : "default",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: isDismissing 
          ? "opacity 0.25s ease-out, transform 0.25s ease-out" 
          : "transform 0.1s linear, opacity 0.3s ease-out",
        opacity: isDismissing ? 0 : 1,
        animation: isDismissing ? "none" : "notificationSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Top Header details */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "800",
            color: "white",
            backgroundColor: priorityMeta.badgeColor,
            padding: "3px 8px",
            borderRadius: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}
        >
          {priorityMeta.badgeText}
        </span>
        <button
          className="close-btn"
          onClick={(e) => {
            e.stopPropagation();
            triggerDismiss();
          }}
          aria-label="Dismiss notification"
          style={{
            border: "none",
            background: "rgba(0, 0, 0, 0.06)",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#4b5563",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            transition: "background 0.2s ease"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(0, 0, 0, 0.12)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(0, 0, 0, 0.06)"}
        >
          ×
        </button>
      </div>

      {/* Main Body content */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {hasImage && (
          <img
            src={activeNotification.image}
            alt=""
            onError={(e) => {
              // Hide image container on error to keep layout stable
              e.target.style.display = "none";
            }}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "10px",
              objectFit: "cover",
              flexShrink: 0,
              backgroundColor: "rgba(0, 0, 0, 0.05)"
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "850",
              color: "#0f172a",
              lineHeight: "1.3",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {activeNotification.title}
          </h4>
          <p
            style={{
              margin: "3px 0 0 0",
              fontSize: "12.5px",
              fontWeight: "600",
              color: "#475569",
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {activeNotification.body}
          </p>
        </div>

        {/* CTA Button if link present */}
        {activeNotification.deepLink && (
          <span
            style={{
              alignSelf: "center",
              background: priorityMeta.accentColor,
              color: "white",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "12.5px",
              fontWeight: "800",
              boxShadow: `0 4px 10px ${priorityMeta.accentColor}30`,
              flexShrink: 0
            }}
          >
            {activeNotification.ctaText}
          </span>
        )}
      </div>

      {/* CSS Animation declaration */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes notificationSlideDown {
          0% {
            transform: translate(-50%, -40px);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
}
