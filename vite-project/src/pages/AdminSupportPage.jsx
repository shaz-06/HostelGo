import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const [incomingChats, setIncomingChats] = useState([]);
  const [waitingChats, setWaitingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [closedChats, setClosedChats] = useState([]);
  const [availability, setAvailability] = useState(null);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  
  // UI & Live Telemetry States
  const [inputMessage, setInputMessage] = useState("");
  const [customerDraft, setCustomerDraft] = useState("");
  const [customerTyping, setCustomerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [associateState, setAssociateState] = useState("online");
  const [activeTab, setActiveTab] = useState("waiting"); // waiting, active, closed
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Waiting, Active, Closed

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, customerTyping]);

  // Fetch initial chat categories
  useEffect(() => {
    document.title = "Admin Support Console";
    if (!token) {
      navigate("/login");
      return;
    }

    fetchChatLists();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const fetchChatLists = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/admin/chats", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIncomingChats(data.incoming || []);
        setWaitingChats(data.waiting || []);
        setActiveChats(data.active || []);
        setClosedChats(data.closed || []);
        setAvailability(data.availability || null);
      }
    } catch (err) {
      console.error("Admin Support: Error fetching chats:", err);
    }
  };

  // Initialize Admin Socket Room Listening
  const initializeSocket = () => {
    if (socketRef.current) return;

    const socket = io(window.API_BASE_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Admin support Socket connected. Listening for queue alerts.");
      socket.emit("adminSupportPresence", {
        adminId: user?._id,
        name: user?.name || "Associate",
        inSupportPanel: true,
        state: associateState
      });
    });

    socket.on("incomingSupportRequest", (newChat) => {
      setIncomingChats((prev) => [...prev.filter(c => c._id !== newChat._id), newChat]);
    });

    socket.on("newWaitingSupportChat", (newChat) => {
      console.log("🔌 Socket: New customer joined waitlist:", newChat);
      setWaitingChats((prev) => [...prev.filter(c => c._id !== newChat._id), newChat]);
    });

    socket.on("adminChatStatusUpdated", (updatedChat) => {
      console.log("🔌 Socket: Chat status updated globally:", updatedChat);
      fetchChatLists(); // Reload lists
      
      // Update currently open active chat details
      setSelectedChat((prev) => {
        if (prev && String(prev._id) === String(updatedChat._id)) {
          return updatedChat;
        }
        return prev;
      });
    });

    socket.on("associateAvailabilityChanged", (data) => {
      setAvailability(data);
    });

    socket.on("newSupportMessage", (msg) => {
      // If message is for currently open chat console
      setSelectedChat((current) => {
        if (current && String(msg.senderId) !== String(user._id)) {
          setLocalMessages((prev) => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
        return current;
      });
    });

    socket.on("supportTypingUpdated", (data) => {
      setSelectedChat((current) => {
        if (current && data.role === "user") {
          setCustomerTyping(data.isTyping);
          if (!data.isTyping) {
            setCustomerDraft(""); // Clear draft preview if they stop typing
          }
        }
        return current;
      });
    });

    socket.on("supportTypingPreviewUpdated", (data) => {
      setSelectedChat((current) => {
        if (current) {
          setCustomerDraft(data.text);
        }
        return current;
      });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Admin Socket disconnected.");
    });
  };

  useEffect(() => {
    socketRef.current?.emit("adminSupportPresence", {
      adminId: user?._id,
      name: user?.name || "Associate",
      inSupportPanel: true,
      state: associateState
    });
  }, [associateState, user?._id, user?.name]);

  // Shared MongoDB Document Synchronizer (Polling Backup Loop for Admin Console)
  useEffect(() => {
    if (!selectedChat?._id || selectedChat.status === "closed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(window.API_BASE_URL + `/api/support/chat/${selectedChat._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.chat) {
            setSelectedChat(data.chat);
            setLocalMessages(data.chat.messages || []);
          }
        }
      } catch (err) {
        console.error("Admin Sync: Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedChat?._id, selectedChat?.status, token]);

  // Connect to room for selected chat console
  const selectChat = (chat) => {
    setSelectedChat(chat);
    setLocalMessages(chat.messages || []);
    setCustomerDraft("");
    setCustomerTyping(false);
    
    if (socketRef.current) {
      console.log(`Socket: Admin joining customer support room chat_${chat._id}`);
      socketRef.current.emit("joinSupportRoom", chat._id);
    }
  };

  // Bridge customer waitlist
  const handleConnectChat = async (chatId) => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Support: Dynamic bridge established for chat ${chatId}`);
        setAssociateState("active");
        fetchChatLists();
        selectChat(data.chat);
        setActiveTab("active");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWaitChat = async (chatId) => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/wait", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId })
      });
      if (res.ok) {
        fetchChatLists();
        setActiveTab("waiting");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve chat session
  const handleResolveChat = async (chatId) => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/support/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId })
      });
      if (res.ok) {
        console.log(`Support: Chat resolved ${chatId}`);
        setAssociateState("online");
        setSelectedChat(null);
        setLocalMessages([]);
        setCustomerDraft("");
        fetchChatLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send admin reply
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat) return;

    const messageText = inputMessage.trim();
    setInputMessage("");

    // Clear typing states
    if (socketRef.current) {
      socketRef.current.emit("supportTyping", {
        chatId: selectedChat._id,
        isTyping: false,
        senderName: user.name,
        role: "admin"
      });
    }

    // Append visually instantly for premium responsiveness
    const optimisticMsg = {
      senderName: user.name,
      role: "admin",
      message: messageText,
      timestamp: new Date()
    };
    setLocalMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetch(window.API_BASE_URL + "/api/support/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          message: messageText
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle typing state
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    if (!selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit("supportTyping", {
        chatId: selectedChat._id,
        isTyping: true,
        senderName: user.name,
        role: "admin"
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("supportTyping", {
        chatId: selectedChat._id,
        isTyping: false,
        senderName: user.name,
        role: "admin"
      });
    }, 1500);
  };

  const getChatList = () => {
    if (activeTab === "waiting") return [...incomingChats, ...waitingChats];
    if (activeTab === "active") return activeChats;
    return closedChats;
  };

  const getFilteredChats = () => {
    let list = getChatList();
    
    if (statusFilter !== "All") {
      list = list.filter((chat) => {
        if (statusFilter === "Waiting") {
          return chat.status === "waiting" || chat.status === "connecting";
        }
        if (statusFilter === "Active") {
          return chat.status === "active";
        }
        if (statusFilter === "Closed") {
          return chat.status === "closed";
        }
        return true;
      });
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter((chat) => (
        chat.customerName?.toLowerCase().includes(q) ||
        (chat.phone && chat.phone.toLowerCase().includes(q)) ||
        (chat.orderId && chat.orderId.toLowerCase().includes(q)) ||
        chat.messages?.some(m => m.message?.toLowerCase().includes(q))
      ));
    }

    return list;
  };

  return (
    <div style={pageContainerStyle}>
      {/* Top Navbar */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <h1 style={titleStyle}>Buyto Admin Dashboard</h1>
          <span style={badgeStyle}>Instant Mode</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={storefrontBtnStyle}>
            🏪 Live Storefront
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div style={contentGridStyle}>
        {/* Navigation Sidebar */}
        <nav style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={avatarStyle}>AD</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#111827", fontWeight: "800", fontSize: "14px" }}>Admin Control</span>
              <span style={{ color: "#6B7280", fontSize: "12px", fontWeight: "600" }}>Administrator</span>
            </div>
          </div>
          
          <div style={navGroupStyle}>
            <button onClick={() => navigate("/admin")} style={navLinkStyle}>
              📊 Dashboard
            </button>
            <button onClick={() => navigate("/admin/orders")} style={navLinkStyle}>
              📦 Orders Lifecycle
            </button>
            <button onClick={() => navigate("/admin/products")} style={navLinkStyle}>
              🍎 Inventory Catalog
            </button>
            <button onClick={() => navigate("/admin/riders")} style={navLinkStyle}>
              🛵 Riders Management
            </button>
            <button onClick={() => navigate("/admin/support")} style={activeNavLinkStyle}>
              💬 Customer Support
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                ...navLinkStyle,
                marginTop: "12px",
                borderTop: "1px solid #E5E7EB",
                borderRadius: "0",
                paddingTop: "12px",
                color: "#318616",
                fontWeight: "800"
              }}
            >
              🏪 Open Customer App
            </button>
          </div>
        </nav>

        {/* Support Dashboard */}
        <main style={mainPanelStyle}>
          {/* Top Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={titleStyle}>Customer Support Center</h1>
            <button onClick={fetchChatLists} style={refreshBtnStyle}>
              🔄 Refresh Chats
            </button>
          </div>

          {/* Top Stats Cards */}
          <div style={statsGridStyle}>
            {/* Waiting Chats Card */}
            <div style={statCardStyle("#f59e0b")}>
              <div style={statIconStyle("⏳", "#fffbeb", "#f59e0b")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Waiting Chats</span>
                <span style={statValStyle}>{incomingChats.length + waitingChats.length}</span>
              </div>
            </div>

            {/* Active Chats Card */}
            <div style={statCardStyle("#318616")}>
              <div style={statIconStyle("🟢", "#f0fdf4", "#318616")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Active Chats</span>
                <span style={statValStyle}>{activeChats.length}</span>
              </div>
            </div>

            {/* Closed Chats Card */}
            <div style={statCardStyle("#9ca3af")}>
              <div style={statIconStyle("✅", "#f3f4f6", "#9ca3af")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Closed Chats</span>
                <span style={statValStyle}>{closedChats.length}</span>
              </div>
            </div>

            {/* Total Chats Today Card */}
            <div style={statCardStyle("#6366f1")}>
              <div style={statIconStyle("💬", "#eef2ff", "#6366f1")} />
              <div style={statContentStyle}>
                <span style={statLabelStyle}>Total Chats Today</span>
                <span style={statValStyle}>{incomingChats.length + waitingChats.length + activeChats.length + closedChats.length}</span>
              </div>
            </div>
          </div>

          {/* Split Screen Layout (30% / 70%) */}
          <div style={splitScreenStyle}>
            {/* Left 30% Panel */}
            <div style={leftPanelStyle}>
              {/* Search Bar */}
              <div style={searchBarContainerStyle}>
                <input
                  type="text"
                  placeholder="Search name, phone, order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={searchQueryInputStyle}
                />
              </div>

              {/* Status Filter Row */}
              <div style={statusFilterContainerStyle}>
                {["All", "Waiting", "Active", "Closed"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    style={{
                      ...filterButtonStyle,
                      background: statusFilter === filter ? "#318616" : "#ffffff",
                      color: statusFilter === filter ? "#ffffff" : "#4b5563",
                      borderColor: statusFilter === filter ? "#318616" : "#e5e7eb"
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Navigation Tabs */}
              <div style={tabsRowStyle}>
                {[
                  { id: "waiting", label: "⏳ Waiting Chats", count: incomingChats.length + waitingChats.length, color: "#f97316" },
                  { id: "active", label: "🟢 Active Chats", count: activeChats.length, color: "#318616" },
                  { id: "closed", label: "✅ Closed Chats", count: closedChats.length, color: "#6b7280" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedChat(null);
                      setLocalMessages([]);
                      setCustomerDraft("");
                    }}
                    style={{
                      ...tabButtonStyle,
                      borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : "3px solid transparent",
                      color: activeTab === tab.id ? "#111827" : "#6b7280",
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span style={{ ...badgeStyle, background: tab.color }}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Chat Cards Scroll list */}
              <div style={listScrollStyle}>
                {getFilteredChats().length === 0 ? (
                  <div style={emptyListStyle}>
                    <span>📭</span>
                    <p style={{ margin: "8px 0 0 0", fontSize: "13px", fontWeight: "600" }}>No support chats found</p>
                  </div>
                ) : (
                  getFilteredChats().map((chat) => {
                    const isSelected = selectedChat?._id === chat._id;
                    
                    return (
                      <div
                        key={chat._id}
                        onClick={() => {
                          if (chat.status === "waiting" || chat.status === "connecting") {
                            handleConnectChat(chat._id);
                          } else {
                            selectChat(chat);
                          }
                        }}
                        style={{
                          ...chatCardStyle,
                          background: isSelected ? "#f0fdf4" : "#ffffff",
                          borderColor: isSelected ? "#318616" : "#e5e7eb",
                          boxShadow: isSelected ? "0 4px 12px rgba(49, 134, 22, 0.08)" : "none",
                          position: "relative"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={customerNameLabelStyle}>👤 {chat.customerName}</span>
                          <span style={{
                            fontSize: "10px",
                            background: chat.status === "active" ? "#dcfce7" : chat.status === "closed" ? "#f3f4f6" : "#ffedd5",
                            color: chat.status === "active" ? "#318616" : chat.status === "closed" ? "#9ca3af" : "#f59e0b",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontWeight: "800",
                            textTransform: "lowercase"
                          }}>
                            {chat.status === "active" ? "active" : chat.status === "closed" ? "closed" : "waiting"}
                          </span>
                        </div>
                        
                        {/* Phone Number Display */}
                        {chat.phone && (
                          <span style={{ fontSize: "11px", color: "#4B5563", fontWeight: "600", marginTop: "2px", display: "block" }}>
                            📞 {chat.phone}
                          </span>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          {chat.orderId ? (
                            <span style={orderIdLabelStyle}>Order: #{chat.orderId.slice(-6)}</span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>General Inquiry</span>
                          )}
                          <span style={timeTagStyle}>
                            {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Last message preview */}
                        <p style={{
                          margin: "8px 0 0 0",
                          fontSize: "12px",
                          color: "#4b5563",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: "550",
                          background: "#f9fafb",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "1px solid #f3f4f6"
                        }}>
                          💬 {chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].message : "No messages yet"}
                        </p>

                        {/* Wait button overlay only for waiting chats inside card if not selected */}
                        {(chat.status === "waiting" || chat.status === "connecting") && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnectChat(chat._id);
                              }}
                              style={connectBtnStyle}
                            >
                              Connect 🔌
                            </button>
                          </div>
                        )}

                        {chat.status === "closed" && chat.rating && (
                          <div style={ratingTagStyle}>
                            <span>Score: {Array(chat.rating).fill("★").join("")}</span>
                            {chat.feedback && (
                              <p style={{ margin: "4px 0 0 0", fontStyle: "italic", fontSize: "11px", color: "#6b7280" }}>
                                "{chat.feedback}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 70% Panel (Conversation Window) */}
            <div style={rightPanelStyle}>
              {selectedChat ? (
                <div style={consoleContainerStyle}>
                  {/* Header Details */}
                  <div style={consoleHeaderStyle}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "850", color: "#111827" }}>
                        {selectedChat.customerName}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>
                        Status: {selectedChat.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      {selectedChat.status === "active" && (
                        <button
                          onClick={() => handleResolveChat(selectedChat._id)}
                          style={resolveSessionBtnStyle}
                        >
                          End Conversation ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Logs window */}
                  <div style={consoleMessagesWindowStyle}>
                    {localMessages.map((msg, index) => {
                      const isBot = msg.role === "bot";
                      const isUser = msg.role === "user";
                      const isSystem = msg.senderName === "System" || (isBot && (
                        msg.message.includes("joined the conversation") || 
                        msg.message.includes("ended due to inactivity") || 
                        msg.message.includes("ended the conversation") ||
                        msg.message.includes("joined the chat") ||
                        msg.message.includes("Associate Connected")
                      ));
                      
                      // If system message, center it
                      if (isSystem) {
                        return (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              margin: "12px 0",
                            }}
                          >
                            <div style={{
                              background: "#f3f4f6",
                              color: "#4B5563",
                              borderRadius: "10px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "600",
                              textAlign: "center",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                              border: "1.5px solid #e5e7eb",
                              maxWidth: "80%"
                            }}>
                              {msg.message}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent: isUser ? "flex-end" : "flex-start",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "70%",
                              background: isUser ? "#d9fdd3" : "#ffffff",
                              color: "#111b21",
                              borderRadius: "16px",
                              borderTopRightRadius: isUser ? "2px" : "16px",
                              borderTopLeftRadius: !isUser ? "2px" : "16px",
                              padding: "10px 14px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              border: isUser ? "none" : "1px solid #e5e7eb",
                              fontSize: "13px",
                              lineHeight: "1.4",
                            }}
                          >
                            <div style={{ fontWeight: "800", fontSize: "10px", opacity: 0.8, marginBottom: "4px", color: isUser ? "#15803d" : "#0284c7" }}>
                              {msg.senderName}
                            </div>
                            <div>{msg.message}</div>
                            <div style={{ fontSize: "9px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* CUSTOMER IS TYPING FEED */}
                    {customerTyping && (
                      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                        <div style={typingPreviewLabelStyle}>
                          <span>💬 Customer typing...</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* FLOATING REAL-TIME CUSTOMER KEYSTROKE PREVIEW */}
                  {customerDraft && (
                    <div style={typingPreviewBannerStyle}>
                      <span style={{ fontSize: "14px" }}>✏️</span>
                      <span>
                        <strong>Customer Draft Preview:</strong> "{customerDraft}"
                      </span>
                    </div>
                  )}

                  {/* Message Input box */}
                  {selectedChat.status === "active" ? (
                    <form onSubmit={handleSendMessage} style={consoleInputFormStyle}>
                      <input
                        type="text"
                        placeholder="Type response..."
                        value={inputMessage}
                        onChange={handleInputChange}
                        style={consoleTextInputStyle}
                      />
                      <button type="submit" style={consoleSendBtnStyle}>
                        Send
                      </button>
                    </form>
                  ) : (
                    <div style={consolePlaceholderStyle}>
                      <p style={{ margin: 0 }}>This support session is in "{selectedChat.status}" state.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={unselectedPlaceholderStyle}>
                  <span>🎧</span>
                  <h3>No Customer Selected</h3>
                  <p>Choose an item from the left-hand workspace tabs to begin real-time assistance.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// STYLES SYSTEM
const pageContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  color: "#111827",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "24px 32px",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "20px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "24px",
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  letterSpacing: "-0.5px",
  margin: 0,
};

const badgeStyle = {
  background: "#FFF1F0",
  color: "#318616",
  border: "1px solid rgba(49, 134, 22, 0.15)",
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase",
};

const storefrontBtnStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
  padding: "8px 16px",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
  transition: "all 0.15s ease",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "250px 1fr",
  gap: "28px",
  alignItems: "start",
};

const sidebarStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const sidebarHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "16px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "16px",
};

const avatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #318616 0%, #286f12 100%)",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const navGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const activeNavLinkStyle = {
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "800",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
};

const navLinkStyle = {
  background: "transparent",
  color: "#4B5563",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "700",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const mainPanelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const refreshBtnStyle = {
  background: "#318616",
  border: "none",
  borderRadius: "12px",
  color: "white",
  fontSize: "13px",
  fontWeight: "800",
  padding: "8px 16px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
  transition: "all 0.15s ease",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
};

const statCardStyle = (accentColor) => ({
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderTop: `4px solid ${accentColor}`,
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
  cursor: "default",
});

const statIconStyle = (emoji, bg, color) => ({
  fontSize: "24px",
  width: "50px",
  height: "50px",
  borderRadius: "14px",
  background: bg,
  color: color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const statContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const statLabelStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const statValStyle = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#111827",
};

const splitScreenStyle = {
  display: "flex",
  width: "100%",
  height: "calc(100vh - 280px)",
  minHeight: "500px",
  maxHeight: "720px",
  background: "white",
  borderRadius: "28px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
  overflow: "hidden"
};

const leftPanelStyle = {
  width: "30%",
  borderRight: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  flexShrink: 0,
  height: "100%"
};

const searchBarContainerStyle = {
  padding: "16px 16px 8px 16px"
};

const searchQueryInputStyle = {
  width: "100%",
  height: "40px",
  borderRadius: "10px",
  border: "1.5px solid #e5e7eb",
  padding: "0 14px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none",
  background: "#f9fafb",
  boxSizing: "border-box"
};

const statusFilterContainerStyle = {
  padding: "0 16px 8px 16px",
  display: "flex",
  gap: "6px",
  flexWrap: "wrap"
};

const filterButtonStyle = {
  padding: "5px 12px",
  borderRadius: "8px",
  border: "1.5px solid #e5e7eb",
  fontSize: "11px",
  fontWeight: "800",
  cursor: "pointer",
  background: "#ffffff",
  transition: "all 0.15s ease"
};

const tabsRowStyle = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "0 10px"
};

const tabButtonStyle = {
  flex: 1,
  background: "transparent",
  border: "none",
  padding: "12px 2px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  transition: "all 0.2s"
};

const listScrollStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
  background: "#F9FAFB"
};

const emptyListStyle = {
  textAlign: "center",
  padding: "40px 0",
  color: "#9ca3af",
  fontSize: "32px"
};

const chatCardStyle = {
  border: "1.5px solid #e5e7eb",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "12px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const customerNameLabelStyle = {
  fontWeight: "800",
  fontSize: "14px",
  color: "#111827"
};

const timeTagStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  fontWeight: "600"
};

const orderIdLabelStyle = {
  fontSize: "11px",
  background: "#f3f4f6",
  padding: "4px 8px",
  borderRadius: "6px",
  alignSelf: "flex-start",
  fontWeight: "755",
  color: "#4b5563"
};

const connectBtnStyle = {
  background: "#318616",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "11px"
};

const ratingTagStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#F8CB46",
  marginTop: "4px"
};

const rightPanelStyle = {
  width: "70%",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  height: "100%"
};

const unselectedPlaceholderStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: "48px",
  background: "#F9FAFB"
};

const consoleContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden"
};

const consoleHeaderStyle = {
  padding: "16px 24px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};

const resolveSessionBtnStyle = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
};

const consoleMessagesWindowStyle = {
  flex: 1,
  padding: "24px",
  overflowY: "auto",
  background: "#F9FAFB"
};

const typingPreviewLabelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#318616",
  padding: "8px 14px",
  borderRadius: "14px",
  borderTopLeftRadius: "2px",
  fontSize: "11px",
  fontWeight: "750",
  boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
};

const typingPreviewBannerStyle = {
  background: "rgba(49, 134, 22, 0.05)",
  borderTop: "1.5px solid #318616",
  padding: "10px 24px",
  fontSize: "12px",
  color: "#318616",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600"
};

const consoleInputFormStyle = {
  padding: "16px 24px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  gap: "12px",
  background: "#ffffff"
};

const consoleTextInputStyle = {
  flex: 1,
  height: "46px",
  borderRadius: "12px",
  border: "1.5px solid #e5e7eb",
  padding: "0 16px",
  fontSize: "14px",
  fontWeight: "600",
  outline: "none",
  background: "#f9fafb",
  boxSizing: "border-box"
};

const consoleSendBtnStyle = {
  height: "46px",
  padding: "0 24px",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)"
};

const consolePlaceholderStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb"
};