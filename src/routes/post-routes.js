import express from "express";

import {
  createPost,
  getPost,
  getFeed,
  editPost,
  deletePost,
  toggleLike,
  sharePost,
  reportPost,
} from "../controllers/post-controller.js";

import {
  addComment,
  likeComment,
  deleteComment,
} from "../controllers/comment-controller.js";
import { auth } from "../middlewares/auth-middleware.js";
import { uploadPost } from "../config/upload-post.js";

const postRouter = express.Router();

// POSTS CRUD
postRouter.post("/create", auth, uploadPost, createPost);
postRouter.get("/feed", auth, getFeed);
postRouter.get("/:id", auth, getPost);
postRouter.put("/:id", auth, editPost);
postRouter.delete("/:id", auth, deletePost);

// LIKE POST
postRouter.put("/like/:id", auth, toggleLike);

// SHARE
postRouter.put("/share/:id", auth, sharePost);

// REPORT POST
postRouter.post("/report/:id", auth, reportPost);

// COMMENTS
postRouter.post("/:postId/comment", auth, addComment);
postRouter.put("/comment/like/:id", auth, likeComment);
postRouter.delete("/comment/:id", auth, deleteComment);

export default postRouter;
