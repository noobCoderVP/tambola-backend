import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        code: { type: String, required: true },
        host: { type: String, required: true },
        players: [{ type: String }],
        calledCodes: [{ type: String }], // All codes announced by host
        isActive: { type: Boolean, default: false },
        claims: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                claimType: { type: String },
                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected"],
                    default: "pending",
                },
            },
        ],
    },
    { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
