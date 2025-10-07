import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        code: { type: String, required: true },

        // Ticket as a single string, rows separated by "\" and elements in row separated by ","
        ticketString: {
            type: String,
            required: true,
            // Example format: "DY,LK,GN\\TR,OP,MS\\HG,PK,WD"
        },

        // Optional: keep marked items separately (for gameplay logic)
        markedItems: [{ type: String }],
    },
    { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
