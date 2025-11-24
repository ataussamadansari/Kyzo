import express from "express";
import { forgotPassword, login, register, resetPassword, setAvatar, setUsername } from "../controllers/auth-controller.js";
import { auth } from '../middlewares/auth-middleware.js';
import { upload } from "../config/multer.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/username", auth, setUsername);
authRouter.post("/set-avatar", auth, upload.single("image"), setAvatar);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

export default authRouter;
