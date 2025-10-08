import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import morgan from "morgan";
import {connectDB} from './config/db.js'

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev")); // Logs requests to the terminal
// Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    // --- JOIN ROOM EVENT ONLY ---
    socket.on("user-joined", ({ code, username }) => {
        socket.join(code);
        io.to(code).emit("user-joined", username);
    });

    // --- START GAME EVENT ONLY ---
    socket.on("game-started", ({ code }) => {
        console.log(`code ${code} game started`);
        io.to(code).emit("game-started");
    });

    // --- CODE CALLED EVENT ONLY ---
    socket.on("code-called", ({ code, calledCode }) => {
        console.log(`Room ${code} called code ${calledCode}`);
        io.to(code).emit("code-called", calledCode);
    });

    // --- CLAIM EVENT ONLY ---
    socket.on("claim-received", ({ code, player, type }) => {
        console.log(`Room ${code} claim received from ${player} for ${type}`);
        io.to(code).emit("claim-received", { player, type });
    });

    // --- DISCONNECT LOGGING ---
    socket.on("disconnect", () => {
        console.log(`🔴 Socket disconnected: ${socket.id}`);
    });
});

app.use("/api/v1/users", (await import("./routes/userRoutes.js")).default);
app.use("/api/v1/rooms", (await import("./routes/roomRoutes.js")).default);
app.use("/api/v1/tickets", (await import("./routes/ticketRoutes.js")).default);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
