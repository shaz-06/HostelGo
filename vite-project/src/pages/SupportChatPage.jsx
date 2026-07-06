import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

export default function SupportChatPage() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [chatSession, setChatSession] = useState(null);
  const [localMessages, setLocalMessages] = useState([
    {
      senderName: "Buyto BOT",
      role: "bot",
      message: "Hello! 👋 Welcome to Buyto Instant Support. How can we help you today?",
      timestamp: new Date()
    }
  ]);
  const [queueInfo, setQueueInfo] = useState(null);
  const [isBotOptionsActive, setIsBotOptionsActive] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCheckingAssociate, setIsCheckingAssociate] = useState(false);

  // UI States
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [availability, setAvailability] = useState(null);

  const [ellipsis, setEllipsis] = useState(".");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const supportStatus = chatSession?.status;

  const chatContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll event handler to track if user is near bottom
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      120;

    setShouldAutoScroll(isNearBottom);

    if (isNearBottom) {
      setShowNewMessageIndicator(false);
    }
  };

  // Scroll to bottom click handler for floating button
  const handleScrollToBottomClick = () => {
    setShouldAutoScroll(true);
    scrollToBottom();
    setShowNewMessageIndicator(false);
  };

  // Auto-scroll logic depending on user scroll position
  useEffect(() => {
    const messageCount = localMessages.length;
    const isNewMessage = messageCount > prevMessageCountRef.current;
    prevMessageCountRef.current = messageCount;

    if (isNewMessage) {
      if (shouldAutoScroll) {
        scrollToBottom();
        setShowNewMessageIndicator(false);
      } else {
        // Show indicator when scrolled up and new message arrives
        setShowNewMessageIndicator(true);
      }
    }
  }, [localMessages, shouldAutoScroll]);

  // Animated searching text ellipsis cycle
  useEffect(() => {
    if (!["connecting", "waiting"].includes(supportStatus)) return;
    const timer = setInterval(() => {
      setEllipsis((prev) => (prev.length >= 5 ? "." : prev + "."));
    }, 500);
    return () => clearInterval(timer);
  }, [supportStatus]);

  // Reset scroll container to top on mount
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: 0,
      behavior: "instant"
    });
    setShouldAutoScroll(false);
  }, []);

  // Load customer's active session on mount
  useEffect(() => {
    document.title = "Chat With Us";
    if (!token) {
      navigate("/login", { state: { from: { pathname: "/support/chat" } } });
      return;
    }

    const checkActiveSession = async () => {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/support/queue", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Customer has an active waitlisted or connected session
          fetchSessionDetails();
        }
      } catch (err) {
        console.error("Support: Failed to fetch active queue stats:", err);
      }
    };

    checkActiveSession();

    // Fetch recent orders for bot
    fetch(window.API_BASE_URL + "/api/orders/my-orders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setRecentOrders(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Support: Error loading orders:", err));
  }, [token]);

  const fetchSessionDetails = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChatSession(data.chat);
        setLocalMessages(data.chat.messages);
        setIsBotOptionsActive(false);
        setAvailability(data.availability || null);
        setQueueInfo(data.chat.status === "waiting" ? {
          queuePosition: data.chat.queuePosition,
          estimatedWaitTime: data.chat.queuePosition * 3
        } : null);
        initializeSocket(data.chat._id);
      }
    } catch (err) {
      console.error("Support: Failed to fetch active session details:", err);
    }
  };

  // Socket.IO Initialization
  const initializeSocket = (chatId) => {
    if (socketRef.current) return;

    const socket = io(window.API_BASE_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Support Socket connected. Joining Support Room:", chatId);
      socket.emit("joinSupportRoom", chatId);
    });

    socket.on("newSupportMessage", (msg) => {
      console.log("🔌 Socket: New message received:", msg);
      setLocalMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some(m => m._id === msg._id || (m.timestamp === msg.timestamp && m.message === msg.message))) {
          return prev;
        }
        return [...prev, msg];
      });
    });

    socket.on("supportConnected", (data) => {
      console.log("🔌 Socket: Associate connected:", data);
      setChatSession(data.chat);
      setLocalMessages(data.chat.messages);
      setPartnerName(data.adminName);
      setQueueInfo(null);
    });

    socket.on("queuePositionUpdated", (data) => {
      console.log("🔌 Socket: Queue position updated:", data);
      setQueueInfo(data);
      setChatSession((prev) => prev ? { ...prev, status: "waiting", queuePosition: data.queuePosition } : prev);
    });

    socket.on("supportWaiting", (data) => {
      setChatSession(data.chat);
      setLocalMessages(data.chat.messages);
      setQueueInfo({
        queuePosition: data.queuePosition,
        estimatedWaitTime: data.estimatedWaitTime
      });
    });

    socket.on("associateAvailabilityChanged", (data) => {
      setAvailability(data);
    });

    socket.on("supportTypingUpdated", (data) => {
      if (data.role === "admin") {
        setPartnerTyping(data.isTyping);
      }
    });

    socket.on("supportClosed", (data) => {
      console.log("🔌 Socket: Support closed by associate:", data);
      setChatSession(data.chat);
      setLocalMessages(data.chat.messages);
      setPartnerTyping(false);
      setQueueInfo(null);
      setShowRatingModal(data.reason !== "inactivity");
    });

    socket.on("disconnect", () => {
      console.log("🔌 Support Socket disconnected.");
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Shared MongoDB Document Synchronizer (Polling Backup Loop)
  useEffect(() => {
    if (!chatSession?._id || chatSession.status === "closed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(window.API_BASE_URL + `/api/support/chat/${chatSession._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.chat) {
            setChatSession(data.chat);
            setLocalMessages(data.chat.messages || []);
            if (data.chat.status === "active" && data.chat.messages) {
              const joinMsg = data.chat.messages.find(m => m.message.includes("joined the conversation") || m.message.includes("Associate Connected"));
              if (joinMsg) {
                setPartnerName("Associate");
              }
            }
            if (data.chat.status === "closed") {
              setShowRatingModal(true);
              clearInterval(interval);
            }
          }
        }
      } catch (err) {
        console.error("Support Sync: Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [chatSession?._id, chatSession?.status, token]);

  // Bot Click Handlers
  const handleBotOption = (option) => {
    setShouldAutoScroll(true);
    const userMsg = {
      senderName: user?.name || "Customer",
      role: "user",
      message: option,
      timestamp: new Date()
    };

    setLocalMessages(prev => [...prev, userMsg]);
    setIsBotOptionsActive(false);

    if (option === "Where is my order?") {
      if (recentOrders.length === 0) {
        addBotReply("You haven't placed any orders yet! Head back to the store to start shopping. 🛒", () => {
          setIsBotOptionsActive(true);
        });
      } else {
        addBotReply("Please select the order you want help with.", () => {
          setSelectedOrder("select");
        });
      }
    } else if (option === "Payment issue") {
      addBotReply("If your transaction failed but money was debited, it will be automatically refunded by your bank within 3-5 business days. For urgent billing issues or manual verifications, please click 'Chat with Associate'.", () => {
        setIsBotOptionsActive(true);
      });
    } else if (option === "Refund & cancellation") {
      addBotReply("You can cancel any order before it is packed for shipment directly from your Order History page to receive an instant refund to your original payment method. If the order is already shipped or delivered, please request help via an associate.", () => {
        setIsBotOptionsActive(true);
      });
    } else if (option === "Product issue") {
      addBotReply("We are sorry to hear you're facing issues with a product. If it is defective, incorrect, or missing parts, we can help arrange a replacement or refund. Please connect with an associate to resolve this quickly.", () => {
        setIsBotOptionsActive(true);
      });
    } else if (option === "Account issue") {
      addBotReply("For issues related to updating phone numbers, emails, passwords, addresses, or account access, please select 'Chat with Associate' for security verification and assistance.", () => {
        setIsBotOptionsActive(true);
      });
    } else if (option === "Chat with Associate") {
      connectToLiveSupport();
    }
  };

  const handleSelectOrderForBot = (order) => {
    setShouldAutoScroll(true);
    setSelectedOrder(null);
    const userMsg = {
      senderName: user?.name || "Customer",
      role: "user",
      message: `Help with Order #${order._id.slice(-6)}`,
      timestamp: new Date()
    };
    setLocalMessages(prev => [...prev, userMsg]);

    addBotReply(`Order #${order._id.slice(-6)} status is currently "${order.orderStatus}". Estimated delivery speed is superfast. If you need special delivery adjustments, please click 'Chat with Associate' below.`, () => {
      setIsBotOptionsActive(true);
    });
  };

  const addBotReply = (text, onComplete) => {
    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      const botReply = {
        senderName: "Buyto BOT",
        role: "bot",
        message: text,
        timestamp: new Date()
      };
      setLocalMessages(prev => [...prev, botReply]);
      if (onComplete) onComplete();
    }, 1800);
  };

  const handleReconnect = () => {
    setShouldAutoScroll(true);
    connectToLiveSupport();
  };

  // Convert Bot session to Live Support waitlist
  const connectToLiveSupport = async () => {
    setShouldAutoScroll(true);
    if (!navigator.onLine) {
      addBotReply("⚠️ You appear to be offline. Please check your internet connection.");
      setIsBotOptionsActive(true);
      return;
    }

    setIsCheckingAssociate(true);
    addBotReply("🔄 Checking live associate availability...");

    console.log("Checking associate availability...");
    console.log("API URL:", window.API_BASE_URL);

    try {
      const statusRes = await fetch(window.API_BASE_URL + "/api/chat/associate/status", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!statusRes.ok) {
        throw new Error("Support service is temporarily unavailable. Please try again in a few minutes.");
      }

      const statusData = await statusRes.json();

      if (statusData.available) {
        addBotReply("✅ Connecting you with a live associate...");
      } else {
        addBotReply("⚠️ No associates are available right now. Please leave your message and we'll get back to you soon.");
      }

      const res = await fetch(window.API_BASE_URL + "/api/support/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setChatSession(data.chat);
        setLocalMessages(data.chat.messages);
        setAvailability(data.availability || null);
        setQueueInfo(data.chat.status === "waiting" ? {
          queuePosition: data.chat.queuePosition,
          estimatedWaitTime: data.chat.queuePosition * 3
        } : null);
        initializeSocket(data.chat._id);
        setIsBotOptionsActive(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        const message = errData.message || "Support service is temporarily unavailable. Please try again in a few minutes.";
        addBotReply(`⚠️ ${message}`);
        setIsBotOptionsActive(true);
      }
    } catch (error) {
      console.error("Associate Chat Error:", error);
      const message = error?.message || "Support service is temporarily unavailable. Please try again in a few minutes.";
      addBotReply(`⚠️ ${message}`);
      setIsBotOptionsActive(true);
    } finally {
      setIsCheckingAssociate(false);
    }
  };

  // Send human message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !chatSession) return;

    setShouldAutoScroll(true);
    const messageText = inputMessage.trim();
    setInputMessage("");

    // Cancel active typing status
    if (socketRef.current) {
      socketRef.current.emit("supportTyping", {
        chatId: chatSession._id,
        isTyping: false,
        senderName: user.name,
        role: "user"
      });
      socketRef.current.emit("supportTypingPreview", {
        chatId: chatSession._id,
        text: "",
        senderName: user.name
      });
    }

    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: chatSession._id,
          message: messageText
        })
      });
      if (!res.ok) {
        console.error("Support API: Message failed to send via REST API");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live Typing Indicators
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    if (!chatSession) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit("supportTyping", {
        chatId: chatSession._id,
        isTyping: true,
        senderName: user.name,
        role: "user"
      });
    }

    // Keystroke typing preview
    socketRef.current?.emit("supportTypingPreview", {
      chatId: chatSession._id,
      text: val,
      senderName: user.name
    });

    // Timeout to clear typing state
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("supportTyping", {
        chatId: chatSession._id,
        isTyping: false,
        senderName: user.name,
        role: "user"
      });
    }, 1500);
  };

  // Close and Rate Session
  const handleCloseSession = async () => {
    if (!chatSession) return;
    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: chatSession._id
        })
      });
      if (res.ok) {
        setShowRatingModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitRatingFeedback = async () => {
    try {
      await fetch(window.API_BASE_URL + "/api/support/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: chatSession._id,
          rating,
          feedback
        })
      });
      setShowRatingModal(false);
      setChatSession(null);
      setQueueInfo(null);
      setIsBotOptionsActive(true);
      setLocalMessages([
        {
          senderName: "Buyto Bot",
          role: "bot",
          message: "Thank you for your rating! Welcoming you back to Buyto Support. Let us know if you need anything else.",
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <div style={chatConsoleStyle}>
        {/* Hide Scrollbars and premium animations Global CSS injection */}
        <style>{`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }
          @keyframes slideUpFade {
            0% {
              opacity: 0;
              transform: translateY(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .typing-dot {
            width: 7px;
            height: 7px;
            background: #318616;
            border-radius: 50%;
            display: inline-block;
            animation: bounce 1.0s infinite ease-in-out;
          }
          .typing-dot:nth-child(2) {
            animation-delay: 0.15s;
          }
          .typing-dot:nth-child(3) {
            animation-delay: 0.3s;
          }
          .message-animate {
            animation: slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes spinHourglass {
            0% {
              transform: rotate(0deg);
            }
            25% {
              transform: rotate(180deg);
            }
            50% {
              transform: rotate(180deg);
            }
            75% {
              transform: rotate(360deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          @keyframes connectionSpin {
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes pulseLive {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.55;
              transform: scale(0.86);
            }
          }
          @keyframes searchingBounce {
            0%, 100% {
              transform: translateY(0);
              background: #f97316;
            }
            50% {
              transform: translateY(-8px);
              background: #22c55e;
            }
          }
          .system-searching-dot {
            width: 10px;
            height: 10px;
            background: #f97316;
            border-radius: 50%;
            display: inline-block;
            animation: searchingBounce 1.2s infinite ease-in-out;
          }
          .system-searching-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .system-searching-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
          .hourglass-spin {
            display: inline-block;
            animation: spinHourglass 3.0s infinite cubic-bezier(0.77, 0, 0.175, 1);
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .chip-button {
            background: white;
            border: 1px solid rgba(49, 134, 22, 0.15);
            color: #111827;
            padding: 8px 14px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .chip-button:hover {
            background: linear-gradient(135deg, #318616, #4ca728);
            color: white;
            border-color: transparent;
            transform: translateY(-2px);
          }
        `}</style>

        {/* CHAT CONSOLE HEADER */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{
              ...logoBadgeStyle,
              background: (chatSession?.status === "active" || chatSession?.status === "waiting" || chatSession?.status === "connecting")
                ? "#dcfce7"
                : "rgba(255, 255, 255, 0.2)",
              color: (chatSession?.status === "active" || chatSession?.status === "waiting" || chatSession?.status === "connecting")
                ? "#15803d"
                : "white",
              backdropFilter: (chatSession?.status === "active" || chatSession?.status === "waiting" || chatSession?.status === "connecting")
                ? "none"
                : "blur(10px)",
              WebkitBackdropFilter: (chatSession?.status === "active" || chatSession?.status === "waiting" || chatSession?.status === "connecting")
                ? "none"
                : "blur(10px)"
            }}>
              {chatSession?.status === "active" 
                ? "🟢 Active" 
                : chatSession?.status === "waiting" || chatSession?.status === "connecting" 
                  ? "🟠 Waiting" 
                  : "⚫ Closed"}
            </span>
            <div>
              <h2 style={headerTitleStyle}>Chat With Us</h2>
              <span style={headerSubtitleStyle}>
                {chatSession?.status === "active"
                  ? `Connected with ${partnerName || "Associate"}`
                  : chatSession?.status === "connecting"
                    ? "Connecting to associate"
                    : chatSession?.status === "waiting"
                      ? `Live queue${availability?.availableCount ? ` · ${availability.availableCount} online` : ""}`
                      : "Automated Help Bot"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {chatSession && chatSession.status !== "closed" && (
              <button onClick={handleCloseSession} style={endChatBtnStyle}>
                Close Chat
              </button>
            )}
            <button onClick={() => navigate("/help")} style={closeConsoleBtnStyle}>
              Exit
            </button>
          </div>
        </div>

        {/* GREEN BANNER IF ACTIVE */}
        {chatSession?.status === "active" && (
          <div style={greenBannerStyle}>
            <div style={{ fontWeight: "850", fontSize: "13px", marginBottom: "2px" }}>
              🟢 Associate Connected
            </div>
            <div style={{ fontSize: "11px", fontWeight: "600", opacity: 0.9 }}>
              Please reply within 2 minutes to stay connected.
            </div>
          </div>
        )}

        {/* MESSAGES DISPLAY SCROLL AREA */}
        <div ref={chatContainerRef} onScroll={handleScroll} style={messagesWindowStyle}>

          {localMessages.map((msg, index) => {
            const isBot = msg.role === "bot";
            const isSelf = msg.role === "user";

            const isSystem = msg.senderName === "System" || (isBot && (
              msg.message.includes("joined the chat") || 
              msg.message.includes("ended due to inactivity") || 
              msg.message.includes("ended the conversation") ||
              msg.message.includes("joined the conversation") ||
              msg.message.includes("Associate Connected")
            ));
            
            // If it's a System or Timeout notification, render a centered system alert
            if (isSystem) {
              return (
                <div
                  key={index}
                  className="message-animate"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "16px 0",
                  }}
                >
                  <div
                    style={{
                      background: "#fffbeb",
                      color: "#78350f",
                      fontSize: "12px",
                      fontWeight: "600",
                      borderRadius: "10px",
                      padding: "8px 18px",
                      textAlign: "center",
                      maxWidth: "85%",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      border: "1px solid #fef3c7"
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="message-animate"
                style={{
                  display: "flex",
                  justifyContent: isSelf ? "flex-end" : "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    background: isSelf
                      ? "#d9fdd3"
                      : isBot
                        ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(49, 134, 22, 0.08))"
                        : "#ffffff",
                    color: "#111b21",
                    borderRadius: "16px",
                    borderTopRightRadius: isSelf ? "2px" : "16px",
                    borderTopLeftRadius: !isSelf ? "2px" : "16px",
                    padding: "10px 14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: isSelf ? "none" : isBot ? "none" : "1px solid #e5e7eb",
                    borderLeft: isBot ? "4px solid #318616" : (isSelf ? "none" : "1px solid #e5e7eb"),
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  <div style={{
                    fontWeight: isBot ? "700" : "750",
                    fontSize: "11px",
                    opacity: isBot ? 1 : 0.8,
                    marginBottom: "4px",
                    color: isSelf ? "#15803d" : (isBot ? "#318616" : "#0284c7")
                  }}>
                    {msg.senderName}
                  </div>
                  <div>{msg.message}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontSize: "9px", opacity: 0.5, marginTop: "4px" }}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isSelf && <span style={{ color: "#53bdeb", fontWeight: "bold" }}>✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {isBotTyping && (
            <div
              className="message-animate"
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(49, 134, 22, 0.08))",
                  color: "#111b21",
                  borderRadius: "16px",
                  borderTopLeftRadius: "2px",
                  padding: "10px 14px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  borderLeft: "4px solid #318616",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "11px", marginBottom: "6px", color: "#318616" }}>
                  Buyto BOT
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {/* BOT SELECTABLE ORDER LIST AREA */}
          {selectedOrder === "select" && (
            <div style={orderSelectContainerStyle}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#4b5563" }}>Select an order:</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recentOrders.slice(0, 3).map((order) => (
                  <div
                    key={order._id}
                    onClick={() => handleSelectOrderForBot(order)}
                    style={orderSelectCardStyle}
                  >
                    <span>📦 Order #{order._id.slice(-6)}</span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>₹{order.totalAmount} • {order.orderStatus}</span>
                  </div>
                ))}
                <button onClick={() => setSelectedOrder(null)} style={cancelSelectBtnStyle}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PARTNER TYPING INDICATOR */}
          {partnerTyping && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
              <div style={typingBubbleStyle}>
                <span style={{ fontWeight: "700" }}>{partnerName || "Associate"} is typing</span>
                <span className="dot-pulse">...</span>
              </div>
            </div>
          )}

          {/* BOT SELECTABLE CHIPS CONTROLS */}
          {isBotOptionsActive && (
            <div style={chipsContainerStyle}>
              <h4 style={chipsHeadingStyle}>Suggested Questions</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  "Where is my order?",
                  "Payment issue",
                  "Refund & cancellation",
                  "Product issue",
                  "Account issue",
                  "Chat with Associate"
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleBotOption(option)}
                    className="chip-button"
                    disabled={isCheckingAssociate}
                    style={{
                      opacity: isCheckingAssociate ? 0.6 : 1,
                      cursor: isCheckingAssociate ? "not-allowed" : "pointer"
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CONNECTING & QUEUE LOADING PANEL */}
          {(chatSession?.status === "connecting" || chatSession?.status === "waiting") && (
            <div style={queuePanelStyle} className="message-animate">
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                <span className="system-searching-dot" />
                <span className="system-searching-dot" />
                <span className="system-searching-dot" />
              </div>
              
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: "#1f2937" }}>
                Associate is busy with another user, please wait {ellipsis}
              </h3>

              {chatSession.status === "waiting" && queueInfo && (
                <div
                  key={queueInfo.queuePosition}
                  className="message-animate"
                  style={{
                    background: "#F9FAFB",
                    borderRadius: "14px",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>Queue Position</span>
                    <div style={{ fontSize: "18px", fontWeight: "850", color: "#f97316", marginTop: "2px" }}>
                      #{queueInfo.queuePosition}
                    </div>
                  </div>
                  <div style={{ width: "1px", height: "30px", background: "#e5e7eb" }} />
                  <div>
                    <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>Est. Wait Time</span>
                    <div style={{ fontSize: "18px", fontWeight: "850", color: "#111827", marginTop: "2px" }}>
                      {queueInfo.estimatedWaitTime} min{queueInfo.estimatedWaitTime > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => navigate("/")} style={comeBackLaterBtnStyle}>
                Come back later
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* FLOATING NEW MESSAGE INDICATOR */}
        {showNewMessageIndicator && (
          <button
            onClick={handleScrollToBottomClick}
            style={{
              position: "absolute",
              bottom: "74px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#318616",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: "0 4px 15px rgba(49, 134, 22, 0.35)",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              animation: "slideUpFade 0.25s ease-out"
            }}
          >
            ⬇️ New Messages
          </button>
        )}

        {/* BOTTOM MESSAGE INPUT BAR - ACTIVE IN WAITING & CONNECTING & ACTIVE */}
        {chatSession && ["active", "waiting", "connecting"].includes(chatSession.status) && (
          <form onSubmit={handleSendMessage} style={inputFormStyle}>
            <input
              type="text"
              placeholder="Type your message here..."
              value={inputMessage}
              onChange={handleInputChange}
              style={textInputStyle}
            />
            <button type="submit" style={{ ...sendBtnStyle, background: "#318616", boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)" }}>
              Send 🚀
            </button>
          </form>
        )}

        {/* BOTTOM MESSAGE INPUT BAR - DISABLED IF CLOSED */}
        {chatSession && chatSession.status === "closed" && (
          <div>
            <div style={{ ...inputFormStyle, opacity: 0.6, pointerEvents: "none" }}>
              <input
                type="text"
                placeholder="Chat has ended. Message box is disabled."
                disabled
                style={{ ...textInputStyle, background: "#f3f4f6" }}
              />
              <button disabled style={{ ...sendBtnStyle, background: "#9ca3af" }}>
                Send 🚀
              </button>
            </div>
            
            <div style={reconnectContainerStyle}>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", color: "#4b5563", textAlign: "center" }}>
                {localMessages[localMessages.length - 1]?.message === "Chat session ended due to inactivity." 
                  ? "Chat session ended due to inactivity." 
                  : "Associate has ended the conversation."}
              </p>
              <button onClick={handleReconnect} style={reconnectBtnStyle}>
                Reconnect with Associate 🔌
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 5-STAR RATING & FEEDBACK OVERLAY MODAL */}
      {showRatingModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "850", color: "#111827", textAlign: "center" }}>
              How was your chat? 🌟
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#6b7280", textAlign: "center", fontWeight: "600" }}>
              Please rate your experience with {partnerName || "our support associate"}.
            </p>

            {/* Stars Row */}
            <div style={starsRowStyle}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    fontSize: "32px",
                    cursor: "pointer",
                    color: star <= rating ? "#F8CB46" : "#d1d5db",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseOver={(e) => e.target.style.transform = "scale(1.2)"}
                  onMouseOut={(e) => e.target.style.transform = "scale(1)"}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Comments input */}
            <textarea
              placeholder="Tell us what we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              style={feedbackInputStyle}
            />

            <button onClick={submitRatingFeedback} style={submitFeedbackBtnStyle}>
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// INLINE STYLING SYSTEM
const pageContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "16px",
  boxSizing: "border-box"
};

const chatConsoleStyle = {
  width: "100%",
  maxWidth: "540px",
  height: "calc(100vh - 32px)",
  minHeight: "480px",
  maxHeight: "760px",
  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.10) 0%, rgba(49, 134, 22, 0.08) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "28px",
  boxShadow: "0 10px 35px rgba(49, 134, 22, 0.12)",
  border: "1px solid rgba(49, 134, 22, 0.12)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

const headerStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid rgba(49, 134, 22, 0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "linear-gradient(90deg, #318616 0%, #6fbf3a 40%, #f59e0b 100%)"
};

const logoBadgeStyle = {
  background: "rgba(255, 77, 79, 0.08)",
  color: "#FF4D4F",
  padding: "6px 12px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const headerTitleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "700",
  color: "white"
};

const headerSubtitleStyle = {
  fontSize: "12px",
  color: "rgba(255, 255, 255, 0.9)",
  fontWeight: "600"
};

const greenBannerStyle = {
  background: "#dcfce7",
  borderBottom: "1.5px solid #bbf7d0",
  color: "#15803d",
  padding: "10px 20px",
  textAlign: "center",
  boxSizing: "border-box"
};

const closeConsoleBtnStyle = {
  background: "linear-gradient(135deg, #f59e0b, #ffb81c)",
  border: "none",
  padding: "8px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  color: "white"
};

const endChatBtnStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)"
};

const messagesWindowStyle = {
  flex: 1,
  padding: "20px",
  overflowY: "auto",
  background: "transparent"
};

const inputFormStyle = {
  padding: "14px 20px",
  borderTop: "1px solid rgba(49, 134, 22, 0.12)",
  display: "flex",
  gap: "10px",
  background: "rgba(255, 255, 255, 0.6)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)"
};

const textInputStyle = {
  flex: 1,
  height: "46px",
  borderRadius: "12px",
  border: "1.5px solid rgba(49, 134, 22, 0.15)",
  padding: "0 16px",
  fontSize: "14px",
  fontWeight: "600",
  outline: "none",
  background: "#f9fafb",
  boxSizing: "border-box"
};

const sendBtnStyle = {
  height: "46px",
  padding: "0 22px",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)"
};

const chipsContainerStyle = {
  background: "rgba(255, 255, 255, 0.75)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(49, 134, 22, 0.12)",
  borderRadius: "18px",
  padding: "16px",
  marginTop: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
};

const chipsHeadingStyle = {
  margin: "0 0 12px 0",
  fontSize: "12px",
  fontWeight: "800",
  textTransform: "uppercase",
  color: "#9ca3af",
  letterSpacing: "0.5px"
};

const chipButtonStyle = {
  background: "white",
  border: "1px solid rgba(49, 134, 22, 0.15)",
  color: "#111827",
  padding: "8px 14px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.15s ease"
};

const orderSelectContainerStyle = {
  background: "#ffffff",
  border: "1px dashed #FF4D4F",
  borderRadius: "18px",
  padding: "16px",
  margin: "12px 0",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.03)"
};

const orderSelectCardStyle = {
  background: "#f9fafb",
  border: "1.5px solid #e5e7eb",
  borderRadius: "12px",
  padding: "10px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "750"
};

const cancelSelectBtnStyle = {
  background: "#f3f4f6",
  color: "#4b5563",
  border: "none",
  padding: "8px 12px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "4px"
};

const typingBubbleStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#4b5563",
  padding: "10px 16px",
  borderRadius: "16px",
  borderTopLeftRadius: "4px",
  fontSize: "12px",
  fontWeight: "600",
  boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
};

const connectingPanelStyle = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "22px",
  padding: "24px",
  textAlign: "center",
  marginTop: "20px",
  boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)"
};

const connectionSpinnerStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  border: "4px solid #dbeafe",
  borderTopColor: "#2563eb",
  margin: "0 auto 14px auto",
  animation: "connectionSpin 0.9s linear infinite"
};

const liveStatusRowStyle = {
  margin: "16px auto 0 auto",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: "999px",
  padding: "7px 12px",
  fontSize: "12px",
  fontWeight: "800"
};

const liveDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#22c55e",
  animation: "pulseLive 1.2s infinite"
};

const queuePanelStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "24px",
  textAlign: "center",
  marginTop: "20px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
};

const queueIconStyle = {
  fontSize: "36px",
  marginBottom: "12px"
};

const progressContainerStyle = {
  width: "100%",
  height: "6px",
  background: "#f3f4f6",
  borderRadius: "999px",
  overflow: "hidden"
};

const progressFillStyle = {
  width: "60%",
  height: "100%",
  background: "#FF4D4F",
  animation: "pulse 1.5s infinite"
};

const comeBackLaterBtnStyle = {
  background: "#f3f4f6",
  color: "#4b5563",
  border: "none",
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  fontWeight: "750",
  fontSize: "13px",
  cursor: "pointer"
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(17, 24, 39, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "16px"
};

const modalCardStyle = {
  background: "white",
  borderRadius: "28px",
  padding: "32px",
  width: "100%",
  maxWidth: "400px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  border: "1px solid #e5e7eb",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column"
};

const starsRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "20px"
};

const feedbackInputStyle = {
  width: "100%",
  height: "90px",
  borderRadius: "14px",
  border: "1.5px solid #e5e7eb",
  padding: "12px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none",
  resize: "none",
  background: "#f9fafb",
  boxSizing: "border-box",
  marginBottom: "20px",
  fontFamily: "inherit"
};

const submitFeedbackBtnStyle = {
  width: "100%",
  height: "48px",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "14px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.25)"
};

const reconnectContainerStyle = {
  padding: "16px 20px",
  borderTop: "1px solid #e5e7eb",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const reconnectBtnStyle = {
  width: "100%",
  height: "46px",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)",
  transition: "all 0.2s ease"
};