import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

export const addComment = async (req, res) => {
  try {
    const { text, mentions = [], parent = null } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    // Check if post exists
    const post = await Post.findOne({ _id: req.params.postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user.id,
      text: text.trim(),
      mentions,
      parent,
    });

    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });

    const populated = await comment.populate("user", "name username avatar");

    res.status(201).json({ success: true, message: "Comment added", comment: populated });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted)
      return res.status(404).json({ success: false, message: "Comment not found" });

    const userId = req.user.id;
    const liked = comment.likes.includes(userId);

    if (liked) {
      comment.likes.pull(userId);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      comment.likes.push(userId);
      comment.likesCount++;
    }

    await comment.save();

    res.json({ 
      success: true, 
      message: liked ? "Comment unliked" : "Comment liked",
      liked: !liked, 
      likesCount: comment.likesCount 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!comment)
      return res.status(404).json({ success: false, message: "Comment not found or already deleted" });

    comment.isDeleted = true;
    await comment.save();

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: "Comment deleted successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
