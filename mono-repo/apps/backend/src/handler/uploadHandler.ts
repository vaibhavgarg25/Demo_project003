import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
import multer from "multer";
import fs from "fs";
import * as csvParser from "csv-parser";

const upload = multer();


export const uploadMany = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
          res.status(400).send('No file uploaded');
          return;
        }
    
        const results: any[] = [];
        fs.createReadStream(req.file.path)
          .pipe(csvParser.default())
          .on('data', (data: any) => results.push(data))
          .on('end', async () => {
            for (const row of results) {
              
              const train = await prisma.train.upsert({
                where: { trainID: row.TrainID },
                create: {
                  trainname: row.Trainname,
                  trainID: row.TrainID,
                },
                update: {},
              });
    
              // Upsert FitnessCertificates
              await prisma.fitnessCertificates.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  rollingStockFitnessStatus: row.RollingStockFitnessStatus === 'TRUE',
                  signallingFitnessStatus: row.SignallingFitnessStatus === 'TRUE',
                  telecomFitnessStatus: row.TelecomFitnessStatus === 'TRUE',
                  fitnessExpiryDate: new Date(row.fitness_expiry_date),
                  lastFitnessCheckDate: new Date(row.last_fitness_check_date),
                },
                update: {
                  rollingStockFitnessStatus: row.RollingStockFitnessStatus === 'TRUE',
                  signallingFitnessStatus: row.SignallingFitnessStatus === 'TRUE',
                  telecomFitnessStatus: row.TelecomFitnessStatus === 'TRUE',
                  fitnessExpiryDate: new Date(row.fitness_expiry_date),
                  lastFitnessCheckDate: new Date(row.last_fitness_check_date),
                },
              });
    
              // Upsert JobCardStatus
              await prisma.jobCardStatus.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  jobCardStatus: row.JobCardStatus === 'open' ? 'open' : 'close',
                  openJobCards: Number(row.OpenJobCards),
                  closedJobCards: Number(row.ClosedJobCards),
                  lastJobCardUpdate: new Date(row.LastJobCardUpdate),
                },
                update: {
                  jobCardStatus: row.JobCardStatus === 'open' ? 'open' : 'close',
                  openJobCards: Number(row.OpenJobCards),
                  closedJobCards: Number(row.ClosedJobCards),
                  lastJobCardUpdate: new Date(row.LastJobCardUpdate),
                },
              });
    
              // Upsert Branding
              await prisma.branding.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  brandingActive: row.BrandingActive === 'TRUE',
                  brandCampaignID: row.BrandCampaignID || null,
                  exposureHoursAccrued: Number(row.ExposureHoursAccrued),
                  exposureHoursTarget: Number(row.ExposureHoursTarget),
                  exposureDailyQuota: Number(row.ExposureDailyQuota),
                },
                update: {
                  brandingActive: row.BrandingActive === 'TRUE',
                  brandCampaignID: row.BrandCampaignID || null,
                  exposureHoursAccrued: Number(row.ExposureHoursAccrued),
                  exposureHoursTarget: Number(row.ExposureHoursTarget),
                  exposureDailyQuota: Number(row.ExposureDailyQuota),
                },
              });
    
              // Upsert Mileage
              await prisma.mileage.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  totalMileageKM: Number(row.TotalMileageKM),
                  mileageSinceLastServiceKM: Number(row.MileageSinceLastServiceKM),
                  mileageBalanceVariance: Number(row.MileageBalanceVariance),
                  brakepadWearPercent: Number(row['BrakepadWear%']),
                  hvacWearPercent: Number(row['HVACWear%']),
                },
                update: {
                  totalMileageKM: Number(row.TotalMileageKM),
                  mileageSinceLastServiceKM: Number(row.MileageSinceLastServiceKM),
                  mileageBalanceVariance: Number(row.MileageBalanceVariance),
                  brakepadWearPercent: Number(row['BrakepadWear%']),
                  hvacWearPercent: Number(row['HVACWear%']),
                },
              });
    
              // Upsert Cleaning
              await prisma.cleaning.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  cleaningRequired: row.CleaningRequired === 'TRUE',
                  cleaningSlotStatus: row.CleaningSlotStatus,
                  bayOccupancyIDC: row.BayOccupancyIDC || null,
                  cleaningCrewAssigned: row.CleaningCrewAssigned ? Number(row.CleaningCrewAssigned) : null,
                  lastCleanedDate: new Date(row.LastCleanedDate),
                },
                update: {
                  cleaningRequired: row.CleaningRequired === 'TRUE',
                  cleaningSlotStatus: row.CleaningSlotStatus,
                  bayOccupancyIDC: row.BayOccupancyIDC || null,
                  cleaningCrewAssigned: row.CleaningCrewAssigned ? Number(row.CleaningCrewAssigned) : null,
                  lastCleanedDate: new Date(row.LastCleanedDate),
                },
              });
    
              // Upsert Stabling
              await prisma.stabling.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  bayPositionID: Number(row.BayPositionID),
                  stablingSequenceOrder: Number(row.StablingSequenceOrder),
                  shuntingMovesRequired: Number(row.ShuntingMovesRequired),
                },
                update: {
                  bayPositionID: Number(row.BayPositionID),
                  stablingSequenceOrder: Number(row.StablingSequenceOrder),
                  shuntingMovesRequired: Number(row.ShuntingMovesRequired),
                },
              });
    

              await prisma.operations.upsert({
                where: { trainId: train.id.toString() },
                create: {
                  trainId: train.id.toString(),
                  operationalStatus: row.OperationalStatus as 'In_Service' | 'Standby' | 'Under_Maintenance',
                },
                update: {
                  operationalStatus: row.OperationalStatus as 'In_Service' | 'Standby' | 'Under_Maintenance',
                },
              });
            }
    
            res.status(200).send('CSV processed and data inserted/updated successfully');
          });
      } catch (error) {
        res.status(500).send(`Error processing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
};