import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { Ticket } from "../models/Ticket.js";

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
        if(existingRoom)
            return res.status(400).json({ message: "Room code already in use. Please choose a different code." });

        // 🔹 Generate unique room code
        code = code || generateRoomCode();
        while (await Room.find({ code })) {
            code = generateRoomCode();
        }

        // 🔹 Create room
        const room = new Room({
            code: code,
            host: hostFound.username,
            players: [],
            isActive: false,
            calledItems: [],
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
        const { code } = req.params;
        const { host } = req.body;
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (String(room.host) !== String(host))
            return res
                .status(403)
                .json({ message: "Only host can start the game" });

        room.isActive = true;
        room.calledItems = [];
        room.milestonesClaimed = [];
        await room.save();

        res.json(room);
    } catch (error) {
        console.error("startGame error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Call next item (host action). Body: { host, itemCode } */
export const callItem = async (req, res) => {
    try {
        const { code } = req.params;
        const { host, item } = req.body;
        if (!item)
            return res.status(400).json({ message: "item code required" });

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        if (String(room.host) !== String(host))
            return res
                .status(403)
                .json({ message: "Only host can call items" });

        // avoid duplicates
        if (!room.calledItems.includes(item)) {
            room.calledItems.push(item);
            await room.save();
        }

        res.json(room);
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
        res.json({ calledItems: room.calledItems });
    } catch (error) {
        console.error("getHistory error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Claim a milestone
 * POST /api/rooms/:code/claim
 * Body: { player, type } where type in ["earlyFive","lineTop","lineMiddle","lineBottom","fullHouse"]
 */
export const claimMilestone = async (req, res) => {
    try {
        const { code } = req.params;
        const { player, type } = req.body;
        if (!player || !type)
            return res
                .status(400)
                .json({ message: "player and type required" });

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Fetch user properly by name
        const user = await User.findOne({ name: player });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch ticket by userId and code
        const ticket = await Ticket.findOne({
            user: user.username,
            code: code,
        });
        if (!ticket)
            return res
                .status(404)
                .json({ message: "Ticket not found for this user in room" });

        const ticketRows = parseTicketString(ticket.ticketString);
        const allItems = ticketRows.flat().filter(Boolean);
        const calledSet = new Set(room.calledItems);
        const intersectionCount = allItems.filter((it) =>
            calledSet.has(it)
        ).length;

        let valid = false;

        switch (type) {
            case "earlyFive":
                valid = intersectionCount >= 5;
                break;
            case "lineTop":
                if (ticketRows[0] && ticketRows[0].length > 0)
                    valid = ticketRows[0].every((it) => calledSet.has(it));
                break;
            case "lineMiddle":
                if (ticketRows[1] && ticketRows[1].length > 0)
                    valid = ticketRows[1].every((it) => calledSet.has(it));
                break;
            case "lineBottom":
                if (ticketRows[2] && ticketRows[2].length > 0)
                    valid = ticketRows[2].every((it) => calledSet.has(it));
                break;
            case "fullHouse":
                valid =
                    allItems.length > 0 &&
                    allItems.every((it) => calledSet.has(it));
                break;
            default:
                return res
                    .status(400)
                    .json({ message: "Unknown milestone type" });
        }

        if (!valid)
            return res.status(400).json({ message: "Claim is not valid" });

        // check duplicate claim by same user + type
        const already = room.milestonesClaimed.find(
            (m) => String(m.user) === String(user.username) && m.type === type
        );
        if (already)
            return res
                .status(400)
                .json({ message: "Milestone already claimed by this user" });

        room.milestonesClaimed.push({ user: user.username, type });
        await room.save();

        res.json({ success: true, message: "Claim verified", type });
    } catch (error) {
        console.error("claimMilestone error:", error);
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
