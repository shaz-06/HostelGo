const express = require("express");
const router = express.Router();
const SupportChat = require("../models/SupportChat");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const userReplyTimers = new Map();

// Helper to recalculate and broadcast updated queue positions
const updateQueuePositions = async (io) => {
  try {
    const waitingChats = await SupportChat.find({ status: "waiting" }).sort({ createdAt: 1 });
    for (let i = 0; i < waitingChats.length; i++) {
      const position = i + 1;
      waitingChats[i].queuePosition = position;
      await waitingChats[i].save();

      if (io) {
        io.to(`chat_${waitingChats[i]._id}`).emit("queuePositionUpdated", {
          queuePosition: position,
          estimatedWaitTime: position * 3
        });
      }
    }
  } catch (err) {
    console.error("❌ Support Queue: Error recalculating queue positions:", err.message);
  }
};

const getAvailability = (req) => {
  const snapshotProvider = req.getAssociateSnapshot || req.app.get("getAssociateSnapshot");
  return snapshotProvider ? snapshotProvider() : { associates: [], availableCount: 0, hasAvailableAssociate: false };
};

const scheduleUserReplyTimeout = (chatId, io) => {
  clearTimeout(userReplyTimers.get(String(chatId)));

  const timer = setTimeout(async () => {
    try {
      const chat = await SupportChat.findById(chatId);
      if (!chat || chat.status !== "active") return;

      const connectedAt = [...chat.messages].reverse().find((msg) => (
        msg.role === "bot" && msg.message.includes("Please reply within 2 mins")
      ))?.timestamp || chat.updatedAt;

      const hasUserReplyAfterConnection = chat.messages.some((msg) => (
        msg.role === "user" && new Date(msg.timestamp).getTime() > new Date(connectedAt).getTime()
      ));

      if (hasUserReplyAfterConnection) return;

      chat.status = "closed";
      chat.queuePosition = 0;
      chat.messages.push({
        senderName: "System",
        role: "bot",
        message: "Chat session ended due to inactivity."
      });
      await chat.save();

      if (io) {
        io.to(`chat_${chatId}`).emit("supportClosed", {
          chat,
          closedBy: "System",
          reason: "inactivity"
        });
        io.emit("adminChatStatusUpdated", chat);
        await updateQueuePositions(io);
      }
    } catch (err) {
      console.error("❌ Support Timeout: Failed to auto-close inactive chat:", err.message);
    } finally {
      userReplyTimers.delete(String(chatId));
    }
  }, 2 * 60 * 1000);

  userReplyTimers.set(String(chatId), timer);
};

const cancelUserReplyTimeout = (chatId) => {
  clearTimeout(userReplyTimers.get(String(chatId)));
  userReplyTimers.delete(String(chatId));
};

// 1. POST /api/support/start - Start session or resume existing active session
router.post("/support/start", authMiddleware, async (req, res) => {
  console.log("=== [SUPPORT API] POST /api/support/start ===");
  try {
    const userId = req.user._id;

    // Check for an existing active session
    let chat = await SupportChat.findOne({
      customerId: userId,
      status: { $in: ["connecting", "waiting", "active"] }
    });

    if (chat) {
      console.log(`Support: Found existing active chat session ${chat._id} for customer ${req.user.name}`);
      return res.json({ chat, availability: getAvailability(req) });
    }

    // Get order if provided
    const orderId = req.body.orderId || null;
    const availability = getAvailability(req);
    const shouldQueue = !availability.hasAvailableAssociate;

    // Count how many users are already in the waiting queue
    const activeWaitingCount = shouldQueue ? await SupportChat.countDocuments({ status: "waiting" }) : 0;
    const position = shouldQueue ? activeWaitingCount + 1 : 0;

    // Create a new support request in MongoDB
    chat = new SupportChat({
      customerId: userId,
      customerName: req.user.name,
      phone: req.user.phone || "",
      orderId: orderId,
      status: shouldQueue ? "waiting" : "connecting",
      queuePosition: position,
      messages: [
        {
          senderName: "Buyto Bot",
          role: "bot",
          message: shouldQueue ? "Searching for available associate..." : "Connecting to associate..."
        }
      ]
    });

    await chat.save();
    console.log(`Support: Created ${chat.status} chat session ${chat._id} for customer ${req.user.name}`);

    // Notify administrators of the new request
    if (req.io) {
      req.io.to("support_admins").emit(shouldQueue ? "newWaitingSupportChat" : "incomingSupportRequest", chat);
      req.io.emit("adminChatStatusUpdated", chat);
    }

    return res.status(201).json({ chat, availability });
  } catch (err) {
    console.error("❌ Support API: Failed to start support session:", err.message);
    res.status(500).json({ message: "Failed to initialize support session", error: err.message });
  }
});

// 2. POST /api/support/message - Send/save a message to an active chat
router.post("/support/message", authMiddleware, async (req, res) => {
  console.log("=== [SUPPORT API] POST /api/support/message ===");
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ message: "Chat ID and message content are required" });
    }

    const chat = await SupportChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Support chat session not found" });
    }

    if (chat.status === "closed") {
      return res.status(400).json({ message: "This support session has been closed" });
    }

    // Double check user authorization
    const isAdmin = req.user.role === "admin";
    const isCustomer = String(chat.customerId) === String(req.user._id);

    if (!isAdmin && !isCustomer) {
      return res.status(403).json({ message: "Unauthorized access to support session" });
    }

    // Append the new message
    const newMessage = {
      senderId: req.user._id,
      senderName: req.user.name,
      role: isAdmin ? "admin" : "user",
      message: message,
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(newMessage);
    if (newMessage.role === "user" && chat.status === "active") {
      cancelUserReplyTimeout(chatId);
    }
    await chat.save();

    const savedMessage = chat.messages[chat.messages.length - 1];

    // Broadcast the message instantly over Socket.IO to the room
    if (req.io) {
      console.log(`Socket: Broadcasting message to room: chat_${chatId}`);
      req.io.to(`chat_${chatId}`).emit("newSupportMessage", savedMessage);
    }

    return res.status(200).json({ message: savedMessage });
  } catch (err) {
    console.error("❌ Support API: Failed to save message:", err.message);
    res.status(500).json({ message: "Failed to post message", error: err.message });
  }
});

// 3. POST /api/support/connect - Connect associate (Admin only)
router.post("/support/connect", authMiddleware, adminMiddleware, async (req, res) => {
  console.log("=== [SUPPORT API] POST /api/support/connect ===");
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await SupportChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Support session not found" });
    }

    if (!["connecting", "waiting"].includes(chat.status)) {
      return res.status(400).json({ message: `Session status is already '${chat.status}'` });
    }

    // Update status to active
    chat.status = "active";
    chat.queuePosition = 0;

    // Add connection system logs
    chat.messages.push({
      senderName: "System",
      role: "bot",
      message: "🟢 Associate Connected"
    });
    chat.messages.push({
      senderName: "System",
      role: "bot",
      message: "An associate has joined the conversation. Please reply within 2 minutes to stay connected."
    });

    await chat.save();
    console.log(`Support: Admin ${req.user.name} connected to chat session ${chatId}`);

    // Broadcast connection to user room
    if (req.io) {
      req.io.to(`chat_${chatId}`).emit("supportConnected", {
        chat,
        adminName: req.user.name
      });

      // Emit update globally to other admin consoles
      req.io.emit("adminChatStatusUpdated", chat);

      // Recalculate remaining waiting users' positions
      await updateQueuePositions(req.io);
    }
    scheduleUserReplyTimeout(chatId, req.io);

    return res.json({ chat });
  } catch (err) {
    console.error("❌ Support API: Failed to connect to session:", err.message);
    res.status(500).json({ message: "Failed to establish connection", error: err.message });
  }
});

// 4. POST /api/support/close - Close/resolve an active chat session
router.post("/support/close", authMiddleware, async (req, res) => {
  console.log("=== [SUPPORT API] POST /api/support/close ===");
  try {
    const { chatId, rating, feedback, reason } = req.body;
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await SupportChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Support session not found" });
    }

    // Verify participant
    const isAdmin = req.user.role === "admin";
    const isCustomer = String(chat.customerId) === String(req.user._id);
    if (!isAdmin && !isCustomer) {
      return res.status(403).json({ message: "Unauthorized request" });
    }

    // If already closed and we are updating rating/feedback
    if (chat.status === "closed") {
      if (rating !== undefined) {
        chat.rating = rating;
        chat.feedback = feedback || "";
        await chat.save();
        console.log(`Support: Saved rating ${rating}/5 for closed chat session ${chatId}`);
        return res.json({ chat });
      }
      return res.status(400).json({ message: "Support session is already closed" });
    }

    // Close session
    cancelUserReplyTimeout(chatId);
    chat.status = "closed";
    chat.queuePosition = 0;

    if (rating !== undefined) {
      chat.rating = rating;
      chat.feedback = feedback || "";
    }

    chat.messages.push({
      senderName: "System",
      role: "bot",
      message: reason === "inactivity" ? "Chat session ended due to inactivity." : "Associate has ended the conversation."
    });

    await chat.save();
    console.log(`Support: Chat session ${chatId} has been successfully closed.`);

    // Broadcast close to Socket room
    if (req.io) {
      req.io.to(`chat_${chatId}`).emit("supportClosed", {
        chat,
        closedBy: req.user.name,
        reason: reason || "resolved"
      });

      // Notify other admin consoles
      req.io.emit("adminChatStatusUpdated", chat);

      // Update queue details in case other sessions changed
      await updateQueuePositions(req.io);
    }

    return res.json({ chat });
  } catch (err) {
    console.error("❌ Support API: Failed to close session:", err.message);
    res.status(500).json({ message: "Failed to resolve support session", error: err.message });
  }
});

// 5. POST /api/support/wait - Admin manually places an incoming request into the real queue
router.post("/support/wait", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await SupportChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Support session not found" });
    }

    if (chat.status !== "connecting") {
      return res.status(400).json({ message: `Session status is already '${chat.status}'` });
    }

    const activeWaitingCount = await SupportChat.countDocuments({ status: "waiting" });
    chat.status = "waiting";
    chat.queuePosition = activeWaitingCount + 1;
    chat.messages.push({
      senderName: "System",
      role: "bot",
      message: "Searching for available associate..."
    });
    await chat.save();

    if (req.io) {
      req.io.to(`chat_${chatId}`).emit("supportWaiting", {
        chat,
        queuePosition: chat.queuePosition,
        estimatedWaitTime: chat.queuePosition * 3
      });
      req.io.emit("adminChatStatusUpdated", chat);
      await updateQueuePositions(req.io);
    }

    return res.json({ chat });
  } catch (err) {
    console.error("❌ Support API: Failed to move support session to queue:", err.message);
    res.status(500).json({ message: "Failed to move support session to queue", error: err.message });
  }
});

// 6. GET /api/support/queue - Fetch a customer's live support session details
router.get("/support/queue", authMiddleware, async (req, res) => {
  try {
    const chat = await SupportChat.findOne({
      customerId: req.user._id,
      status: { $in: ["connecting", "waiting", "active"] }
    });

    if (!chat) {
      return res.status(404).json({ message: "No active queue session found" });
    }

    return res.json({
      chatId: chat._id,
      status: chat.status,
      queuePosition: chat.queuePosition,
      estimatedWaitTime: chat.queuePosition * 3,
      availability: getAvailability(req)
    });
  } catch (err) {
    console.error("❌ Support API: Failed to fetch queue stats:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chat/associate/status
router.get("/chat/associate/status", async (req, res) => {
  const availability = getAvailability(req);
  console.log("Associate availability request received");
  console.log("Associates online:", availability.availableCount);
  return res.json({
    success: true,
    available: availability.hasAvailableAssociate
  });
});

// 7. GET /api/support/availability - Fetch live associate availability
router.get("/support/availability", authMiddleware, async (req, res) => {
  return res.json(getAvailability(req));
});

// 8. GET /api/support/admin/chats - Fetch chats lists for administrative command dashboard
router.get("/support/admin/chats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const incoming = await SupportChat.find({ status: "connecting" }).sort({ createdAt: 1 });
    const waiting = await SupportChat.find({ status: "waiting" }).sort({ createdAt: 1 });
    const active = await SupportChat.find({ status: "active" }).sort({ updatedAt: -1 });
    const closed = await SupportChat.find({ status: "closed" }).sort({ updatedAt: -1 }).limit(50);

    return res.json({ incoming, waiting, active, closed, availability: getAvailability(req) });
  } catch (err) {
    console.error("❌ Support API: Failed to fetch admin chat lists:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 9. GET /api/support/chat/:chatId - Fetch single chat details (Admin or customer participant)
router.get("/support/chat/:chatId", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await SupportChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat session not found" });
    }
    
    // Verify participant
    const isAdmin = req.user.role === "admin";
    const isCustomer = String(chat.customerId) === String(req.user._id);
    if (!isAdmin && !isCustomer) {
      return res.status(403).json({ message: "Unauthorized access to chat" });
    }
    
    return res.json({ chat });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;