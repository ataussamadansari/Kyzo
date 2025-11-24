import express from "express";
import { login, register, setAvatar, setUsername } from "../controllers/auth-controller.js";
import { auth } from '../middlewares/auth-middleware.js';
import { upload } from "../config/multer.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/username", auth, setUsername);
authRouter.post("/set-avatar", auth, upload.single("image"), setAvatar);

export default authRouter;
