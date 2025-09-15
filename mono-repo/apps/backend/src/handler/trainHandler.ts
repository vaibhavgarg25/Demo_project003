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
        res.status(200).json(trains);
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

export const getTrainFitness=async(req:Request,res:Response):Promise<void>=>{
    logger.info("[getTrainFitness] Request received");
    try {
        const fitnessRecords = await prisma.fitnessCertificates.findMany();
        if (fitnessRecords.length === 0) {
            logger.warn("[getTrainFitness] No fitness records found");
            res.status(404).json({ message: "No fitness records found" });
            return;
        }
        logger.info("[getTrainFitness] Fitness records fetched successfully", {count: fitnessRecords.length });
        res.status(200).json(fitnessRecords);
    }
    catch (error: any) {
        logger.error("[getTrainFitness] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainFitnessById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainFitness] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainFitness] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const fitnessRecords = await prisma.fitnessCertificates.findMany({
            where: { trainId: id as string },
        });
        if (fitnessRecords.length === 0) {
            logger.warn("[getTrainFitness] No fitness records found", { id });
            res.status(404).json({ message: "No fitness records found" });
            return;
        }
        logger.info("[getTrainFitness] Fitness records fetched successfully", { id, count: fitnessRecords.length });
        res.status(200).json(fitnessRecords);
    }
    catch (error: any) {
        logger.error("[getTrainFitness] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainJobCardStatus=async(req:Request,res:Response):Promise<void>=>{
    logger.info("[getTrainJobCardStatus] Request received");
    try {
        const jobCardStatus = await prisma.jobCardStatus.findMany();
        if (jobCardStatus.length === 0) {
            logger.warn("[getTrainJobCardStatus] No jobCardStatus records found");
            res.status(404).json({ message: "No jobCardStatus records found" });
            return;
        }
        logger.info("[getTrainJobCardStatus] jobCardStatus records fetched successfully", { count: jobCardStatus.length });
        res.status(200).json(jobCardStatus);
    }
    catch (error: any) {
        logger.error("[getTrainJobCardStatus] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainJobCardStatusById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainJobCardStatus] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainJobCardStatus] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const jobCardStatus = await prisma.jobCardStatus.findMany({
            where: { trainId: id as string },
        });
        if (jobCardStatus.length === 0) {
            logger.warn("[getTrainJobCardStatus] No jobCardStatus records found", { id });
            res.status(404).json({ message: "No jobCardStatus records found" });
            return;
        }
        logger.info("[getTrainJobCardStatus] jobCardStatus records fetched successfully", { id, count: jobCardStatus.length });
        res.status(200).json(jobCardStatus);
    }
    catch (error: any) {
        logger.error("[getTrainJobCardStatus] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainBranding=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainBranding] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainBranding] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const branding = await prisma.branding.findMany({
            where: { trainId: id as string },
        });
        if (branding.length === 0) {
            logger.warn("[getTrainBranding] No Branding records found", { id });
            res.status(404).json({ message: "No Branding records found" });
            return;
        }
        logger.info("[getTrainBranding] Branding records fetched successfully", { id, count: branding.length });
        res.status(200).json(branding);
    }
    catch (error: any) {
        logger.error("[getTrainBranding] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainBrandingById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainBranding] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainBranding] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const branding = await prisma.branding.findMany({
            where: { trainId: id as string },
        });
        if (branding.length === 0) {
            logger.warn("[getTrainBranding] No Branding records found", { id });
            res.status(404).json({ message: "No Branding records found" });
            return;
        }
        logger.info("[getTrainBranding] Branding records fetched successfully", { id, count: branding.length });
        res.status(200).json(branding);
    }
    catch (error: any) {
        logger.error("[getTrainBranding] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainMileage=async(req:Request,res:Response):Promise<void>=>{
    logger.info("[getTrainBranding] Request received");
    try {
        const mileage = await prisma.mileage.findMany();
        if (mileage.length === 0) {
            logger.warn("[getTrainMileage] No Mileage records found");
            res.status(404).json({ message: "No Mileage records found" });
            return;
        }
        logger.info("[getTrainMileage] Mileage records fetched successfully", { count: mileage.length });
        res.status(200).json(mileage);
    }
    catch (error: any) {
        logger.error("[getTrainMileage] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainMileageById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainBranding] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainMileage] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const mileage = await prisma.mileage.findMany({
            where: { trainId: id as string },
        });
        if (mileage.length === 0) {
            logger.warn("[getTrainMileage] No Mileage records found", { id });
            res.status(404).json({ message: "No Mileage records found" });
            return;
        }
        logger.info("[getTrainMileage] Mileage records fetched successfully", { id, count: mileage.length });
        res.status(200).json(mileage);
    }
    catch (error: any) {
        logger.error("[getTrainMileage] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainCleaning=async(req:Request,res:Response):Promise<void>=>{
    logger.info("[getTrainCleaning] Request received");
    try {
        const cleaning = await prisma.cleaning.findMany();
        if (cleaning.length === 0) {
            logger.warn("[getTrainCleaning] No Cleaning records found");
            res.status(404).json({ message: "No Cleaning records found" });
            return;
        }
        logger.info("[getTrainCleaning] Cleaning records fetched successfully", { count: cleaning.length });
        res.status(200).json(cleaning);
    }
    catch (error: any) {
        logger.error("[getTrainCleaning] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainCleaningById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainCleaning] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainCleaning] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const cleaning = await prisma.cleaning.findMany({
            where: { trainId: id as string },
        });
        if (cleaning.length === 0) {
            logger.warn("[getTrainCleaning] No Cleaning records found", { id });
            res.status(404).json({ message: "No Cleaning records found" });
            return;
        }
        logger.info("[getTrainCleaning] Cleaning records fetched successfully", { id, count: cleaning.length });
        res.status(200).json(cleaning);
    }
    catch (error: any) {
        logger.error("[getTrainCleaning] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainStabling=async(req:Request,res:Response):Promise<void>=>{
    logger.info("[getTrainStabling] Request received");
    try {
        const stabling = await prisma.stabling.findMany();
        if (stabling.length === 0) {
            logger.warn("[getTrainStabling] No stabling records found");
            res.status(404).json({ message: "No stabling records found" });
            return;
        }
        logger.info("[getTrainStabling] stabling records fetched successfully", { count: stabling.length });
        res.status(200).json(stabling);
    }
    catch (error: any) {
        logger.error("[getTrainStabling] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainStablingById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainStabling] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainStabling] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const stabling = await prisma.stabling.findMany({
            where: { trainId: id as string },
        });
        if (stabling.length === 0) {
            logger.warn("[getTrainStabling] No stabling records found", { id });
            res.status(404).json({ message: "No stabling records found" });
            return;
        }
        logger.info("[getTrainStabling] stabling records fetched successfully", { id, count: stabling.length });
        res.status(200).json(stabling);
    }
    catch (error: any) {
        logger.error("[getTrainStabling] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainOperationStatus=async(req:Request,res:Response):Promise<void>=>{
    logger.info("[getTrainOperationStatus] Request received");
    try {
        const operationStatus = await prisma.operations.findMany();
        if (operationStatus.length === 0) {
            logger.warn("[getTrainOperationStatus] No operationStatus records found");
            res.status(404).json({ message: "No operationStatus records found" });
            return;
        }
        logger.info("[getTrainOperationStatus] operationStatus records fetched successfully", { count: operationStatus.length });
        res.status(200).json(operationStatus);
    }
    catch (error: any) {
        logger.error("[getTrainOperationStatus] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTrainOperationStatusById=async(req:Request,res:Response):Promise<void>=>{
    const { id } = req.params;
    logger.info("[getTrainOperationStatus] Request received", { id });
    try {
        if (!id) {
            logger.warn("[getTrainOperationStatus] No train ID provided");
            res.status(400).json({ message: "No train ID provided" });
            return;
        }
        const operationStatus = await prisma.operations.findMany({
            where: { trainId: id as string },
        });
        if (operationStatus.length === 0) {
            logger.warn("[getTrainOperationStatus] No operationStatus records found", { id });
            res.status(404).json({ message: "No operationStatus records found" });
            return;
        }
        logger.info("[getTrainOperationStatus] operationStatus records fetched successfully", { id, count: operationStatus.length });
        res.status(200).json(operationStatus);
    }
    catch (error: any) {
        logger.error("[getTrainOperationStatus] Server error", { error: error.message });
        res.status(500).json({ message: "Server error", error: error.message });
    }
};