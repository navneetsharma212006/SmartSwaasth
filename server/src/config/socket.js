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

    // Chat functionality
    socket.on("join_chat", ({ userId1, userId2 }) => {
      // Create a consistent room ID regardless of who initiates
      const roomId = [userId1, userId2].sort().join("_");
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        const roomId = [senderId, receiverId].sort().join("_");
        
        // Save to DB
        const newMessage = await Message.create({ senderId, receiverId, content });
        
        // Broadcast to room
        io.to(roomId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("Error saving message:", err);
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
