const { Server } = require("socket.io");

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
