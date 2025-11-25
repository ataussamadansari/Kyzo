import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import dotenv from "dotenv";
import "./cron/delete-expired-users.js";
import connectDB from "./config/db.js";
dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

io.on("connection", (socket) => {
    console.log("🔥 User connected:", socket.id);
});

connectDB().catch((err) => console.error("DB connection failed:", err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));