import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendPushNotificationToUser } from "./push.js"; // implement separately


let io = null;

/**
 * online users: Map<userId, Set<socketId>>
 * so one user can have multiple sockets (mobile + web)
 */
const onlineUser = new Map();

/**
 * initSocket(server, options)
 * - can once from server.js after http server creation
 */
export const initSocket = (server, options = {}) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: options.corsOrigin || "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization"],
    },
  });

  // Auth middleware: verify JWT in handshake.auth.token or Authorization header
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        (socket.handshake.headers?.authorization || "").replace(
          "Bearer ",
          ""
        ) ||
        socket.handshake.query?.token;

      if (!token) return next(new Error("Authentication error: token missing"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        "_id name username avatar"
      );

      if (!user) return next(new Error("Authentication error: user not found"));
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    // Join per-user room (useful for emit to all sockets of the user)
    socket.join(userRoom(uid));

    // track socket id for this user
    if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
    onlineUsers.get(uid).add(socket.id);

    console.log(
      `Socket connected: ${socket.id} (user: ${uid}). totalSockets=${
        onlineUsers.get(uid).size
      }`
    );

    // Optional: expose presence event
    io.to(userRoom(uid)).emit("presence:online", { userId: uid });

    // Optional handlers from client
    socket.on("client:ping", () => socket.emit("server:pong"));

    socket.on("disconnect", () => {
      const set = onlineUsers.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(uid);
          // notify others that this user is offline
          io.to(userRoom(uid)).emit("presence:offline", { userId: uid });
        }
      }
      console.log(`Socket disconnected: ${socket.id} (user: ${uid}).`);
    });
  });

  return io;
};

/* ---------- helper utilities ---------- */

const userRoom = (userId) => `user:${userId}`;

export const isUserOnline = (userId) => {
  const set = onlineUsers.get(userId.toString());
  return Boolean(set && set.size > 0);
};

export const getUserSocketIds = (userId) => {
  const set = onlineUsers.get(userId.toString());
  return set ? Array.from(set) : [];
};

/* ---------- emit helpers ---------- */

// Generic emitter to all sockets in user's room
export const emitToUser = (userId, eventName, payload) => {
  if (!io) return;
  io.to(userRoom(userId)).emit(eventName, payload);
};

// Emit to multiple users
export const emitToUsers = (userIds, eventName, payload) => {
  if (!io) return;
  for (const id of userIds) {
    io.to(userRoom(id)).emit(eventName, payload);
  }
};

/* ---------- high-level notification helpers ---------- */
/**
 * Each helper:
 * 1) writes Notification DB (if not already done by the controller), OR controllers may create DB entries and then call these helpers to emit
 * 2) emits socket event to target user if online
 * 3) if offline -> optionally send push via FCM (implement sendPushNotificationToUser)
 *
 * NOTE: your controllers already create Notification records. It's fine to call emit helpers AFTER DB creation.
 */

// Simple helper to ensure payload shape
const makePayload = (type, sender, meta = {}) => ({
  type,
  sender,
  ...meta,
  timestamp: new Date(),
});

// follow event
export const notifyFollow = async (
  targetUserId,
  senderObj,
  notificationId = null
) => {
  const payload = makePayload("follow", senderObj, { notificationId });
  emitToUser(targetUserId, "follow", payload);

  // fallback: push if offline
  if (!isUserOnline(targetUserId)) {
    // get push tokens for target user from DB (implement in push.js)
    await sendPushNotificationToUser(targetUserId, {
      title: `${senderObj.name} followed you`,
      body: `${senderObj.name} started following you.`,
      data: { type: "follow", senderId: senderObj._id },
    });
  }
};

// unfollow
export const notifyUnfollow = (targetUserId, senderObj) => {
  const payload = makePayload("unfollow", senderObj);
  emitToUser(targetUserId, "unfollow", payload);
  // usually unfollow doesn't need push
};

// follow request (private accounts)
export const notifyFollowRequest = async (
  targetUserId,
  senderObj,
  requestId = null
) => {
  const payload = makePayload("follow_request", senderObj, { requestId });
  emitToUser(targetUserId, "follow_request", payload);
  if (!isUserOnline(targetUserId)) {
    await sendPushNotificationToUser(targetUserId, {
      title: `Follow request from ${senderObj.name}`,
      body: `${senderObj.name} requested to follow you.`,
      data: { type: "follow_request", senderId: senderObj._id },
    });
  }
};

// request accepted
export const notifyRequestAccepted = async (
  requesterId,
  accepterObj,
  notificationId = null
) => {
  const payload = makePayload("request_accepted", accepterObj, {
    notificationId,
  });
  emitToUser(requesterId, "request_accepted", payload);
  if (!isUserOnline(requesterId)) {
    await sendPushNotificationToUser(requesterId, {
      title: `${accepterObj.name} accepted your request`,
      body: `You can now see ${accepterObj.name}'s posts.`,
      data: { type: "request_accepted", accepterId: accepterObj._id },
    });
  }
};

// follow_back (mutual)
export const notifyFollowBack = async (
  targetUserId,
  senderObj,
  notificationId = null
) => {
  const payload = makePayload("follow_back", senderObj, { notificationId });
  emitToUser(targetUserId, "follow_back", payload);
  if (!isUserOnline(targetUserId)) {
    await sendPushNotificationToUser(targetUserId, {
      title: `${senderObj.name} followed you back`,
      body: `You and ${senderObj.name} are now following each other.`,
      data: { type: "follow_back", senderId: senderObj._id },
    });
  }
};

// generic notification emitter (if you want central flow)
export const notifyGeneric = async (targetUserId, payload, push = true) => {
  emitToUser(targetUserId, "notification", payload);
  if (push && !isUserOnline(targetUserId)) {
    await sendPushNotificationToUser(targetUserId, {
      title: payload.title || "New notification",
      body: payload.body || "",
      data: payload.data || {},
    });
  }
};




// ---------------------------------------------------

// import { Server } from "socket.io";

// let io;
// const onlineUser = new Map(); //userId → socketId

// export const initSocket = (server) => {
//   io = new Server(server, {
//     cors: {
//       origin: "*",
//     },
//   });

//   io.on("connection", (socket) => {
//     // user join with id
//     socket.on("join", (userId) => {
//       onlineUser.set(userId, socket.id);
//     });

//     // cleanup on disconnect
//     socket.on("disconnect", () => {
//       for (const [uid, sid] of onlineUser.entries()) {
//         if (sid === socket.id) {
//           onlineUser.delete(uid);
//         }
//       }
//     });
//   });
// };

// export const sendNotification = (userId, data) => {
//   const socketId = onlineUser.get(userId.toString());
//   if (socketId) {
//     io.to(socketId).emit("notification", data);
//   }
// };
