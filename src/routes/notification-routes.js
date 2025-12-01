import express from "express";
import { auth } from "../middlewares/auth-middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification-controller.js";

const notificationRouter = express.Router();

// Get all notifications
notificationRouter.get("/", auth, getNotifications);

// Get unread count
notificationRouter.get("/unread-count", auth, getUnreadCount);

// Mark as read
notificationRouter.put("/:notificationId/read", auth, markAsRead);

// Mark all as read
notificationRouter.put("/read-all", auth, markAllAsRead);

// Delete notification
notificationRouter.delete("/:notificationId", auth, deleteNotification);

// Delete all notifications
notificationRouter.delete("/", auth, deleteAllNotifications);

export default notificationRouter;
