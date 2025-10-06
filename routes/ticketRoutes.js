import express from "express";
import {
    createTicket,
    getTicketsByRoom,
    markItem,
} from "../controllers/ticketController.js";

const router = express.Router();

// POST /api/tickets — Create new ticket
router.post("/", createTicket);

// GET /api/tickets/room/:roomCode — Get tickets by room
router.get("/room/:roomCode", getTicketsByRoom);

// PATCH /api/tickets/:ticketId/mark — Mark an item in ticket
router.patch("/:ticketId/mark", markItem);

export default router;
