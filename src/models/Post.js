import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: String,
});

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ["gps", "custom"], default: "custom" },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  name: String, // place name or custom location
});

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason: String,
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    // Owner of post
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Description
    description: { type: String, default: "" },

    // Mentioned users @username
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Tags #hashtag
    tags: [String],

    // Photos & Videos
    images: [mediaSchema],
    videos: [mediaSchema],

    // Post Type: normal Post / Reel / Story
    type: {
      type: String,
      enum: ["post", "reel", "story"],
      default: "post",
    },

    // Location
    location: locationSchema,

    // Likes
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },

    // Comments
    commentsCount: { type: Number, default: 0 },

    // Share count
    shareCount: { type: Number, default: 0 },

    // Reports
    reports: [reportSchema],
    reportsCount: { type: Number, default: 0 },

    // Story expiry (24h)
    expiresAt: Date,

    // Soft delete
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
