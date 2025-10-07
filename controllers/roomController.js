import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { Ticket } from "../models/Ticket.js";
import { diwaliSymbols } from "../data/symbols.js";

/** Helper: generate a short room code (simple) */
const generateRoomCode = (len = 4) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
};

/** Helper: parse ticketString to rows (ticketString uses "\" between rows and "," between items) */
const parseTicketString = (ticketString) => {
    if (!ticketString) return [];
    // stored with single backslashes; in JS strings it's fine
    const rows = ticketString.split("\\");
    return rows.map((r) => (r === "" ? [] : r.split(",").filter(Boolean)));
};

/** Create room (anyone can host) */
export const createRoom = async (req, res) => {
    try {
        let { host, code } = req.body;
        if (!host)
            return res.status(400).json({ message: "host required" });

        // 🔹 Find or create host user
        const hostFound = await User.find({ username: host });
        if (!hostFound) {
            return res.status(400).json({ message: "Please register the host user first." });
        }

        const existingRoom = await Room.find({ code: code, isActive: true });
        if(existingRoom.length > 0)
            return res.status(400).json({ message: "Room code already in use. Please choose a different code." });

        // 🔹 Create room
        const room = new Room({
            code: code,
            host: host,
            players: [],
            isActive: false,
            calledCodes: [],
            milestonesClaimed: [],
        });

        await room.save();

        res.status(201).json(room);
    } catch (error) {
        console.error("createRoom error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Join a room */
export const joinRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const { player, socketId } = req.body;

        if (!player)
            return res.status(400).json({ message: "player required" });

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Try to find user by name
        let user = await User.findOne({ username: player });
        if(!user)
            return res.status(404).json({ message: "User not found. Please register first." });

        // Add if not already present
        if (!room.players.map(String).includes(String(user.username))) {
            room.players.push(user.username);
            await room.save();
        }
        
        res.json(room);
    } catch (error) {
        console.error("joinRoom error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Get room detail (populate players & host) */
export const getRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });
        res.json(room);
    } catch (error) {
        console.error("getRoom error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Start game (host only) -> set isActive true and clear history */
export const startGame = async (req, res) => {
    try {
        const { code, host } = req.body;
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (String(room.host) !== String(host))
            return res
                .status(403)
                .json({ message: "Only host can start the game" });

        room.isActive = true;
        room.calledCodes = [];
        room.milestonesClaimed = [];
        await room.save();

        res.json(room);
    } catch (error) {
        console.error("startGame error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Call next item (host action). Automatically picks a random uncalled symbol */
export const callItem = async (req, res) => {
    try {
        const { host } = req.body;
        const { code } = req.params; // Assuming route: /rooms/:code/call

        if (!code)
            return res.status(400).json({ message: "Room code required" });

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        if (String(room.host) !== String(host))
            return res
                .status(403)
                .json({ message: "Only host can call items" });

        // Get all available 2-letter symbol codes
        const allItems = Object.keys(diwaliSymbols);

        // Filter out already called ones
        const remainingItems = allItems.filter(
            (item) => !room.calledCodes.includes(item)
        );

        if (remainingItems.length === 0) {
            return res
                .status(200)
                .json({ message: "All items have been called!", item: null });
        }

        // Pick one random symbol from the remaining list
        const randomIndex = Math.floor(Math.random() * remainingItems.length);
        const calledItem = remainingItems[randomIndex];

        // Save to DB
        room.calledCodes.push(calledItem);
        await room.save();

        res.json({
            message: `🪔 Called: ${calledItem} (${diwaliSymbols[calledItem]})`,
            item: calledItem,
            meaning: diwaliSymbols[calledItem],
            calledCodes: room.calledCodes,
        });
    } catch (error) {
        console.error("callItem error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Get all rooms hosted by a specific user */
export const getRoomsByHost = async (req, res) => {
    try {
        const { host } = req.params;
        if (!host) {
            return res.status(400).json({ message: "host is required" });
        }

        // find the host user
        const hostFound = await User.findOne({ username: host });
        if (!hostFound) {
            return res.status(404).json({ message: "Host not found" });
        }

        // find all rooms where this user is the host
        const rooms = await Room.find({ host });

        if (!rooms || rooms.length === 0) {
            return res.status(404).json({ message: "No rooms found for this host" });
        }

        res.json(rooms);
    } catch (error) {
        console.error("getRoomsByHost error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/** Get called history */
export const getHistory = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });
        res.json({ calledCodes: room.calledCodes });
    } catch (error) {
        console.error("getHistory error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
/** Player raises a milestone claim */
export const claimMilestone = async (req, res) => {
    try {
        const { code } = req.params;
        const { player, type } = req.body;

        if (!player || !type)
            return res.status(400).json({ message: "player and type required" });

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Prevent duplicate claim (pending or already accepted)
        const existing = room.claims.find(
            (c) =>
                c.username === player &&
                c.claimType === type &&
                c.status !== "rejected"
        );
        if (existing)
            return res.status(400).json({ message: "Claim already pending or accepted" });

        // Add new pending claim
        room.claims.push({ username: player, claimType: type, status: "pending" });
        await room.save();

        res.json({ success: true, message: "Claim raised — pending host verification" });
    } catch (error) {
        console.error("claimMilestone error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/** Host verifies a player's milestone claim */
export const verifyMilestone = async (req, res) => {
    try {
        const { code } = req.params;
        const { player, type } = req.body;

        if (!player || !type)
            return res.status(400).json({ message: "player, and type required" });

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        const user = await User.findOne({ username: player });
        if (!user) return res.status(404).json({ message: "User not found" });

        const ticket = await Ticket.findOne({ username: player, code });
        if (!ticket)
            return res.status(404).json({ message: "Ticket not found for this user" });

        // --- Parse and check ticket ---
        const ticketRows = parseTicketString(ticket.ticketString);
        const allItems = ticketRows.flat().filter(Boolean);
        const calledSet = new Set(room.calledCodes);

        let valid = false;

        switch (type) {
            case "First Five":
                valid = allItems.filter((it) => calledSet.has(it)).length >= 5;
                break;
            case "Line Top":
                valid = ticketRows[0]?.every((it) => calledSet.has(it));
                break;
            case "Line Middle":
                valid = ticketRows[1]?.every((it) => calledSet.has(it));
                break;
            case "Line Bottom":
                valid = ticketRows[2]?.every((it) => calledSet.has(it));
                break;
            case "Full House":
                valid = allItems.length > 0 && allItems.every((it) => calledSet.has(it));
                break;
            default:
                return res.status(400).json({ message: "Unknown milestone type" });
        }

        if(!valid)
            return res.status(400).json({ message: "Claim verification failed. Ticket does not satisfy the milestone criteria." });

        // Find pending claim
        const claim = room.claims.find(
            (c) => c.username === player || c.claimType === type
        );
        if (claim)
            return res.status(400).json({ message: "No pending claim found for this type or User is already a winner!" });

        room.claims.push({username: player, claimType: type});
        await room.save();

        res.json({
            success: true,
            type: type,
            message: "Claimed Successfully!"
        });
    } catch (error) {
        console.error("verifyMilestone error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/** Close or delete a room (host only) */
export const closeRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const { host } = req.body;
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (String(room.host) !== String(host))
            return res
                .status(403)
                .json({ message: "Only host can close the room" });

        await Room.deleteOne({ code: room.code });

        res.json({ message: "Room closed" });
    } catch (error) {
        console.error("closeRoom error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
