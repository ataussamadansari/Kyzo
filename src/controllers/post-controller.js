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
    })
      .populate("user", "name username avatar bio isVerified")
      .populate("mentions", "name username avatar");

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isDeleted: false })
      .populate("user", "name username avatar bio isVerified")
      .populate("mentions", "name username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ isDeleted: false });

    res.json({ 
      success: true, 
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const editPost = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["description", "tags", "mentions", "location"];

    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, isDeleted: false },
      updates,
      { new: true }
    ).populate("user", "name username avatar");

    if (!post) return res.status(404).json({ success: false, message: "Post not found or unauthorized" });

    res.json({ success: true, message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!post) return res.status(404).json({ success: false, message: "Post not found or already deleted" });

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || post.isDeleted)
      return res.status(404).json({ success: false, message: "Post not found" });

    const userId = req.user.id;
    const liked = post.likes.includes(userId);

    if (liked) {
      post.likes.pull(userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(userId);
      post.likesCount++;
    }

    await post.save();

    res.json({
      success: true,
      message: liked ? "Post unliked" : "Post liked",
      liked: !liked,
      likesCount: post.likesCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || post.isDeleted) 
      return res.status(404).json({ success: false, message: "Post not found" });

    post.shareCount++;
    await post.save();

    res.json({ success: true, message: "Post shared", shareCount: post.shareCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const reportPost = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Report reason is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) 
      return res.status(404).json({ success: false, message: "Post not found" });

    // Check if user already reported this post
    const alreadyReported = post.reports.some(
      report => report.user.toString() === req.user.id
    );

    if (alreadyReported) {
      return res.status(400).json({ success: false, message: "You have already reported this post" });
    }

    post.reports.push({ user: req.user.id, reason: reason.trim() });
    post.reportsCount++;

    await post.save();

    res.json({ success: true, message: "Post reported successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      user: userId, 
      isDeleted: false,
      type: { $ne: 'story' } // Exclude stories
    })
      .populate("user", "name username avatar bio isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ 
      user: userId, 
      isDeleted: false,
      type: { $ne: 'story' }
    });

    res.json({ 
      success: true, 
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const Comment = (await import("../models/Comment.js")).default;
    
    const comments = await Comment.find({ 
      post: postId, 
      isDeleted: false,
      parent: null // Only top-level comments
    })
      .populate("user", "name username avatar")
      .populate("mentions", "name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ 
      post: postId, 
      isDeleted: false,
      parent: null
    });

    res.json({ 
      success: true, 
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
