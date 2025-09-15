import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { logger } from "../config/logger.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET as string | undefined;

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!JWT_SECRET) {
        logger.error("[authMiddleware] JWT_SECRET environment variable is not defined");
        res.status(500).json({ message: "Server misconfiguration: missing JWT secret" });
        return;
    }

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        logger.warn("[authMiddleware] Token not found in Authorization header");
        res.status(401).json({ message: "Unauthorized: Missing token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === "object" && decoded !== null && "userId" in decoded && "email" in decoded) {
            logger.info("[authMiddleware] Token verified", { userId: (decoded as JwtPayload).userId, email: (decoded as JwtPayload).email });

            req.user = { id: (decoded as JwtPayload).userId, email: (decoded as JwtPayload).email };
            next();
        } else {
            logger.warn("[authMiddleware] Token payload missing required fields");
            res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }
    } catch (error: any) {
        logger.error("[authMiddleware] Token verification failed", { error: error.message });
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
