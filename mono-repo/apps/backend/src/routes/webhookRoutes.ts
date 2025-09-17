import express from "express";
import { getRun, handleMooFinished, handleRlFinished, handleSimulationFinished, startSimulationRun, listRuns } from "../services/pipelineService.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Manually start a pipeline run (also used by cron)
router.post("/start", async (_req, res) => {
  const runId = await startSimulationRun();
  res.json({ runId });
});

router.post("/simulation-finished", async (req, res) => {
  const { runId, filePath, success, error } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: "runId required" });
  }

  if (!success || !filePath) {
    logger.warn(`Simulation failed for runId ${runId}`, { error });
    // Update run status to failed
    const run = getRun(runId);
    if (run) {
      run.status = "failed";
      run.details = { ...run.details, simulation: { error, receivedAt: new Date().toISOString() } };
    }
    return res.status(200).json({ ok: true, message: "Simulation failure acknowledged" });
  }

  await handleSimulationFinished(runId, filePath);
  res.json({ ok: true, run: getRun(runId) });
});

router.post("/moo-finished", async (req, res) => {
  const { runId, filePath, success, error } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: "runId required" });
  }

  if (!success || !filePath) {
    logger.warn(`MOO failed for runId ${runId}`, { error });
    // Update run status to failed
    const run = getRun(runId);
    if (run) {
      run.status = "failed";
      run.details = { ...run.details, moo: { error, receivedAt: new Date().toISOString() } };
    }
    return res.status(200).json({ ok: true, message: "MOO failure acknowledged" });
  }

  await handleMooFinished(runId, filePath);
  res.json({ ok: true, run: getRun(runId) });
});


router.post("/rl-finished", async (req, res) => {
  const { runId, filePath, success, error } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: "runId required" });
  }

  if (!success || !filePath) {
    logger.warn(`RL failed for runId ${runId}`, { error });
    // Update run status to failed
    const run = getRun(runId);
    if (run) {
      run.status = "failed";
      run.details = { ...run.details, rl: { error, receivedAt: new Date().toISOString() } };
    }
    return res.status(200).json({ ok: true, message: "RL failure acknowledged" });
  }

  await handleRlFinished(runId, filePath);
  res.json({ ok: true, run: getRun(runId) });
});


export default router;


