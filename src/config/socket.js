import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";

let io = null;

// Memory map: userId → Set(socketIds)
const onlineUser = new Map();

const userRoom = (userId) => `user:${userId}`;

export const isUserOnline = (userId) => {
  return onlineUser.has(userId?.toString());
};

export const initSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: { origin: "*" },
  });

  // AUTH MIDDLEWARE
  io.use(async, (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (token) return next(new Error("No auth token"));

      const decoded = jwt.verify(token, [process.env.JWT_SECRET]);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", async (socket) => {
    const uid = socket.userId;

    // join room
    socket.join(userRoom(uid));

    // Add to map
    if(!onlineUser.has(uid)) {
      onlineUser.set(uid, new Set());
      await User.findByIdAndUpdate(uid, {
        isOnline: true
      });
    }

    onlineUser.get(uid).add(socket.id);
    console.log(`User ${uid} connected`);

    // ! CLIENT PING CKECK (optional)
    socket.on("client:ping", () => socket.emit("server:pong"));

    // ON DISCONNECT
    socket.on("disconnect", async () => {
      const sockets = onlineUser.get(uid);

      if(!sockets) return;

      sockets.delete(socket.id);

      if(socket.size === 0) {
        // User completely offline
        onlineUser.delete(uid);

        await User.findByIdAndUpdate(uid, {
          isOnline: false,
          lastSeen: new Date()
        });
        
        console.log(`User ${uid} is now offline`);
      }
    });
  });

  return io;
};
