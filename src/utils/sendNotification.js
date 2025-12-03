import admin from "./firebase.js";

export const sendNotification = async (tokens, title, body, data = {}) => {
  try {
    const message = {
      notification: { title, body },
      data,
      tokens,  // array of device tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.log("Notification Error:", error);
  }
};
