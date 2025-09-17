// import { prisma } from "../config/db.js";
// import { logger } from "../config/logger.js";

// type PipelineStatus =
//   | "idle"
//   | "simulation_running"
//   | "moo_running"
//   | "rl_running"
//   | "completed"
//   | "failed";

// interface PipelineRun {
//   runId: string;
//   startedAt: Date;
//   status: PipelineStatus;
//   details?: Record<string, unknown>;
// }

// const runs: Record<string, PipelineRun> = {};

// let sseBroadcast: ((event: string, data: any) => void) | null = null;

// export const setSseBroadcaster = (fn: (event: string, data: any) => void) => {
//   sseBroadcast = fn;
// };

// const announce = (event: string, data: any) => {
//   if (sseBroadcast) sseBroadcast(event, data);
// };

// export const startSimulationRun = async (): Promise<string> => {
//   const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
//   runs[runId] = {
//     runId,
//     startedAt: new Date(),
//     status: "simulation_running",
//   };
//   logger.info("Pipeline started", { runId, status: runs[runId].status });
//   announce("pipeline", { runId, status: runs[runId].status });
//   // Call out to simulation service if applicable
//   // Placeholder: external system should call /api/webhook/simulation-finished when done
//   return runId;
// };

// export const handleSimulationFinished = async (runId: string, payload?: any) => {
//   const run = runs[runId];
//   if (!run) return;
//   logger.info("Simulation finished webhook received", { runId, payloadSummary: summarizePayload(payload) });
//   run.status = "moo_running";
//   run.details = {
//     ...run.details,
//     simulation: { receivedAt: new Date().toISOString(), payload },
//   };
//   announce("pipeline", { runId, status: run.status });
//   // Trigger MOO (external) → expected to call /api/webhook/moo-finished
// };

// export const handleMooFinished = async (runId: string, payload?: any) => {
//   const run = runs[runId];
//   if (!run) return;
//   logger.info("MOO finished webhook received", { runId, payloadSummary: summarizePayload(payload) });
//   run.status = "rl_running";
//   run.details = {
//     ...run.details,
//     moo: { receivedAt: new Date().toISOString(), payload },
//   };
//   announce("pipeline", { runId, status: run.status });
//   // Trigger RL (external) → expected to call /api/webhook/rl-finished
// };

// export const handleRlFinished = async (runId: string, payload?: any) => {
//   const run = runs[runId];
//   if (!run) return;
//   logger.info("RL finished webhook received", { runId, payloadSummary: summarizePayload(payload) });
//   run.status = "completed";
//   run.details = {
//     ...run.details,
//     rl: { receivedAt: new Date().toISOString(), payload },
//   };
//   announce("pipeline", { runId, status: run.status });

//   // Minimal DB touch to mark activity; adjust to your domain as needed
//   try {
//     await prisma.train.updateMany({
//       data: { updatedAt: new Date() },
//     });
//   } catch (e) {
//     run.status = "failed";
//     logger.error("Pipeline failed during DB update", { runId, error: (e as Error).message });
//     announce("pipeline", { runId, status: run.status, error: (e as Error).message });
//   }
// };

// export const getRun = (runId: string) => runs[runId];
// export const listRuns = () => Object.values(runs).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

// function summarizePayload(payload: any) {
//   try {
//     if (payload == null) return null;
//     if (typeof payload === "string") return `${payload.length} chars`;
//     const json = JSON.stringify(payload);
//     return json.length > 512 ? `json ${json.length} bytes` : payload;
//   } catch {
//     return "unserializable";
//   }
// }


