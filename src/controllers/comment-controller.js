export const addComment = async (req, res) => {
  try {
    const { text, mentions = [], parent = null } = req.body;

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user.id,
      text,
      mentions,
      parent,
    });

    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });

    const populated = await comment.populate("user", "name username avatar");

    res.status(201).json({ success: true, comment: populated });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted)
      return res.status(404).json({ message: "Comment not found" });

    const userId = req.user.id;
    const liked = comment.likes.includes(userId);

    if (liked) {
      comment.likes.pull(userId);
      comment.likesCount--;
    } else {
      comment.likes.push(userId);
      comment.likesCount++;
    }

    await comment.save();

    res.json({ success: true, liked: !liked, likesCount: comment.likesCount });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!comment)
      return res.status(404).json({ message: "Comment not found" });

    comment.isDeleted = true;
    await comment.save();

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: "Comment deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
