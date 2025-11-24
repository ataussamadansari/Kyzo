import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import "./cron/delete-expired-users.js";
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

connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));