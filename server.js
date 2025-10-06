import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { User } from "./models/User.js";
import { Room } from "./models/Room.js";
import {connectDB} from './config/db.js'

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
// Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    // --- JOIN ROOM ---
    socket.on("join-room", async ({ roomCode, userName, isHost }) => {
        try {
            let user = await User.findOne({ name: userName });
            if (!user)
                user = await User.create({
                    name: userName,
                    socketId: socket.id,
                    isHost,
                    roomCode,
                });
            else
                (user.socketId = socket.id),
                    (user.roomCode = roomCode),
                    await user.save();

            let room = await Room.findOne({ code: roomCode });
            if (!room && isHost) {
                room = await Room.create({
                    code: roomCode,
                    host: user._id,
                    players: [user._id],
                });
            } else if (room && !room.players.includes(user._id)) {
                room.players.push(user._id);
                await room.save();
            }

            socket.join(roomCode);
            io.to(roomCode).emit("user-joined", { userName });
        } catch (err) {
            console.error(err);
        }
    });

    // --- START GAME ---
    socket.on("start-game", async ({ roomCode }) => {
        await Room.findOneAndUpdate({ code: roomCode }, { isActive: true });
        io.to(roomCode).emit("game-started");
    });

    // --- NEW CODE CALLED ---
    socket.on("new-code", async ({ roomCode, code }) => {
        const room = await Room.findOneAndUpdate(
            { code: roomCode },
            { $push: { calledCodes: code } },
            { new: true }
        );
        io.to(roomCode).emit("code-called", room.calledCodes);
    });

    // --- CLAIM EVENT ---
    socket.on("claim", async ({ roomCode, userName, claimType }) => {
        const user = await User.findOne({ name: userName });
        const room = await Room.findOne({ code: roomCode });

        room.claims.push({ user: user._id, claimType });
        await room.save();

        // Alert host (host can verify later)
        io.to(roomCode).emit("claim-received", { userName, claimType });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", async () => {
        const user = await User.findOneAndUpdate(
            { socketId: socket.id },
            { socketId: null }
        );
        if (user) console.log(`🔴 User disconnected: ${user.name}`);
    });
});

app.use("/api/v1/users", (await import("./routes/userRoutes.js")).default);
app.use("/api/v1/rooms", (await import("./routes/roomRoutes.js")).default);
app.use("/api/v1/tickets", (await import("./routes/ticketRoutes.js")).default);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
