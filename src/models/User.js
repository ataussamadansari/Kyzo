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
      unique: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: [8, "Password must be at least 8 characters long"],
    },
    role: {
      type: String,
      enum: ["admin", "sub-admin", "user"],
      default: "user",
      lowercase: true,
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dnar7ei8b/image/upload/v1764219249/336635642_bc9fd4bd-de9b-4555-976c-8360576c6708_vuwna0.jpg",
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
    links: [
      {
        title: String,
        url: String,
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    isPrivate: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: "" },
    deleted: { type: Boolean, default: false },
    deleteAt: { type: Date, default: "" },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Pre-save middleware to ensure email is always lowercase
userSchema.pre("save", function (next) {
  if (this.email && this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

export default mongoose.model("User", userSchema);
