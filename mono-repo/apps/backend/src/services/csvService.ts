import csv from 'csv-parser';
import { Readable } from 'stream';
import { prisma } from "../config/db.js";

// --- Normalization helpers for varied Excel/CSV headers and values ---
const normalizeHeader = (header: string): string => {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  const v = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return undefined;
};

const parseDateFlexible = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const str = String(value).trim();
  // dd-mm-yyyy or dd/mm/yyyy
  const m = str.match(/^([0-3]?\d)[-\/]([0-1]?\d)[-\/]((?:19|20)?\d{2})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    return new Date(yyyy, mm - 1, dd);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
};

const aliasToCanonical: Record<string, string> = {
  // Train
  trainname: "trainname",
  train: "trainname",
  trainid: "trainID",
  // Fitness
  rollingstockfitnessstatus: "rollingStockFitnessStatus",
  signallingfitnessstatus: "signallingFitnessStatus",
  telecomfitnessstatus: "telecomFitnessStatus",
  fitness_expiry_date: "fitnessExpiryDate",
  last_fitness_check_date: "lastFitnessCheckDate",
  // Job cards
  jobcardstatus: "jobCardStatus",
  openjobcards: "openJobCards",
  closedjobcards: "closedJobCards",
  lastjobcardupdate: "lastJobCardUpdate",
  // Branding
  brandingactive: "brandingActive",
  brandcampaignid: "brandCampaignID",
  exposurehoursaccrued: "exposureHoursAccrued",
  exposurehourstarget: "exposureHoursTarget",
  exposuredailyquota: "exposureDailyQuota",
  // Mileage
  mileagesincelastservicekm: "mileageSinceLastServiceKM",
  mileagebalancevariance: "mileageBalanceVariance",
  brakepadwearpercent: "brakepadWearPercent",
  hvacwearpercent: "hvacWearPercent",
  // Cleaning
  cleaningrequired: "cleaningRequired",
  cleaningslotstatus: "cleaningSlotStatus",
  bayoccupancyidc: "bayOccupancyIDC",
  cleaningcrewassigned: "cleaningCrewAssigned",
  lastcleaneddate: "lastCleanedDate",
  // Stabling
  baypositionid: "bayPositionID",
  shuntingmovesrequired: "shuntingMovesRequired",
  stablingsequenceorder: "stablingSequenceOrder",
  // Operations
  operationalstatus: "operationalStatus",
};

const normalizeRow = (raw: CSVRow): CSVRow => {
  const normalized: CSVRow = {};
  for (const [k, v] of Object.entries(raw)) {
    const nk = normalizeHeader(k);
    // First try exact alias match
    let canonical = aliasToCanonical[nk] || nk;
    // Heuristic mappings for common abbreviated headers
    if (!aliasToCanonical[nk]) {
      const contains = (s: string) => nk.includes(s);
      if (contains("trainid")) canonical = "trainID";
      else if (contains("trainname") || nk === "train") canonical = "trainname";
      else if ((contains("rolling") && contains("fitness")) || contains("rollingstock")) canonical = "rollingStockFitnessStatus";
      else if (contains("signalling") && contains("fitness")) canonical = "signallingFitnessStatus";
      else if (contains("telecom") && contains("fitness")) canonical = "telecomFitnessStatus";
      else if (contains("fitness") && contains("expiry")) canonical = "fitnessExpiryDate";
      else if (contains("last") && contains("fitness") && contains("check")) canonical = "lastFitnessCheckDate";
      else if (contains("job") && contains("status")) canonical = "jobCardStatus";
      else if (contains("open") && contains("job")) canonical = "openJobCards";
      else if (contains("closed") && contains("job")) canonical = "closedJobCards";
      else if (contains("last") && contains("job") && contains("update")) canonical = "lastJobCardUpdate";
      else if (contains("branding") && contains("active")) canonical = "brandingActive";
      else if (contains("brand") && contains("campaign")) canonical = "brandCampaignID";
      else if (contains("exposure") && contains("accrued")) canonical = "exposureHoursAccrued";
      else if (contains("exposure") && contains("target")) canonical = "exposureHoursTarget";
      else if (contains("daily") && contains("quota")) canonical = "exposureDailyQuota";
      else if (contains("total") && contains("mileage")) canonical = "totalMileageKM";
      else if (contains("since") && contains("service")) canonical = "mileageSinceLastServiceKM";
      else if (contains("balance") && contains("variance")) canonical = "mileageBalanceVariance";
      else if (contains("brake") && contains("wear")) canonical = "brakepadWearPercent";
      else if (contains("hvac") && contains("wear")) canonical = "hvacWearPercent";
      else if (contains("cleaning") && contains("required")) canonical = "cleaningRequired";
      else if (contains("cleaning") && contains("slot")) canonical = "cleaningSlotStatus";
      else if (contains("bay") && contains("occupancy")) canonical = "bayOccupancyIDC";
      else if (contains("crew") && contains("assigned")) canonical = "cleaningCrewAssigned";
      else if (contains("last") && contains("clean")) canonical = "lastCleanedDate";
      else if (contains("bay") && contains("position")) canonical = "bayPositionID";
      else if (contains("shunting") && contains("moves")) canonical = "shuntingMovesRequired";
      else if (contains("stabling") && contains("sequence")) canonical = "stablingSequenceOrder";
      else if (contains("operational") && contains("status")) canonical = "operationalStatus";
    }
    normalized[canonical] = String(v ?? "").trim();
  }

  // Convert booleans
  const booleanFields = [
    "rollingStockFitnessStatus",
    "signallingFitnessStatus",
    "telecomFitnessStatus",
    "brandingActive",
    "cleaningRequired",
  ];
  for (const b of booleanFields) {
    const val = parseBoolean((normalized as any)[b]);
    if (val !== undefined) (normalized as any)[b] = String(val);
  }

  // Normalize date fields to ISO strings understood by new Date()
  const dateFields = [
    "fitnessExpiryDate",
    "lastFitnessCheckDate",
    "lastJobCardUpdate",
    "lastCleanedDate",
  ];
  for (const d of dateFields) {
    const parsed = parseDateFlexible((normalized as any)[d]);
    if (parsed) (normalized as any)[d] = parsed.toISOString();
  }

  // Ensure canonical train fields casing
  if (normalized.trainname && !normalized.trainID && normalized.trainid) {
    normalized.trainID = normalized.trainid;
  }

  return normalized;
};

interface CSVRow {
  [key: string]: string;
}

interface UploadStatus {
  [key: string]: {
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    message?: string;
    results?: any;
  };
}

export const processCSV = async (
  buffer: Buffer,
  jobId: string,
  uploadStatusMap: UploadStatus
): Promise<void> => {
  try {
    const results: CSVRow[] = [];
    
    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (data: CSVRow) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    if (uploadStatusMap[jobId]) {
      uploadStatusMap[jobId].progress = 25;
      uploadStatusMap[jobId].message = `Parsed ${results.length} rows from CSV`;
    }

    // Normalize headers/values from Excel-style CSVs before inserting
    const normalizedRows = results.map(normalizeRow);

    // Process and insert data
    const processResults = await insertDataIntoModels(normalizedRows, jobId, uploadStatusMap);

    if (uploadStatusMap[jobId]) {
      uploadStatusMap[jobId] = {
        status: 'completed',
        progress: 100,
        message: 'CSV processing completed successfully',
        results: processResults
      };
    }

  } catch (error) {
    console.error('CSV processing error:', error);
    if (uploadStatusMap[jobId]) {
      uploadStatusMap[jobId] = {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

const insertDataIntoModels = async (
  data: CSVRow[],
  jobId: string,
  uploadStatusMap: UploadStatus
) => {
  const results = {
    trains: 0,
    fitness: 0,
    jobCards: 0,
    branding: 0,
    mileage: 0,
    cleaning: 0,
    stabling: 0,
    operations: 0,
    parsedRows: data.length,
    skippedMissingTrainFields: 0,
    errors: [] as string[]
  };

  try {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row) continue;
      
      try {
        // Create or update Train
        if (row.trainname && row.trainID) {
          const train = await prisma.train.upsert({
            where: { trainID: row.trainID },
            update: {
              trainname: row.trainname,
              updatedAt: new Date()
            },
            create: {
              trainname: row.trainname,
              trainID: row.trainID
            }
          });
          results.trains++;

          // Process related models
          await processRelatedModels(row, train.trainID, results);
        } else {
          results.skippedMissingTrainFields++;
          results.errors.push(`Row ${i + 1}: missing trainname/trainID after normalization`);
        }

        // Update progress
        const progress = 25 + Math.floor((i / data.length) * 70);
        if (uploadStatusMap[jobId]) {
          uploadStatusMap[jobId].progress = progress;
          uploadStatusMap[jobId].message = `Processing row ${i + 1} of ${data.length}`;
        }

      } catch (rowError) {
        const errorMsg = `Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    if (uploadStatusMap[jobId]) {
      uploadStatusMap[jobId].progress = 95;
      uploadStatusMap[jobId].message = 'Finalizing data insertion...';
    }

    return results;

  } catch (error) {
    console.error('Data insertion error:', error);
    throw error;
  }
};

const processRelatedModels = async (row: CSVRow, trainId: string, results: any) => {
  // Fitness Certificates
  if (row.rollingStockFitnessStatus !== undefined || row.signallingFitnessStatus !== undefined) {
    await prisma.fitnessCertificates.upsert({
      where: { trainId },
      update: {
        rollingStockFitnessStatus: row.rollingStockFitnessStatus === 'true',
        signallingFitnessStatus: row.signallingFitnessStatus === 'true',
        telecomFitnessStatus: row.telecomFitnessStatus === 'true',
        fitnessExpiryDate: row.fitnessExpiryDate ? new Date(row.fitnessExpiryDate) : new Date(),
        lastFitnessCheckDate: row.lastFitnessCheckDate ? new Date(row.lastFitnessCheckDate) : new Date()
      },
      create: {
        trainId,
        rollingStockFitnessStatus: row.rollingStockFitnessStatus === 'true',
        signallingFitnessStatus: row.signallingFitnessStatus === 'true',
        telecomFitnessStatus: row.telecomFitnessStatus === 'true',
        fitnessExpiryDate: row.fitnessExpiryDate ? new Date(row.fitnessExpiryDate) : new Date(),
        lastFitnessCheckDate: row.lastFitnessCheckDate ? new Date(row.lastFitnessCheckDate) : new Date()
      }
    });
    results.fitness++;
  }

  // Job Card Status
  if (row.jobCardStatus !== undefined) {
    await prisma.jobCardStatus.upsert({
      where: { trainId },
      update: {
        jobCardStatus: row.jobCardStatus as any,
        openJobCards: parseInt(row.openJobCards || '0') || 0,
        closedJobCards: parseInt(row.closedJobCards || '0') || 0,
        lastJobCardUpdate: row.lastJobCardUpdate ? new Date(row.lastJobCardUpdate) : new Date()
      },
      create: {
        trainId,
        jobCardStatus: row.jobCardStatus as any,
        openJobCards: parseInt(row.openJobCards || '0') || 0,
        closedJobCards: parseInt(row.closedJobCards || '0') || 0,
        lastJobCardUpdate: row.lastJobCardUpdate ? new Date(row.lastJobCardUpdate) : new Date()
      }
    });
    results.jobCards++;
  }

  // Branding
  if (row.brandingActive !== undefined) {
    await prisma.branding.upsert({
      where: { trainId },
      update: {
        brandingActive: row.brandingActive === 'true',
        brandCampaignID: row.brandCampaignID || null,
        exposureHoursAccrued: parseInt(row.exposureHoursAccrued || '0') || 0,
        exposureHoursTarget: parseInt(row.exposureHoursTarget || '0') || 0,
        exposureDailyQuota: parseInt(row.exposureDailyQuota || '0') || 0
      },
      create: {
        trainId,
        brandingActive: row.brandingActive === 'true',
        brandCampaignID: row.brandCampaignID || null,
        exposureHoursAccrued: parseInt(row.exposureHoursAccrued || '0') || 0,
        exposureHoursTarget: parseInt(row.exposureHoursTarget || '0') || 0,
        exposureDailyQuota: parseInt(row.exposureDailyQuota || '0') || 0
      }
    });
    results.branding++;
  }

  // Mileage
  if (row.totalMileageKM !== undefined) {
    await prisma.mileage.upsert({
      where: { trainId },
      update: {
        totalMileageKM: parseInt(row.totalMileageKM || '0') || 0,
        mileageSinceLastServiceKM: parseInt(row.mileageSinceLastServiceKM || '0') || 0,
        mileageBalanceVariance: parseInt(row.mileageBalanceVariance || '0') || 0,
        brakepadWearPercent: parseInt(row.brakepadWearPercent || '0') || 0,
        hvacWearPercent: parseInt(row.hvacWearPercent || '0') || 0
      },
      create: {
        trainId,
        totalMileageKM: parseInt(row.totalMileageKM || '0') || 0,
        mileageSinceLastServiceKM: parseInt(row.mileageSinceLastServiceKM || '0') || 0,
        mileageBalanceVariance: parseInt(row.mileageBalanceVariance || '0') || 0,
        brakepadWearPercent: parseInt(row.brakepadWearPercent || '0') || 0,
        hvacWearPercent: parseInt(row.hvacWearPercent || '0') || 0
      }
    });
    results.mileage++;
  }

  // Cleaning
  if (row.cleaningRequired !== undefined) {
    await prisma.cleaning.upsert({
      where: { trainId },
      update: {
        cleaningRequired: row.cleaningRequired === 'true',
        cleaningSlotStatus: row.cleaningSlotStatus as any,
        bayOccupancyIDC: row.bayOccupancyIDC || null,
        cleaningCrewAssigned: row.cleaningCrewAssigned ? parseInt(row.cleaningCrewAssigned) : null,
        lastCleanedDate: row.lastCleanedDate ? new Date(row.lastCleanedDate) : new Date()
      },
      create: {
        trainId,
        cleaningRequired: row.cleaningRequired === 'true',
        cleaningSlotStatus: row.cleaningSlotStatus as any,
        bayOccupancyIDC: row.bayOccupancyIDC || null,
        cleaningCrewAssigned: row.cleaningCrewAssigned ? parseInt(row.cleaningCrewAssigned) : null,
        lastCleanedDate: row.lastCleanedDate ? new Date(row.lastCleanedDate) : new Date()
      }
    });
    results.cleaning++;
  }

  // Stabling
  if (row.bayPositionID !== undefined) {
    await prisma.stabling.upsert({
      where: { trainId },
      update: {
        bayPositionID: parseInt(row.bayPositionID || '0') || 0,
        shuntingMovesRequired: parseInt(row.shuntingMovesRequired || '0') || 0,
        stablingSequenceOrder: parseInt(row.stablingSequenceOrder || '0') || 0
      },
      create: {
        trainId,
        bayPositionID: parseInt(row.bayPositionID || '0') || 0,
        shuntingMovesRequired: parseInt(row.shuntingMovesRequired || '0') || 0,
        stablingSequenceOrder: parseInt(row.stablingSequenceOrder || '0') || 0
      }
    });
    results.stabling++;
  }

  // Operations
  if (row.operationalStatus !== undefined) {
    await prisma.operations.upsert({
      where: { trainId },
      update: {
        operationalStatus: row.operationalStatus as any
      },
      create: {
        trainId,
        operationalStatus: row.operationalStatus as any
      }
    });
    results.operations++;
  }
};