import express from "express";
import { auth } from "../middlewares/auth-middleware.js"
import { changePassword, deleteAccount, getSuggestedUsers, getUserProfile, getUserProfileById, me, recoverAccount, status, updateMe } from "../controllers/user-controller.js";
import { acceptFollowRequest, followUser, getFollower, getFollowing, getFollowRequests, getUserFollower, getUserFollowing, rejectFollowRequest, unfollowUser } from "../controllers/follows-controller.js";

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/user/status/{id}:
 *   get:
 *     summary: Get user online status
 *     tags: [Users]
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
 *         description: User status retrieved
 */
userRouter.get('/status/:id', auth, status);

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
userRouter.get('/me', auth, me);

/**
 * @swagger
 * /api/user/update:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated
 */
userRouter.put('/update', auth, updateMe);

/**
 * @swagger
 * /api/user/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
userRouter.put('/change-password', auth, changePassword);

/**
 * @swagger
 * /api/user/u/{username}:
 *   get:
 *     summary: Get user profile by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
userRouter.get('/u/:username', auth, getUserProfile);

/**
 * @swagger
 * /api/user/id/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
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
 *         description: User profile
 */
userRouter.get("/id/:id", auth, getUserProfileById);

/**
 * @swagger
 * /api/user/suggested:
 *   get:
 *     summary: Get suggested users to follow
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suggested users
 */
userRouter.get('/suggested', auth, getSuggestedUsers);

/**
 * @swagger
 * tags:
 *   name: Follows
 *   description: Follow/unfollow operations
 */

/**
 * @swagger
 * /api/user/followers:
 *   get:
 *     summary: Get current user followers
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followers
 */
userRouter.get('/followers', auth, getFollower);

/**
 * @swagger
 * /api/user/following:
 *   get:
 *     summary: Get users current user is following
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of following
 */
userRouter.get('/following', auth, getFollowing);

/**
 * @swagger
 * /api/user/{id}/followers:
 *   get:
 *     summary: Get user followers by ID
 *     tags: [Follows]
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
 *         description: List of followers
 */
userRouter.get('/:id/followers', auth, getUserFollower);

/**
 * @swagger
 * /api/user/{id}/following:
 *   get:
 *     summary: Get users that user is following
 *     tags: [Follows]
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
 *         description: List of following
 */
userRouter.get('/:id/following', auth, getUserFollowing);

/**
 * @swagger
 * /api/user/follow/{id}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follows]
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
 *         description: User followed
 */
userRouter.post('/follow/:id', auth, followUser);

/**
 * @swagger
 * /api/user/unfollow/{id}:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Follows]
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
 *         description: User unfollowed
 */
userRouter.post('/unfollow/:id', auth, unfollowUser);

/**
 * @swagger
 * /api/user/follow-requests:
 *   get:
 *     summary: Get pending follow requests
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of follow requests
 */
userRouter.get("/follow-requests", auth, getFollowRequests);

/**
 * @swagger
 * /api/user/follow-request/accept/{id}:
 *   post:
 *     summary: Accept follow request
 *     tags: [Follows]
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
 *         description: Follow request accepted
 */
userRouter.post("/follow-request/accept/:id", auth, acceptFollowRequest);

/**
 * @swagger
 * /api/user/follow-request/reject/{id}:
 *   post:
 *     summary: Reject follow request
 *     tags: [Follows]
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
 *         description: Follow request rejected
 */
userRouter.post("/follow-request/reject/:id", auth, rejectFollowRequest);

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
userRouter.delete('/delete', auth, deleteAccount);

/**
 * @swagger
 * /api/user/recover:
 *   put:
 *     summary: Recover deleted account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account recovered
 */
userRouter.put('/recover', auth, recoverAccount);

export default userRouter;
