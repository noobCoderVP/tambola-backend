import { diwaliSymbols } from "../data/symbols.js"; // your 90-symbol JSON map

const SYMBOL_CODES = Object.keys(diwaliSymbols);

/**
 * 🎟️ Generate a validated Diwali-themed Tambola ticket (9x3 grid)
 * - 9 columns × 3 rows = 27 cells
 * - 15 filled (5 per row)
 * - No duplicate codes
 * - Column fill: 1–2 per column (Tambola-style)
 */
export const generateTicket = () => {
    while (true) {
        const ticket = buildTicket();
        if (validateTicket(ticket)) return ticket;
    }
};

/**
 * 🏗️ Build a random 9×3 ticket structure
 */
const buildTicket = () => {
    const used = new Set();
    const ticket = [];

    for (let r = 0; r < 3; r++) {
        const row = Array(9).fill("");
        const filledCols = getRandomColumns(9, 5);

        for (const c of filledCols) {
            let code;
            do {
                code =
                    SYMBOL_CODES[
                        Math.floor(Math.random() * SYMBOL_CODES.length)
                    ];
            } while (used.has(code));
            used.add(code);
            row[c] = code;
        }

        ticket.push(row);
    }

    return ticket;
};

/**
 * ✅ Validate ticket based on Tambola-like rules
 * - Each column has 1–2 filled cells
 * - Each row has exactly 5 filled cells
 */
const validateTicket = (ticket) => {
    const colFillCount = Array(9).fill(0);

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 9; c++) {
            if (ticket[r][c]) colFillCount[c]++;
        }
    }

    // Column must have 1 or 2 symbols
    if (colFillCount.some((count) => count === 0 || count > 2)) return false;

    // Each row must have exactly 5 symbols
    for (let r = 0; r < 3; r++) {
        const rowCount = ticket[r].filter(Boolean).length;
        if (rowCount !== 5) return false;
    }

    return true;
};

/**
 * 🎲 Helper — pick random distinct column indices
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
 * 🧩 Format ticket as string "A,B,,C,...\E,,,...\..." for DB storage
 */
export const formatTicket = (ticket) => {
    return ticket.map((row) => row.join(",")).join("\\");
};

/**
 * 🖨️ Print a 9×3 ticket in console (for debugging)
 */
export const printTicket = (ticket) => {
    if (!Array.isArray(ticket) || ticket.length !== 3) {
        console.log("❌ Invalid ticket structure.");
        return;
    }

    console.log("🎟️ Diwali Tambola Ticket (9x3)\n");
    console.log("┌────────────────────────────────────────────────┐");

    ticket.forEach((row) => {
        const formattedRow = row
            .map((cell) => (cell ? cell.padEnd(3, " ") : "   "))
            .join(" | ");
        console.log(`| ${formattedRow} |`);
    });

    console.log("└────────────────────────────────────────────────┘");
};

// Example run
const ticket = generateTicket();
printTicket(ticket);
