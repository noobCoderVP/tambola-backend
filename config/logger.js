// filepath: c:\Users\vaibh\Desktop\Housey\tambola-backend\config\logger.js
import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "app.log" }),
    ],
});

export default logger;