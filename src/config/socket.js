import { Server } from "socket.io";

let io;
const onlineUser = new Map(); //userId → socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    // user join with id
    socket.on("join", (userId) => {
      onlineUser.set(userId, socket.id);
    });

    // cleanup on disconnect
    socket.on("disconnect", () => {
      for (const [uid, sid] of onlineUser.entries()) {
        if (sid === socket.id) {
          onlineUser.delete(uid);
        }
      }
    });
  });
};

export const sendNotification = (userId, data) => {
  const socketId = onlineUser.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", data);
  }
};
