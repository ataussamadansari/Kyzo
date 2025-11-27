// config/push.js (example)
import admin from "firebase-admin";
import User from "../models/User.js";

export const sendPushNotificationToUser = async (userId, { title, body, data }) => {
  try {
    const user = await User.findById(userId).select("pushTokens"); // assume pushTokens: [string]
    if (!user || !user.pushTokens || user.pushTokens.length === 0) return;

    const message = {
      notification: { title, body },
      data: { ...data, click_action: "FLUTTER_NOTIFICATION_CLICK" },
      tokens: user.pushTokens,
    };
    // admin must be initialized elsewhere with serviceAccount
    const response = await admin.messaging().sendMulticast(message);
    return response;
  } catch (err) {
    console.error("Push send error:", err);
  }
};
