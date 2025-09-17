import express from "express";
import { getRun, handleMooFinished, handleRlFinished, handleSimulationFinished, startSimulationRun, listRuns } from "../services/pipelineService.js";

const router = express.Router();

// Manually start a pipeline run (also used by cron)
router.post("/start", async (_req, res) => {
  const runId = await startSimulationRun();
  res.json({ runId });
});

router.post("/simulation-finished", async (req, res) => {
  const { runId, filePath } = req.body || {};
  if (!runId || !filePath)
    return res.status(400).json({ error: "runId and filePath required" });

  await handleSimulationFinished(runId, filePath);

  res.json({ ok: true, run: getRun(runId) });
});

router.post("/moo-finished", async (req, res) => {
  const { runId, filePath } = req.body || {};
  if (!runId || !filePath)
    return res.status(400).json({ error: "runId and filePath required" });

  await handleMooFinished(runId, filePath);

  res.json({ ok: true, run: getRun(runId) });
});


router.post("/rl-finished", async (req, res) => {
  const { runId, filePath } = req.body || {};
  if (!runId || !filePath)
    return res.status(400).json({ error: "runId and filePath required" });

  await handleRlFinished(runId, filePath);

  res.json({ ok: true, run: getRun(runId) });
});


export default router;


