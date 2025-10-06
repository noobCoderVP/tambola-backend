import {diwaliSymbols} from "../data/symbols.js"; // your 90-symbol JSON map

const SYMBOL_CODES = Object.keys(diwaliSymbols);

/**
 * 🎟️ Generate a validated Diwali-themed Tambola ticket (9x3 grid)
 * - 9 columns × 3 rows = 27 cells
 * - 15 filled (5 per row)
 * - No duplicates
 */
export const generateTicket = () => {
    while (true) {
        const ticket = buildTicket();
        if (validateTicket(ticket)) return formatTicket(ticket);
    }
    return "";
};

/**
 * 🏗️ Build a random 9×3 ticket structure
 */
const buildTicket = () => {
    const available = [...SYMBOL_CODES];
    const ticket = Array.from({ length: 3 }, () => Array(9).fill(""));

    // Each row must have exactly 5 filled cells
    for (let r = 0; r < 3; r++) {
        const filledCols = getRandomColumns(9, 5);
        filledCols.forEach((c) => {
            const randIdx = Math.floor(Math.random() * available.length);
            ticket[r][c] = available.splice(randIdx, 1)[0];
        });
    }

    return ticket;
};

/**
 * ✅ Validate ticket based on Tambola-like rules
 */
const validateTicket = (ticket) => {
    const colFillCount = Array(9).fill(0);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 9; c++) {
            if (ticket[r][c]) colFillCount[c]++;
        }
    }

    // Each column must have 1 or 2 symbols
    if (colFillCount.some((count) => count === 0 || count > 2)) return false;

    // Each row must have exactly 5 symbols
    for (let r = 0; r < 3; r++) {
        const rowCount = ticket[r].filter(Boolean).length;
        if (rowCount !== 5) return false;
    }

    return true;
};

/**
 * 🧩 Format ticket as "A,B,,C,...\E,,,...\..." for DB storage
 */
const formatTicket = (ticket) => {
    return ticket.map((row) => row.join(",")).join("\\");
};

/**
 * 🎲 Helper — pick random columns
 */
const getRandomColumns = (total, pick) => {
    const cols = Array.from({ length: total }, (_, i) => i);
    for (let i = cols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cols[i], cols[j]] = [cols[j], cols[i]];
    }
    return cols.slice(0, pick);
};

/**
 * 🖨️ Utility to print a 9×3 Tambola ticket in console (for debugging)
 * @param {string} ticketString - Ticket stored as "AB,,CD\\EF,,GH\\..."
 */
export const printTicket = (ticketString) => {
    if (!ticketString || typeof ticketString !== "string") {
        console.log("❌ Invalid ticket string.");
        return;
    }

    // Split into rows (by '\')
    const rows = ticketString.split("\\").map((r) => r.split(","));

    console.log("🎟️ Diwali Tambola Ticket (9x3)\n");
    console.log("┌────────────────────────────────────────────┐");

    rows.forEach((row) => {
        const formattedRow = row
            .map((cell) => (cell ? cell.padEnd(3, " ") : "   "))
            .join(" | ");
        console.log(`| ${formattedRow} |`);
    });

    console.log("└────────────────────────────────────────────┘");
};


console.log(printTicket(generateTicket()));