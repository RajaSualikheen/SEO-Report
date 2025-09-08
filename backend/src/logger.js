import winston from "winston";

// Define log format
const logFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "debug",
    format: logFormat,
    transports: [
        new winston.transports.Console()
    ]
});

// Example: add file logging in production
if (process.env.NODE_ENV === "production") {
    logger.add(
        new winston.transports.File({
            filename: "logs/app.log",
            level: "info",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    );
}

export default logger;
