import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      // unique: true,
      default: "",
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "sub-admin", "user"],
      default: "user",
      lowercase: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    avatarId: {
      type: String,
      default: "",
      select: false,
    },
    bio: {
      type: String,
      default: "",
    },
    isPrivate: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
    deleteAt: { type: Date, default: null },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
