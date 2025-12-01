import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import e from "cors";
import { unfollowUser } from "../controllers/follows-controller.js";

let io = null;

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

  // ---------------- AUTH MIDDLEWARE ----------------
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("No auth token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Auth failed"));
    }
  });

  // ---------------- CONNECTION ----------------
  io.on("connection", async (socket) => {
    const uid = socket.userId;

    socket.join(userRoom(uid));

    if (!onlineUser.has(uid)) {
      onlineUser.set(uid, new Set());
      await User.findByIdAndUpdate(uid, {
        isOnline: true,
        lastSeen: null,
      });
    }

    onlineUser.get(uid).add(socket.id);
    console.log(`User ${uid} connected`);

    // Ping
    socket.on("client:ping", () => socket.emit("server:pong"));

    // ---------------- DISCONNECT ----------------
    socket.on("disconnect", async () => {
      const sockets = onlineUser.get(uid);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUser.delete(uid);

        await User.findByIdAndUpdate(uid, {
          isOnline: false,
          lastSeen: new Date(),
        });

        console.log(`User ${uid} is now offline`);
      }
    });
  });

  return io;
};

// ============== SOCKET HELPER FUNCTIONS ==============

// Send notification to specific user
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, data);
};

// Follow notification
export const notifyFollow = async (
  targetUserId,
  followerData,
  notificationId
) => {
  emitToUser(targetUserId, "notification:follow", {
    type: "follow",
    sender: followerData,
    notificationId,
    timestamp: new Date(),
  });

  // Update follower count
  const followerCount = await User.findById(targetUserId).select(
    "followersCount"
  );
  emitToUser(targetUserId, "update:followers_count", {
    count: followerCount?.followersCount || 0,
  });
};

// Unfollow notification
export const notifyUnfollow = async (targetUserId, unfollowerData) => {
  const followerCount = await User.findById(targetUserId).select(
    "followersCount"
  );
  emitToUser(targetUserId, "update:followers_count", {
    count: followerCount?.followersCount || 0,
  });
};

// Follow request notification
export const notifyFollowRequest = async (
  targetUserId,
  requesterData,
  notificationId
) => {
  emitToUser(targetUserId, "notification:follow_request", {
    type: "follow_request",
    sender: requesterData,
    notificationId,
    timestamp: new Date(),
  });
};

// Follow back notification
export const notifyFollowBack = async (
  targetUserId,
  followerData,
  notificationId
) => {
  emitToUser(targetUserId, "notification:follow_back", {
    type: "follow_back",
    sender: followerData,
    notificationId,
    timestamp: new Date(),
  });

  // Update following count
  const followingCount = await User.findById(targetUserId).select(
    "followingCount"
  );
  emitToUser(targetUserId, "update:following_count", {
    count: followingCount?.followingCount || 0,
  });
};

// Request accepted notification
export const notifyRequestAccepted = async (
  requesterUserId,
  accepterData,
  notificationId
) => {
  emitToUser(requesterUserId, "notification:request_accepted", {
    type: "request_accepted",
    sender: accepterData,
    notificationId,
    timestamp: new Date(),
  });

  // Update following count for requester
  const followingCount = await User.findById(requesterUserId).select(
    "followingCount"
  );
  emitToUser(requesterUserId, "update:following_count", {
    count: followingCount?.followingCount || 0,
  });
};

// Request rejected notification
export const notifyRequestRejected = async (
  requesterUserId,
  rejecterData,
  notificationId
) => {
  emitToUser(requesterUserId, "notification:request_rejected", {
    type: "request_rejected",
    sender: rejecterData,
    notificationId,
    timestamp: new Date(),
  });
};
