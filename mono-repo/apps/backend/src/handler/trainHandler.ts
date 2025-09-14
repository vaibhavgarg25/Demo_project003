import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
import { sanitizedTrains } from "../utils/sanitizedTrains.js";

export const getTrains = async (req: Request, res: Response): Promise<void> => {
    logger.info("[getTrains] Request received");
    try {
        const trains = await prisma.train.findMany({
            include: {
                fitness: true,
                jobCardStatus: true,
                branding: true,
                mileage: true,
                cleaning: true,
                stabling: true,
                operations: true,
            },
        });
        logger.info("[getTrains] Trains fetched successfully", { count: trains.length });
        const sanitized = sanitizedTrains(trains);
        res.status(200).json(sanitized);
    } catch (error: any) {
        logger.error("[getTrains] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    logger.info("[getTrainById] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainById] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const train = await prisma.train.findUnique({
            where: { trainID: id as string },
            include: {
                fitness: true,
                jobCardStatus: true,
                branding: true,
                mileage: true,
                cleaning: true,
                stabling: true,
                operations: true,
            },
        });
        if (!train) {
            logger.warn("[getTrainById] Train not found", { id });
            res.status(404).json({ message: "Train not found" });
            return;
        }
        logger.info("[getTrainById] Train fetched successfully", { id: train.trainID });
        res.status(200).json(train);
    } catch (error: any) {
        logger.error("[getTrainById] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};