import express from "express";
import { getRun, handleMooFinished, handleRlFinished, handleSimulationFinished, startSimulationRun, listRuns } from "../services/pipelineService.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Manually start a pipeline run (also used by cron)
router.post("/start", async (_req, res) => {
  const runId = await startSimulationRun();
  res.json({ runId });
});

router.post("/simulation-complete", async (req, res) => {
  const { runId, status, outputFilePath, error, metadata } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: "runId required" });
  }

  logger.info("Simulation webhook received", { runId, status, outputFilePath, metadata });

  if (status !== "success" || !outputFilePath) {
    logger.warn(`Simulation failed for runId ${runId}`, { error });
    // Update run status to failed
    const run = getRun(runId);
    if (run) {
      run.status = "failed";
      run.details = { ...run.details, simulation: { error, receivedAt: new Date().toISOString() } };
    }
    return res.status(200).json({ ok: true, message: "Simulation failure acknowledged" });
  }

  await handleSimulationFinished(runId, outputFilePath);
  res.json({ ok: true, run: getRun(runId) });
});

// Legacy endpoint - kept for backward compatibility
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

router.post("/moo-complete", async (req, res) => {
  const { runId, status, outputFilePath, error, metadata } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: "runId required" });
  }

  logger.info("MOO webhook received", { runId, status, outputFilePath, metadata });

  if (status !== "success" || !outputFilePath) {
    logger.warn(`MOO failed for runId ${runId}`, { error });
    // Update run status to failed
    const run = getRun(runId);
    if (run) {
      run.status = "failed";
      run.details = { ...run.details, moo: { error, receivedAt: new Date().toISOString() } };
    }
    return res.status(200).json({ ok: true, message: "MOO failure acknowledged" });
  }

  await handleMooFinished(runId, outputFilePath);
  res.json({ ok: true, run: getRun(runId) });
});

// Legacy endpoint - kept for backward compatibility
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


router.post("/rl-complete", async (req, res) => {
  const { runId, status, outputFilePath, error, metadata } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: "runId required" });
  }

  logger.info("RL webhook received", { runId, status, outputFilePath, metadata });

  if (status !== "success" || !outputFilePath) {
    logger.warn(`RL failed for runId ${runId}`, { error });
    // Update run status to failed
    const run = getRun(runId);
    if (run) {
      run.status = "failed";
      run.details = { ...run.details, rl: { error, receivedAt: new Date().toISOString() } };
    }
    return res.status(200).json({ ok: true, message: "RL failure acknowledged" });
  }

  await handleRlFinished(runId, outputFilePath);
  res.json({ ok: true, run: getRun(runId) });
});

// Legacy endpoint - kept for backward compatibility
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


// Get pipeline run status and logs for UI monitoring
router.get("/runs/:runId", async (req, res) => {
  const { runId } = req.params;
  const run = getRun(runId);
  
  if (!run) {
    return res.status(404).json({ error: "Pipeline run not found" });
  }
  
  const details = run.details as any;
  
  res.json({
    runId,
    status: run.status,
    startedAt: run.startedAt,
    details: run.details,
    stages: {
      simulation: details?.simulation?.stage || "pending",
      moo: details?.moo?.stage || "pending",
      rl: details?.rl?.stage || "pending"
    },
    duration: details?.completedAt 
      ? new Date(details.completedAt).getTime() - run.startedAt.getTime()
      : new Date().getTime() - run.startedAt.getTime()
  });
});

// List all pipeline runs for UI monitoring
router.get("/runs", async (req, res) => {
  const runs = listRuns();
  
  const formattedRuns = runs.map(run => {
    const details = run.details as any;
    
    return {
      runId: run.runId,
      status: run.status,
      startedAt: run.startedAt,
      stages: {
        simulation: details?.simulation?.stage || "pending",
        moo: details?.moo?.stage || "pending",
        rl: details?.rl?.stage || "pending"
      },
      duration: details?.completedAt 
        ? new Date(details.completedAt).getTime() - run.startedAt.getTime()
        : new Date().getTime() - run.startedAt.getTime(),
      hasError: run.status === "failed",
      error: details?.error?.message
    };
  });
  
  res.json({
    runs: formattedRuns,
    totalRuns: runs.length,
    activeRuns: runs.filter(r => r.status !== "completed" && r.status !== "failed").length
  });
});

export default router;


