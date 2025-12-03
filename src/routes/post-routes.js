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
  getUserPosts,
  getPostComments,
} from "../controllers/post-controller.js";

import {
  addComment,
  likeComment,
  deleteComment,
} from "../controllers/comment-controller.js";
import { auth } from "../middlewares/auth-middleware.js";
import { uploadPost } from "../config/upload-post.js";

const postRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management operations
 */

/**
 * @swagger
 * /api/post/create:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Post description/caption
 *               type:
 *                 type: string
 *                 enum: [post, reel, story]
 *                 default: post
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to mention
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of hashtags
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 10 images
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 5 videos
 *               lat:
 *                 type: number
 *                 description: Latitude for GPS location
 *               lng:
 *                 type: number
 *                 description: Longitude for GPS location
 *               locationName:
 *                 type: string
 *                 description: Location name
 *               locationType:
 *                 type: string
 *                 enum: [gps, custom]
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
postRouter.post("/create", auth, uploadPost, createPost);

/**
 * @swagger
 * /api/post/feed:
 *   get:
 *     summary: Get user feed
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Posts per page
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
postRouter.get("/feed", auth, getFeed);

/**
 * @swagger
 * /api/post/user/{userId}:
 *   get:
 *     summary: Get posts by user ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User posts retrieved
 */
postRouter.get("/user/:userId", auth, getUserPosts);

/**
 * @swagger
 * /api/post/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comments retrieved
 */
postRouter.get("/:postId/comments", auth, getPostComments);

/**
 * @swagger
 * /api/post/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
postRouter.get("/:id", auth, getPost);

/**
 * @swagger
 * /api/post/{id}:
 *   put:
 *     summary: Edit a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [gps, custom]
 *                   name:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found or unauthorized
 */
postRouter.put("/:id", auth, editPost);

/**
 * @swagger
 * /api/post/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 */
postRouter.delete("/:id", auth, deletePost);

/**
 * @swagger
 * /api/post/like/{id}:
 *   put:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post like toggled
 */
postRouter.put("/like/:id", auth, toggleLike);

/**
 * @swagger
 * /api/post/share/{id}:
 *   put:
 *     summary: Share a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post shared
 */
postRouter.put("/share/:id", auth, sharePost);

/**
 * @swagger
 * /api/post/report/{id}:
 *   post:
 *     summary: Report a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post reported
 */
postRouter.post("/report/:id", auth, reportPost);

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment operations
 */

/**
 * @swagger
 * /api/post/{postId}/comment:
 *   post:
 *     summary: Add comment to post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Comment text content
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to mention
 *               parent:
 *                 type: string
 *                 description: Parent comment ID for replies
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Post not found
 */
postRouter.post("/:postId/comment", auth, addComment);

/**
 * @swagger
 * /api/post/comment/like/{id}:
 *   put:
 *     summary: Like or unlike a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment like toggled
 */
postRouter.put("/comment/like/:id", auth, likeComment);

/**
 * @swagger
 * /api/post/comment/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 */
postRouter.delete("/comment/:id", auth, deleteComment);

export default postRouter;
