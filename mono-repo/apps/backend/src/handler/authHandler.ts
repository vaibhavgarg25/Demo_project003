import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import type { LoginUserRequestBody, LoginUserResponse, RegisterUserRequestBody } from "../types/userTypes.js";
import { logger } from "../config/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
}
const SALT_ROUNDS = 10;

export const registerUser = async (
    req: Request<unknown, unknown, RegisterUserRequestBody>,
    res: Response
): Promise<Response> => {
    const { username, email, password, role } = req.body;
    logger.info("[registerUser] Request received", { username, email, role });

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            logger.warn("[registerUser] User already exists", { email });
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        logger.info("[registerUser] Password hashed");

        const newUser = await prisma.user.create({
            data: { name: username, email, password: hashedPassword, role }
        });

        logger.info("[registerUser] User created successfully", { userId: newUser.id });

        return res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error: any) {
        logger.error("[registerUser] Server error", { error: error.message });
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const loginUser = async (
    req: Request<unknown, unknown, LoginUserRequestBody>,
    res: Response<LoginUserResponse>
): Promise<void> => {
    const { email, password } = req.body;
    logger.info("[loginUser] Login attempt", { email });

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            logger.warn("[loginUser] No user found", { email });
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
    
        if (!passwordMatch) {
            logger.warn("[loginUser] Incorrect password", { email });
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        logger.info("[loginUser] Login successful, token generated", { userId: user.id });

        res.status(200).json({ message: "Login successful", token, user });
    } catch (error: any) {
        logger.error("[loginUser] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
