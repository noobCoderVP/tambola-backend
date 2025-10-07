import express from "express";
import {
    createTicket,
    getTicketByUserAndRoom,
    getTicketsByRoom,
    markItem,
} from "../controllers/ticketController.js";

const router = express.Router();

// POST /api/tickets — Create new ticket
router.post("/", createTicket);

// GET /api/tickets?user=&roomCode= — Get ticket by user and room
router.get("/", getTicketByUserAndRoom);

// GET /api/tickets/room/:roomCode — Get tickets by room
router.get("/room/:roomCode", getTicketsByRoom);

// PATCH /api/tickets/:ticketId/mark — Mark an item in ticket
router.patch("/:ticketId/mark", markItem);

export default router;
