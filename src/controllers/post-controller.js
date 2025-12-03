import Post from "../models/Post.js";
import { uploadPostToCloudinary } from "../utils/cloudinary-post-upload.js";

export const createPost = async (req, res) => {
  try {
    const {
      description = "",
      mentions = [],
      tags = [],
      type = "post",
      lat,
      lng,
      locationName,
      locationType
    } = req.body;

    let expiresAt = null;
    if (type === "story") {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Upload Images & Videos
    const images = [];
    const videos = [];

    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadPostToCloudinary(file.buffer, "posts/images");
        images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    if (req.files?.videos) {
      for (const file of req.files.videos) {
        const result = await uploadPostToCloudinary(file.buffer, "posts/videos");
        videos.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // Create Post
    const post = await Post.create({
      user: req.user.id,
      description,
      mentions,
      tags,
      images,
      videos,
      type,
      location:
        lat && lng
          ? { type: "gps", coordinates: { lat, lng }, name: locationName }
          : { type: "custom", name: locationName },
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: "Post created",
      post,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getPost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("user", "name username avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeed = async (req, res) => {
  try {
    const posts = await Post.find({ isDeleted: false })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const editPost = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["description", "tags", "mentions", "images", "videos", "location"];

    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true }
    );

    if (!post) return res.status(404).json({ message: "Post not found or unauthorized" });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || post.isDeleted)
      return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const liked = post.likes.includes(userId);

    if (liked) {
      post.likes.pull(userId);
      post.likesCount--;
    } else {
      post.likes.push(userId);
      post.likesCount++;
    }

    await post.save();

    res.json({
      success: true,
      liked: !liked,
      likesCount: post.likesCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.shareCount++;
    await post.save();

    res.json({ success: true, shareCount: post.shareCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const reportPost = async (req, res) => {
  try {
    const { reason } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.reports.push({ user: req.user.id, reason });
    post.reportsCount++;

    await post.save();

    res.json({ success: true, message: "Post reported" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
