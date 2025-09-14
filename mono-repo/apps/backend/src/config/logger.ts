import { createLogger, transports, format } from "winston";

export const logger = createLogger({
    level: "info",
    format: format.combine(
        format.colorize({ all: true }), 
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message, ...meta }) => {
            const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
            return `${timestamp} [${level}] : ${message} ${metaString}`;
        })
    ),
    transports: [
        new transports.Console({
            handleExceptions: true, 
        }),
    ],
});
