import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { Ticket } from "../models/Ticket.js";

/** Helper: generate a short room roomCode (simple) */
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
        let { hostName, roomCode, socketId } = req.body;
        if (!hostName)
            return res.status(400).json({ message: "hostName required" });

        // 🔹 Find or create host user
        let host = await User.findOne({ name: hostName });
        if (!host) {
            host = await User.create({
                name: hostName,
                socketId: socketId || "",
                isHost: true,
            });
        } else {
            host.socketId = socketId || host.socketId;
            host.isHost = true;
            await host.save();
        }

        // 🔹 Generate unique room code
        roomCode = roomCode || generateRoomCode();
        while (await Room.findOne({ roomCode })) {
            roomCode = generateRoomCode();
        }

        // 🔹 Create room
        const room = new Room({
            code: roomCode,
            host: host._id,
            players: [host._id],
            isActive: false,
            calledItems: [],
            milestonesClaimed: [],
        });

        await room.save();

        // 🔹 Update host user info
        host.roomCode = roomCode;
        await host.save();

        res.status(201).json(room);
    } catch (error) {
        console.error("createRoom error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Join a room */
export const joinRoom = async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { playerName, socketId } = req.body;

        if (!playerName)
            return res.status(400).json({ message: "playerName required" });

        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Try to find user by name
        let user = await User.findOne({ name: playerName });
        if (!user) {
            // Create user if not exists
            user = await User.create({
                name: playerName,
                roomCode,
                socketId,
                isHost: String(room.host) === String(playerName), // only host stays true
            });
        } else {
            user.roomCode = roomCode;
            user.socketId = socketId;
            // Preserve host flag if this player is the room host
            user.isHost = String(room.host) === String(user._id);
            await user.save();
        }

        // Add if not already present
        if (!room.players.map(String).includes(String(user._id))) {
            room.players.push(user._id);
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
        const { roomCode } = req.params;
        const room = await Room.findOne({ roomCode })
            .populate("host", "name")
            .populate("players", "name");
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
        const { roomCode } = req.params;
        const { hostId } = req.body;
        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (String(room.host) !== String(hostId))
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

/** Call next item (host action). Body: { hostId, itemCode } */
export const callItem = async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { hostId, item } = req.body;
        if (!item)
            return res.status(400).json({ message: "item roomCode required" });

        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (String(room.host) !== String(hostId))
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
        const { hostName } = req.params;
        if (!hostName) {
            return res.status(400).json({ message: "hostName is required" });
        }

        // find the host user
        const host = await User.findOne({ name: hostName });
        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }

        // find all rooms where this user is the host
        const rooms = await Room.find({ host: host._id })
            .populate("players", "name")
            .populate("host", "name");

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
        const { roomCode } = req.params;
        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(404).json({ message: "Room not found" });
        res.json({ calledItems: room.calledItems });
    } catch (error) {
        console.error("getHistory error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Claim a milestone
 * POST /api/rooms/:roomCode/claim
 * Body: { playerName, type } where type in ["earlyFive","lineTop","lineMiddle","lineBottom","fullHouse"]
 */
export const claimMilestone = async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { playerName, type } = req.body;
        if (!playerName || !type)
            return res
                .status(400)
                .json({ message: "playerName and type required" });

        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Fetch user properly by name
        const user = await User.findOne({ name: playerName });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch ticket by userId and roomCode
        const ticket = await Ticket.findOne({
            user: user._id,
            roomCode: roomCode,
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
            (m) => String(m.user) === String(user._id) && m.type === type
        );
        if (already)
            return res
                .status(400)
                .json({ message: "Milestone already claimed by this user" });

        room.milestonesClaimed.push({ user: user._id, type });
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
        const { roomCode } = req.params;
        const { hostId } = req.body;
        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (String(room.host) !== String(hostId))
            return res
                .status(403)
                .json({ message: "Only host can close the room" });

        await Room.deleteOne({ _id: room._id });

        // optional cleanup of users
        await User.updateMany(
            { roomCode },
            { $set: { roomCode: null, isHost: false } }
        );

        res.json({ message: "Room closed" });
    } catch (error) {
        console.error("closeRoom error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
