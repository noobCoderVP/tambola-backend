import { User } from "../models/User.js";

/**
 * 🧍 Login or Register a User
 * - Creates a new user if not existing
 * - Updates socket info and room if provided
 */
export const registerUser = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username?.trim() || !password?.trim()) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        let user = await User.findOne({ username: username.trim() });

        if (!user) {
            // Create new user
            user = new User({
                username: username.trim(),
                password: password.trim(),
            });
            await user.save();
        } else {
            // return response that user already exists
            return res.status(400).json({ message: "User already exists", user });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.trim(), password: password.trim() });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        return res.status(200).json(user);
    }catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error" });
    }   
}

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
 * ❌ Delete User (on disconnect or cleanup)
 */
export const deleteUser = async (req, res) => {
    try {
        const { username } = req.params;
        await User.findOneAndDelete({ username });
        res.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};
