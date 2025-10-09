import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        host: { type: String, required: true },
        players: [{ type: String }],
        calledCodes: [{ type: String }], // All codes announced by host
        isActive: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
        claims: [
            {
                username: { type: String, required: true },
                claimType: { type: String },
                claimedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
