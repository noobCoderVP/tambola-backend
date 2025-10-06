import { Ticket } from "../models/Ticket.js";
import { generateTicket } from "../utils/generateTicket.js";

// 🎟️ Create a new ticket
export const createTicket = async (req, res) => {
    try {
        const { user, roomCode } = req.body;

        if (!user || !roomCode) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const ticketString = generateTicket();

        const newTicket = new Ticket({
            user,
            roomCode,
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
        const { roomCode } = req.params;
        const tickets = await Ticket.find({ roomCode }).populate(
            "user",
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
        const { item } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket)
            return res.status(404).json({ message: "Ticket not found" });

        if (!ticket.markedItems.includes(item)) {
            ticket.markedItems.push(item);
            await ticket.save();
        }

        res.json(ticket);
    } catch (error) {
        console.error("Error marking item:", error);
        res.status(500).json({ message: "Server error" });
    }
};
