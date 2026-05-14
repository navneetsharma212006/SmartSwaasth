const { Server } = require("socket.io");
const Message = require("../models/Message");

let io;

function initSocket(server, clientOrigin) {
  io = new Server(server, {
    cors: {
      origin: clientOrigin || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // ── Personal notification room ─────────────────────────────────────────────
    // Each logged-in user joins `user:<userId>` so we can send them targeted
    // events (chat badge updates, push-notification echoes) from any page.
    socket.on("join_user_room", ({ userId }) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined personal room user:${userId}`);
    });

    // ── Chat ──────────────────────────────────────────────────────────────────
    socket.on("join_chat", ({ userId1, userId2 }) => {
      const roomId = [userId1, userId2].sort().join("_");
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined chat room ${roomId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        const roomId = [senderId, receiverId].sort().join("_");

        // Persist to DB
        const newMessage = await Message.create({ senderId, receiverId, content });

        // Deliver to both users currently in the chat room
        io.to(roomId).emit("receive_message", newMessage);

        // Also push a chat-notification event to the receiver's personal room
        // so their notification badge/count updates even if they're on a
        // different page and haven't opened that chat.
        io.to(`user:${receiverId}`).emit("notification:chat", {
          from: senderId,
          content,
          messageId: newMessage._id,
          createdAt: newMessage.createdAt,
        });

        // ── Push notification (works even when the app is closed) ──────────────
        const { sendPushToUser } = require("../services/pushService");
        const User = require("../models/User");

        const sender = await User.findById(senderId, "name role").lean();
        const senderName = sender
          ? `${sender.role === "caregiver" ? "Dr. " : ""}${sender.name}`
          : "Someone";

        sendPushToUser(receiverId, {
          title: `💬 ${senderName}`,
          body: content.length > 100 ? content.slice(0, 97) + "…" : content,
          url: `/chat/${senderId}`,
          tag: `chat-${senderId}`,   // collapses multiple messages from same sender
        }).catch((err) =>
          console.error("[push] chat push failed:", err.message)
        );
      } catch (err) {
        console.error("[socket] send_message error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

function getIo() {
  return io;
}

module.exports = { initSocket, getIo };
