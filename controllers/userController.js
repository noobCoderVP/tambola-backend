import { User } from "../models/User.js";

/**
 * 🧍 Login or Register a User
 * - Creates a new user if not existing
 * - Updates socket info and room if provided
 */
export const loginUser = async (req, res) => {
    try {
        const { name, socketId, roomCode, isHost } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        let user = await User.findOne({ name: name.trim() });

        if (!user) {
            // Create new user
            user = new User({
                name: name.trim(),
                socketId: socketId || "",
                isHost: isHost || false,
                roomCode: roomCode || "",
            });
            await user.save();
        } else {
            // Update existing user with new info
            user.socketId = socketId || user.socketId;
            user.isHost = isHost ?? user.isHost;
            user.roomCode = roomCode || user.roomCode;
            await user.save();
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * 👥 Get All Users (optional admin use)
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * 🔄 Update User Room or Socket Info
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { socketId, roomCode, isHost } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { socketId, roomCode, isHost },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * ❌ Delete User (on disconnect or cleanup)
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};
