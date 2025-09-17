import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
import fs from "fs/promises";
import axios from "axios";
import { processCSV } from "./csvService.js";
import { StorageManager } from "../utils/storageManager.js";

function notifyClients(eventType: string) {
  if (sseBroadcast) {
    sseBroadcast(eventType, { message: "New train data available" });
  }
}

type PipelineStatus =
  | "idle"
  | "simulation_running"
  | "moo_running"
  | "rl_running"
  | "completed"
  | "failed";

interface PipelineRun {
  runId: string;
  startedAt: Date;
  status: PipelineStatus;
  details?: Record<string, unknown>;
}

const runs: Record<string, PipelineRun> = {};
let sseBroadcast: ((event: string, data: any) => void) | null = null;

export const setSseBroadcaster = (fn: (event: string, data: any) => void) => {
  sseBroadcast = fn;
};

const announce = (event: string, data: any) => {
  if (sseBroadcast) sseBroadcast(event, data);
};

export const startSimulationRunWithFile = async (runId: string, filePath: string): Promise<string> => {
  runs[runId] = {
    runId,
    startedAt: new Date(),
    status: "simulation_running",
  };
  logger.info("Pipeline run started with file", { runId, filePath });
  announce("pipeline", { runId, status: "simulation_running" });
  
  // Initialize storage
  await StorageManager.initializeStorage();
  
  // Trigger simulation with the provided file path
  try {
    await triggerSimulationWithFile(runId, filePath);
  } catch (error) {
    runs[runId].status = "failed";
    logger.error("Failed to trigger simulation with file", { runId, filePath, error: (error as Error).message });
    announce("pipeline", { runId, status: "failed", error: (error as Error).message });
  }
  
  return runId;
};

export const startSimulationRun = async (): Promise<string> => {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  runs[runId] = {
    runId,
    startedAt: new Date(),
    status: "simulation_running",
  };
  logger.info("Pipeline run started", { runId });
  announce("pipeline", { runId, status: "simulation_running" });
  
  // Initialize storage
  await StorageManager.initializeStorage();
  
  // Trigger simulation immediately
  try {
    await triggerSimulation(runId);
  } catch (error) {
    runs[runId].status = "failed";
    logger.error("Failed to trigger simulation", { runId, error: (error as Error).message });
    announce("pipeline", { runId, status: "failed", error: (error as Error).message });
  }
  
  return runId;
};

const triggerSimulationWithFile = async (runId: string, filePath: string) => {
  // Call simulation API with the provided file path
  const simulationUrl = `${process.env.FAST_API_BASE_URI}/simulation/start-from-file`;
  
  try {
    const response = await axios.post(simulationUrl, {
      file_path: filePath,
      runId: runId,
      days_to_simulate: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000, // 5 minutes timeout for simulation
    });
    
    logger.info("Simulation triggered successfully with file path", { runId, filePath, status: response.status });
  } catch (error) {
    logger.error("Failed to trigger simulation with file", { runId, filePath, error: (error as Error).message });
    throw error;
  }
};

const triggerSimulation = async (runId: string) => {
  // Get the latest train data from database
  const trains = await prisma.train.findMany();
  
  if (trains.length === 0) {
    throw new Error("No train data available for simulation");
  }
  
  // Convert train data to CSV format
  const csvData = convertTrainsToCSV(trains);
  
  // Save train data to shared storage
  const filePath = await StorageManager.saveUserUpload(runId, csvData);
  
  // Call simulation API with file path
  const simulationUrl = `${process.env.FAST_API_BASE_URI}/simulation/start-from-file`;
  
  try {
    const response = await axios.post(simulationUrl, {
      file_path: filePath,
      runId: runId,
      days_to_simulate: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000, // 5 minutes timeout for simulation
    });
    
    logger.info("Simulation triggered successfully with file path", { runId, filePath, status: response.status });
  } catch (error) {
    logger.error("Failed to trigger simulation", { runId, filePath, error: (error as Error).message });
    throw error;
  }
};

const convertTrainsToCSV = (trains: any[]): string => {
  if (trains.length === 0) return '';
  
  // Get all unique keys from train objects
  const headers = Object.keys(trains[0]);
  
  // Create CSV header row
  const csvRows = [headers.join(',')];
  
  // Add data rows
  trains.forEach(train => {
    const row = headers.map(header => {
      const value = train[header];
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return 'NULL';
      }
      // Handle boolean values
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }
      // Handle dates
      if (value instanceof Date) {
        return value.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      }
      // Handle strings with commas (escape them)
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

export const handleSimulationFinished = async (runId: string, filePath?: string) => {
  const run = runs[runId];
  if (!run) {
    logger.warn(`handleSimulationFinished called with invalid runId: ${runId}`);
    return;
  }

  logger.info("Simulation finished received", { runId, filePath });

  run.status = "moo_running";
  run.details = {
    ...run.details,
    simulation: { receivedAt: new Date().toISOString(), filePath },
  };
  announce("pipeline", { runId, status: "moo_running" });

  try {
    await axios.post(`${process.env.FAST_API_BASE_URI}/moo/rank-from-file`, {
      simulation_result_file_path: filePath,
      runId: runId
    });
    logger.info("MOO service started successfully with file path", { runId, filePath });
  } catch (error) {
    run.status = "failed";
    logger.error("Failed to trigger MOO service", { runId, error: (error as Error).message });
    announce("pipeline", { runId, status: "failed", error: (error as Error).message });
  }
};

export const handleMooFinished = async (runId: string, filePath?: string) => {
  const run = runs[runId];
  if (!run) {
    logger.warn(`handleMooFinished called with invalid runId: ${runId}`);
    return;
  }

  logger.info("MOO finished received", { runId, filePath });

  run.status = "rl_running";
  run.details = {
    ...run.details,
    moo: { receivedAt: new Date().toISOString(), filePath },
  };
  announce("pipeline", { runId, status: "rl_running" });

  try {
    await axios.post(`${process.env.FAST_API_BASE_URI}/rl/schedule-from-file`, {
      moo_result_file_path: filePath,
      runId: runId
    });
    logger.info("RL service started successfully with file path", { runId, filePath });
  } catch (error) {
    run.status = "failed";
    logger.error("Failed to trigger RL service", { runId, error: (error as Error).message });
    announce("pipeline", { runId, status: "failed", error: (error as Error).message });
  }
};

export const handleRlFinished = async (runId: string, filePath?: string) => {
  const run = runs[runId];
  if (!run) {
    logger.warn(`handleRlFinished called with invalid runId: ${runId}`);
    return;
  }

  logger.info("RL finished webhook received", { runId, filePath });

  run.status = "completed";
  run.details = {
    ...run.details,
    rl: { receivedAt: new Date().toISOString(), filePath },
  };
  announce("pipeline", { runId, status: "completed" });

  try {
    if (!filePath) throw new Error("filePath is undefined");

    // Check if file exists
    const fileExists = await StorageManager.fileExists(filePath);
    if (!fileExists) {
      throw new Error(`Final RL result file not found: ${filePath}`);
    }

    // Read the final RL result file
    const buffer = await StorageManager.readFileBuffer(filePath);

    type UploadStatus = Record<string, { status: "completed" | "failed" | "processing"; progress?: number; message?: string; results?: any }>;
    const tempJobId = `job_${Date.now()}`;
    const uploadStatusMap: UploadStatus = {
      [tempJobId]: { status: "processing", progress: 0 },
    };

    await processCSV(buffer, tempJobId, uploadStatusMap);

    if (!uploadStatusMap[tempJobId] || uploadStatusMap[tempJobId].status !== "completed") {
      throw new Error(uploadStatusMap[tempJobId]?.message || "CSV processing failed without message");
    }

    await prisma.train.updateMany({ data: { updatedAt: new Date() } });
    notifyClients("new_data_ready");
    logger.info("Train data successfully updated in DB from RL result file", { runId, filePath });

  } catch (error) {
    run.status = "failed";
    logger.error("Pipeline failed during RL data processing", { runId, filePath, error: (error as Error).message });
    announce("pipeline", { runId, status: "failed", error: (error as Error).message });
  }
};

export const getRun = (runId: string) => runs[runId];

export const listRuns = () => Object.values(runs).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
