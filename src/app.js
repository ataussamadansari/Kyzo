import express from "express";
import cors from "cors";
import authRouter from "./routes/auth-routes.js";
import userRouter from "./routes/user-routes.js";
import notificationRouter from "./models/Notification.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user/", userRouter);
app.use("/api/notifications", notificationRouter);

export default app;