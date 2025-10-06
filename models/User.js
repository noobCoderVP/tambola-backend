import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    socketId: { type: String, required: false },
    isHost: { type: Boolean, default: false },
    roomCode: { type: String },
});

export const User = mongoose.model("User", userSchema);
