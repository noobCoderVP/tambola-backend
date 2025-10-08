import express from "express";
import {
    createRoom,
    joinRoom,
    getRoom,
    startGame,
    callItem,
    fetchClaims,
    closeRoom,
    getRoomsByHost,
    verifyMilestone,
} from "../controllers/roomController.js";

const router = express.Router();

// POST /api/rooms  -> create a new room
router.post("/", createRoom);

// GET /api/rooms/host/:hostName  -> get rooms by host name
router.get("/host/:host", getRoomsByHost);

// POST /api/rooms/:code/join  -> join room
router.post("/:code/join", joinRoom);

// GET /api/rooms/:code  -> get room details
router.get("/:code", getRoom);

// POST /api/rooms/:code/start -> start the game (host only)
router.post("/:code/start", startGame);

// POST /api/rooms/:code/call -> host calls next item { hostId, item }
router.post("/:code/call", callItem);

// GET /api/rooms/:code/milestones -> fetch all claims for this room (host only)
router.get("/:code/leaderboard", fetchClaims);

// POST /api/rooms/:code/verify-claim -> host verifies claim { claimId, action }
router.post("/:code/verify-claim", verifyMilestone);

// POST /api/rooms/:code/close -> close/delete room (host only)
router.post("/:code/close", closeRoom);

export default router;
