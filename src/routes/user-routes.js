import express from "express";
import { auth } from "../middlewares/auth-middleware.js"
import { changePassword, deleteAccount, getSuggestedUsers, getUserProfile, getUserProfileById, me, recoverAccount, status, updateMe } from "../controllers/user-controller.js";
import { acceptFollowRequest, followUser, getFollower, getFollowing, getFollowRequests, getUserFollower, getUserFollowing, rejectFollowRequest, unfollowUser } from "../controllers/follows-controller.js";

const userRouter = express.Router();

userRouter.get('/status/:id', auth, status);
userRouter.get('/me', auth, me);
userRouter.put('/update', auth, updateMe);
userRouter.put('/change-password', auth, changePassword);

userRouter.get('/u/:username', auth, getUserProfile);
userRouter.get("/id/:id", auth, getUserProfileById);

userRouter.get('/suggested', auth, getSuggestedUsers);

userRouter.get('/followers', auth, getFollower);
userRouter.get('/following', auth, getFollowing);
userRouter.get('/:id/followers', auth, getUserFollower);
userRouter.get('/:id/following', auth, getUserFollowing);
userRouter.post('/follow/:id', auth, followUser);
userRouter.post('/unfollow/:id', auth, unfollowUser);
userRouter.get("/follow-requests", auth, getFollowRequests);
userRouter.post("/follow-request/accept/:id", auth, acceptFollowRequest);
userRouter.post("/follow-request/reject/:id", auth, rejectFollowRequest);

userRouter.delete('/delete', auth, deleteAccount);
userRouter.put('/recover', auth, recoverAccount);

export default userRouter;
