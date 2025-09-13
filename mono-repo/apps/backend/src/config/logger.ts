import { createLogger, transports, format } from "winston";

export const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`
        )
    ),
    transports: [
        new transports.Console(),
    ],
});
