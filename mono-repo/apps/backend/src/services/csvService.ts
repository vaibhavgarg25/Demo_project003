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
  
  // Clean the value - remove quotes and trim whitespace
  let v = String(value).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  
  // Convert to lowercase for comparison
  const lowerV = v.toLowerCase();
  if (["true", "1", "yes", "y"].includes(lowerV)) return true;
  if (["false", "0", "no", "n"].includes(lowerV)) return false;
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
  currentdate: "current_date",
  // Fitness (align with Prisma schema) - EXACT MATCHES FIRST
  rollingstockfitnessstatus: "rollingStockFitnessStatus",
  signallingfitnessstatus: "signallingFitnessStatus", 
  telecomfitnessstatus: "telecomFitnessStatus",
  rollingstockfitnessexpirydate: "rollingStockFitnessExpiryDate",
  signallingfitnessexpirydate: "signallingFitnessExpiryDate",
  telecomfitnessexpirydate: "telecomFitnessExpiryDate",
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
  totalmileagekm: "totalMileageKM",
  mileagesincelastservicekm: "mileageSinceLastServiceKM",
  mileagebalancevariance: "mileageBalanceVariance",
  brakepadwear: "brakepadWearPercent",
  hvacwear: "hvacWearPercent",
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
  reasonforstatus: "reasonForStatus", 
  rank: "rank",
  score: "score",
  rlpriority: "rl_priority"
};

const cleanStringValue = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  
  let str = String(value).trim();
  
  // Remove surrounding quotes if present
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  
  return str.trim();
};

const normalizeRow = (raw: CSVRow, rowIndex: number): CSVRow => {
  const normalized: CSVRow = { _rowOrder: rowIndex.toString() }; // Preserve row order
  
  for (const [k, v] of Object.entries(raw)) {
    const nk = normalizeHeader(k);
    let canonical = aliasToCanonical[nk];
    
    if (!canonical) {
      // If no exact match, use the normalized key as-is initially
      canonical = nk;
      
      // Only apply heuristic mappings if we don't have an exact match
      const contains = (s: string) => nk.includes(s);
      
      if (contains("trainid") && !contains("fitness")) canonical = "trainID";
      else if ((contains("trainname") || nk === "train") && !contains("fitness")) canonical = "trainname";
      else if (contains("currentdate")) canonical = "current_date";
      // Be very specific about fitness mappings to avoid conflicts
      else if (nk === "rollingstockfitnessstatus") canonical = "rollingStockFitnessStatus";
      else if (nk === "signallingfitnessstatus") canonical = "signallingFitnessStatus"; 
      else if (nk === "telecomfitnessstatus") canonical = "telecomFitnessStatus";
      else if (nk === "rollingstockfitnessexpirydate") canonical = "rollingStockFitnessExpiryDate";
      else if (nk === "signallingfitnessexpirydate") canonical = "signallingFitnessExpiryDate";
      else if (nk === "telecomfitnessexpirydate") canonical = "telecomFitnessExpiryDate";
      // Other mappings...
      else if (contains("job") && contains("status") && !contains("card")) canonical = "jobCardStatus";
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
      else if (contains("reason") && contains("status")) canonical = "reasonForStatus";
      else if (nk === "rank") canonical = "rank";
      else if (nk === "score") canonical = "score";
      else if (contains("rl") && contains("priority")) canonical = "rl_priority";
      else if (nk === "rlpriority") canonical = "rl_priority";
    }
    // Clean the value first
    normalized[canonical] = cleanStringValue(v);
  }

  // Convert booleans using the improved parser
  const booleanFields = [
    "rollingStockFitnessStatus",
    "signallingFitnessStatus", 
    "telecomFitnessStatus",
    "brandingActive",
    "cleaningRequired",
  ];
  
  for (const field of booleanFields) {
    if (normalized[field] !== undefined && normalized[field] !== '') {
      const boolValue = parseBoolean(normalized[field]);
      if (boolValue !== undefined) {
        normalized[field] = String(boolValue);
      }
    }
  }

  // Normalize date fields to ISO strings
  const dateFields = [
    "current_date",
    "rollingStockFitnessExpiryDate",
    "signallingFitnessExpiryDate", 
    "telecomFitnessExpiryDate",
    "lastJobCardUpdate",
    "lastCleanedDate",
  ];
  
  for (const field of dateFields) {
    if (normalized[field] && normalized[field] !== '') {
      const parsedDate = parseDateFlexible(normalized[field]);
      if (parsedDate) {
        normalized[field] = parsedDate.toISOString();
      }
    }
  }

  // Ensure canonical train fields exist
  if (normalized.trainname && !normalized.trainID && normalized.trainid) {
    normalized.trainID = normalized.trainid;
  }

  return normalized;
};

interface CSVRow {
  [key: string]: string;
  _rowOrder?: string; // To maintain order
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
      uploadStatusMap[jobId].progress = 40;
      uploadStatusMap[jobId].message = `Parsed ${results.length} rows from CSV`;
    }

    // Normalize headers/values from Excel-style CSVs before inserting
    // Pass row index to maintain order
    const normalizedRows = results.map((row, index) => normalizeRow(row, index));

    // Expose ONLY first 25 parsed rows in status for inspection via GET /upload-status/:jobId
    if (uploadStatusMap[jobId]) {
      uploadStatusMap[jobId].results = {
        parsedCount: normalizedRows.length,
        parsedPreview: normalizedRows.slice(0, 25),
      };
    }

    // Process and insert data maintaining CSV order
    const processResults = await insertDataIntoModels(normalizedRows, jobId, uploadStatusMap);

    if (uploadStatusMap[jobId]) {
      uploadStatusMap[jobId] = {
        status: 'completed',
        progress: 100,
        message: 'CSV processing completed successfully',
        results: {
          ...(uploadStatusMap[jobId].results || {}),
          ...processResults,
        }
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
    // Sort by row order to maintain CSV sequence
    const sortedData = data.sort((a, b) => {
      const orderA = parseInt(a._rowOrder || '0');
      const orderB = parseInt(b._rowOrder || '0');
      return orderA - orderB;
    });

    // First, clear existing data if this is a fresh upload (optional - remove if you want to keep existing data)
    // await prisma.train.deleteMany({});

    for (let i = 0; i < sortedData.length; i++) {
      const row = sortedData[i];
      
      if (!row) continue;
      
      try {
        // Create or update Train (maintaining order is crucial here)
        if (row.trainname && row.trainID) {
          const train = await prisma.train.upsert({
            where: { trainID: row.trainID },
            update: {
              trainname: row.trainname,
              updatedAt: new Date()
            },
            create: {
              trainname: row.trainname,
              trainID: row.trainID,
              current_date: new Date()
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
        const progress = 25 + Math.floor((i / sortedData.length) * 70);
        if (uploadStatusMap[jobId]) {
          uploadStatusMap[jobId].progress = progress;
          uploadStatusMap[jobId].message = `Processing row ${i + 1} of ${sortedData.length}`;
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
  // Fitness Certificates - only create if at least one fitness field has data
  if (row.rollingStockFitnessStatus !== undefined && row.rollingStockFitnessStatus !== '' || 
      row.signallingFitnessStatus !== undefined && row.signallingFitnessStatus !== '' ||
      row.telecomFitnessStatus !== undefined && row.telecomFitnessStatus !== '') {
    await prisma.fitnessCertificates.upsert({
      where: { trainId },
      update: {
        rollingStockFitnessStatus: row.rollingStockFitnessStatus === 'true',
        signallingFitnessStatus: row.signallingFitnessStatus === 'true',
        telecomFitnessStatus: row.telecomFitnessStatus === 'true',
        rollingStockFitnessExpiryDate: row.rollingStockFitnessExpiryDate ? new Date(row.rollingStockFitnessExpiryDate) : new Date(),
        signallingFitnessExpiryDate: row.signallingFitnessExpiryDate ? new Date(row.signallingFitnessExpiryDate) : new Date(),
        telecomFitnessExpiryDate: row.telecomFitnessExpiryDate ? new Date(row.telecomFitnessExpiryDate) : new Date(),
      },
      create: {
        trainId,
        rollingStockFitnessStatus: row.rollingStockFitnessStatus === 'true',
        signallingFitnessStatus: row.signallingFitnessStatus === 'true',
        telecomFitnessStatus: row.telecomFitnessStatus === 'true',
        rollingStockFitnessExpiryDate: row.rollingStockFitnessExpiryDate ? new Date(row.rollingStockFitnessExpiryDate) : new Date(),
        signallingFitnessExpiryDate: row.signallingFitnessExpiryDate ? new Date(row.signallingFitnessExpiryDate) : new Date(),
        telecomFitnessExpiryDate: row.telecomFitnessExpiryDate ? new Date(row.telecomFitnessExpiryDate) : new Date(),
      }
    });
    results.fitness++;
  }

  // Job Card Status - only create if jobCardStatus has data
  if (row.jobCardStatus !== undefined && row.jobCardStatus !== '') {
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

  // Branding - only create if brandingActive has data
  if (row.brandingActive !== undefined && row.brandingActive !== '') {
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

  // Mileage - only create if totalMileageKM has data
  if (row.totalMileageKM !== undefined && row.totalMileageKM !== '') {
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

  // Cleaning - only create if cleaningRequired has data
  if (row.cleaningRequired !== undefined && row.cleaningRequired !== '') {
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

  // Stabling - only create if bayPositionID has data
  if (row.bayPositionID !== undefined && row.bayPositionID !== '') {
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

  // Operations - Updated to include new fields: rank, score, reasonForStatus, rl_priority
  if (row.operationalStatus !== undefined && row.operationalStatus !== '') {
    await prisma.operations.upsert({
      where: { trainId },
      update: {
        operationalStatus: row.operationalStatus as any,
        reasonForStatus: row.reasonForStatus || null,
        rank: row.rank ? parseInt(row.rank) : null,
        score: row.score ? parseInt(row.score) : null,
        rl_priority: row.rl_priority ? parseInt(row.rl_priority) : null
      },
      create: {
        trainId,
        operationalStatus: row.operationalStatus as any,
        reasonForStatus: row.reasonForStatus || null,
        rank: row.rank ? parseInt(row.rank) : null,
        score: row.score ? parseInt(row.score) : null,
        rl_priority: row.rl_priority ? parseInt(row.rl_priority) : null
      }
    });
    results.operations++;
  } else if (row.rank !== undefined && row.rank !== '' || 
             row.score !== undefined && row.score !== '' || 
             row.reasonForStatus !== undefined && row.reasonForStatus !== '' ||
             row.rl_priority !== undefined && row.rl_priority !== '') {
    // Create operations record even if operationalStatus is not provided but other fields are
    await prisma.operations.upsert({
      where: { trainId },
      update: {
        reasonForStatus: row.reasonForStatus || null,
        rank: row.rank ? parseInt(row.rank) : null,
        score: row.score ? parseInt(row.score) : null,
        rl_priority: row.rl_priority ? parseInt(row.rl_priority) : null
      },
      create: {
        trainId,
        operationalStatus: 'in_service', // Default value if not provided
        reasonForStatus: row.reasonForStatus || null,
        rank: row.rank ? parseInt(row.rank) : null,
        score: row.score ? parseInt(row.score) : null,
        rl_priority: row.rl_priority ? parseInt(row.rl_priority) : null
      }
    });
    results.operations++;
  }
};