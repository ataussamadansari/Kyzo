import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import "./cron/delete-expired-users.js";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

dotenv.config();

const server = http.createServer(app);

// Initialize Socket.IO with authentication
initSocket(server);

connectDB().catch((err) => console.error("DB connection failed:", err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
