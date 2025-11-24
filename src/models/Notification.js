import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, //receiving user
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId, // who triggered the notification
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "follow",
        "follow_back",
        "follow_request",
        "request_accepted",
        "request_rejected",
        "like",
        "comment",
        "message",
        "mention",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
