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
  const [activeTab, setActiveTab] = useState("incoming"); // incoming, waiting, active, closed

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
      const res = await fetch("http://localhost:8000/api/support/admin/chats", {
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

    const socket = io("http://localhost:8000");
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
      const res = await fetch("http://localhost:8000/api/support/connect", {
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
        setAssociateState("connected");
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
      const res = await fetch("http://localhost:8000/api/support/wait", {
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
      const res = await fetch("http://localhost:8000/api/support/close", {
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
      await fetch("http://localhost:8000/api/support/message", {
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
    if (activeTab === "incoming") return incomingChats;
    if (activeTab === "waiting") return waitingChats;
    if (activeTab === "active") return activeChats;
    return closedChats;
  };

  return (
    <div style={pageContainerStyle}>
      <div style={controlCenterStyle}>
        
        {/* LEFT COLUMN: LISTS SELECTORS */}
        <div style={leftPanelStyle}>
          {/* Dashboard Header */}
          <div style={panelHeaderStyle}>
            <span style={roleBadgeStyle}>Admin Workspace</span>
            <h2 style={panelTitleStyle}>Support Console</h2>
            <div style={presencePanelStyle}>
              <span style={presenceTextStyle}>
                {availability?.availableCount || 0} available · {associateState}
              </span>
              <div style={presenceButtonsStyle}>
                {["online", "busy", "waiting"].map((state) => (
                  <button
                    key={state}
                    onClick={() => setAssociateState(state)}
                    style={{
                      ...presenceButtonStyle,
                      background: associateState === state ? "#111827" : "#ffffff",
                      color: associateState === state ? "#ffffff" : "#4b5563"
                    }}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={tabsRowStyle}>
            {[
              { id: "incoming", label: "Incoming", count: incomingChats.length, color: "#2563eb" },
              { id: "waiting", label: "Waiting Queue", count: waitingChats.length, color: "#FF4D4F" },
              { id: "active", label: "Active Chats", count: activeChats.length, color: "#318616" },
              { id: "closed", label: "History", count: closedChats.length, color: "#6b7280" }
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

          {/* Chat List Items Scroll Container */}
          <div style={listScrollStyle}>
            {getChatList().length === 0 ? (
              <div style={emptyListStyle}>
                <span>📭</span>
                <p style={{ margin: "8px 0 0 0", fontSize: "13px", fontWeight: "600" }}>No support chats found</p>
              </div>
            ) : (
              getChatList().map((chat) => {
                const isSelected = selectedChat?._id === chat._id;
                
                return (
                  <div
                    key={chat._id}
                    onClick={() => selectChat(chat)}
                    style={{
                      ...chatCardStyle,
                      background: isSelected ? "#F9FAFB" : "#ffffff",
                      borderColor: isSelected ? "#FF4D4F" : "#e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={customerNameLabelStyle}>👤 {chat.customerName}</span>
                      <span style={timeTagStyle}>
                        {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {chat.orderId && (
                      <span style={orderIdLabelStyle}>Order: #{chat.orderId.slice(-6)}</span>
                    )}

                    {chat.status === "connecting" && (
                      <div style={queueIndicatorStyle}>
                        <span>Live request</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWaitChat(chat._id);
                            }}
                            style={waitBtnStyle}
                          >
                            Wait
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnectChat(chat._id);
                            }}
                            style={connectBtnStyle}
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    )}

                    {chat.status === "waiting" && (
                      <div style={queueIndicatorStyle}>
                        <span>Queue Position: #{chat.queuePosition}</span>
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

        {/* RIGHT COLUMN: ACTIVE SELECTED CHAT CONSOLE */}
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
                  {selectedChat.status === "connected" && (
                    <button
                      onClick={() => handleResolveChat(selectedChat._id)}
                      style={resolveSessionBtnStyle}
                    >
                      Resolve Session ✓
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages Logs window */}
              <div style={consoleMessagesWindowStyle}>
                {localMessages.map((msg, index) => {
                  const isBot = msg.role === "bot";
                  const isSelf = msg.role === "admin";
                  
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: isSelf ? "flex-end" : "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          background: isSelf ? "#FF4D4F" : isBot ? "#f3f4f6" : "#ffffff",
                          color: isSelf ? "white" : "#111827",
                          borderRadius: "18px",
                          borderTopRightRadius: isSelf ? "2px" : "18px",
                          borderTopLeftRadius: !isSelf ? "2px" : "18px",
                          padding: "10px 16px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          border: isSelf ? "none" : "1px solid #e5e7eb",
                          fontSize: "13px",
                          lineHeight: "1.4",
                        }}
                      >
                        <div style={{ fontWeight: "800", fontSize: "10px", opacity: 0.8, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                      <span>💬 Customer typing indicator...</span>
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
              {selectedChat.status === "connected" ? (
                <form onSubmit={handleSendMessage} style={consoleInputFormStyle}>
                  <input
                    type="text"
                    placeholder="Type your response here..."
                    value={inputMessage}
                    onChange={handleInputChange}
                    style={consoleTextInputStyle}
                  />
                  <button type="submit" style={consoleSendBtnStyle}>
                    Reply
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
    </div>
  );
}

// INLINE STYLES SYSTEM
const pageContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "24px",
  boxSizing: "border-box"
};

const controlCenterStyle = {
  width: "100%",
  maxWidth: "1140px",
  height: "calc(100vh - 48px)",
  minHeight: "560px",
  maxHeight: "840px",
  background: "white",
  borderRadius: "28px",
  boxShadow: "0 16px 48px rgba(17, 24, 39, 0.08)",
  border: "1px solid #e5e7eb",
  display: "flex",
  overflow: "hidden"
};

const leftPanelStyle = {
  width: "360px",
  borderRight: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  flexShrink: 0
};

const panelHeaderStyle = {
  padding: "24px 20px 16px 20px",
  borderBottom: "1px solid #f3f4f6"
};

const roleBadgeStyle = {
  background: "rgba(255, 77, 79, 0.08)",
  color: "#FF4D4F",
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "10px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const panelTitleStyle = {
  margin: "8px 0 0 0",
  fontSize: "20px",
  fontWeight: "850",
  color: "#111827"
};

const presencePanelStyle = {
  marginTop: "14px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "10px"
};

const presenceTextStyle = {
  display: "block",
  color: "#4b5563",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "capitalize",
  marginBottom: "8px"
};

const presenceButtonsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "6px"
};

const presenceButtonStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  height: "30px",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "capitalize",
  cursor: "pointer"
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
  padding: "14px 4px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  transition: "all 0.2s"
};

const badgeStyle = {
  color: "white",
  fontSize: "10px",
  fontWeight: "800",
  padding: "2px 6px",
  borderRadius: "999px"
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
  gap: "6px"
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

const queueIndicatorStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "6px",
  fontSize: "11px",
  fontWeight: "750",
  color: "#FF4D4F"
};

const connectBtnStyle = {
  background: "#FF4D4F",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "750",
  fontSize: "11px"
};

const waitBtnStyle = {
  background: "#ffffff",
  color: "#4b5563",
  border: "1px solid #e5e7eb",
  padding: "6px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "750",
  fontSize: "11px"
};

const ratingTagStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#F8CB46",
  marginTop: "4px"
};

const rightPanelStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "#ffffff"
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
  height: "100%"
};

const consoleHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};

const resolveSessionBtnStyle = {
  background: "#318616",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  fontWeight: "750",
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
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
  color: "#FF4D4F",
  padding: "8px 14px",
  borderRadius: "14px",
  borderTopLeftRadius: "2px",
  fontSize: "11px",
  fontWeight: "750",
  boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
};

const typingPreviewBannerStyle = {
  background: "rgba(255, 77, 79, 0.05)",
  borderTop: "1.5px solid #FF4D4F",
  padding: "10px 24px",
  fontSize: "12px",
  color: "#FF4D4F",
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
  background: "#FF4D4F",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "750",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.2)"
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
