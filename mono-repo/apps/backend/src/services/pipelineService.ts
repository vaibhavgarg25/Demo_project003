import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
import fs from "fs/promises";
import axios from "axios";
import { processCSV } from "./csvService.js";

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

export const startSimulationRun = async (): Promise<string> => {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  runs[runId] = {
    runId,
    startedAt: new Date(),
    status: "simulation_running",
  };
  logger.info("Pipeline run started", { runId });
  announce("pipeline", { runId, status: "simulation_running" });
  return runId;
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
    await axios.post("http://moo-server/api/start-moo", {
      simulation_result_file_path: filePath,
    });
    logger.info("MOO service started successfully", { runId });
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
    await axios.post("http://rl-server/api/start-rl", {
      moo_result_file_path: filePath,
    });
    logger.info("RL service started successfully", { runId });
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

    const buffer = await fs.readFile(filePath);

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
    logger.info("Train data successfully updated in DB", { runId });

  } catch (error) {
    run.status = "failed";
    logger.error("Pipeline failed during RL data processing", { runId, error: (error as Error).message });
    announce("pipeline", { runId, status: "failed", error: (error as Error).message });
  }
};

export const getRun = (runId: string) => runs[runId];

export const listRuns = () => Object.values(runs).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
