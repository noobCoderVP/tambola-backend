import { Ticket } from "../models/Ticket.js";
import { generateTicket } from "../utils/generateTicket.js";

// 🎟️ Create a new ticket
export const createTicket = async (req, res) => {
    try {
        const { username, code } = req.body;

        if (!username || !code) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if ticket already exists for username & code
        const existingTicket = await Ticket.findOne({ username, code });
        if (existingTicket) {
            return res.status(409).json({ message: "Ticket already exists for this username and room" });
        }

        const ticketString = generateTicket();

        const newTicket = new Ticket({
            username,
            code,
            ticketString,
        });

        await newTicket.save();
        res.status(201).json(newTicket);
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🧾 Get all tickets for a room
export const getTicketsByRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const tickets = await Ticket.find({ code }).populate(
            "username",
            "name"
        );
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Mark an item on a ticket
export const markItem = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { markedItems } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket)
            return res.status(404).json({ message: "Ticket not found" });

        ticket.markedItems = markedItems;
        await ticket.save();
        res.json(ticket);
    } catch (error) {
        console.error("Error marking item:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🧾 Get ticket by username and code
export const getTicketByUserAndRoom = async (req, res) => {
    try {
        const { username, code } = req.query;
        if (!username || !code) {
            return res.status(400).json({ message: "Missing username or code" });
        }
        const ticket = await Ticket.findOne({ username, code });
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(ticket);
    } catch (error) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({ message: "Server error" });
    }
};