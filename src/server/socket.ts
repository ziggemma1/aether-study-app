import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send-message", (data) => {
      io.to(data.roomId).emit("receive-message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
